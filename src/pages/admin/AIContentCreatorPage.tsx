import { useState } from 'react';
import { AdminLayout } from '@/components/layout/AdminLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Loader2, Wand2, Download, Image as ImageIcon, Quote, Smartphone } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

type AspectRatio = '3:4' | '9:16';
type ContentType = 'screenshot' | 'quote';

const aspectRatioSizes: Record<AspectRatio, { width: number; height: number }> = {
  '3:4': { width: 768, height: 1024 },
  '9:16': { width: 576, height: 1024 },
};

export default function AIContentCreatorPage() {
  const [contentType, setContentType] = useState<ContentType>('screenshot');
  const [aspectRatio, setAspectRatio] = useState<AspectRatio>('3:4');
  const [prompt, setPrompt] = useState('');
  const [generatedImage, setGeneratedImage] = useState<string | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);

  const defaultPrompts: Record<ContentType, string> = {
    screenshot: 'تصميم واجهة تطبيق تعليمي عصري بألوان زرقاء وبيضاء، يعرض لوحة تحكم المعلم مع إحصائيات الطلاب والحضور والدرجات. التصميم احترافي ونظيف مع أيقونات واضحة وخطوط عربية جميلة.',
    quote: 'تصميم بوست تربوي ملهم بخلفية متدرجة من الأزرق الداكن إلى الفاتح، مع اقتباس تربوي عربي بخط عربي أنيق، مزين بزخارف إسلامية خفيفة وأيقونات تعليمية.',
  };

  const handleGenerate = async () => {
    if (!prompt.trim()) {
      toast.error('يرجى كتابة وصف للمحتوى المطلوب');
      return;
    }

    setIsGenerating(true);
    setGeneratedImage(null);

    try {
      const { width, height } = aspectRatioSizes[aspectRatio];
      
      const { data, error } = await supabase.functions.invoke('generate-ai-content', {
        body: {
          prompt: prompt,
          width,
          height,
          aspectRatio,
        },
      });

      if (error) {
        console.error('Edge function error:', error);
        if (error.message?.includes('429')) {
          toast.error('تم تجاوز الحد المسموح، يرجى المحاولة لاحقاً');
        } else if (error.message?.includes('402')) {
          toast.error('يرجى إضافة رصيد لاستخدام خدمة الذكاء الاصطناعي');
        } else {
          toast.error('حدث خطأ أثناء إنشاء المحتوى');
        }
        return;
      }

      if (data?.imageUrl) {
        setGeneratedImage(data.imageUrl);
        toast.success('تم إنشاء المحتوى بنجاح!');
      } else {
        toast.error('لم يتم إنشاء الصورة، يرجى المحاولة مرة أخرى');
      }
    } catch (err) {
      console.error('Error generating content:', err);
      toast.error('حدث خطأ غير متوقع');
    } finally {
      setIsGenerating(false);
    }
  };

  const handleDownload = () => {
    if (!generatedImage) return;
    
    const link = document.createElement('a');
    link.href = generatedImage;
    link.download = `ai-content-${Date.now()}.png`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    toast.success('تم تحميل الصورة');
  };

  const handleUseDefaultPrompt = () => {
    setPrompt(defaultPrompts[contentType]);
  };

  return (
    <AdminLayout>
      <div className="p-4 md:p-6 space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
            <Wand2 className="w-6 h-6 text-primary" />
            إنشاء محتوى بالذكاء الاصطناعي
          </h1>
          <p className="text-muted-foreground mt-1">
            إنشاء صور ترويجية للتطبيق واقتباسات تربوية باستخدام الذكاء الاصطناعي
          </p>
        </div>

        <div className="grid gap-6 lg:grid-cols-2">
          {/* Controls */}
          <Card>
            <CardHeader>
              <CardTitle>إعدادات المحتوى</CardTitle>
              <CardDescription>حدد نوع المحتوى والحجم المطلوب</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Content Type */}
              <div className="space-y-3">
                <Label className="text-base font-medium">نوع المحتوى</Label>
                <Tabs value={contentType} onValueChange={(v) => setContentType(v as ContentType)}>
                  <TabsList className="grid w-full grid-cols-2">
                    <TabsTrigger value="screenshot" className="flex items-center gap-2">
                      <Smartphone className="w-4 h-4" />
                      واجهة التطبيق
                    </TabsTrigger>
                    <TabsTrigger value="quote" className="flex items-center gap-2">
                      <Quote className="w-4 h-4" />
                      اقتباس تربوي
                    </TabsTrigger>
                  </TabsList>
                </Tabs>
              </div>

              {/* Aspect Ratio */}
              <div className="space-y-3">
                <Label className="text-base font-medium">حجم الصورة</Label>
                <RadioGroup
                  value={aspectRatio}
                  onValueChange={(v) => setAspectRatio(v as AspectRatio)}
                  className="flex gap-4"
                >
                  <div className="flex items-center space-x-2 space-x-reverse">
                    <RadioGroupItem value="3:4" id="ratio-3-4" />
                    <Label htmlFor="ratio-3-4" className="cursor-pointer flex items-center gap-2">
                      <div className="w-6 h-8 border-2 border-primary rounded" />
                      <span>3:4 (انستقرام)</span>
                    </Label>
                  </div>
                  <div className="flex items-center space-x-2 space-x-reverse">
                    <RadioGroupItem value="9:16" id="ratio-9-16" />
                    <Label htmlFor="ratio-9-16" className="cursor-pointer flex items-center gap-2">
                      <div className="w-5 h-9 border-2 border-primary rounded" />
                      <span>9:16 (ستوري)</span>
                    </Label>
                  </div>
                </RadioGroup>
              </div>

              {/* Prompt */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <Label className="text-base font-medium">وصف المحتوى</Label>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={handleUseDefaultPrompt}
                    className="text-xs"
                  >
                    استخدام قالب جاهز
                  </Button>
                </div>
                <Textarea
                  value={prompt}
                  onChange={(e) => setPrompt(e.target.value)}
                  placeholder="اكتب وصفاً تفصيلياً للصورة المطلوبة..."
                  className="min-h-[120px] resize-none"
                  dir="rtl"
                />
                <p className="text-xs text-muted-foreground">
                  نصيحة: كلما كان الوصف أكثر تفصيلاً، كانت النتيجة أفضل
                </p>
              </div>

              {/* Generate Button */}
              <Button
                onClick={handleGenerate}
                disabled={isGenerating || !prompt.trim()}
                className="w-full"
                size="lg"
              >
                {isGenerating ? (
                  <>
                    <Loader2 className="w-4 h-4 ml-2 animate-spin" />
                    جاري الإنشاء...
                  </>
                ) : (
                  <>
                    <Wand2 className="w-4 h-4 ml-2" />
                    إنشاء المحتوى
                  </>
                )}
              </Button>
            </CardContent>
          </Card>

          {/* Preview */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <span>المعاينة</span>
                {generatedImage && (
                  <Button variant="outline" size="sm" onClick={handleDownload}>
                    <Download className="w-4 h-4 ml-2" />
                    تحميل
                  </Button>
                )}
              </CardTitle>
              <CardDescription>
                الصورة المنشأة بواسطة الذكاء الاصطناعي
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div 
                className={`
                  bg-muted rounded-lg flex items-center justify-center overflow-hidden mx-auto
                  ${aspectRatio === '3:4' ? 'aspect-[3/4] max-w-[300px]' : 'aspect-[9/16] max-w-[225px]'}
                `}
              >
                {isGenerating ? (
                  <div className="text-center space-y-3">
                    <Loader2 className="w-8 h-8 animate-spin text-primary mx-auto" />
                    <p className="text-sm text-muted-foreground">جاري إنشاء الصورة...</p>
                  </div>
                ) : generatedImage ? (
                  <img
                    src={generatedImage}
                    alt="محتوى منشأ بالذكاء الاصطناعي"
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="text-center space-y-3 p-6">
                    <ImageIcon className="w-12 h-12 text-muted-foreground/50 mx-auto" />
                    <p className="text-sm text-muted-foreground">
                      ستظهر الصورة هنا بعد الإنشاء
                    </p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </AdminLayout>
  );
}
