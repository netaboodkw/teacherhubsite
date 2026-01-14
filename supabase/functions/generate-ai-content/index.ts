import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// App features for generating content
const appFeatures = [
  {
    title: "إدارة الحضور الذكية",
    description: "تسجيل حضور الطلاب بنقرة واحدة مع تقارير تفصيلية",
    icon: "calendar-check",
    color: "#3B82F6"
  },
  {
    title: "متابعة الدرجات",
    description: "رصد درجات الطلاب مع تحليلات الأداء الأكاديمي",
    icon: "chart-bar",
    color: "#10B981"
  },
  {
    title: "لوحة تحكم شاملة",
    description: "نظرة عامة على جميع الفصول والطلاب في مكان واحد",
    icon: "dashboard",
    color: "#8B5CF6"
  },
  {
    title: "تقارير تفصيلية",
    description: "إنشاء تقارير PDF احترافية لأولياء الأمور",
    icon: "file-text",
    color: "#F59E0B"
  },
  {
    title: "ملاحظات سلوكية",
    description: "توثيق السلوك الإيجابي والسلبي للطلاب",
    icon: "message-circle",
    color: "#EC4899"
  },
  {
    title: "جدول الحصص",
    description: "تنظيم الجدول الدراسي مع تنبيهات ذكية",
    icon: "clock",
    color: "#06B6D4"
  },
  {
    title: "إدارة الفصول",
    description: "إنشاء وتنظيم الفصول الدراسية بسهولة",
    icon: "users",
    color: "#84CC16"
  },
  {
    title: "اختيار طالب عشوائي",
    description: "أداة تفاعلية لتحفيز مشاركة الطلاب",
    icon: "shuffle",
    color: "#F97316"
  }
];

interface FeatureType {
  title: string;
  description: string;
  icon: string;
  color: string;
}

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { prompt, aspectRatio, autoGenerate } = await req.json();

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) {
      console.error("LOVABLE_API_KEY is not configured");
      return new Response(
        JSON.stringify({ error: "API key not configured" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Select a random feature if autoGenerate is true
    let selectedFeature: FeatureType | null = null;
    let finalPrompt = prompt;
    
    if (autoGenerate) {
      selectedFeature = appFeatures[Math.floor(Math.random() * appFeatures.length)];
      finalPrompt = `
Generate an image for a professional social media post about a teacher app feature:

Title: "${selectedFeature.title}"
Description: "${selectedFeature.description}"

Design requirements:
- Aspect ratio: ${aspectRatio}
- Gradient background from dark blue (#1E3A8A) to light blue (#3B82F6)
- Large Arabic title text in white, bold font at the center
- Smaller description text below the title
- Large decorative icon representing ${selectedFeature.icon}
- Modern, clean, minimalist design
- Use vector graphics and icons only, no photos
- Suitable for Instagram Stories
- Professional and attractive layout

The design should reflect the quality of an educational teacher app.
`.trim();
    } else if (!prompt) {
      return new Response(
        JSON.stringify({ error: "Prompt is required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    } else {
      finalPrompt = `Generate an image: ${prompt}`;
    }

    console.log("Calling Lovable AI with prompt:", finalPrompt.substring(0, 150) + "...");

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash-image-preview",
        messages: [
          {
            role: "user",
            content: finalPrompt,
          },
        ],
        modalities: ["image", "text"],
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error("AI gateway error:", response.status, errorText);

      if (response.status === 429) {
        return new Response(
          JSON.stringify({ error: "Rate limit exceeded" }),
          { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      if (response.status === 402) {
        return new Response(
          JSON.stringify({ error: "Payment required" }),
          { status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      return new Response(
        JSON.stringify({ error: "AI gateway error" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const data = await response.json();
    console.log("AI response received");

    // Extract image from response
    const imageUrl = data.choices?.[0]?.message?.images?.[0]?.image_url?.url;

    if (!imageUrl) {
      console.error("No image in response:", JSON.stringify(data).substring(0, 500));
      return new Response(
        JSON.stringify({ error: "No image generated", details: data }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    return new Response(
      JSON.stringify({ 
        imageUrl,
        message: data.choices?.[0]?.message?.content || "Image generated successfully",
        feature: selectedFeature
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );

  } catch (error) {
    console.error("Error in generate-ai-content:", error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
