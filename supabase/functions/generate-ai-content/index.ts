import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// Platform brand colors from Landing page (matching index.css)
const brandColors = {
  primary: "#5BC0CE",      // Cyan/Teal
  primaryLight: "#7DD3E1", // Light Cyan
  secondary: "#4AA8B8",    // Darker Teal
  purple: "#C9A8D6",       // Soft Purple
  lavender: "#E8D5F0",     // Light Lavender
  orange: "#F5C78E",       // Warm Orange
  peach: "#F8DBC5",        // Light Peach
  green: "#10B981",        // Success Green
  background: "#F0F9FA",   // Light cyan background
};

// Expanded app features with multiple marketing texts for randomization
const appFeatures = [
  {
    id: "attendance",
    title: "إدارة الحضور الذكية",
    description: "سجّل حضور طلابك بنقرة واحدة فقط!",
    icon: "calendar with checkmark icon",
    marketingTexts: [
      "وداعاً للورق! سجّل الحضور بثوانٍ",
      "تتبع حضور طلابك بكل سهولة",
      "نظام حضور ذكي وسريع",
      "سجّل الحضور واحصل على تقارير فورية",
    ],
  },
  {
    id: "grades",
    title: "متابعة الدرجات",
    description: "رصد درجات طلابك مع تحليلات الأداء",
    icon: "bar chart going up with star",
    marketingTexts: [
      "تابع تقدم طلابك بذكاء",
      "درجات دقيقة وتحليلات شاملة",
      "ارصد الدرجات في لحظات",
      "تحليل أداء الطلاب بكل وضوح",
    ],
  },
  {
    id: "dashboard",
    title: "لوحة تحكم شاملة",
    description: "كل فصولك وطلابك في مكان واحد",
    icon: "dashboard grid with widgets and charts",
    marketingTexts: [
      "كل شيء تحتاجه في مكان واحد",
      "لوحة تحكم ذكية لكل معلم",
      "نظرة شاملة على كل فصولك",
      "إدارة سهلة ومنظمة",
    ],
  },
  {
    id: "reports",
    title: "تقارير احترافية",
    description: "تقارير PDF جاهزة للطباعة والمشاركة",
    icon: "document with pie chart and print icon",
    marketingTexts: [
      "تقارير جاهزة بضغطة زر",
      "اطبع وشارك تقاريرك بسهولة",
      "تقارير PDF احترافية",
      "وثّق أداء طلابك باحترافية",
    ],
  },
  {
    id: "behavior",
    title: "ملاحظات سلوكية",
    description: "وثّق السلوك الإيجابي والسلبي للطلاب",
    icon: "thumbs up and thumbs down with notepad",
    marketingTexts: [
      "راقب سلوك طلابك بسهولة",
      "وثّق الإيجابيات والسلبيات",
      "تتبع السلوك اليومي للطلاب",
      "نظام ملاحظات سلوكية متكامل",
    ],
  },
  {
    id: "schedule",
    title: "جدول الحصص",
    description: "نظّم جدولك مع تنبيهات ذكية",
    icon: "clock with calendar schedule",
    marketingTexts: [
      "لا تفوّت أي حصة مع التنبيهات الذكية",
      "نظّم وقتك باحترافية",
      "جدول ذكي لكل معلم",
      "تنبيهات قبل كل حصة",
    ],
  },
  {
    id: "classrooms",
    title: "إدارة الفصول",
    description: "أنشئ ونظّم فصولك الدراسية بسهولة",
    icon: "classroom with students silhouettes",
    marketingTexts: [
      "نظّم فصولك باحترافية",
      "أنشئ فصولك في ثوانٍ",
      "إدارة سهلة لكل الفصول",
      "كل فصولك في متناول يدك",
    ],
  },
  {
    id: "random",
    title: "اختيار طالب عشوائي",
    description: "حفّز مشاركة طلابك بأداة تفاعلية",
    icon: "spinning wheel with dice",
    marketingTexts: [
      "اجعل حصتك أكثر تفاعلية!",
      "حفّز طلابك بالتشويق",
      "عشوائية ممتعة في الفصل",
      "أضف الحماس لحصتك",
    ],
  },
  {
    id: "import",
    title: "استيراد الطلاب",
    description: "استورد بيانات طلابك من Excel أو بالصور",
    icon: "upload arrow with spreadsheet",
    marketingTexts: [
      "أضف طلابك في ثوانٍ معدودة",
      "استورد من Excel بسهولة",
      "وفّر وقتك مع الاستيراد الذكي",
      "بيانات طلابك جاهزة فوراً",
    ],
  },
  {
    id: "templates",
    title: "قوالب التقييم",
    description: "صمم نظام تقييمك حسب مادتك ومرحلتك",
    icon: "template grid with checkmarks",
    marketingTexts: [
      "قوالب تقييم مرنة تناسب احتياجاتك",
      "صمم تقييمك الخاص",
      "قوالب جاهزة لكل مادة",
      "تقييم مخصص لكل معلم",
    ],
  },
  {
    id: "students",
    title: "إدارة الطلاب",
    description: "ملفات شاملة لكل طالب مع جميع البيانات",
    icon: "student profile card with avatar",
    marketingTexts: [
      "كل بيانات طلابك في مكان واحد",
      "ملف متكامل لكل طالب",
      "تواصل سهل مع أولياء الأمور",
      "إدارة شاملة لبيانات الطلاب",
    ],
  },
  {
    id: "notifications",
    title: "التنبيهات الذكية",
    description: "لا تفوت أي شيء مع التنبيهات الفورية",
    icon: "bell with notification badge",
    marketingTexts: [
      "ابقَ على اطلاع دائم",
      "تنبيهات فورية لكل جديد",
      "لا تفوت أي تحديث مهم",
      "إشعارات ذكية في الوقت المناسب",
    ],
  },
  {
    id: "analytics",
    title: "تحليلات الأداء",
    description: "رسوم بيانية وإحصائيات تفصيلية",
    icon: "analytics graph with trending arrow",
    marketingTexts: [
      "افهم أداء طلابك بعمق",
      "إحصائيات دقيقة ومفصلة",
      "تحليلات ذكية لقرارات أفضل",
      "اكتشف نقاط القوة والضعف",
    ],
  },
  {
    id: "mobile",
    title: "تطبيق الجوال",
    description: "استخدم المنصة من أي مكان على جوالك",
    icon: "smartphone with app screens",
    marketingTexts: [
      "معك أينما كنت",
      "إدارة فصولك من جوالك",
      "تطبيق سريع وسهل الاستخدام",
      "كل شيء في جيبك",
    ],
  },
  {
    id: "security",
    title: "أمان وخصوصية",
    description: "بياناتك محمية بأعلى معايير الأمان",
    icon: "shield with lock",
    marketingTexts: [
      "بياناتك في أمان تام",
      "خصوصية مضمونة",
      "حماية عالية المستوى",
      "أمان طلابك أولويتنا",
    ],
  },
];

// Function to get random marketing text for a feature
function getRandomMarketingText(feature: typeof appFeatures[0]): string {
  const texts = feature.marketingTexts;
  return texts[Math.floor(Math.random() * texts.length)];
}

// Transform feature for response (with random marketing text)
function transformFeatureForResponse(feature: typeof appFeatures[0]) {
  return {
    id: feature.id,
    title: feature.title,
    description: feature.description,
    icon: feature.icon,
    marketingText: getRandomMarketingText(feature),
  };
}

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { prompt, aspectRatio, featureId, getFeatures } = await req.json();

    // If requesting features list - return with random marketing text each time
    if (getFeatures) {
      const featuresWithRandomText = appFeatures.map(f => transformFeatureForResponse(f));
      return new Response(
        JSON.stringify({ features: featuresWithRandomText }),
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
    let selectedFeature: typeof appFeatures[0] | null = null;
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

    // Transform feature for response with random marketing text
    const responseFeature = selectedFeature ? transformFeatureForResponse(selectedFeature) : null;

    return new Response(
      JSON.stringify({ 
        imageUrl,
        message: data.choices?.[0]?.message?.content || "Image generated successfully",
        feature: responseFeature
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
