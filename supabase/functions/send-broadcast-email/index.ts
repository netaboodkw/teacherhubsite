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

    const { broadcastId } = await req.json();

    if (!broadcastId) {
      throw new Error("Broadcast ID is required");
    }

    // Get broadcast details
    const { data: broadcast, error: broadcastError } = await supabase
      .from('broadcast_emails')
      .select('*')
      .eq('id', broadcastId)
      .single();

    if (broadcastError || !broadcast) {
      throw new Error("Broadcast not found");
    }

    console.log(`Processing broadcast: ${broadcast.id} - ${broadcast.subject}`);

    // Get recipients based on filter
    let recipientQuery = supabase
      .from('teacher_subscriptions')
      .select('user_id');

    switch (broadcast.recipient_filter) {
      case 'active':
        recipientQuery = recipientQuery.eq('status', 'active');
        break;
      case 'trial':
        recipientQuery = recipientQuery.eq('status', 'trial');
        break;
      case 'expired':
        recipientQuery = recipientQuery.eq('status', 'expired');
        break;
      // 'all' - no filter
    }

    const { data: subscriptions } = await recipientQuery;

    const userIds = subscriptions?.map(s => s.user_id) || [];
    console.log(`Found ${userIds.length} recipients`);

    // Update broadcast with total count
    await supabase
      .from('broadcast_emails')
      .update({
        total_recipients: userIds.length,
        status: 'sending',
      })
      .eq('id', broadcastId);

    let sentCount = 0;
    let failedCount = 0;

    for (const userId of userIds) {
      try {
        // Get user email
        const { data: userData } = await supabase.auth.admin.getUserById(userId);
        if (!userData?.user?.email) {
          failedCount++;
          continue;
        }

        // Get profile
        const { data: profile } = await supabase
          .from('profiles')
          .select('full_name')
          .eq('user_id', userId)
          .single();

        // Send email
        const response = await fetch(`${Deno.env.get("SUPABASE_URL")}/functions/v1/send-email`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")}`,
          },
          body: JSON.stringify({
            type: 'broadcast',
            to: userData.user.email,
            data: {
              name: profile?.full_name || 'المعلم',
              title: broadcast.subject,
              subject: broadcast.subject,
              content: broadcast.body_html.replace(/{{name}}/g, profile?.full_name || 'المعلم'),
            },
          }),
        });

        if (response.ok) {
          sentCount++;
        } else {
          failedCount++;
        }

        // Update progress every 10 emails
        if ((sentCount + failedCount) % 10 === 0) {
          await supabase
            .from('broadcast_emails')
            .update({
              sent_count: sentCount,
              failed_count: failedCount,
            })
            .eq('id', broadcastId);
        }
      } catch (error) {
        console.error(`Error sending to ${userId}:`, error);
        failedCount++;
      }
    }

    // Final update
    await supabase
      .from('broadcast_emails')
      .update({
        sent_count: sentCount,
        failed_count: failedCount,
        status: 'completed',
        sent_at: new Date().toISOString(),
      })
      .eq('id', broadcastId);

    return new Response(
      JSON.stringify({ success: true, sentCount, failedCount }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error: any) {
    console.error("Error sending broadcast:", error);
    return new Response(
      JSON.stringify({ success: false, error: error.message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
