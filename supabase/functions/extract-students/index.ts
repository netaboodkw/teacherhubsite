import { serve } from "https://deno.land/std@0.168.0/http/server.ts"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    const { image } = await req.json()

    if (!image) {
      throw new Error('No image provided')
    }

    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY')
    if (!LOVABLE_API_KEY) {
      throw new Error('LOVABLE_API_KEY is not configured')
    }

    const response = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${LOVABLE_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'google/gemini-2.5-flash',
        messages: [
          {
            role: 'user',
            content: [
              {
                type: 'text',
                text: `استخرج أسماء الطلاب من هذه الصورة. 
                
قواعد مهمة:
- استخرج الأسماء فقط بدون أي أرقام أو رموز
- ضع كل اسم في سطر منفصل
- إذا كان هناك رقم بجانب الاسم (مثل رقم تسلسلي)، تجاهله
- اكتب الأسماء باللغة العربية كما هي في الصورة
- لا تضف أي نص آخر، فقط الأسماء

مثال للإخراج:
أحمد محمد علي
سارة خالد
محمد عبدالله

الآن استخرج الأسماء من الصورة:`
              },
              {
                type: 'image_url',
                image_url: {
                  url: image
                }
              }
            ]
          }
        ],
        max_tokens: 2000,
      }),
    })

    if (!response.ok) {
      const error = await response.text()
      console.error('AI Gateway error:', error)
      throw new Error('Failed to process image')
    }

    const data = await response.json()
    const content = data.choices?.[0]?.message?.content || ''

    // Parse the names from the response
    const names = content
      .split('\n')
      .map((line: string) => line.trim())
      .filter((line: string) => line.length > 0 && !line.startsWith('#') && !line.includes(':'))

    return new Response(
      JSON.stringify({ names }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200 
      }
    )
  } catch (error) {
    console.error('Error:', error)
    const errorMessage = error instanceof Error ? error.message : 'Unknown error'
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500 
      }
    )
  }
})
