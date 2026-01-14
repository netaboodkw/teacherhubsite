import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// Platform brand colors from Landing page
const brandColors = {
  primary: "#5BC0CE",      // Cyan/Teal
  primaryLight: "#7DD3E1", // Light Cyan
  secondary: "#4AA8B8",    // Darker Teal
  purple: "#C9A8D6",       // Soft Purple
  orange: "#F5C78E",       // Warm Orange
  green: "#10B981",        // Success Green
};

// App features for generating content
const appFeatures = [
  {
    id: "attendance",
    title: "إدارة الحضور الذكية",
    description: "سجّل حضور طلابك بنقرة واحدة فقط!",
    icon: "calendar with checkmark",
    marketingText: "وداعاً للورق! سجّل الحضور بثوانٍ",
  },
  {
    id: "grades",
    title: "متابعة الدرجات",
    description: "رصد درجات طلابك مع تحليلات الأداء",
    icon: "bar chart going up",
    marketingText: "تابع تقدم طلابك بذكاء",
  },
  {
    id: "dashboard",
    title: "لوحة تحكم شاملة",
    description: "كل فصولك وطلابك في مكان واحد",
    icon: "dashboard with widgets",
    marketingText: "كل شيء تحتاجه في مكان واحد",
  },
  {
    id: "reports",
    title: "تقارير احترافية",
    description: "تقارير PDF جاهزة للطباعة والمشاركة",
    icon: "document with charts",
    marketingText: "تقارير جاهزة بضغطة زر",
  },
  {
    id: "behavior",
    title: "ملاحظات سلوكية",
    description: "وثّق السلوك الإيجابي والسلبي للطلاب",
    icon: "speech bubbles with thumbs up/down",
    marketingText: "راقب سلوك طلابك بسهولة",
  },
  {
    id: "schedule",
    title: "جدول الحصص",
    description: "نظّم جدولك مع تنبيهات ذكية",
    icon: "clock with schedule",
    marketingText: "لا تفوّت أي حصة مع التنبيهات الذكية",
  },
  {
    id: "classrooms",
    title: "إدارة الفصول",
    description: "أنشئ ونظّم فصولك الدراسية بسهولة",
    icon: "group of students",
    marketingText: "نظّم فصولك باحترافية",
  },
  {
    id: "random",
    title: "اختيار طالب عشوائي",
    description: "حفّز مشاركة طلابك بأداة تفاعلية",
    icon: "dice or shuffle arrows",
    marketingText: "اجعل حصتك أكثر تفاعلية!",
  },
  {
    id: "import",
    title: "استيراد الطلاب",
    description: "استورد بيانات طلابك من Excel أو بالصور",
    icon: "upload with spreadsheet",
    marketingText: "أضف طلابك في ثوانٍ معدودة",
  },
  {
    id: "templates",
    title: "قوالب التقييم",
    description: "صمم نظام تقييمك حسب مادتك ومرحلتك",
    icon: "template with checkboxes",
    marketingText: "قوالب تقييم مرنة تناسب احتياجاتك",
  }
];

interface FeatureType {
  id: string;
  title: string;
  description: string;
  icon: string;
  marketingText: string;
}

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { prompt, aspectRatio, featureId, getFeatures } = await req.json();

    // If requesting features list
    if (getFeatures) {
      return new Response(
        JSON.stringify({ features: appFeatures }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) {
      console.error("LOVABLE_API_KEY is not configured");
      return new Response(
        JSON.stringify({ error: "API key not configured" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Find selected feature
    let selectedFeature: FeatureType | null = null;
    if (featureId) {
      selectedFeature = appFeatures.find(f => f.id === featureId) || null;
      if (!selectedFeature) {
        // Random feature if not found
        selectedFeature = appFeatures[Math.floor(Math.random() * appFeatures.length)];
      }
    }

    // Create prompt for visual-only design (no Arabic text - we'll overlay it)
    let finalPrompt: string;
    
    if (selectedFeature) {
      finalPrompt = `
Create a stunning visual background design for a mobile app social media post. 
DO NOT include any text or letters in the image - this is just a background.

DESIGN REQUIREMENTS:
- Create a beautiful abstract gradient background
- Main colors: Cyan (#5BC0CE, #7DD3E1), Purple (#C9A8D6), with subtle Orange (#F5C78E) accents
- Add a large, prominent white icon representing: ${selectedFeature.icon}
- The icon should be centered and clearly visible
- Add subtle decorative elements: floating circles, dots, soft light effects, abstract shapes
- Style: Modern, clean, minimalist, professional, suitable for education/school app
- Aspect ratio: ${aspectRatio} (vertical, for Instagram stories)
- The design should have space at top and bottom for text overlay later
- Make it look like premium app marketing material
- Use soft gradients and modern glassmorphism effects
- NO TEXT, NO LETTERS, NO WORDS - only visual elements and icons

Make it visually stunning and suitable for Instagram/social media marketing.
`.trim();
    } else if (prompt) {
      finalPrompt = `
Create a visual background design for social media with these specifications:
DO NOT include any text or letters - this is just a visual background.

USER REQUEST: ${prompt}

DESIGN:
- Color scheme: Cyan (#5BC0CE, #7DD3E1), Purple (#C9A8D6), Orange (#F5C78E)
- Aspect ratio: ${aspectRatio}
- Style: Modern, clean, professional, suitable for social media
- Add decorative elements and icons based on the request
- NO TEXT, NO LETTERS, NO WORDS - only visual elements

Make it visually stunning and marketing-ready.
`.trim();
    } else {
      return new Response(
        JSON.stringify({ error: "Feature ID or prompt is required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    console.log("Calling Lovable AI with feature:", selectedFeature?.title || "custom prompt");

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
