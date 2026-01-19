import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { Resend } from "https://esm.sh/resend@2.0.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface PaymentConfirmationRequest {
  email: string;
  name: string;
  packageName: string;
  amount: number;
  currency: string;
  invoiceId: string;
  subscriptionEndsAt: string;
  paymentMethod?: string;
}

const handler = async (req: Request): Promise<Response> => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const resend = new Resend(Deno.env.get("RESEND_API_KEY"));
    
    const {
      email,
      name,
      packageName,
      amount,
      currency,
      invoiceId,
      subscriptionEndsAt,
      paymentMethod
    }: PaymentConfirmationRequest = await req.json();

    console.log("Sending payment confirmation to:", email);

    const formattedDate = new Date(subscriptionEndsAt).toLocaleDateString('ar-SA', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });

    const emailResponse = await resend.emails.send({
      from: "TeacherHub <noreply@teacherhub.site>",
      to: [email],
      subject: "تأكيد الدفع - TeacherHub",
      html: `
        <!DOCTYPE html>
        <html dir="rtl" lang="ar">
        <head>
          <meta charset="UTF-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
        </head>
        <body style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; margin: 0; padding: 0; background-color: #f4f4f5; direction: rtl;">
          <div style="max-width: 600px; margin: 0 auto; background-color: #ffffff; border-radius: 12px; overflow: hidden; margin-top: 20px; margin-bottom: 20px; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);">
            
            <!-- Header -->
            <div style="background: linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%); padding: 30px; text-align: center;">
              <h1 style="color: #ffffff; margin: 0; font-size: 28px;">✓ تم الدفع بنجاح</h1>
            </div>
            
            <!-- Content -->
            <div style="padding: 30px;">
              <p style="font-size: 18px; color: #374151; margin-bottom: 20px;">
                مرحباً <strong>${name}</strong>،
              </p>
              
              <p style="font-size: 16px; color: #6b7280; line-height: 1.8;">
                شكراً لك! تم تفعيل اشتراكك في <strong>TeacherHub</strong> بنجاح. يمكنك الآن الاستمتاع بجميع مميزات النظام.
              </p>
              
              <!-- Payment Details Card -->
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
                    <td style="padding: 8px 0; color: #1f2937; font-weight: bold; font-size: 14px; text-align: left;">${amount} ${currency === 'KWD' ? 'د.ك' : currency}</td>
                  </tr>
                  ${paymentMethod ? `
                  <tr>
                    <td style="padding: 8px 0; color: #6b7280; font-size: 14px;">طريقة الدفع:</td>
                    <td style="padding: 8px 0; color: #1f2937; font-weight: bold; font-size: 14px; text-align: left;">${paymentMethod}</td>
                  </tr>
                  ` : ''}
                </table>
              </div>
              
              <!-- Subscription Info -->
              <div style="background-color: #ecfdf5; border-radius: 8px; padding: 20px; margin: 25px 0; border: 1px solid #a7f3d0;">
                <div style="display: flex; align-items: center;">
                  <span style="font-size: 24px; margin-left: 10px;">📅</span>
                  <div>
                    <p style="margin: 0; color: #065f46; font-weight: bold; font-size: 14px;">تاريخ انتهاء الاشتراك</p>
                    <p style="margin: 5px 0 0 0; color: #047857; font-size: 18px; font-weight: bold;">${formattedDate}</p>
                  </div>
                </div>
              </div>
              
              <!-- CTA Button -->
              <div style="text-align: center; margin-top: 30px;">
                <a href="https://teacherhub.site/teacher" style="display: inline-block; background: linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%); color: #ffffff; text-decoration: none; padding: 14px 40px; border-radius: 8px; font-size: 16px; font-weight: bold;">
                  الذهاب إلى لوحة التحكم
                </a>
              </div>
            </div>
            
            <!-- Footer -->
            <div style="background-color: #f9fafb; padding: 20px; text-align: center; border-top: 1px solid #e5e7eb;">
              <p style="color: #9ca3af; font-size: 12px; margin: 0;">
                © ${new Date().getFullYear()} TeacherHub. جميع الحقوق محفوظة.
              </p>
              <p style="color: #9ca3af; font-size: 12px; margin: 10px 0 0 0;">
                للدعم الفني: support@teacherhub.site
              </p>
            </div>
          </div>
        </body>
        </html>
      `,
    });

    console.log("Email sent successfully:", emailResponse);

    return new Response(JSON.stringify({ success: true, data: emailResponse }), {
      status: 200,
      headers: { "Content-Type": "application/json", ...corsHeaders },
    });
  } catch (error: any) {
    console.error("Error sending confirmation email:", error);
    return new Response(
      JSON.stringify({ success: false, error: error.message }),
      { status: 500, headers: { "Content-Type": "application/json", ...corsHeaders } }
    );
  }
};

serve(handler);
