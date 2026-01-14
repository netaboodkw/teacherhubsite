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

// Color palette configurations
const colorPalettes = {
  pastel: {
    name: "Pastel",
    colors: "Soft teal (#A8DDE6, #7DD3E1), Lavender (#DCC6E8, #E8D5F0), Soft peach (#FDDCB8, #FEE8D6), Mint green (#B8E6CF)",
    mood: "soft, gentle, warm, calming",
  },
  vibrant: {
    name: "Vibrant",
    colors: "Coral red (#FF6B6B), Turquoise (#4ECDC4), Sunny yellow (#FFE66D), Fresh mint (#95E1D3)",
    mood: "energetic, exciting, playful, dynamic",
  },
  dark: {
    name: "Dark",
    colors: "Deep navy (#2C3E50), Royal purple (#8E44AD), Emerald (#16A085), Crimson (#E74C3C)",
    mood: "elegant, professional, sophisticated, bold",
  },
  sunset: {
    name: "Sunset",
    colors: "Warm orange (#FF6B35), Soft cream (#F7C59F), Light beige (#EFEFD0), Deep blue (#004E89)",
    mood: "warm, inspiring, hopeful, romantic",
  },
  ocean: {
    name: "Ocean",
    colors: "Deep blue (#0077B6), Bright cyan (#00B4D8), Light sky (#90E0EF), Pale aqua (#CAF0F8)",
    mood: "calm, refreshing, peaceful, serene",
  },
};

