import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
    );

    const results = {
      reminders_sent: 0,
      expired_sent: 0,
      errors: [] as string[],
    };

    // Get email settings
    const { data: reminderSetting } = await supabase
      .from('email_settings')
      .select('value')
      .eq('setting_key', 'reminder_days_before_expiry')
      .single();

    const { data: enableReminderSetting } = await supabase
      .from('email_settings')
      .select('value')
      .eq('setting_key', 'enable_reminder_email')
      .single();

    const { data: enableExpiredSetting } = await supabase
      .from('email_settings')
      .select('value')
      .eq('setting_key', 'enable_expired_email')
      .single();

    const reminderDays = (reminderSetting?.value as any)?.days || 7;
    const enableReminder = (enableReminderSetting?.value as any)?.enabled !== false;
    const enableExpired = (enableExpiredSetting?.value as any)?.enabled !== false;

    console.log(`Processing emails - Reminder days: ${reminderDays}, Enable reminder: ${enableReminder}, Enable expired: ${enableExpired}`);

    // Calculate target date for reminders
    const today = new Date();
    const reminderTargetDate = new Date(today);
    reminderTargetDate.setDate(today.getDate() + reminderDays);
    const reminderDateStr = reminderTargetDate.toISOString().split('T')[0];

    // Process reminder emails
    if (enableReminder) {
      const { data: subscriptionsToRemind } = await supabase
        .from('teacher_subscriptions')
        .select(`
          id,
          user_id,
          subscription_ends_at,
          status
        `)
        .eq('status', 'active')
        .gte('subscription_ends_at', today.toISOString())
        .lte('subscription_ends_at', reminderTargetDate.toISOString());

      console.log(`Found ${subscriptionsToRemind?.length || 0} subscriptions to remind`);

      for (const sub of subscriptionsToRemind || []) {
        try {
          // Get user email
          const { data: userData } = await supabase.auth.admin.getUserById(sub.user_id);
          if (!userData?.user?.email) continue;

          // Get profile
          const { data: profile } = await supabase
            .from('profiles')
            .select('full_name')
            .eq('user_id', sub.user_id)
            .single();

          const endDate = new Date(sub.subscription_ends_at!);
          const daysRemaining = Math.ceil((endDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
          const formattedDate = endDate.toLocaleDateString('ar-SA', {
            year: 'numeric',
            month: 'long',
            day: 'numeric'
          });

          // Check if we already sent a reminder today
          const { data: existingLog } = await supabase
            .from('email_logs')
            .select('id')
            .eq('recipient_email', userData.user.email)
            .eq('template_key', 'subscription_reminder')
            .gte('created_at', today.toISOString().split('T')[0])
            .single();

          if (existingLog) {
            console.log(`Already sent reminder to ${userData.user.email} today`);
            continue;
          }

          // Send reminder email
          await fetch(`${Deno.env.get("SUPABASE_URL")}/functions/v1/send-email`, {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              "Authorization": `Bearer ${Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")}`,
            },
            body: JSON.stringify({
              type: 'subscription_reminder',
              to: userData.user.email,
              data: {
                name: profile?.full_name || 'المعلم',
                daysRemaining,
                endDate: formattedDate,
              },
            }),
          });

          results.reminders_sent++;
          console.log(`Sent reminder to ${userData.user.email}`);
        } catch (error: any) {
          console.error(`Error sending reminder:`, error);
          results.errors.push(`Reminder error for ${sub.user_id}: ${error.message}`);
        }
      }
    }

    // Process expired subscription emails
    if (enableExpired) {
      const yesterday = new Date(today);
      yesterday.setDate(today.getDate() - 1);

      const { data: expiredSubscriptions } = await supabase
        .from('teacher_subscriptions')
        .select(`
          id,
          user_id,
          subscription_ends_at,
          status
        `)
        .eq('status', 'active')
        .lt('subscription_ends_at', today.toISOString())
        .gte('subscription_ends_at', yesterday.toISOString());

      console.log(`Found ${expiredSubscriptions?.length || 0} expired subscriptions`);

      for (const sub of expiredSubscriptions || []) {
        try {
          // Get user email
          const { data: userData } = await supabase.auth.admin.getUserById(sub.user_id);
          if (!userData?.user?.email) continue;

          // Get profile
          const { data: profile } = await supabase
            .from('profiles')
            .select('full_name')
            .eq('user_id', sub.user_id)
            .single();

          const expiredDate = new Date(sub.subscription_ends_at!).toLocaleDateString('ar-SA', {
            year: 'numeric',
            month: 'long',
            day: 'numeric'
          });

          // Check if we already sent an expired email
          const { data: existingLog } = await supabase
            .from('email_logs')
            .select('id')
            .eq('recipient_email', userData.user.email)
            .eq('template_key', 'subscription_expired')
            .gte('created_at', yesterday.toISOString().split('T')[0])
            .single();

          if (existingLog) {
            console.log(`Already sent expired email to ${userData.user.email}`);
            continue;
          }

          // Send expired email
          await fetch(`${Deno.env.get("SUPABASE_URL")}/functions/v1/send-email`, {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              "Authorization": `Bearer ${Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")}`,
            },
            body: JSON.stringify({
              type: 'subscription_expired',
              to: userData.user.email,
              data: {
                name: profile?.full_name || 'المعلم',
                expiredDate,
              },
            }),
          });

          // Update subscription status
          await supabase
            .from('teacher_subscriptions')
            .update({ status: 'expired', is_read_only: true })
            .eq('id', sub.id);

          results.expired_sent++;
          console.log(`Sent expired email to ${userData.user.email}`);
        } catch (error: any) {
          console.error(`Error sending expired email:`, error);
          results.errors.push(`Expired error for ${sub.user_id}: ${error.message}`);
        }
      }
    }

    return new Response(
      JSON.stringify({ success: true, results }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error: any) {
    console.error("Error processing subscription emails:", error);
    return new Response(
      JSON.stringify({ success: false, error: error.message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
