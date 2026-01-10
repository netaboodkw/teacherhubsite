import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { fileBase64, fileType, fileName } = await req.json();
    
    if (!fileBase64) {
      throw new Error("No file provided");
    }

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) {
      throw new Error("LOVABLE_API_KEY is not configured");
    }

    // Prepare the content based on file type
    let content: any[] = [];
    
    if (fileType.startsWith("image/")) {
      // For images, use multimodal capability
      content = [
        {
          type: "text",
          text: `أنت محلل قوالب درجات متخصص. قم بتحليل صورة جدول الدرجات المرفقة واستخراج الهيكل بدقة.

استخرج المعلومات التالية بالضبط:
1. أسماء الأعمدة (مثل: أعمال ١، أعمال ٢، اختبار، المجموع)
2. أقصى درجة لكل عمود
3. التجميعات (المجموعات التي تحتوي على أعمدة فرعية)

قم بإرجاع النتيجة بالتنسيق التالي فقط (JSON):
{
  "templateName": "اسم القالب المقترح",
  "groups": [
    {
      "name": "اسم المجموعة",
      "columns": [
        { "name": "اسم العمود", "maxScore": 2, "type": "score" },
        { "name": "المجموع", "maxScore": 10, "type": "total" }
      ]
    }
  ],
  "totalMaxScore": 100
}

ملاحظات:
- type يكون "score" للدرجات العادية و "total" للمجاميع
- إذا لم تتمكن من قراءة قيمة، استخدم 0
- حافظ على الترتيب الأصلي للأعمدة`
        },
        {
          type: "image_url",
          image_url: {
            url: `data:${fileType};base64,${fileBase64}`
          }
        }
      ];
    } else {
      // For other files (Excel, PDF), send as text description
      content = [
        {
          type: "text",
          text: `أنت محلل قوالب درجات متخصص. الملف المرفق هو: ${fileName} (نوع: ${fileType})

بناءً على اسم الملف ونوعه، اقترح هيكل قالب درجات مناسب.

قم بإرجاع النتيجة بالتنسيق التالي فقط (JSON):
{
  "templateName": "اسم القالب المقترح",
  "groups": [
    {
      "name": "اسم المجموعة",
      "columns": [
        { "name": "اسم العمود", "maxScore": 2, "type": "score" },
        { "name": "المجموع", "maxScore": 10, "type": "total" }
      ]
    }
  ],
  "totalMaxScore": 100
}

ملاحظات:
- type يكون "score" للدرجات العادية و "total" للمجاميع
- اقترح هيكل قالب معقول بناءً على السياق`
        }
      ];
    }

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [
          {
            role: "user",
            content
          }
        ],
      }),
    });

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(JSON.stringify({ error: "تم تجاوز حد الطلبات، يرجى المحاولة لاحقاً" }), {
          status: 429,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      if (response.status === 402) {
        return new Response(JSON.stringify({ error: "يرجى إضافة رصيد لحساب Lovable AI" }), {
          status: 402,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      const errorText = await response.text();
      console.error("AI gateway error:", response.status, errorText);
      throw new Error("فشل في تحليل الملف");
    }

    const data = await response.json();
    const content_text = data.choices?.[0]?.message?.content || "";
    
    // Extract JSON from the response
    let structure = null;
    try {
      // Try to find JSON in the response
      const jsonMatch = content_text.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        structure = JSON.parse(jsonMatch[0]);
      }
    } catch (e) {
      console.error("Failed to parse AI response as JSON:", e);
    }

    if (!structure) {
      // Return a default structure if parsing fails
      structure = {
        templateName: "قالب جديد",
        groups: [
          {
            name: "المجموعة الأولى",
            columns: [
              { name: "عمود 1", maxScore: 10, type: "score" },
              { name: "المجموع", maxScore: 10, type: "total" }
            ]
          }
        ],
        totalMaxScore: 10
      };
    }

    return new Response(JSON.stringify({ structure, rawResponse: content_text }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Error in analyze-grading-template:", error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "خطأ غير معروف" }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});
