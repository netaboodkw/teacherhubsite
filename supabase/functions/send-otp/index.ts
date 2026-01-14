import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const MAX_ATTEMPTS = 5;
const OTP_EXPIRY_MINUTES = 3;

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { phone, action, otp } = await req.json();

    if (!phone) {
      return new Response(
        JSON.stringify({ error: "رقم الهاتف مطلوب" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Format phone number for Kuwait (add +965 if not present)
    let formattedPhone = phone.replace(/\s/g, '');
    if (!formattedPhone.startsWith('+')) {
      if (formattedPhone.startsWith('965')) {
        formattedPhone = '+' + formattedPhone;
      } else {
        formattedPhone = '+965' + formattedPhone;
      }
    }

    const accountSid = Deno.env.get("TWILIO_ACCOUNT_SID");
    const authToken = Deno.env.get("TWILIO_AUTH_TOKEN");
    const twilioPhone = Deno.env.get("TWILIO_PHONE_NUMBER");
    const supabaseUrl = Deno.env.get("SUPABASE_URL");
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");

    if (!accountSid || !authToken || !twilioPhone) {
      console.error("Missing Twilio credentials");
      return new Response(
        JSON.stringify({ error: "خطأ في إعدادات الخادم" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    if (!supabaseUrl || !supabaseServiceKey) {
      console.error("Missing Supabase credentials");
      return new Response(
        JSON.stringify({ error: "خطأ في إعدادات الخادم" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Create Supabase client with service role key
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    if (action === "send") {
      // Check rate limiting - max 3 OTP requests per phone per 15 minutes
      const fifteenMinutesAgo = new Date(Date.now() - 15 * 60 * 1000).toISOString();
      const { data: recentOtps } = await supabase
        .from('otp_codes')
        .select('id')
        .eq('phone', formattedPhone)
        .gte('created_at', fifteenMinutesAgo);

      if (recentOtps && recentOtps.length >= 3) {
        return new Response(
          JSON.stringify({ error: "تم إرسال الكثير من الرسائل. يرجى الانتظار 15 دقيقة." }),
          { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      // Generate 6-digit OTP
      const generatedOtp = Math.floor(100000 + Math.random() * 900000).toString();
      const expiresAt = new Date(Date.now() + OTP_EXPIRY_MINUTES * 60 * 1000).toISOString();

      // Delete any existing OTPs for this phone
      await supabase
        .from('otp_codes')
        .delete()
        .eq('phone', formattedPhone);

      // Store OTP in database with attempt counter
      const { error: insertError } = await supabase
        .from('otp_codes')
        .insert({
          phone: formattedPhone,
          code: generatedOtp,
          expires_at: expiresAt,
          verified: false,
          attempts: 0
        });

      if (insertError) {
        console.error("Database error:", insertError);
        return new Response(
          JSON.stringify({ error: "خطأ في حفظ رمز التحقق" }),
          { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      // Send SMS via Twilio
      const twilioUrl = `https://api.twilio.com/2010-04-01/Accounts/${accountSid}/Messages.json`;
      
      const formData = new URLSearchParams();
      formData.append("To", formattedPhone);
      formData.append("From", twilioPhone);
      formData.append("Body", `رمز التحقق الخاص بك هو: ${generatedOtp}\nصالح لمدة ${OTP_EXPIRY_MINUTES} دقائق.`);

      const twilioResponse = await fetch(twilioUrl, {
        method: "POST",
        headers: {
          "Authorization": `Basic ${btoa(`${accountSid}:${authToken}`)}`,
          "Content-Type": "application/x-www-form-urlencoded",
        },
        body: formData,
      });

      if (!twilioResponse.ok) {
        const errorData = await twilioResponse.json();
        console.error("Twilio error:", errorData);
        return new Response(
          JSON.stringify({ error: "فشل في إرسال الرسالة النصية" }),
          { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      console.log(`OTP sent to ${formattedPhone}`);

      return new Response(
        JSON.stringify({ success: true, message: "تم إرسال رمز التحقق" }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );

    } else if (action === "verify") {
      // Get OTP from database
      const { data: otpRecord, error: fetchError } = await supabase
        .from('otp_codes')
        .select('*')
        .eq('phone', formattedPhone)
        .eq('verified', false)
        .order('created_at', { ascending: false })
        .limit(1)
        .single();

      if (fetchError || !otpRecord) {
        console.error("OTP fetch error:", fetchError);
        return new Response(
          JSON.stringify({ error: "لم يتم إرسال رمز تحقق لهذا الرقم" }),
          { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      // Check max attempts
      if (otpRecord.attempts >= MAX_ATTEMPTS) {
        // Delete the OTP after max attempts
        await supabase
          .from('otp_codes')
          .delete()
          .eq('id', otpRecord.id);

        return new Response(
          JSON.stringify({ error: "تم تجاوز الحد الأقصى للمحاولات. يرجى طلب رمز جديد." }),
          { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      // Check if expired
      if (new Date() > new Date(otpRecord.expires_at)) {
        // Delete expired OTP
        await supabase
          .from('otp_codes')
          .delete()
          .eq('id', otpRecord.id);

        return new Response(
          JSON.stringify({ error: "انتهت صلاحية رمز التحقق" }),
          { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      // Check if OTP matches
      if (otpRecord.code !== otp) {
        // Increment attempt counter
        await supabase
          .from('otp_codes')
          .update({ attempts: (otpRecord.attempts || 0) + 1 })
          .eq('id', otpRecord.id);

        const remainingAttempts = MAX_ATTEMPTS - (otpRecord.attempts || 0) - 1;
        
        return new Response(
          JSON.stringify({ 
            error: `رمز التحقق غير صحيح. المحاولات المتبقية: ${remainingAttempts}` 
          }),
          { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      // OTP verified successfully - mark as verified and delete
      await supabase
        .from('otp_codes')
        .delete()
        .eq('id', otpRecord.id);

      console.log(`OTP verified for ${formattedPhone}`);

      return new Response(
        JSON.stringify({ success: true, verified: true }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    return new Response(
      JSON.stringify({ error: "إجراء غير صالح" }),
      { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );

  } catch (error) {
    console.error("Error:", error);
    return new Response(
      JSON.stringify({ error: "حدث خطأ غير متوقع" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
