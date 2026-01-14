import { useState } from 'react';
import { AdminLayout } from '@/components/layout/AdminLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Loader2, Wand2, Download, Image as ImageIcon, Quote, Smartphone, Save, FolderOpen, Trash2, X } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '@/hooks/useAuth';
import { useSiteLogo } from '@/hooks/useSiteLogo';
import { Switch } from '@/components/ui/switch';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { ScrollArea } from '@/components/ui/scroll-area';

type AspectRatio = '3:4' | '9:16';
type ContentType = 'screenshot' | 'quote';

interface SavedContent {
  id: string;
  title: string;
  image_url: string;
  content_type: string;
  aspect_ratio: string;
  prompt: string | null;
  created_at: string;
}

const aspectRatioSizes: Record<AspectRatio, { width: number; height: number }> = {
  '3:4': { width: 768, height: 1024 },
  '9:16': { width: 576, height: 1024 },
};

export default function AIContentCreatorPage() {
  const { user } = useAuth();
  const { logoUrl, isCustomLogo } = useSiteLogo();
  const queryClient = useQueryClient();
  const [contentType, setContentType] = useState<ContentType>('screenshot');
  const [aspectRatio, setAspectRatio] = useState<AspectRatio>('9:16');
  const [prompt, setPrompt] = useState('');
  const [generatedImage, setGeneratedImage] = useState<string | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [showSaveDialog, setShowSaveDialog] = useState(false);
  const [saveTitle, setSaveTitle] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [showLibrary, setShowLibrary] = useState(false);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [selectedImage, setSelectedImage] = useState<SavedContent | null>(null);
  const [generatedFeature, setGeneratedFeature] = useState<{ title: string; description: string } | null>(null);
  const [includeLogo, setIncludeLogo] = useState(true);

  const defaultPrompts: Record<ContentType, string> = {
    screenshot: 'تصميم واجهة تطبيق تعليمي عصري بألوان زرقاء وبيضاء، يعرض لوحة تحكم المعلم مع إحصائيات الطلاب والحضور والدرجات. التصميم احترافي ونظيف مع أيقونات واضحة وخطوط عربية جميلة.',
    quote: 'تصميم بوست تربوي ملهم بخلفية متدرجة من الأزرق الداكن إلى الفاتح، مع اقتباس تربوي عربي بخط عربي أنيق، مزين بزخارف إسلامية خفيفة وأيقونات تعليمية.',
  };

  // Fetch saved content
  const { data: savedContent = [], isLoading: isLoadingContent } = useQuery({
    queryKey: ['ai-generated-content'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('ai_generated_content')
        .select('*')
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      return data as SavedContent[];
    },
    enabled: !!user,
  });

  // Delete mutation
  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('ai_generated_content')
        .delete()
        .eq('id', id);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['ai-generated-content'] });
      toast.success('تم حذف المحتوى');
      setDeleteId(null);
    },
    onError: () => {
      toast.error('حدث خطأ أثناء الحذف');
    },
  });

  const handleGenerate = async (autoGenerate = false) => {
    if (!autoGenerate && !prompt.trim()) {
      toast.error('يرجى كتابة وصف للمحتوى المطلوب');
      return;
    }

    setIsGenerating(true);
    setGeneratedImage(null);
    setGeneratedFeature(null);

    try {
      const { data, error } = await supabase.functions.invoke('generate-ai-content', {
        body: {
          prompt: autoGenerate ? '' : prompt,
          aspectRatio,
          autoGenerate,
          logoUrl: includeLogo && isCustomLogo ? logoUrl : null,
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
        if (data.feature) {
          setGeneratedFeature(data.feature);
        }
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

  const handleDownload = (imageUrl?: string) => {
    const url = imageUrl || generatedImage;
    if (!url) return;
    
    const link = document.createElement('a');
    link.href = url;
    link.download = `ai-content-${Date.now()}.png`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    toast.success('تم تحميل الصورة');
  };

  const handleSaveToLibrary = async () => {
    if (!generatedImage || !saveTitle.trim() || !user) {
      toast.error('يرجى إدخال اسم للمحتوى');
      return;
    }

    setIsSaving(true);

    try {
      // Save to database
      const { error } = await supabase.from('ai_generated_content').insert({
        user_id: user.id,
        title: saveTitle.trim(),
        image_url: generatedImage,
        content_type: contentType,
        aspect_ratio: aspectRatio,
        prompt: prompt,
      });

      if (error) throw error;

      queryClient.invalidateQueries({ queryKey: ['ai-generated-content'] });
      toast.success('تم حفظ المحتوى في المكتبة');
      setShowSaveDialog(false);
      setSaveTitle('');
    } catch (err) {
      console.error('Error saving content:', err);
      toast.error('حدث خطأ أثناء الحفظ');
    } finally {
      setIsSaving(false);
    }
  };

  const handleUseDefaultPrompt = () => {
    setPrompt(defaultPrompts[contentType]);
  };

  return (
    <AdminLayout>
      <div className="p-4 md:p-6 space-y-6">
        <div className="flex items-center justify-between flex-wrap gap-4">
          <div>
            <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
              <Wand2 className="w-6 h-6 text-primary" />
              إنشاء محتوى بالذكاء الاصطناعي
            </h1>
            <p className="text-muted-foreground mt-1">
              إنشاء صور ترويجية للتطبيق واقتباسات تربوية باستخدام الذكاء الاصطناعي
            </p>
          </div>
          <Button
            variant="outline"
            onClick={() => setShowLibrary(true)}
            className="flex items-center gap-2"
          >
            <FolderOpen className="w-4 h-4" />
            المكتبة ({savedContent.length})
          </Button>
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

              {/* Logo Option */}
              <div className="space-y-3">
                <Label className="text-base font-medium">إضافة الشعار</Label>
                <div className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                  <div className="flex items-center gap-3">
                    {isCustomLogo ? (
                      <img src={logoUrl} alt="شعار المنصة" className="w-10 h-10 object-contain rounded" />
                    ) : (
                      <div className="w-10 h-10 bg-muted rounded flex items-center justify-center">
                        <ImageIcon className="w-5 h-5 text-muted-foreground" />
                      </div>
                    )}
                    <div>
                      <p className="text-sm font-medium">
                        {isCustomLogo ? 'شعار المنصة' : 'لم يتم تحميل شعار'}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {isCustomLogo ? 'سيتم إضافته للصور المُنشأة' : 'يمكنك تحميله من الإعدادات'}
                      </p>
                    </div>
                  </div>
                  <Switch
                    checked={includeLogo}
                    onCheckedChange={setIncludeLogo}
                    disabled={!isCustomLogo}
                  />
                </div>
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

              {/* Generate Buttons */}
              <div className="space-y-3">
                <Button
                  onClick={() => handleGenerate(true)}
                  disabled={isGenerating}
                  className="w-full"
                  size="lg"
                  variant="default"
                >
                  {isGenerating ? (
                    <>
                      <Loader2 className="w-4 h-4 ml-2 animate-spin" />
                      جاري الإنشاء...
                    </>
                  ) : (
                    <>
                      <Wand2 className="w-4 h-4 ml-2" />
                      🎲 توليد ميزة عشوائية
                    </>
                  )}
                </Button>
                
                <div className="relative">
                  <div className="absolute inset-0 flex items-center">
                    <span className="w-full border-t" />
                  </div>
                  <div className="relative flex justify-center text-xs uppercase">
                    <span className="bg-card px-2 text-muted-foreground">أو</span>
                  </div>
                </div>

                <Button
                  onClick={() => handleGenerate(false)}
                  disabled={isGenerating || !prompt.trim()}
                  className="w-full"
                  size="lg"
                  variant="outline"
                >
                  {isGenerating ? (
                    <>
                      <Loader2 className="w-4 h-4 ml-2 animate-spin" />
                      جاري الإنشاء...
                    </>
                  ) : (
                    <>
                      <Wand2 className="w-4 h-4 ml-2" />
                      إنشاء من الوصف
                    </>
                  )}
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Preview */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <span>المعاينة</span>
                {generatedImage && (
                  <div className="flex gap-2">
                    <Button variant="outline" size="sm" onClick={() => setShowSaveDialog(true)}>
                      <Save className="w-4 h-4 ml-2" />
                      حفظ
                    </Button>
                    <Button variant="outline" size="sm" onClick={() => handleDownload()}>
                      <Download className="w-4 h-4 ml-2" />
                      تحميل
                    </Button>
                  </div>
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
                  <div className="relative w-full h-full">
                    <img
                      src={generatedImage}
                      alt="محتوى منشأ بالذكاء الاصطناعي"
                      className="w-full h-full object-cover"
                    />
                    {generatedFeature && (
                      <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent p-4">
                        <h3 className="text-white font-bold text-lg">{generatedFeature.title}</h3>
                        <p className="text-white/80 text-sm">{generatedFeature.description}</p>
                      </div>
                    )}
                  </div>
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

      {/* Save Dialog */}
      <Dialog open={showSaveDialog} onOpenChange={setShowSaveDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>حفظ في المكتبة</DialogTitle>
            <DialogDescription>
              أدخل اسماً للمحتوى لحفظه في المكتبة
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="title">اسم المحتوى</Label>
              <Input
                id="title"
                value={saveTitle}
                onChange={(e) => setSaveTitle(e.target.value)}
                placeholder="مثال: بوست ترويجي للتطبيق"
                dir="rtl"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowSaveDialog(false)}>
              إلغاء
            </Button>
            <Button onClick={handleSaveToLibrary} disabled={isSaving || !saveTitle.trim()}>
              {isSaving ? (
                <>
                  <Loader2 className="w-4 h-4 ml-2 animate-spin" />
                  جاري الحفظ...
                </>
              ) : (
                <>
                  <Save className="w-4 h-4 ml-2" />
                  حفظ
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Library Dialog */}
      <Dialog open={showLibrary} onOpenChange={setShowLibrary}>
        <DialogContent className="max-w-4xl max-h-[85vh]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <FolderOpen className="w-5 h-5" />
              مكتبة المحتوى ({savedContent.length})
            </DialogTitle>
            <DialogDescription>
              جميع الصور المحفوظة
            </DialogDescription>
          </DialogHeader>
          <ScrollArea className="max-h-[60vh]">
            {isLoadingContent ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="w-8 h-8 animate-spin text-primary" />
              </div>
            ) : savedContent.length === 0 ? (
              <div className="text-center py-12 text-muted-foreground">
                <ImageIcon className="w-12 h-12 mx-auto mb-4 opacity-50" />
                <p>لا يوجد محتوى محفوظ</p>
              </div>
            ) : (
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 p-1">
                {savedContent.map((item) => (
                  <div
                    key={item.id}
                    className="group relative bg-muted rounded-lg overflow-hidden cursor-pointer"
                    onClick={() => setSelectedImage(item)}
                  >
                    <div className={`
                      ${item.aspect_ratio === '3:4' ? 'aspect-[3/4]' : 'aspect-[9/16]'}
                    `}>
                      <img
                        src={item.image_url}
                        alt={item.title}
                        className="w-full h-full object-cover"
                      />
                    </div>
                    <div className="absolute inset-0 bg-foreground/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-end">
                      <div className="p-2 w-full">
                        <p className="text-background text-sm font-medium truncate">{item.title}</p>
                        <p className="text-background/70 text-xs">
                          {item.content_type === 'screenshot' ? 'واجهة' : 'اقتباس'} • {item.aspect_ratio}
                        </p>
                      </div>
                    </div>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setDeleteId(item.id);
                      }}
                      className="absolute top-2 left-2 bg-destructive text-destructive-foreground p-1.5 rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </ScrollArea>
        </DialogContent>
      </Dialog>

      {/* Image Preview Dialog */}
      <Dialog open={!!selectedImage} onOpenChange={() => setSelectedImage(null)}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>{selectedImage?.title}</DialogTitle>
            <DialogDescription>
              {selectedImage?.content_type === 'screenshot' ? 'واجهة التطبيق' : 'اقتباس تربوي'} • {selectedImage?.aspect_ratio}
            </DialogDescription>
          </DialogHeader>
          <div className="flex justify-center py-4">
            <div className={`
              ${selectedImage?.aspect_ratio === '3:4' ? 'aspect-[3/4] max-w-[300px]' : 'aspect-[9/16] max-w-[225px]'}
              w-full rounded-lg overflow-hidden
            `}>
              <img
                src={selectedImage?.image_url}
                alt={selectedImage?.title}
                className="w-full h-full object-cover"
              />
            </div>
          </div>
          {selectedImage?.prompt && (
            <div className="text-sm text-muted-foreground bg-muted p-3 rounded-lg">
              <p className="font-medium mb-1">الوصف المستخدم:</p>
              <p className="line-clamp-3">{selectedImage.prompt}</p>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setSelectedImage(null)}>
              إغلاق
            </Button>
            <Button onClick={() => selectedImage && handleDownload(selectedImage.image_url)}>
              <Download className="w-4 h-4 ml-2" />
              تحميل
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation */}
      <AlertDialog open={!!deleteId} onOpenChange={() => setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>حذف المحتوى</AlertDialogTitle>
            <AlertDialogDescription>
              هل أنت متأكد من حذف هذا المحتوى؟ لا يمكن التراجع عن هذا الإجراء.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>إلغاء</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => deleteId && deleteMutation.mutate(deleteId)}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              حذف
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </AdminLayout>
  );
}
