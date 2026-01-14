import { useState, useEffect, useRef } from 'react';
import { AdminLayout } from '@/components/layout/AdminLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Loader2, Wand2, Download, Image as ImageIcon, Quote, Smartphone, Save, FolderOpen, Trash2, X, Sparkles, Check, RefreshCw, Share2 } from 'lucide-react';
import html2canvas from 'html2canvas';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '@/hooks/useAuth';
import { useSiteLogo } from '@/hooks/useSiteLogo';
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
import { cn } from '@/lib/utils';

type AspectRatio = '3:4' | '9:16';
type ContentType = 'feature' | 'custom';
type ColorPalette = 'pastel' | 'vibrant' | 'dark';
type DesignStyle = 'clay3d' | 'watercolor' | 'origami' | 'isometric';

interface SavedContent {
  id: string;
  title: string;
  image_url: string;
  content_type: string;
  aspect_ratio: string;
  prompt: string | null;
  created_at: string;
}

interface AppFeature {
  id: string;
  title: string;
  description: string;
  icon: string;
  marketingText: string;
}

const colorPaletteOptions = [
  { value: 'pastel', label: 'باستيل', description: 'ألوان هادئة ودافئة', colors: ['#A8DDE6', '#DCC6E8', '#FDDCB8', '#B8E6CF'] },
  { value: 'vibrant', label: 'زاهي', description: 'ألوان مشرقة وحيوية', colors: ['#FF6B6B', '#4ECDC4', '#FFE66D', '#95E1D3'] },
  { value: 'dark', label: 'داكن', description: 'ألوان عميقة وأنيقة', colors: ['#2C3E50', '#8E44AD', '#16A085', '#E74C3C'] },
];

const designStyleOptions = [
  { value: 'clay3d', label: 'طين 3D', icon: '🎨', description: 'أشكال ثلاثية الأبعاد ناعمة' },
  { value: 'watercolor', label: 'ألوان مائية', icon: '🖌️', description: 'رسم فني بألوان مائية' },
  { value: 'origami', label: 'أوريغامي', icon: '📄', description: 'فن طي الورق الياباني' },
  { value: 'isometric', label: 'إيزومتري', icon: '📐', description: 'أشكال هندسية ثلاثية الأبعاد' },
];

