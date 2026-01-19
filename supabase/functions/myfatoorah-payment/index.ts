import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
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
    const supabaseClient = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
    );

    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      throw new Error("Missing authorization header");
    }

    const { data: { user }, error: userError } = await createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_ANON_KEY") ?? "",
      { global: { headers: { Authorization: authHeader } } }
    ).auth.getUser();

    if (userError || !user) {
      throw new Error("Unauthorized");
    }

    const { action, ...params } = await req.json();

    // Try to get API key from system_settings first, then fall back to environment variable
    let myfatoorahApiKey = Deno.env.get("MYFATOORAH_API_KEY") || "";
    let myfatoorahTestMode = true; // Default to test mode for safety

    // Get settings from database
    const { data: apiKeySetting, error: apiKeyError } = await supabaseClient
      .from("system_settings")
      .select("value")
      .eq("key", "myfatoorah_api_key")
      .maybeSingle();

    const { data: testModeSetting } = await supabaseClient
      .from("system_settings")
      .select("value")
      .eq("key", "myfatoorah_test_mode")
      .maybeSingle();

    // Check if API key from database is valid
    if (apiKeySetting?.value) {
      const dbApiKey = typeof apiKeySetting.value === 'string' 
        ? apiKeySetting.value.trim() 
        : (apiKeySetting.value as any)?.toString?.()?.trim() || "";
      
      if (dbApiKey && dbApiKey.length > 10) {
        myfatoorahApiKey = dbApiKey;
      }
    }

    if (testModeSetting?.value !== undefined) {
      const testModeValue = testModeSetting.value;
      myfatoorahTestMode = testModeValue === true || testModeValue === 'true' || testModeValue === "true";
    }

    // Determine base URL based on test mode
    const MYFATOORAH_BASE_URL = myfatoorahTestMode 
      ? "https://apitest.myfatoorah.com" 
      : "https://api.myfatoorah.com";

    console.log("MyFatoorah Config:", {
      hasApiKey: !!myfatoorahApiKey,
      apiKeyLength: myfatoorahApiKey?.length || 0,
      testMode: myfatoorahTestMode,
      baseUrl: MYFATOORAH_BASE_URL
    });

    if (!myfatoorahApiKey || myfatoorahApiKey.length < 10) {
      throw new Error("مفتاح API لماي فاتورة غير مُعد. الرجاء إعداده من لوحة تحكم الأدمن في الإعدادات");
    }

    const MYFATOORAH_API_KEY = myfatoorahApiKey;

    // Get payment methods
    if (action === "get-payment-methods") {
      const { invoiceValue, currencyIso = "KWD" } = params;

      console.log("Getting payment methods for:", { invoiceValue, currencyIso });

      const response = await fetch(`${MYFATOORAH_BASE_URL}/v2/InitiatePayment`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${MYFATOORAH_API_KEY}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          InvoiceAmount: invoiceValue,
          CurrencyIso: currencyIso,
        }),
      });

      const result = await response.json();

      console.log("Payment methods response:", result);

      if (!result.IsSuccess) {
        console.error("MyFatoorah Error:", result);
        throw new Error(result.Message || "فشل في جلب طرق الدفع");
      }

      // Filter active payment methods
      const paymentMethods = result.Data.PaymentMethods.filter((method: any) => method.IsDirectPayment);

      return new Response(
        JSON.stringify({
          success: true,
          paymentMethods: paymentMethods.map((m: any) => ({
            PaymentMethodId: m.PaymentMethodId,
            PaymentMethodAr: m.PaymentMethodAr,
            PaymentMethodEn: m.PaymentMethodEn,
            PaymentMethodCode: m.PaymentMethodCode,
            ImageUrl: m.ImageUrl,
            ServiceCharge: m.ServiceCharge,
            TotalAmount: m.TotalAmount,
          })),
        }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Execute direct payment
    if (action === "execute-payment") {
      const { packageId, discountCode, paymentMethodId, callbackUrl, errorUrl } = params;

      // Get package details
      const { data: pkg, error: pkgError } = await supabaseClient
        .from("subscription_packages")
        .select("*")
        .eq("id", packageId)
        .single();

      if (pkgError || !pkg) {
        throw new Error("Package not found");
      }

      let discountAmount = 0;
      let discountCodeId = null;

      // Validate discount code if provided
      if (discountCode) {
        const { data: discount, error: discountError } = await supabaseClient
          .from("discount_codes")
          .select("*")
          .eq("code", discountCode.toUpperCase())
          .eq("is_active", true)
          .single();

        if (!discountError && discount) {
          const now = new Date();
          const validFrom = discount.valid_from ? new Date(discount.valid_from) : null;
          const validUntil = discount.valid_until ? new Date(discount.valid_until) : null;

          if ((!validFrom || now >= validFrom) && (!validUntil || now <= validUntil)) {
            if (!discount.max_uses || discount.current_uses < discount.max_uses) {
              if (discount.discount_type === "percentage") {
                discountAmount = (pkg.price * discount.discount_value) / 100;
              } else {
                discountAmount = discount.discount_value;
              }
              discountCodeId = discount.id;
            }
          }
        }
      }

      const finalAmount = Math.max(0, pkg.price - discountAmount);

      // Create payment record
      const { data: payment, error: paymentError } = await supabaseClient
        .from("subscription_payments")
        .insert({
          user_id: user.id,
          package_id: packageId,
          discount_code_id: discountCodeId,
          amount: finalAmount,
          original_amount: pkg.price,
          discount_amount: discountAmount,
          currency: pkg.currency,
          status: "pending",
        })
        .select()
        .single();

      if (paymentError) {
        throw new Error("Failed to create payment record");
      }

      // Get user profile for customer info
      const { data: profile } = await supabaseClient
        .from("profiles")
        .select("full_name, phone")
        .eq("user_id", user.id)
        .single();

      // Execute direct payment with selected payment method
      const executePaymentData = {
        PaymentMethodId: paymentMethodId,
        CustomerName: profile?.full_name || "Teacher",
        DisplayCurrencyIso: pkg.currency,
        MobileCountryCode: "+966",
        CustomerMobile: profile?.phone || "0500000000",
        CustomerEmail: user.email,
        InvoiceValue: finalAmount,
        CallBackUrl: callbackUrl,
        ErrorUrl: errorUrl,
        Language: "AR",
        CustomerReference: payment.id,
        InvoiceItems: [
          {
            ItemName: pkg.name_ar,
            Quantity: 1,
            UnitPrice: finalAmount,
          },
        ],
      };

      console.log("Executing payment:", executePaymentData);

      const response = await fetch(`${MYFATOORAH_BASE_URL}/v2/ExecutePayment`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${MYFATOORAH_API_KEY}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(executePaymentData),
      });

      const result = await response.json();

      console.log("Execute payment response:", result);

      if (!result.IsSuccess) {
        console.error("MyFatoorah Error:", result);
        const errorMessage = result.Message || result.ValidationErrors?.[0]?.Error || "فشل في تنفيذ عملية الدفع";
        
        if (errorMessage.includes("token") || errorMessage.includes("Token") || errorMessage.includes("expired")) {
          throw new Error("مفتاح API لماي فاتورة غير صالح أو منتهي الصلاحية");
        }
        
        throw new Error(errorMessage);
      }

      // Update payment with invoice ID
      await supabaseClient
        .from("subscription_payments")
        .update({
          invoice_id: result.Data.InvoiceId.toString(),
        })
        .eq("id", payment.id);

      return new Response(
        JSON.stringify({
          success: true,
          paymentUrl: result.Data.PaymentURL,
          paymentId: payment.id,
          invoiceId: result.Data.InvoiceId,
        }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    if (action === "initiate-payment") {
      const { packageId, discountCode, callbackUrl, errorUrl } = params;

      // Get package details
      const { data: pkg, error: pkgError } = await supabaseClient
        .from("subscription_packages")
        .select("*")
        .eq("id", packageId)
        .single();

      if (pkgError || !pkg) {
        throw new Error("Package not found");
      }

      let discountAmount = 0;
      let discountCodeId = null;

      // Validate discount code if provided
      if (discountCode) {
        const { data: discount, error: discountError } = await supabaseClient
          .from("discount_codes")
          .select("*")
          .eq("code", discountCode.toUpperCase())
          .eq("is_active", true)
          .single();

        if (!discountError && discount) {
          // Check validity
          const now = new Date();
          const validFrom = discount.valid_from ? new Date(discount.valid_from) : null;
          const validUntil = discount.valid_until ? new Date(discount.valid_until) : null;

          if ((!validFrom || now >= validFrom) && (!validUntil || now <= validUntil)) {
            if (!discount.max_uses || discount.current_uses < discount.max_uses) {
              if (discount.discount_type === "percentage") {
                discountAmount = (pkg.price * discount.discount_value) / 100;
              } else {
                discountAmount = discount.discount_value;
              }
              discountCodeId = discount.id;
            }
          }
        }
      }

      const finalAmount = Math.max(0, pkg.price - discountAmount);

      // Create payment record
      const { data: payment, error: paymentError } = await supabaseClient
        .from("subscription_payments")
        .insert({
          user_id: user.id,
          package_id: packageId,
          discount_code_id: discountCodeId,
          amount: finalAmount,
          original_amount: pkg.price,
          discount_amount: discountAmount,
          currency: pkg.currency,
          status: "pending",
        })
        .select()
        .single();

      if (paymentError) {
        throw new Error("Failed to create payment record");
      }

      // Get user profile for customer info
      const { data: profile } = await supabaseClient
        .from("profiles")
        .select("full_name, phone")
        .eq("user_id", user.id)
        .single();

      // Create MyFatoorah invoice
      const invoiceData = {
        NotificationOption: "ALL",
        CustomerName: profile?.full_name || "Teacher",
        DisplayCurrencyIso: pkg.currency,
        MobileCountryCode: "+966",
        CustomerMobile: profile?.phone || "0500000000",
        CustomerEmail: user.email,
        InvoiceValue: finalAmount,
        CallBackUrl: callbackUrl,
        ErrorUrl: errorUrl,
        Language: "AR",
        CustomerReference: payment.id,
        InvoiceItems: [
          {
            ItemName: pkg.name_ar,
            Quantity: 1,
            UnitPrice: finalAmount,
          },
        ],
      };

      const response = await fetch(`${MYFATOORAH_BASE_URL}/v2/SendPayment`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${MYFATOORAH_API_KEY}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(invoiceData),
      });

      const result = await response.json();

      if (!result.IsSuccess) {
        console.error("MyFatoorah Error:", result);
        const errorMessage = result.Message || result.ValidationErrors?.[0]?.Error || "فشل في إنشاء الفاتورة";
        
        // Provide more helpful error messages
        if (errorMessage.includes("token") || errorMessage.includes("Token") || errorMessage.includes("expired")) {
          throw new Error("مفتاح API لماي فاتورة غير صالح أو منتهي الصلاحية. الرجاء التحقق من الإعدادات في لوحة تحكم الأدمن");
        }
        
        throw new Error(errorMessage);
      }

      // Update payment with invoice ID
      await supabaseClient
        .from("subscription_payments")
        .update({
          invoice_id: result.Data.InvoiceId.toString(),
        })
        .eq("id", payment.id);

      return new Response(
        JSON.stringify({
          success: true,
          paymentUrl: result.Data.InvoiceURL,
          paymentId: payment.id,
        }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    if (action === "verify-payment") {
      const { paymentId } = params;

      // Get payment record
      const { data: payment, error: paymentError } = await supabaseClient
        .from("subscription_payments")
        .select("*")
        .eq("id", paymentId)
        .single();

      if (paymentError || !payment) {
        throw new Error("Payment not found");
      }

      if (payment.status === "completed") {
        return new Response(
          JSON.stringify({ success: true, status: "completed" }),
          { headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      // Verify with MyFatoorah
      const response = await fetch(`${MYFATOORAH_BASE_URL}/v2/GetPaymentStatus`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${MYFATOORAH_API_KEY}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          Key: payment.invoice_id,
          KeyType: "InvoiceId",
        }),
      });

      const result = await response.json();

      if (!result.IsSuccess) {
        throw new Error("Failed to verify payment");
      }

      const invoiceStatus = result.Data.InvoiceStatus;
      const isPaid = invoiceStatus === "Paid";

      if (isPaid) {
        // Update payment status
        await supabaseClient
          .from("subscription_payments")
          .update({
            status: "completed",
            paid_at: new Date().toISOString(),
            payment_reference: result.Data.InvoiceTransactions?.[0]?.PaymentId,
            payment_method: result.Data.InvoiceTransactions?.[0]?.PaymentGateway,
          })
          .eq("id", paymentId);

        // Get package details
        const { data: pkg } = await supabaseClient
          .from("subscription_packages")
          .select("courses_count")
          .eq("id", payment.package_id)
          .single();

        // Update or create subscription
        const { data: existingSub } = await supabaseClient
          .from("teacher_subscriptions")
          .select("*")
          .eq("user_id", payment.user_id)
          .single();

        const coursesCount = pkg?.courses_count || 1;
        const now = new Date();
        
        // Calculate subscription end date based on courses
        const { data: courses } = await supabaseClient
          .from("subscription_courses")
          .select("end_date")
          .eq("is_active", true)
          .order("end_date", { ascending: true })
          .limit(coursesCount);

        const subscriptionEndsAt = courses && courses.length > 0 
          ? courses[courses.length - 1].end_date 
          : new Date(now.getFullYear() + 1, now.getMonth(), now.getDate()).toISOString();

        if (existingSub) {
          await supabaseClient
            .from("teacher_subscriptions")
            .update({
              package_id: payment.package_id,
              status: "active",
              subscription_started_at: now.toISOString(),
              subscription_ends_at: subscriptionEndsAt,
              courses_remaining: coursesCount,
              is_read_only: false,
            })
            .eq("id", existingSub.id);
        } else {
          await supabaseClient
            .from("teacher_subscriptions")
            .insert({
              user_id: payment.user_id,
              package_id: payment.package_id,
              status: "active",
              subscription_started_at: now.toISOString(),
              subscription_ends_at: subscriptionEndsAt,
              courses_remaining: coursesCount,
              is_read_only: false,
            });
        }

        // Increment discount code usage if used
        if (payment.discount_code_id) {
          await supabaseClient.rpc("increment_discount_usage", {
            code_id: payment.discount_code_id,
          });
        }

        return new Response(
          JSON.stringify({ success: true, status: "completed" }),
          { headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      return new Response(
        JSON.stringify({ success: true, status: invoiceStatus.toLowerCase() }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    throw new Error("Invalid action");
  } catch (error: unknown) {
    console.error("Error:", error);
    const message = error instanceof Error ? error.message : "Unknown error";
    return new Response(
      JSON.stringify({ success: false, error: message }),
      { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
