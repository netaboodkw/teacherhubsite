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
    title: "إدارة الحضور الذكية",
    description: "سجّل حضور طلابك بنقرة واحدة فقط!",
    icon: "calendar with checkmark",
  },
  {
    title: "متابعة الدرجات",
    description: "رصد درجات طلابك مع تحليلات الأداء",
    icon: "bar chart going up",
  },
  {
    title: "لوحة تحكم شاملة",
    description: "كل فصولك وطلابك في مكان واحد",
    icon: "dashboard with widgets",
  },
  {
    title: "تقارير احترافية",
    description: "تقارير PDF جاهزة للطباعة والمشاركة",
    icon: "document with charts",
  },
  {
    title: "ملاحظات سلوكية",
    description: "وثّق السلوك الإيجابي والسلبي للطلاب",
    icon: "speech bubbles with thumbs up/down",
  },
  {
    title: "جدول الحصص",
    description: "نظّم جدولك مع تنبيهات ذكية",
    icon: "clock with schedule",
  },
  {
    title: "إدارة الفصول",
    description: "أنشئ ونظّم فصولك الدراسية بسهولة",
    icon: "group of students",
  },
  {
    title: "اختيار طالب عشوائي",
    description: "حفّز مشاركة طلابك بأداة تفاعلية",
    icon: "dice or shuffle arrows",
  },
  {
    title: "استيراد الطلاب",
    description: "استورد بيانات طلابك من Excel أو بالصور",
    icon: "upload with spreadsheet",
  },
  {
    title: "قوالب التقييم",
    description: "صمم نظام تقييمك حسب مادتك ومرحلتك",
    icon: "template with checkboxes",
  }
];

interface FeatureType {
  title: string;
  description: string;
  icon: string;
}

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { prompt, aspectRatio, autoGenerate, logoUrl } = await req.json();

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
      
      const logoInstruction = logoUrl 
        ? `IMPORTANT: Include the actual platform logo from this URL: ${logoUrl} - Place it prominently at the top or bottom of the image.`
        : `Logo area: Small white circle or rounded rectangle at bottom with a simple education/teacher icon inside.`;

      finalPrompt = `
Create a professional Arabic social media story/post image for a teacher app called "منصة المعلم الذكي" (Teacher Hub).

CRITICAL REQUIREMENTS:
1. Arabic text MUST be clear, readable, and correctly written (right-to-left)
2. Include the app name "منصة المعلم الذكي" at the top or bottom
3. Include "teacher-hub.app" website URL in small text
4. ${logoInstruction}

CONTENT:
- Main Title (Arabic, large, bold, white): "${selectedFeature.title}"
- Description (Arabic, smaller, white/light): "${selectedFeature.description}"
- Icon: A simple ${selectedFeature.icon} icon in white

DESIGN:
- Aspect ratio: ${aspectRatio} (vertical, for Instagram stories)
- Background: Beautiful gradient from ${brandColors.primary} (cyan) to ${brandColors.primaryLight} (light cyan) with subtle ${brandColors.purple} (purple) accent
- Style: Modern, clean, minimalist, professional
- Add subtle decorative elements like circles, dots, or waves in lighter shades
- The design should look like a premium app marketing material
- Use vector/flat design style, no photos

BRANDING:
- Website: "teacher-hub.app" in small white text
- Colors: Cyan (#5BC0CE, #7DD3E1), Purple (#C9A8D6), Orange accents (#F5C78E)

Make it visually stunning and suitable for Instagram/social media marketing.
`.trim();
    } else if (!prompt) {
      return new Response(
        JSON.stringify({ error: "Prompt is required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    } else {
      // For custom prompts, add branding requirements
      const logoInstruction = logoUrl 
        ? `Include the platform logo from: ${logoUrl}`
        : `Include a simple education/teacher icon`;

      finalPrompt = `
Create an Arabic social media image with these specifications:

CRITICAL: Arabic text must be clear and readable (right-to-left).

USER REQUEST: ${prompt}

BRANDING TO INCLUDE:
- App name "منصة المعلم الذكي" somewhere visible
- Website "teacher-hub.app" in small text
- ${logoInstruction}
- Color scheme: Cyan (#5BC0CE, #7DD3E1), Purple (#C9A8D6), Orange (#F5C78E)
- Aspect ratio: ${aspectRatio}
- Style: Modern, clean, professional, suitable for social media

Make it visually stunning and marketing-ready.
`.trim();
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