// Design style configurations
const designStyles: Record<string, { name: string; description: string }> = {
  // Educational styles
  classroom: {
    name: "Classroom/School",
    description: "Traditional classroom setting with desks, chairs, blackboard, and school supplies. Warm and nostalgic school atmosphere with neat rows of desks.",
  },
  cartoon: {
    name: "Cartoon Characters",
    description: "Cute animated cartoon characters like teachers, students, books with faces, and educational mascots. Pixar/Disney inspired friendly characters with expressive faces.",
  },
  chalkboard: {
    name: "Chalkboard/Blackboard",
    description: "Green or black chalkboard background with white and colored chalk drawings. Hand-drawn educational diagrams, equations, and doodles like a real teacher's board.",
  },
  notebook: {
    name: "Notebook/Paper",
    description: "Notebook paper with lined or grid patterns, sticky notes, paper clips, and handwritten elements. School supplies arranged on a desk.",
  },
  kids: {
    name: "Kids Drawing",
    description: "Childlike crayon or marker drawings with bright colors. Simple, playful illustrations as if drawn by a creative child with thick lines and fun shapes.",
  },
  stickers: {
    name: "Stickers & Badges",
    description: "Colorful reward stickers, gold stars, trophy badges, and achievement stamps. Motivational elements teachers use to encourage students.",
  },
  // Artistic styles
  clay3d: {
    name: "3D Clay/Plasticine",
    description: "Soft, rounded, cute 3D objects with a handmade clay or plasticine feel. Think Claymation style with smooth, tactile surfaces.",
  },
  watercolor: {
    name: "Watercolor Illustration",
    description: "Soft, artistic watercolor splashes and painted elements. Flowing colors with gentle gradients and organic brush strokes.",
  },
  origami: {
    name: "Paper Craft/Origami",
    description: "Layered paper cutouts with subtle shadows and depth. Clean geometric folds like Japanese origami art.",
  },
  isometric: {
    name: "Isometric 3D",
    description: "Clean geometric 3D objects from an isometric perspective. Modern, tech-inspired with precise angles.",
  },
  glassmorphism: {
    name: "Glassmorphism",
    description: "Frosted glass effect with transparency and blur. Modern UI style with floating glass panels and soft light reflections.",
  },
  retro: {
    name: "Retro/Vintage",
    description: "Classic vintage style with halftone patterns, worn textures, and nostalgic color schemes. 70s-80s inspired aesthetic.",
  },
  neon: {
    name: "Neon Glow",
    description: "Vibrant neon lights with glowing effects on dark backgrounds. Cyberpunk-inspired with electric colors and light trails.",
  },
  minimal: {
    name: "Minimalist",
    description: "Clean, simple design with lots of white space. Single-line icons, basic shapes, and subtle gradients.",
  },
  doodle: {
    name: "Hand-drawn Doodles",
    description: "Casual hand-drawn sketches and doodles with pen or pencil. Informal, creative scribbles like notebook margins filled with fun drawings.",
  },
  flat: {
    name: "Flat Design",
    description: "Modern flat design with bold colors, clean shapes, and no shadows or gradients. Contemporary and minimalistic vector-style graphics.",
  },
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
  // New Interactive Posts features
  {
    id: "interactive_poll",
    title: "استطلاعات رأي تفاعلية",
    description: "اسأل طلابك واحصل على آرائهم بشكل ممتع",
    icon: "poll chart with question marks and voting hands",
    marketingTexts: [
      "اسأل طلابك واكتشف آراءهم!",
      "استطلاعات رأي ممتعة وتفاعلية",
      "شارك طلابك في القرارات",
      "اجعل صوت كل طالب مسموع",
    ],
  },
  {
    id: "interactive_quiz",
    title: "اختبارات سريعة",
    description: "اختبر فهم طلابك بأسئلة سريعة وممتعة",
    icon: "quiz paper with checkmark and lightning bolt",
    marketingTexts: [
      "اختبر فهم طلابك بطريقة ممتعة!",
      "أسئلة سريعة ونتائج فورية",
      "تقييم سريع لفهم الدرس",
      "اختبارات تفاعلية لكل حصة",
    ],
  },
  {
    id: "interactive_challenge",
    title: "تحديات أسبوعية",
    description: "حفّز طلابك بتحديات ومسابقات مثيرة",
    icon: "trophy with stars and confetti",
    marketingTexts: [
      "تحدّى طلابك واكتشف المتميزين!",
      "مسابقات أسبوعية مثيرة",
      "حفّز روح التنافس الإيجابي",
      "جوائز ومكافآت للمتفوقين",
    ],
  },
  {
    id: "interactive_feedback",
    title: "تغذية راجعة فورية",
    description: "احصل على ملاحظات طلابك حول الدروس",
    icon: "feedback bubbles with emojis",
    marketingTexts: [
      "اسمع رأي طلابك في دروسك!",
      "تغذية راجعة فورية وصادقة",
      "طوّر أسلوبك بناءً على آراء طلابك",
      "تواصل أفضل مع طلابك",
    ],
  },
  {
    id: "interactive_goals",
    title: "أهداف ومكافآت",
    description: "حدد أهداف للطلاب واحتفل بإنجازاتهم",
    icon: "target with medal and celebration",
    marketingTexts: [
      "حدد أهداف واحتفل بالإنجازات!",
      "مكافآت تحفيزية للطلاب",
      "تتبع تقدم كل طالب",
      "نظام نقاط ومكافآت ممتع",
    ],
  },
];

