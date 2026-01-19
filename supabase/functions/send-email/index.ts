import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { Resend } from "https://esm.sh/resend@2.0.0";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// Base email template with TeacherHub branding
const getEmailTemplate = (content: string, title: string) => `
<!DOCTYPE html>
<html dir="rtl" lang="ar">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; margin: 0; padding: 0; background-color: #f4f4f5; direction: rtl;">
  <div style="max-width: 600px; margin: 0 auto; background-color: #ffffff; border-radius: 12px; overflow: hidden; margin-top: 20px; margin-bottom: 20px; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);">
    
    <!-- Header with Logo -->
    <div style="background: linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%); padding: 40px 30px; text-align: center;">
      <img src="https://teacherhub.site/logo.png" alt="TeacherHub" style="height: 80px; margin-bottom: 20px;" />
      <h1 style="color: #1f2937; margin: 0; font-size: 26px; font-weight: bold; background-color: #ffffff; padding: 12px 24px; border-radius: 8px; display: inline-block;">${title}</h1>
    </div>
    
    <!-- Content -->
    <div style="padding: 30px;">
      ${content}
    </div>
    
    <!-- Footer -->
    <div style="background-color: #f9fafb; padding: 20px; text-align: center; border-top: 1px solid #e5e7eb;">
      <a href="https://teacherhub.site" style="color: #3b82f6; text-decoration: none; font-weight: bold;">teacherhub.site</a>
      <p style="color: #9ca3af; font-size: 12px; margin: 10px 0 0 0;">
        © ${new Date().getFullYear()} TeacherHub. جميع الحقوق محفوظة.
      </p>
    </div>
  </div>
</body>
</html>
`;