export default function AIContentCreatorPage() {
  const { user } = useAuth();
  const { logoUrl, isCustomLogo } = useSiteLogo();
  const queryClient = useQueryClient();
  const [contentType, setContentType] = useState<ContentType>('feature');
  const [aspectRatio, setAspectRatio] = useState<AspectRatio>('9:16');
  const [colorPalette, setColorPalette] = useState<ColorPalette>('pastel');
  const [designStyle, setDesignStyle] = useState<DesignStyle>('clay3d');
  const [prompt, setPrompt] = useState('');
  const [generatedImage, setGeneratedImage] = useState<string | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [showSaveDialog, setShowSaveDialog] = useState(false);
  const [saveTitle, setSaveTitle] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [showLibrary, setShowLibrary] = useState(false);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [selectedImage, setSelectedImage] = useState<SavedContent | null>(null);
  const [selectedFeature, setSelectedFeature] = useState<AppFeature | null>(null);
  const [features, setFeatures] = useState<AppFeature[]>([]);
  const [isLoadingFeatures, setIsLoadingFeatures] = useState(true);
  const [isExporting, setIsExporting] = useState(false);
  const previewRef = useRef<HTMLDivElement>(null);

  // Fetch features from edge function
  useEffect(() => {
    const fetchFeatures = async () => {
      try {
        const { data, error } = await supabase.functions.invoke('generate-ai-content', {
          body: { getFeatures: true },
        });
        if (data?.features) {
          setFeatures(data.features);
        }
      } catch (err) {
        console.error('Error fetching features:', err);
      } finally {
        setIsLoadingFeatures(false);
      }
    };
    fetchFeatures();
  }, []);

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

  const handleGenerate = async () => {
    if (contentType === 'feature' && !selectedFeature) {
      toast.error('يرجى اختيار ميزة من القائمة');
      return;
    }
    if (contentType === 'custom' && !prompt.trim()) {
      toast.error('يرجى كتابة وصف للمحتوى المطلوب');
      return;
    }

    setIsGenerating(true);
    setGeneratedImage(null);

    try {
      const { data, error } = await supabase.functions.invoke('generate-ai-content', {
        body: {
          prompt: contentType === 'custom' ? prompt : '',
          aspectRatio,
          colorPalette,
          designStyle,
          featureId: contentType === 'feature' ? selectedFeature?.id : null,
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
          setSelectedFeature(data.feature);
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

  // Refresh marketing text for selected feature without generating new image
  const handleRefreshText = async () => {
    if (!selectedFeature) return;
    
    try {
      const { data } = await supabase.functions.invoke('generate-ai-content', {
        body: { getFeatures: true },
      });
      
      if (data?.features) {
        const updatedFeature = data.features.find((f: AppFeature) => f.id === selectedFeature.id);
        if (updatedFeature) {
          setSelectedFeature(updatedFeature);
          toast.success('تم تحديث النص التسويقي');
        }
      }
    } catch (err) {
      console.error('Error refreshing text:', err);
      toast.error('حدث خطأ أثناء تحديث النص');
    }
  };

  // Export merged image with text overlay
  const handleExportMerged = async () => {
    if (!previewRef.current || !generatedImage) return;
    
    setIsExporting(true);
    try {
      const canvas = await html2canvas(previewRef.current, {
        useCORS: true,
        allowTaint: true,
        scale: 3, // Higher quality
        backgroundColor: null,
      });
      
      const link = document.createElement('a');
      link.download = `teacherhub-${selectedFeature?.id || 'content'}-${Date.now()}.png`;
      link.href = canvas.toDataURL('image/png');
      link.click();
      toast.success('تم تصدير الصورة المدمجة بنجاح!');
    } catch (err) {
      console.error('Error exporting:', err);
      toast.error('حدث خطأ أثناء التصدير');
    } finally {
      setIsExporting(false);
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
      const { error } = await supabase.from('ai_generated_content').insert({
        user_id: user.id,
        title: saveTitle.trim(),
        image_url: generatedImage,
        content_type: contentType,
        aspect_ratio: aspectRatio,
        prompt: prompt || selectedFeature?.title,
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
              إنشاء صور ترويجية للتطبيق باستخدام الذكاء الاصطناعي
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
              <CardDescription>اختر ميزة التطبيق وحجم الصورة</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Content Type */}
              <div className="space-y-3">
                <Label className="text-base font-medium">نوع المحتوى</Label>
                <Tabs value={contentType} onValueChange={(v) => setContentType(v as ContentType)}>
                  <TabsList className="grid w-full grid-cols-2">
                    <TabsTrigger value="feature" className="flex items-center gap-2">
                      <Sparkles className="w-4 h-4" />
                      مميزات التطبيق
                    </TabsTrigger>
                    <TabsTrigger value="custom" className="flex items-center gap-2">
                      <Quote className="w-4 h-4" />
                      وصف مخصص
                    </TabsTrigger>
                  </TabsList>
                </Tabs>
              </div>

              {/* Feature Selection */}
              {contentType === 'feature' && (
                <div className="space-y-3">
                  <Label className="text-base font-medium">اختر الميزة</Label>
                  <ScrollArea className="h-[280px] rounded-lg border p-2">
                    <div className="space-y-2">
                      {isLoadingFeatures ? (
                        <div className="flex items-center justify-center py-8">
                          <Loader2 className="w-6 h-6 animate-spin text-primary" />
                        </div>
                      ) : (
                        features.map((feature) => (
                          <button
                            key={feature.id}
                            onClick={() => setSelectedFeature(feature)}
                            className={cn(
                              "w-full text-right p-3 rounded-lg border-2 transition-all",
                              "hover:border-primary/50 hover:bg-primary/5",
                              selectedFeature?.id === feature.id
                                ? "border-primary bg-primary/10"
                                : "border-transparent bg-muted/50"
                            )}
                          >
                            <div className="flex items-start gap-3">
                              <div className={cn(
                                "w-5 h-5 rounded-full border-2 flex-shrink-0 mt-0.5 flex items-center justify-center",
                                selectedFeature?.id === feature.id
                                  ? "border-primary bg-primary text-primary-foreground"
                                  : "border-muted-foreground/30"
                              )}>
                                {selectedFeature?.id === feature.id && (
                                  <Check className="w-3 h-3" />
                                )}
                              </div>
                              <div className="flex-1 min-w-0">
                                <h4 className="font-bold text-foreground">{feature.title}</h4>
                                <p className="text-sm text-muted-foreground line-clamp-1">{feature.description}</p>
                                <p className="text-xs text-primary mt-1">"{feature.marketingText}"</p>
                              </div>
                            </div>
                          </button>
                        ))
                      )}
                    </div>
                  </ScrollArea>
                </div>
              )}

              {/* Custom Prompt */}
              {contentType === 'custom' && (
                <div className="space-y-3">
                  <Label className="text-base font-medium">وصف المحتوى</Label>
                  <Textarea
                    value={prompt}
                    onChange={(e) => setPrompt(e.target.value)}
                    placeholder="اكتب وصفاً للصورة المطلوبة (مثال: خلفية ملونة مع أيقونات تعليمية)"
                    className="min-h-[120px] resize-none"
                    dir="rtl"
                  />
                </div>
              )}

              {/* Design Style */}
              <div className="space-y-3">
                <Label className="text-base font-medium">نمط التصميم</Label>
                <div className="grid grid-cols-2 gap-2">
                  {designStyleOptions.map((style) => (
                    <button
                      key={style.value}
                      onClick={() => setDesignStyle(style.value as DesignStyle)}
                      className={cn(
                        "p-3 rounded-lg border-2 text-right transition-all",
                        "hover:border-primary/50 hover:bg-primary/5",
                        designStyle === style.value
                          ? "border-primary bg-primary/10"
                          : "border-border bg-muted/30"
                      )}
                    >
                      <div className="flex items-center gap-2">
                        <span className="text-xl">{style.icon}</span>
                        <div>
                          <p className="font-medium text-sm">{style.label}</p>
                          <p className="text-xs text-muted-foreground">{style.description}</p>
                        </div>
                      </div>
                    </button>
                  ))}
                </div>
              </div>

              {/* Color Palette */}
              <div className="space-y-3">
                <Label className="text-base font-medium">لوحة الألوان</Label>
                <div className="grid grid-cols-3 gap-2">
                  {colorPaletteOptions.map((palette) => (
                    <button
                      key={palette.value}
                      onClick={() => setColorPalette(palette.value as ColorPalette)}
                      className={cn(
                        "p-3 rounded-lg border-2 text-center transition-all",
                        "hover:border-primary/50",
                        colorPalette === palette.value
                          ? "border-primary bg-primary/10"
                          : "border-border bg-muted/30"
                      )}
                    >
                      <div className="flex justify-center gap-1 mb-2">
                        {palette.colors.map((color, i) => (
                          <div
                            key={i}
                            className="w-4 h-4 rounded-full border border-border/50"
                            style={{ backgroundColor: color }}
                          />
                        ))}
                      </div>
                      <p className="font-medium text-sm">{palette.label}</p>
                      <p className="text-xs text-muted-foreground">{palette.description}</p>
                    </button>
                  ))}
                </div>
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

              {/* Generate Button */}
              <Button
                onClick={handleGenerate}
                disabled={isGenerating || (contentType === 'feature' && !selectedFeature) || (contentType === 'custom' && !prompt.trim())}
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
                    إنشاء الصورة
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
                  <div className="flex gap-2 flex-wrap">
                    {selectedFeature && (
                      <Button variant="outline" size="sm" onClick={handleRefreshText}>
                        <RefreshCw className="w-4 h-4 ml-2" />
                        نص جديد
                      </Button>
                    )}
                    <Button variant="outline" size="sm" onClick={() => setShowSaveDialog(true)}>
                      <Save className="w-4 h-4 ml-2" />
                      حفظ
                    </Button>
                    <Button 
                      variant="default" 
                      size="sm" 
                      onClick={handleExportMerged}
                      disabled={isExporting}
                    >
                      {isExporting ? (
                        <Loader2 className="w-4 h-4 ml-2 animate-spin" />
                      ) : (
                        <Share2 className="w-4 h-4 ml-2" />
                      )}
                      تصدير مدمج
                    </Button>
                  </div>
                )}
              </CardTitle>
              <CardDescription>
                الصورة المنشأة مع النص العربي
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div 
                ref={previewRef}
                className={cn(
                  "bg-muted rounded-lg flex items-center justify-center overflow-hidden mx-auto relative",
                  aspectRatio === '3:4' ? 'aspect-[3/4] max-w-[300px]' : 'aspect-[9/16] max-w-[225px]'
                )}
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
                    {/* Professional Gradient Overlay */}
                    <div className="absolute inset-0 bg-gradient-to-b from-black/50 via-transparent to-black/70 pointer-events-none" />
                    
                    {selectedFeature && (
                      <div className="absolute inset-0 flex flex-col pointer-events-none">
                        {/* Top Section - Logo as App Icon */}
                        <div className="pt-5 px-3 text-center">
                          <div className="inline-flex flex-col items-center gap-2">
                            {isCustomLogo && (
                              <div className="w-14 h-14 rounded-2xl bg-white/95 backdrop-blur-sm p-2 shadow-xl ring-2 ring-white/30">
                                <img 
                                  src={logoUrl} 
                                  alt="شعار" 
                                  className="w-full h-full object-contain"
                                />
                              </div>
                            )}
                            <p className="text-white text-xs font-bold drop-shadow-lg">
                              منصة المعلم الذكي
                            </p>
                          </div>
                        </div>
                        
                        {/* Bottom Section - Feature Content */}
                        <div className="mt-auto pb-5 px-3">
                          <div className="bg-white/15 backdrop-blur-md rounded-xl p-4 border border-white/20">
                            {/* Feature Title */}
                            <h2 className="text-white text-base font-bold text-center mb-2 leading-snug">
                              {selectedFeature.title}
                            </h2>
                            
                            {/* Divider */}
                            <div className="w-12 h-0.5 bg-white/40 mx-auto mb-2" />
                            
                            {/* Marketing Text */}
                            <p className="text-white/90 text-xs text-center leading-relaxed">
                              "{selectedFeature.marketingText}"
                            </p>
                          </div>
                          
                          {/* Website */}
                          <p className="text-white/60 text-[9px] text-center mt-3 font-medium tracking-wider">
                            teacherhub.site
                          </p>
                        </div>
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="text-center space-y-3 p-6">
                    <ImageIcon className="w-12 h-12 text-muted-foreground/50 mx-auto" />
                    <p className="text-sm text-muted-foreground">
                      اختر ميزة ثم اضغط "إنشاء الصورة"
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
        <DialogContent className="max-w-3xl max-h-[80vh]">
          <DialogHeader>
            <DialogTitle>مكتبة المحتوى</DialogTitle>
            <DialogDescription>
              المحتوى المحفوظ سابقاً
            </DialogDescription>
          </DialogHeader>
          <ScrollArea className="h-[50vh]">
            {isLoadingContent ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="w-6 h-6 animate-spin" />
              </div>
            ) : savedContent.length === 0 ? (
              <div className="text-center py-12 text-muted-foreground">
                <FolderOpen className="w-12 h-12 mx-auto mb-4 opacity-50" />
                <p>لا يوجد محتوى محفوظ</p>
              </div>
            ) : (
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4 p-4">
                {savedContent.map((content) => (
                  <div key={content.id} className="group relative">
                    <div 
                      className="aspect-[3/4] rounded-lg overflow-hidden cursor-pointer"
                      onClick={() => setSelectedImage(content)}
                    >
                      <img
                        src={content.image_url}
                        alt={content.title}
                        className="w-full h-full object-cover transition-transform group-hover:scale-105"
                      />
                    </div>
                    <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity rounded-lg flex items-center justify-center gap-2">
                      <Button
                        size="sm"
                        variant="secondary"
                        onClick={() => handleDownload(content.image_url)}
                      >
                        <Download className="w-4 h-4" />
                      </Button>
                      <Button
                        size="sm"
                        variant="destructive"
                        onClick={() => setDeleteId(content.id)}
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                    <p className="text-sm font-medium mt-2 truncate">{content.title}</p>
                  </div>
                ))}
              </div>
            )}
          </ScrollArea>
        </DialogContent>
      </Dialog>

      {/* Image Preview Dialog */}
      <Dialog open={!!selectedImage} onOpenChange={() => setSelectedImage(null)}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>{selectedImage?.title}</DialogTitle>
          </DialogHeader>
          {selectedImage && (
            <div className="space-y-4">
              <img
                src={selectedImage.image_url}
                alt={selectedImage.title}
                className="w-full rounded-lg"
              />
              <div className="flex gap-2 justify-end">
                <Button
                  variant="outline"
                  onClick={() => handleDownload(selectedImage.image_url)}
                >
                  <Download className="w-4 h-4 ml-2" />
                  تحميل
                </Button>
              </div>
            </div>
          )}
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