// Content type templates for different marketing purposes
const contentTypeTemplates = {
  feature: {
    purpose: "showcase a specific app feature",
    elements: "icons representing the feature, educational elements, professional look",
    mood: "informative, professional, clear",
  },
  marketing: {
    purpose: "promotional and advertising content to attract new users",
    elements: "eye-catching visuals, call-to-action feel, premium look, sparkles, highlights",
    mood: "exciting, persuasive, premium, aspirational",
  },
  interactive: {
    purpose: "engage audience with questions and polls",
    elements: "question marks, poll graphics, emoji reactions, engagement symbols, hands raised",
    mood: "fun, engaging, participatory, curious",
  },
  trial: {
    purpose: "encourage users to try the app for free",
    elements: "gift box, free trial badge, rocket launch, unlock symbols, welcome gestures",
    mood: "inviting, exciting, risk-free, welcoming",
  },
  testimonial: {
    purpose: "showcase user experiences and reviews",
    elements: "speech bubbles, star ratings, happy faces, quote symbols, heart reactions",
    mood: "trustworthy, authentic, warm, relatable",
  },
  tips: {
    purpose: "share educational tips and advice for teachers",
    elements: "lightbulb, book, notepad, checklist, teacher symbols, educational icons",
    mood: "helpful, informative, friendly, supportive",
  },
  custom: {
    purpose: "custom content based on user description",
    elements: "based on user input",
    mood: "versatile",
  },
};

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
    const { prompt, aspectRatio, colorPalette = 'pastel', designStyle = 'clay3d', featureId, contentType = 'feature', getFeatures, getSuggestions } = await req.json();

    // If requesting features list - return with random marketing text each time
    if (getFeatures) {
      const featuresWithRandomText = appFeatures.map(f => transformFeatureForResponse(f));
      return new Response(
        JSON.stringify({ features: featuresWithRandomText }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // If requesting text suggestions for a content type
    if (getSuggestions && contentType) {
      const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
      if (!LOVABLE_API_KEY) {
        return new Response(
          JSON.stringify({ error: "API key not configured" }),
          { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      const contentConfig = contentTypeTemplates[contentType as keyof typeof contentTypeTemplates] || contentTypeTemplates.feature;
      
      const suggestionPrompts: Record<string, string> = {
        marketing: `أنت خبير تسويق لتطبيق تعليمي للمعلمين. اقترح 4 أفكار مختلفة لبوستات تسويقية جذابة.
لكل فكرة أعطني:
- عنوان قصير جذاب (5-8 كلمات)
- نص تسويقي مقنع (15-25 كلمة)

الأفكار يجب أن تكون:
- مثيرة للاهتمام وتدفع للتجربة
- تركز على حل مشاكل المعلمين
- تستخدم لغة عربية فصيحة وجذابة`,

        interactive: `أنت خبير محتوى تفاعلي. اقترح 4 أفكار لبوستات تفاعلية تشجع المعلمين على المشاركة.
لكل فكرة أعطني:
- سؤال أو عنوان تفاعلي (5-10 كلمات)
- نص يشرح كيفية التفاعل (15-25 كلمة)

الأفكار يجب أن تكون:
- أسئلة مثيرة للتفكير
- استطلاعات رأي
- تحديات ممتعة للمعلمين`,

        trial: `أنت خبير في جذب المستخدمين الجدد. اقترح 4 أفكار لبوستات تشجع على تجربة التطبيق.
لكل فكرة أعطني:
- عنوان يدعو للتجربة (5-8 كلمات)
- نص يوضح مميزات التجربة المجانية (15-25 كلمة)

الأفكار يجب أن تكون:
- تؤكد على سهولة البدء
- تذكر أن التجربة مجانية
- تركز على الفائدة الفورية للمعلم`,

        testimonial: `أنت كاتب محتوى متخصص في شهادات العملاء. اقترح 4 أفكار لبوستات شهادات وتجارب المعلمين.
لكل فكرة أعطني:
- عنوان الشهادة (5-8 كلمات)
- نص الشهادة أو التجربة (20-30 كلمة)

الأفكار يجب أن تكون:
- واقعية ومقنعة
- تظهر نتائج ملموسة
- بأسلوب معلم حقيقي`,

        tips: `أنت مستشار تعليمي خبير. اقترح 4 نصائح تعليمية قيمة للمعلمين.
لكل نصيحة أعطني:
- عنوان النصيحة (5-8 كلمات)
- شرح النصيحة وكيفية تطبيقها (20-30 كلمة)

النصائح يجب أن تكون:
- عملية وقابلة للتطبيق
- مفيدة في الفصل الدراسي
- مرتبطة بإدارة الصف والطلاب`,
      };

      const systemPrompt = suggestionPrompts[contentType] || suggestionPrompts.marketing;

      try {
        const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
          method: "POST",
          headers: {
            Authorization: `Bearer ${LOVABLE_API_KEY}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            model: "google/gemini-3-flash-preview",
            messages: [
              { role: "system", content: systemPrompt },
              { role: "user", content: "أعطني 4 أفكار متنوعة ومبتكرة الآن. أجب بصيغة JSON فقط بهذا الشكل: [{\"title\": \"العنوان\", \"text\": \"النص\"}]" }
            ],
            tools: [
              {
                type: "function",
                function: {
                  name: "return_suggestions",
                  description: "Return 4 content suggestions",
                  parameters: {
                    type: "object",
                    properties: {
                      suggestions: {
                        type: "array",
                        items: {
                          type: "object",
                          properties: {
                            title: { type: "string", description: "العنوان القصير" },
                            text: { type: "string", description: "النص التسويقي أو التفاعلي" }
                          },
                          required: ["title", "text"],
                          additionalProperties: false
                        }
                      }
                    },
                    required: ["suggestions"],
                    additionalProperties: false
                  }
                }
              }
            ],
            tool_choice: { type: "function", function: { name: "return_suggestions" } }
          }),
        });

        if (!response.ok) {
          const errorText = await response.text();
          console.error("AI API error:", response.status, errorText);
          
          if (response.status === 429) {
            return new Response(
              JSON.stringify({ error: "تم تجاوز حد الطلبات، يرجى المحاولة لاحقاً" }),
              { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } }
            );
          }
          if (response.status === 402) {
            return new Response(
              JSON.stringify({ error: "يرجى إضافة رصيد للاستمرار" }),
              { status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" } }
            );
          }
          
          throw new Error(`AI API error: ${response.status}`);
        }

        const data = await response.json();
        const toolCall = data.choices?.[0]?.message?.tool_calls?.[0];
        
        if (toolCall?.function?.arguments) {
          const parsed = JSON.parse(toolCall.function.arguments);
          return new Response(
            JSON.stringify({ suggestions: parsed.suggestions }),
            { headers: { ...corsHeaders, "Content-Type": "application/json" } }
          );
        }

        // Fallback: try to parse from content
        const content = data.choices?.[0]?.message?.content;
        if (content) {
          const jsonMatch = content.match(/\[[\s\S]*\]/);
          if (jsonMatch) {
            const suggestions = JSON.parse(jsonMatch[0]);
            return new Response(
              JSON.stringify({ suggestions }),
              { headers: { ...corsHeaders, "Content-Type": "application/json" } }
            );
          }
        }

        throw new Error("Could not parse suggestions from response");
      } catch (error) {
        console.error("Error generating suggestions:", error);
        return new Response(
          JSON.stringify({ error: "حدث خطأ في توليد الاقتراحات" }),
          { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
    }

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) {
      console.error("LOVABLE_API_KEY is not configured");
      return new Response(
        JSON.stringify({ error: "API key not configured" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Get color palette and design style configs
    const paletteConfig = colorPalettes[colorPalette as keyof typeof colorPalettes] || colorPalettes.pastel;
    const styleConfig = designStyles[designStyle as keyof typeof designStyles] || designStyles.clay3d;
    const contentConfig = contentTypeTemplates[contentType as keyof typeof contentTypeTemplates] || contentTypeTemplates.feature;

    // Find selected feature
    let selectedFeature: typeof appFeatures[0] | null = null;
    if (featureId) {
      selectedFeature = appFeatures.find(f => f.id === featureId) || null;
      if (!selectedFeature) {
        // Random feature if not found
        selectedFeature = appFeatures[Math.floor(Math.random() * appFeatures.length)];
      }
    }

    // Create prompt based on content type
    let finalPrompt: string;
    
    if (contentType === 'feature' && selectedFeature) {
      finalPrompt = `
Create a HIGH QUALITY, HIGH RESOLUTION (1024x1024 minimum, 1K quality) beautiful, ${paletteConfig.mood} illustration for a teacher's app promotional post.
DO NOT include any text, letters, or words in the image - only visuals.

DESIGN STYLE: ${styleConfig.name}
${styleConfig.description}

VISUAL ELEMENTS FOR "${selectedFeature.title}":
- Main visual element representing: ${selectedFeature.icon}
- Make it look friendly, approachable, and educational
- Color palette: ${paletteConfig.colors}
- Add small decorative elements related to education: books, pencils, stars, hearts
- Include subtle patterns: dots, soft geometric shapes, organic curves

COMPOSITION:
- Aspect ratio: ${aspectRatio} (vertical for stories)
- Leave space at top for logo and at bottom for text overlay
- Center the main illustration element
- Background should be a soft gradient or subtle pattern (not plain) using the color palette

QUALITY: Ultra high resolution, sharp details, professional quality, 1K resolution, crisp edges
MOOD: ${paletteConfig.mood}, suitable for educators
NO TEXT, NO LETTERS, NO WORDS - only beautiful illustrations in ${styleConfig.name} style
`.trim();
    } else if (contentType === 'marketing') {
      finalPrompt = `
Create a HIGH QUALITY, HIGH RESOLUTION (1024x1024 minimum, 1K quality) stunning MARKETING illustration for a teacher's app promotional campaign.
DO NOT include any text, letters, or words in the image - only visuals.

PURPOSE: ${contentConfig.purpose}

DESIGN STYLE: ${styleConfig.name}
${styleConfig.description}

VISUAL ELEMENTS:
- ${contentConfig.elements}
- Eye-catching central element that grabs attention
- Premium, high-quality aesthetic
- Color palette: ${paletteConfig.colors}
- Add sparkles, glows, or highlights to make it pop

COMPOSITION:
- Aspect ratio: ${aspectRatio} (vertical for stories)
- Leave space at top for logo and at bottom for text overlay
- Create visual hierarchy that draws the eye to the center

QUALITY: Ultra high resolution, sharp details, professional quality, 1K resolution, crisp edges
MOOD: ${contentConfig.mood}
NO TEXT, NO LETTERS, NO WORDS - only stunning marketing visuals in ${styleConfig.name} style
`.trim();
    } else if (contentType === 'interactive') {
      finalPrompt = `
Create a HIGH QUALITY, HIGH RESOLUTION (1024x1024 minimum, 1K quality) INTERACTIVE and engaging illustration for a teacher's app social media post.
DO NOT include any text, letters, or words in the image - only visuals.

PURPOSE: ${contentConfig.purpose}

DESIGN STYLE: ${styleConfig.name}
${styleConfig.description}

VISUAL ELEMENTS:
- ${contentConfig.elements}
- Create elements that suggest interaction and engagement
- Fun, playful visual elements
- Color palette: ${paletteConfig.colors}
- Add emojis-style elements, reaction buttons, or poll graphics

COMPOSITION:
- Aspect ratio: ${aspectRatio} (vertical for stories)
- Leave space at top for logo and at bottom for text overlay
- Design should encourage viewer participation

QUALITY: Ultra high resolution, sharp details, professional quality, 1K resolution, crisp edges
MOOD: ${contentConfig.mood}
NO TEXT, NO LETTERS, NO WORDS - only engaging interactive visuals in ${styleConfig.name} style
`.trim();
    } else if (contentType === 'trial') {
      finalPrompt = `
Create a HIGH QUALITY, HIGH RESOLUTION (1024x1024 minimum, 1K quality) inviting illustration to encourage users to TRY the teacher's app.
DO NOT include any text, letters, or words in the image - only visuals.

PURPOSE: ${contentConfig.purpose}

DESIGN STYLE: ${styleConfig.name}
${styleConfig.description}

VISUAL ELEMENTS:
- ${contentConfig.elements}
- Gift box or present being opened
- Rocket launching or door opening to new possibilities
- Welcoming, inviting visual metaphors
- Color palette: ${paletteConfig.colors}
- Add celebratory elements: confetti, stars, sparkles

COMPOSITION:
- Aspect ratio: ${aspectRatio} (vertical for stories)
- Leave space at top for logo and at bottom for text overlay
- Create a sense of excitement and opportunity

QUALITY: Ultra high resolution, sharp details, professional quality, 1K resolution, crisp edges
MOOD: ${contentConfig.mood}
NO TEXT, NO LETTERS, NO WORDS - only welcoming trial-invitation visuals in ${styleConfig.name} style
`.trim();
    } else if (contentType === 'testimonial') {
      finalPrompt = `
Create a HIGH QUALITY, HIGH RESOLUTION (1024x1024 minimum, 1K quality) warm illustration for showcasing USER TESTIMONIALS and experiences.
DO NOT include any text, letters, or words in the image - only visuals.

PURPOSE: ${contentConfig.purpose}

DESIGN STYLE: ${styleConfig.name}
${styleConfig.description}

VISUAL ELEMENTS:
- ${contentConfig.elements}
- Speech bubbles or quote symbols
- Happy teacher figures (abstract, no faces needed)
- Star ratings or heart symbols
- Color palette: ${paletteConfig.colors}
- Add warm, friendly visual elements

COMPOSITION:
- Aspect ratio: ${aspectRatio} (vertical for stories)
- Leave space at top for logo and at bottom for text overlay
- Create a trustworthy, authentic feel

QUALITY: Ultra high resolution, sharp details, professional quality, 1K resolution, crisp edges
MOOD: ${contentConfig.mood}
NO TEXT, NO LETTERS, NO WORDS - only testimonial-style visuals in ${styleConfig.name} style
`.trim();
    } else if (contentType === 'tips') {
      finalPrompt = `
Create a HIGH QUALITY, HIGH RESOLUTION (1024x1024 minimum, 1K quality) educational illustration for sharing TIPS and advice for teachers.
DO NOT include any text, letters, or words in the image - only visuals.

PURPOSE: ${contentConfig.purpose}

DESIGN STYLE: ${styleConfig.name}
${styleConfig.description}

VISUAL ELEMENTS:
- ${contentConfig.elements}
- Lightbulb for ideas
- Books, notepads, or educational items
- Helpful, supportive visual metaphors
- Color palette: ${paletteConfig.colors}
- Add organized, structured visual elements

COMPOSITION:
- Aspect ratio: ${aspectRatio} (vertical for stories)
- Leave space at top for logo and at bottom for text overlay
- Create a helpful, informative atmosphere

QUALITY: Ultra high resolution, sharp details, professional quality, 1K resolution, crisp edges
MOOD: ${contentConfig.mood}
NO TEXT, NO LETTERS, NO WORDS - only educational tips-style visuals in ${styleConfig.name} style
`.trim();
    } else if (prompt) {
      finalPrompt = `
Create a HIGH QUALITY, HIGH RESOLUTION (1024x1024 minimum, 1K quality) creative illustration with these specifications:
DO NOT include any text or letters - this is just a visual illustration.

USER REQUEST: ${prompt}

DESIGN STYLE: ${styleConfig.name}
${styleConfig.description}

Color palette: ${paletteConfig.colors}
Mood: ${paletteConfig.mood}

Aspect ratio: ${aspectRatio}
QUALITY: Ultra high resolution, sharp details, professional quality, 1K resolution
NO TEXT, NO LETTERS, NO WORDS - only beautiful visual elements in ${styleConfig.name} style
`.trim();
    } else {
      return new Response(
        JSON.stringify({ error: "Content type or prompt is required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    console.log("Calling Lovable AI with feature:", selectedFeature?.title || "custom prompt", "style:", designStyle, "palette:", colorPalette);

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