// Email content templates
const emailTemplates = {
  welcome: (name: string) => getEmailTemplate(`
    <p style="font-size: 18px; color: #374151; margin-bottom: 20px;">
      مرحباً <strong>${name}</strong>! 👋
    </p>
    <p style="font-size: 16px; color: #6b7280; line-height: 1.8;">
      شكراً لانضمامك إلى <strong>TeacherHub</strong>! نحن سعداء بوجودك معنا.
    </p>
    <p style="font-size: 16px; color: #6b7280; line-height: 1.8;">
      يمكنك الآن البدء في:
    </p>
    <ul style="color: #6b7280; line-height: 2;">
      <li>إنشاء صفوفك الدراسية</li>
      <li>إضافة طلابك</li>
      <li>تسجيل الحضور والدرجات</li>
      <li>متابعة تقدم طلابك</li>
    </ul>
    <div style="text-align: center; margin-top: 30px;">
      <a href="https://teacherhub.site/teacher" style="display: inline-block; background: linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%); color: #ffffff; text-decoration: none; padding: 14px 40px; border-radius: 8px; font-size: 16px; font-weight: bold;">
        ابدأ الآن
      </a>
    </div>
  `, 'مرحباً بك في TeacherHub! 🎉'),

  subscription_reminder: (name: string, daysRemaining: number, endDate: string) => getEmailTemplate(`
    <p style="font-size: 18px; color: #374151; margin-bottom: 20px;">
      مرحباً <strong>${name}</strong>،
    </p>
    <div style="background-color: #fef3c7; border: 1px solid #f59e0b; border-radius: 8px; padding: 20px; margin: 20px 0;">
      <div style="display: flex; align-items: center; gap: 10px;">
        <span style="font-size: 24px;">⏰</span>
        <div>
          <p style="margin: 0; color: #92400e; font-weight: bold; font-size: 16px;">تذكير مهم</p>
          <p style="margin: 5px 0 0 0; color: #b45309; font-size: 14px;">
            اشتراكك سينتهي بعد <strong>${daysRemaining}</strong> ${daysRemaining === 1 ? 'يوم' : 'أيام'}
          </p>
        </div>
      </div>
    </div>
    <p style="font-size: 16px; color: #6b7280; line-height: 1.8;">
      تاريخ الانتهاء: <strong>${endDate}</strong>
    </p>
    <p style="font-size: 16px; color: #6b7280; line-height: 1.8;">
      جدد اشتراكك الآن للاستمرار في الاستفادة من جميع مميزات المنصة.
    </p>
    <div style="text-align: center; margin-top: 30px;">
      <a href="https://teacherhub.site/teacher/subscription" style="display: inline-block; background: linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%); color: #ffffff; text-decoration: none; padding: 14px 40px; border-radius: 8px; font-size: 16px; font-weight: bold;">
        تجديد الاشتراك
      </a>
    </div>
  `, 'تذكير: اشتراكك سينتهي قريباً ⏰'),

  subscription_expired: (name: string, expiredDate: string) => getEmailTemplate(`
    <p style="font-size: 18px; color: #374151; margin-bottom: 20px;">
      مرحباً <strong>${name}</strong>،
    </p>
    <div style="background-color: #fee2e2; border: 1px solid #ef4444; border-radius: 8px; padding: 20px; margin: 20px 0;">
      <div style="display: flex; align-items: center; gap: 10px;">
        <span style="font-size: 24px;">❌</span>
        <div>
          <p style="margin: 0; color: #991b1b; font-weight: bold; font-size: 16px;">انتهى اشتراكك</p>
          <p style="margin: 5px 0 0 0; color: #dc2626; font-size: 14px;">
            انتهى اشتراكك في ${expiredDate}
          </p>
        </div>
      </div>
    </div>
    <p style="font-size: 16px; color: #6b7280; line-height: 1.8;">
      حسابك الآن في وضع القراءة فقط. يمكنك عرض بياناتك لكن لا يمكنك إجراء تعديلات.
    </p>
    <p style="font-size: 16px; color: #6b7280; line-height: 1.8;">
      جدد اشتراكك الآن للعودة إلى استخدام جميع المميزات.
    </p>
    <div style="text-align: center; margin-top: 30px;">
      <a href="https://teacherhub.site/teacher/subscription" style="display: inline-block; background: linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%); color: #ffffff; text-decoration: none; padding: 14px 40px; border-radius: 8px; font-size: 16px; font-weight: bold;">
        تجديد الاشتراك
      </a>
    </div>
  `, 'انتهى اشتراكك في TeacherHub'),

  payment_confirmation: (name: string, packageName: string, amount: number, invoiceId: string, endDate: string, paymentMethod?: string) => getEmailTemplate(`
    <p style="font-size: 18px; color: #374151; margin-bottom: 20px;">
      مرحباً <strong>${name}</strong>،
    </p>
    <div style="background-color: #ecfdf5; border: 1px solid #10b981; border-radius: 8px; padding: 20px; margin: 20px 0;">
      <div style="display: flex; align-items: center; gap: 10px;">
        <span style="font-size: 24px;">✓</span>
        <p style="margin: 0; color: #065f46; font-weight: bold; font-size: 16px;">تم الدفع بنجاح!</p>
      </div>
    </div>
    <div style="background-color: #f9fafb; border-radius: 8px; padding: 20px; margin: 25px 0; border: 1px solid #e5e7eb;">
      <h3 style="color: #1f2937; margin-top: 0; margin-bottom: 15px; font-size: 16px;">تفاصيل الدفع</h3>
      <table style="width: 100%; border-collapse: collapse;">
        <tr>
          <td style="padding: 8px 0; color: #6b7280; font-size: 14px;">رقم الفاتورة:</td>
          <td style="padding: 8px 0; color: #1f2937; font-weight: bold; font-size: 14px; text-align: left;">${invoiceId}</td>
        </tr>
        <tr>
          <td style="padding: 8px 0; color: #6b7280; font-size: 14px;">الباقة:</td>
          <td style="padding: 8px 0; color: #1f2937; font-weight: bold; font-size: 14px; text-align: left;">${packageName}</td>
        </tr>
        <tr>
          <td style="padding: 8px 0; color: #6b7280; font-size: 14px;">المبلغ:</td>
          <td style="padding: 8px 0; color: #1f2937; font-weight: bold; font-size: 14px; text-align: left;">${amount} د.ك</td>
        </tr>
        ${paymentMethod ? `
        <tr>
          <td style="padding: 8px 0; color: #6b7280; font-size: 14px;">طريقة الدفع:</td>
          <td style="padding: 8px 0; color: #1f2937; font-weight: bold; font-size: 14px; text-align: left;">${paymentMethod}</td>
        </tr>
        ` : ''}
      </table>
    </div>
    <div style="background-color: #ecfdf5; border-radius: 8px; padding: 20px; margin: 25px 0; border: 1px solid #a7f3d0;">
      <p style="margin: 0; color: #065f46; font-weight: bold; font-size: 14px;">📅 تاريخ انتهاء الاشتراك</p>
      <p style="margin: 5px 0 0 0; color: #047857; font-size: 18px; font-weight: bold;">${endDate}</p>
    </div>
    <div style="text-align: center; margin-top: 30px;">
      <a href="https://teacherhub.site/teacher" style="display: inline-block; background: linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%); color: #ffffff; text-decoration: none; padding: 14px 40px; border-radius: 8px; font-size: 16px; font-weight: bold;">
        الذهاب إلى لوحة التحكم
      </a>
    </div>
  `, 'تأكيد الدفع - TeacherHub'),

  broadcast: (content: string, title: string) => getEmailTemplate(content, title),
};

