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
      // For images, use multimodal capability with advanced model
      content = [
        {
          type: "text",
          text: `أنت خبير متخصص في تحليل وثائق ونماذج الدرجات التعليمية. مهمتك هي تحليل صورة جدول/نموذج الدرجات المرفقة واستخراج هيكل البيانات بدقة عالية.

## التعليمات:
1. افحص الصورة بعناية وحدد جميع الأعمدة والصفوف
2. حدد المجموعات الرئيسية (مثل: أعمال الفترة الأولى، أعمال الفترة الثانية، الاختبارات)
3. لكل مجموعة، حدد الأعمدة الفرعية مع درجاتها القصوى
4. ميّز بين أعمدة الدرجات العادية وأعمدة المجاميع

## قواعد التحليل:
- إذا كان العمود يحتوي على كلمة "مجموع" أو "إجمالي" أو "total"، نوعه "total"
- باقي الأعمدة نوعها "score"
- إذا لم تستطع قراءة الدرجة، استخدم القيمة الأكثر شيوعاً في السياق
- حافظ على الترتيب الأصلي للأعمدة من اليمين لليسار

## تنسيق الإخراج المطلوب (JSON فقط):
{
  "templateName": "اسم وصفي للقالب بناءً على محتواه",
  "groups": [
    {
      "name": "اسم المجموعة",
      "columns": [
        { "name": "اسم العمود", "maxScore": 2, "type": "score" },
        { "name": "المجموع", "maxScore": 10, "type": "total" }
      ]
    }
  ],
  "totalMaxScore": 100,
  "detectedInfo": {
    "subject": "المادة إن وُجدت",
    "grade": "الصف إن وُجد",
    "semester": "الفصل إن وُجد"
  }
}

أعد فقط كود JSON بدون أي نص إضافي.`
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
          text: `أنت خبير في إنشاء قوالب الدرجات التعليمية. بناءً على اسم الملف "${fileName}" ونوعه (${fileType})، اقترح هيكل قالب درجات مناسب للمعايير التعليمية في الخليج العربي.

## تنسيق الإخراج المطلوب (JSON فقط):
{
  "templateName": "اسم وصفي للقالب",
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

أعد فقط كود JSON بدون أي نص إضافي.`
        }
      ];
    }

    console.log("Calling AI gateway for template analysis...");

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-pro",
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
    
    console.log("AI Response received, parsing...");
    
    // Extract JSON from the response
    let structure = null;
    try {
      // Try to find JSON in the response (handle markdown code blocks)
      let jsonStr = content_text;
      
      // Remove markdown code blocks if present
      const codeBlockMatch = content_text.match(/```(?:json)?\s*([\s\S]*?)```/);
      if (codeBlockMatch) {
        jsonStr = codeBlockMatch[1].trim();
      } else {
        // Try to find raw JSON object
        const jsonMatch = content_text.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
          jsonStr = jsonMatch[0];
        }
      }
      
      structure = JSON.parse(jsonStr);
      
      // Validate and normalize structure
      if (!structure.groups || !Array.isArray(structure.groups)) {
        throw new Error("Invalid structure: missing groups array");
      }
      
      // Ensure all required fields exist
      structure.groups = structure.groups.map((group: any) => ({
        name: group.name || "مجموعة",
        columns: (group.columns || []).map((col: any) => ({
          name: col.name || "عمود",
          maxScore: typeof col.maxScore === 'number' ? col.maxScore : parseInt(col.maxScore) || 1,
          type: col.type === 'total' ? 'total' : 'score'
        }))
      }));
      
      // Calculate total max score if not provided
      if (!structure.totalMaxScore) {
        structure.totalMaxScore = structure.groups.reduce((total: number, group: any) => {
          return total + group.columns.reduce((groupTotal: number, col: any) => {
            return groupTotal + (col.type === 'total' ? 0 : col.maxScore);
          }, 0);
        }, 0);
      }
      
    } catch (e) {
      console.error("Failed to parse AI response as JSON:", e);
      console.log("Raw response:", content_text);
    }

    if (!structure) {
      // Return a default structure if parsing fails
      structure = {
        templateName: "قالب جديد",
        groups: [
          {
            name: "المجموعة الأولى",
            columns: [
              { name: "أعمال 1", maxScore: 5, type: "score" },
              { name: "أعمال 2", maxScore: 5, type: "score" },
              { name: "المجموع", maxScore: 10, type: "total" }
            ]
          }
        ],
        totalMaxScore: 10
      };
    }

    console.log("Template analysis complete");

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