interface SendEmailRequest {
  type: 'welcome' | 'subscription_reminder' | 'subscription_expired' | 'payment_confirmation' | 'broadcast';
  to: string;
  data: Record<string, any>;
}

const handler = async (req: Request): Promise<Response> => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const resend = new Resend(Deno.env.get("RESEND_API_KEY"));
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
    );

    const { type, to, data }: SendEmailRequest = await req.json();

    console.log(`Sending ${type} email to:`, to);

    let html = '';
    let subject = '';

    switch (type) {
      case 'welcome':
        html = emailTemplates.welcome(data.name);
        subject = 'مرحباً بك في TeacherHub! 🎉';
        break;
      case 'subscription_reminder':
        html = emailTemplates.subscription_reminder(data.name, data.daysRemaining, data.endDate);
        subject = 'تذكير: اشتراكك سينتهي قريباً ⏰';
        break;
      case 'subscription_expired':
        html = emailTemplates.subscription_expired(data.name, data.expiredDate);
        subject = 'انتهى اشتراكك في TeacherHub';
        break;
      case 'payment_confirmation':
        html = emailTemplates.payment_confirmation(
          data.name,
          data.packageName,
          data.amount,
          data.invoiceId,
          data.endDate,
          data.paymentMethod
        );
        subject = 'تأكيد الدفع - TeacherHub';
        break;
      case 'broadcast':
        html = emailTemplates.broadcast(data.content, data.title);
        subject = data.subject;
        break;
      default:
        throw new Error('Invalid email type');
    }

    const emailResponse = await resend.emails.send({
      from: "TeacherHub <noreply@teacherhub.site>",
      to: [to],
      subject,
      html,
    });

    // Log the email
    await supabase.from('email_logs').insert({
      template_key: type,
      recipient_email: to,
      recipient_name: data.name,
      subject,
      status: 'sent',
      sent_at: new Date().toISOString(),
    });

    console.log("Email sent successfully:", emailResponse);

    return new Response(JSON.stringify({ success: true, data: emailResponse }), {
      status: 200,
      headers: { "Content-Type": "application/json", ...corsHeaders },
    });
  } catch (error: any) {
    console.error("Error sending email:", error);
    
    // Log failed email
    try {
      const supabase = createClient(
        Deno.env.get("SUPABASE_URL") ?? "",
        Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
      );
      const { to, data } = await req.clone().json();
      await supabase.from('email_logs').insert({
        recipient_email: to,
        recipient_name: data?.name,
        subject: 'Failed to send',
        status: 'failed',
        error_message: error.message,
      });
    } catch (logError) {
      console.error("Failed to log email error:", logError);
    }

    return new Response(
      JSON.stringify({ success: false, error: error.message }),
      { status: 500, headers: { "Content-Type": "application/json", ...corsHeaders } }
    );
  }
};

serve(handler);
