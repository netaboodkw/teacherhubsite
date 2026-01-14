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
type ContentType = 'feature' | 'marketing' | 'interactive' | 'trial' | 'testimonial' | 'tips' | 'custom';
type ColorPalette = 'pastel' | 'vibrant' | 'dark' | 'sunset' | 'ocean';
type DesignStyle = 'clay3d' | 'watercolor' | 'origami' | 'isometric' | 'glassmorphism' | 'retro' | 'neon' | 'minimal';

// Content type configurations
const contentTypeOptions = [
  { 
    value: 'feature', 
    label: 'مميزات التطبيق', 
    icon: '⭐', 
    description: 'اعرض مميزات التطبيق',
    color: 'bg-blue-500/10 border-blue-500/30'
  },
  { 
    value: 'marketing', 
    label: 'تسويقي', 
    icon: '📢', 
    description: 'محتوى ترويجي وإعلاني',
    color: 'bg-purple-500/10 border-purple-500/30'
  },
  { 
    value: 'interactive', 
    label: 'تفاعلي', 
    icon: '🎯', 
    description: 'بوستات تفاعلية وأسئلة',
    color: 'bg-green-500/10 border-green-500/30'
  },
  { 
    value: 'trial', 
    label: 'جذب للتجربة', 
    icon: '🚀', 
    description: 'تشجيع على تجربة التطبيق',
    color: 'bg-orange-500/10 border-orange-500/30'
  },
  { 
    value: 'testimonial', 
    label: 'آراء وتجارب', 
    icon: '💬', 
    description: 'شهادات وتجارب المستخدمين',
    color: 'bg-pink-500/10 border-pink-500/30'
  },
  { 
    value: 'tips', 
    label: 'نصائح تعليمية', 
    icon: '💡', 
    description: 'نصائح ومعلومات للمعلمين',
    color: 'bg-yellow-500/10 border-yellow-500/30'
  },
  { 
    value: 'custom', 
    label: 'مخصص', 
    icon: '✏️', 
    description: 'محتوى مخصص بوصفك',
    color: 'bg-gray-500/10 border-gray-500/30'
  },
];

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
  { value: 'sunset', label: 'غروب', description: 'ألوان الغروب الدافئة', colors: ['#FF6B35', '#F7C59F', '#EFEFD0', '#004E89'] },
  { value: 'ocean', label: 'محيط', description: 'ألوان البحر الهادئة', colors: ['#0077B6', '#00B4D8', '#90E0EF', '#CAF0F8'] },
];

const designStyleOptions = [
  // Educational styles
  { value: 'classroom', label: 'فصل دراسي', icon: '🏫', description: 'صفوف ومقاعد دراسية' },
  { value: 'cartoon', label: 'كرتوني', icon: '🎬', description: 'شخصيات كرتونية مرحة' },
  { value: 'chalkboard', label: 'سبورة', icon: '📝', description: 'طباشير وسبورة خضراء' },
  { value: 'notebook', label: 'دفتر ملاحظات', icon: '📓', description: 'أوراق ودفاتر مدرسية' },
  { value: 'kids', label: 'أطفال', icon: '👧', description: 'رسومات أطفال ملونة' },
  { value: 'stickers', label: 'ملصقات', icon: '🏷️', description: 'ملصقات ونجوم ملونة' },
  // Artistic styles
  { value: 'clay3d', label: 'طين 3D', icon: '🎨', description: 'أشكال ثلاثية الأبعاد ناعمة' },
  { value: 'watercolor', label: 'ألوان مائية', icon: '🖌️', description: 'رسم فني بألوان مائية' },
  { value: 'origami', label: 'أوريغامي', icon: '📄', description: 'فن طي الورق الياباني' },
  { value: 'isometric', label: 'إيزومتري', icon: '📐', description: 'أشكال هندسية ثلاثية الأبعاد' },
  { value: 'glassmorphism', label: 'زجاجي', icon: '💎', description: 'تأثيرات زجاجية شفافة' },
  { value: 'retro', label: 'ريترو', icon: '📻', description: 'طراز كلاسيكي قديم' },
  { value: 'neon', label: 'نيون', icon: '✨', description: 'إضاءة نيون متوهجة' },
  { value: 'minimal', label: 'بسيط', icon: '⬜', description: 'تصميم نظيف ومينيمال' },
  { value: 'doodle', label: 'رسم يدوي', icon: '✏️', description: 'خربشات ورسومات يدوية' },
  { value: 'flat', label: 'فلات ديزاين', icon: '🔷', description: 'تصميم مسطح عصري' },
];

interface TextSuggestion {
  title: string;
  text: string;
}

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
  const [customTitle, setCustomTitle] = useState('');
  const [customMarketingText, setCustomMarketingText] = useState('');
  const [features, setFeatures] = useState<AppFeature[]>([]);
  const [isLoadingFeatures, setIsLoadingFeatures] = useState(true);
  const [isExporting, setIsExporting] = useState(false);
  const [textSuggestions, setTextSuggestions] = useState<TextSuggestion[]>([]);
  const [isLoadingSuggestions, setIsLoadingSuggestions] = useState(false);
  const previewRef = useRef<HTMLDivElement>(null);

  // Display title and marketing text (custom or from feature)
  const displayTitle = customTitle || selectedFeature?.title || '';
  const displayMarketingText = customMarketingText || selectedFeature?.marketingText || '';

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

  // Fetch text suggestions when content type changes (not for 'feature' and 'custom')
  const fetchTextSuggestions = async () => {
    if (['feature', 'custom'].includes(contentType)) {
      setTextSuggestions([]);
      return;
    }
    
    setIsLoadingSuggestions(true);
    try {
      const { data, error } = await supabase.functions.invoke('generate-ai-content', {
        body: { getSuggestions: true, contentType },
      });
      
      if (error) throw error;
      
      if (data?.suggestions) {
        setTextSuggestions(data.suggestions);
      }
    } catch (err) {
      console.error('Error fetching suggestions:', err);
      toast.error('حدث خطأ في تحميل الاقتراحات');
    } finally {
      setIsLoadingSuggestions(false);
    }
  };

  // Load suggestions when content type changes
  useEffect(() => {
    if (!['feature', 'custom'].includes(contentType)) {
      fetchTextSuggestions();
    } else {
      setTextSuggestions([]);
    }
  }, [contentType]);

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
          contentType,
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

  // Export merged image with text overlay - 2K quality using Canvas API
  const handleExportMerged = async () => {
    if (!generatedImage) return;
    
    setIsExporting(true);
    try {
      // Target 2K resolution - maintain exact aspect ratios
      const targetWidth = aspectRatio === '9:16' ? 1080 : 1620; // 9:16 or 3:4
      const targetHeight = aspectRatio === '9:16' ? 1920 : 2160; // Full HD for story, 2K for post
      
      // Create canvas with target dimensions
      const canvas = document.createElement('canvas');
      canvas.width = targetWidth;
      canvas.height = targetHeight;
      const ctx = canvas.getContext('2d');
      
      if (!ctx) {
        throw new Error('Could not get canvas context');
      }

      // Load the generated image
      const img = new Image();
      img.crossOrigin = 'anonymous';
      
      await new Promise<void>((resolve, reject) => {
        img.onload = () => resolve();
        img.onerror = () => reject(new Error('Failed to load image'));
        img.src = generatedImage;
      });

      // Draw background image to fill canvas (object-cover behavior)
      const imgAspect = img.width / img.height;
      const canvasAspect = targetWidth / targetHeight;
      
      let drawWidth, drawHeight, drawX, drawY;
      
      if (imgAspect > canvasAspect) {
        // Image is wider - crop sides
        drawHeight = targetHeight;
        drawWidth = targetHeight * imgAspect;
        drawX = (targetWidth - drawWidth) / 2;
        drawY = 0;
      } else {
        // Image is taller - crop top/bottom
        drawWidth = targetWidth;
        drawHeight = targetWidth / imgAspect;
        drawX = 0;
        drawY = (targetHeight - drawHeight) / 2;
      }
      
      ctx.drawImage(img, drawX, drawY, drawWidth, drawHeight);

      // Draw gradient overlay - matches preview exactly
      const gradient = ctx.createLinearGradient(0, 0, 0, targetHeight);
      gradient.addColorStop(0, 'rgba(0, 0, 0, 0.5)');
      gradient.addColorStop(0.3, 'rgba(0, 0, 0, 0)');
      gradient.addColorStop(0.5, 'rgba(0, 0, 0, 0)');
      gradient.addColorStop(1, 'rgba(0, 0, 0, 0.7)');
      ctx.fillStyle = gradient;
      ctx.fillRect(0, 0, targetWidth, targetHeight);

      // Base preview dimensions for scaling
      const previewWidth = aspectRatio === '9:16' ? 225 : 300;
      const scale = targetWidth / previewWidth;

      // Common text settings
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';

      // Draw logo if custom logo exists - matches preview pt-5 (20px)
      const topPadding = 20 * scale;
      const logoSize = 56 * scale; // w-14 = 56px
      
      if (isCustomLogo && logoUrl) {
        const logoImg = new Image();
        logoImg.crossOrigin = 'anonymous';
        
        try {
          await new Promise<void>((resolve, reject) => {
            logoImg.onload = () => resolve();
            logoImg.onerror = () => reject(new Error('Failed to load logo'));
            logoImg.src = logoUrl;
          });

          const logoPadding = 8 * scale;
          const logoBoxSize = logoSize + logoPadding * 2;
          const logoX = (targetWidth - logoBoxSize) / 2;
          const logoY = topPadding;
          const logoRadius = 16 * scale; // rounded-2xl

          // Draw logo background with shadow
          ctx.save();
          ctx.shadowColor = 'rgba(0, 0, 0, 0.3)';
          ctx.shadowBlur = 25 * scale;
          ctx.shadowOffsetY = 10 * scale;
          ctx.fillStyle = 'rgba(255, 255, 255, 0.95)';
          ctx.beginPath();
          ctx.roundRect(logoX, logoY, logoBoxSize, logoBoxSize, logoRadius);
          ctx.fill();
          ctx.restore();
          
          // Draw logo border
          ctx.strokeStyle = 'rgba(255, 255, 255, 0.3)';
          ctx.lineWidth = 2 * scale;
          ctx.beginPath();
          ctx.roundRect(logoX, logoY, logoBoxSize, logoBoxSize, logoRadius);
          ctx.stroke();
          
          // Draw logo image
          ctx.drawImage(logoImg, logoX + logoPadding, logoY + logoPadding, logoSize, logoSize);
        } catch (err) {
          console.warn('Could not load logo:', err);
        }
      }

      // Calculate platform name position (below logo or at top)
      const platformNameY = isCustomLogo 
        ? topPadding + logoSize + 24 * scale  // gap-2 = 8px + some padding
        : topPadding + 16 * scale;

      // Draw platform name - text-xs = 12px
      ctx.save();
      ctx.fillStyle = 'white';
      ctx.font = `bold ${12 * scale}px 'Tajawal', 'Segoe UI', sans-serif`;
      ctx.shadowColor = 'rgba(0, 0, 0, 0.5)';
      ctx.shadowBlur = 4 * scale;
      ctx.shadowOffsetY = 2 * scale;
      ctx.fillText('منصة المعلم الذكي', targetWidth / 2, platformNameY);
      ctx.restore();

      // Draw bottom content box if there's content - matches preview pb-5 px-3
      if (displayTitle || displayMarketingText) {
        const bottomPadding = 20 * scale; // pb-5
        const horizontalPadding = 12 * scale; // px-3
        const boxPadding = 16 * scale; // p-4
        const boxWidth = targetWidth - horizontalPadding * 2;
        
        // Calculate box height based on content
        const titleFontSize = 16 * scale; // text-base
        const textFontSize = 12 * scale; // text-xs
        const lineHeight = 1.5;
        
        let contentHeight = boxPadding * 2;
        if (displayTitle) {
          contentHeight += titleFontSize * lineHeight;
        }
        if (displayTitle && displayMarketingText) {
          contentHeight += 8 * scale; // mb-2 spacing
          contentHeight += 2 * scale; // divider
          contentHeight += 8 * scale; // mb-2 spacing
        }
        if (displayMarketingText) {
          // Estimate text height (wrap text)
          ctx.font = `${textFontSize}px 'Tajawal', 'Segoe UI', sans-serif`;
          const maxTextWidth = boxWidth - boxPadding * 2;
          const words = `"${displayMarketingText}"`.split(' ');
          let lines = 1;
          let currentLine = '';
          for (const word of words) {
            const testLine = currentLine + (currentLine ? ' ' : '') + word;
            if (ctx.measureText(testLine).width > maxTextWidth && currentLine) {
              lines++;
              currentLine = word;
            } else {
              currentLine = testLine;
            }
          }
          contentHeight += lines * textFontSize * lineHeight;
        }
        
        const boxHeight = Math.max(contentHeight, 100 * scale);
        const websiteHeight = 30 * scale; // Space for website
        const boxY = targetHeight - bottomPadding - websiteHeight - boxHeight;
        const boxRadius = 12 * scale; // rounded-xl

        // Draw box background
        ctx.fillStyle = 'rgba(255, 255, 255, 0.2)';
        ctx.beginPath();
        ctx.roundRect(horizontalPadding, boxY, boxWidth, boxHeight, boxRadius);
        ctx.fill();

        // Draw box border
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.3)';
        ctx.lineWidth = 1 * scale;
        ctx.stroke();

        // Draw content inside box
        let currentY = boxY + boxPadding;
        
        // Draw title - text-base font-bold
        if (displayTitle) {
          ctx.save();
          ctx.fillStyle = 'white';
          ctx.font = `bold ${titleFontSize}px 'Tajawal', 'Segoe UI', sans-serif`;
          ctx.shadowColor = 'rgba(0, 0, 0, 0.3)';
          ctx.shadowBlur = 3 * scale;
          currentY += titleFontSize / 2;
          ctx.fillText(displayTitle, targetWidth / 2, currentY);
          currentY += titleFontSize / 2 + 8 * scale;
          ctx.restore();
        }

        // Draw divider - w-12 h-0.5
        if (displayTitle && displayMarketingText) {
          const dividerWidth = 48 * scale;
          const dividerHeight = 2 * scale;
          ctx.fillStyle = 'rgba(255, 255, 255, 0.4)';
          ctx.fillRect((targetWidth - dividerWidth) / 2, currentY, dividerWidth, dividerHeight);
          currentY += dividerHeight + 8 * scale;
        }

        // Draw marketing text - text-xs with word wrap
        if (displayMarketingText) {
          ctx.fillStyle = 'rgba(255, 255, 255, 0.9)';
          ctx.font = `${textFontSize}px 'Tajawal', 'Segoe UI', sans-serif`;
          
          const maxWidth = boxWidth - boxPadding * 2;
          const words = `"${displayMarketingText}"`.split(' ');
          let line = '';
          const textLineHeight = textFontSize * lineHeight;
          
          currentY += textFontSize / 2;
          
          for (const word of words) {
            const testLine = line + (line ? ' ' : '') + word;
            const metrics = ctx.measureText(testLine);
            if (metrics.width > maxWidth && line) {
              ctx.fillText(line, targetWidth / 2, currentY);
              line = word;
              currentY += textLineHeight;
            } else {
              line = testLine;
            }
          }
          ctx.fillText(line, targetWidth / 2, currentY);
        }

        // Draw website below box - text-[9px]
        const websiteY = targetHeight - bottomPadding - 10 * scale;
        ctx.fillStyle = 'rgba(255, 255, 255, 0.6)';
        ctx.font = `500 ${9 * scale}px 'Tajawal', 'Segoe UI', sans-serif`;
        ctx.fillText('teacherhub.site', targetWidth / 2, websiteY);
      } else {
        // Draw website at bottom when no content box
        const websiteY = targetHeight - 20 * scale;
        ctx.fillStyle = 'rgba(255, 255, 255, 0.6)';
        ctx.font = `500 ${9 * scale}px 'Tajawal', 'Segoe UI', sans-serif`;
        ctx.fillText('teacherhub.site', targetWidth / 2, websiteY);
      }

      // Download
      const link = document.createElement('a');
      link.download = `teacherhub-${selectedFeature?.id || contentType}-2K-${Date.now()}.png`;
      link.href = canvas.toDataURL('image/png', 1.0);
      link.click();
      toast.success('تم تصدير الصورة بجودة عالية!');
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
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                  {contentTypeOptions.map((type) => (
                    <button
                      key={type.value}
                      onClick={() => {
                        setContentType(type.value as ContentType);
                        setSelectedFeature(null);
                        setCustomTitle('');
                        setCustomMarketingText('');
                      }}
                      className={cn(
                        "p-2 rounded-lg border-2 text-center transition-all",
                        "hover:border-primary/50",
                        contentType === type.value
                          ? "border-primary bg-primary/10"
                          : `border-border ${type.color}`
                      )}
                    >
                      <span className="text-xl block mb-1">{type.icon}</span>
                      <p className="font-medium text-xs">{type.label}</p>
                    </button>
                  ))}
                </div>
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

              {/* Content-specific inputs for non-feature types */}
              {['marketing', 'interactive', 'trial', 'testimonial', 'tips'].includes(contentType) && (
                <div className="space-y-4 p-3 rounded-lg bg-muted/50 border">
                  {/* AI Suggestions */}
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <Label className="text-sm font-medium flex items-center gap-2">
                        <Sparkles className="w-4 h-4 text-primary" />
                        اقتراحات ذكية
                      </Label>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={fetchTextSuggestions}
                        disabled={isLoadingSuggestions}
                        className="h-7 px-2 text-xs"
                      >
                        {isLoadingSuggestions ? (
                          <Loader2 className="w-3 h-3 animate-spin" />
                        ) : (
                          <>
                            <RefreshCw className="w-3 h-3 ml-1" />
                            تحديث
                          </>
                        )}
                      </Button>
                    </div>
                    
                    {isLoadingSuggestions ? (
                      <div className="flex items-center justify-center py-4">
                        <Loader2 className="w-5 h-5 animate-spin text-primary" />
                        <span className="mr-2 text-sm text-muted-foreground">جاري توليد الأفكار...</span>
                      </div>
                    ) : textSuggestions.length > 0 ? (
                      <div className="grid grid-cols-1 gap-2">
                        {textSuggestions.map((suggestion, index) => (
                          <button
                            key={index}
                            onClick={() => {
                              setCustomTitle(suggestion.title);
                              setCustomMarketingText(suggestion.text);
                              toast.success('تم اختيار الاقتراح');
                            }}
                            className={cn(
                              "text-right p-2.5 rounded-lg border transition-all",
                              "hover:border-primary/50 hover:bg-primary/5",
                              customTitle === suggestion.title && customMarketingText === suggestion.text
                                ? "border-primary bg-primary/10"
                                : "border-border bg-background"
                            )}
                          >
                            <p className="font-medium text-sm text-foreground mb-1">{suggestion.title}</p>
                            <p className="text-xs text-muted-foreground line-clamp-2">{suggestion.text}</p>
                          </button>
                        ))}
                      </div>
                    ) : (
                      <div className="text-center py-3 text-sm text-muted-foreground">
                        اضغط "تحديث" للحصول على أفكار جديدة
                      </div>
                    )}
                  </div>

                  {/* Divider */}
                  <div className="relative">
                    <div className="absolute inset-0 flex items-center">
                      <span className="w-full border-t" />
                    </div>
                    <div className="relative flex justify-center text-xs">
                      <span className="bg-muted/50 px-2 text-muted-foreground">أو اكتب نصك</span>
                    </div>
                  </div>

                  {/* Manual Text Input */}
                  <div className="space-y-2">
                    <Input
                      value={customTitle}
                      onChange={(e) => setCustomTitle(e.target.value)}
                      placeholder={
                        contentType === 'marketing' ? 'عنوان الإعلان (مثال: جرّب الآن مجاناً!)' :
                        contentType === 'interactive' ? 'السؤال التفاعلي (مثال: ما أكثر ميزة تحتاجها؟)' :
                        contentType === 'trial' ? 'عنوان دعوة التجربة (مثال: ابدأ تجربتك المجانية)' :
                        contentType === 'testimonial' ? 'عنوان الشهادة (مثال: ماذا يقول المعلمون؟)' :
                        'عنوان النصيحة (مثال: نصيحة اليوم للمعلم)'
                      }
                      dir="rtl"
                      className="text-sm"
                    />
                    <Textarea
                      value={customMarketingText}
                      onChange={(e) => setCustomMarketingText(e.target.value)}
                      placeholder={
                        contentType === 'marketing' ? 'النص الترويجي (مثال: وفّر وقتك وركّز على طلابك)' :
                        contentType === 'interactive' ? 'خيارات التفاعل أو تفاصيل السؤال' :
                        contentType === 'trial' ? 'مميزات التجربة المجانية' :
                        contentType === 'testimonial' ? 'نص الشهادة أو التجربة' :
                        'نص النصيحة التعليمية'
                      }
                      className="min-h-[60px] resize-none text-sm"
                      dir="rtl"
                    />
                  </div>
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

              {/* Custom Text Editing for Features */}
              {contentType === 'feature' && selectedFeature && (
                <div className="space-y-3 p-3 rounded-lg bg-muted/50 border">
                  <Label className="text-base font-medium flex items-center gap-2">
                    ✏️ تخصيص النص
                  </Label>
                  <div className="space-y-2">
                    <Input
                      value={customTitle}
                      onChange={(e) => setCustomTitle(e.target.value)}
                      placeholder={selectedFeature.title}
                      dir="rtl"
                      className="text-sm"
                    />
                    <Textarea
                      value={customMarketingText}
                      onChange={(e) => setCustomMarketingText(e.target.value)}
                      placeholder={selectedFeature.marketingText}
                      className="min-h-[60px] resize-none text-sm"
                      dir="rtl"
                    />
                    {(customTitle || customMarketingText) && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => {
                          setCustomTitle('');
                          setCustomMarketingText('');
                        }}
                        className="text-xs"
                      >
                        إعادة للنص الأصلي
                      </Button>
                    )}
                  </div>
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
                    {/* Professional Gradient Overlay - Solid colors for html2canvas compatibility */}
                    <div 
                      className="absolute inset-0 pointer-events-none"
                      style={{
                        background: 'linear-gradient(to bottom, rgba(0,0,0,0.5) 0%, rgba(0,0,0,0) 30%, rgba(0,0,0,0) 50%, rgba(0,0,0,0.7) 100%)'
                      }}
                    />
                    
                    {/* Show overlay when there's content to display */}
                    {(displayTitle || displayMarketingText || contentType !== 'custom') && (
                      <div className="absolute inset-0 flex flex-col pointer-events-none">
                        {/* Top Section - Logo as App Icon */}
                        <div className="pt-5 px-3 text-center">
                          <div className="inline-flex flex-col items-center gap-2">
                            {isCustomLogo && (
                              <div 
                                className="w-14 h-14 rounded-2xl p-2"
                                style={{
                                  backgroundColor: 'rgba(255, 255, 255, 0.95)',
                                  boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.3), 0 0 0 2px rgba(255, 255, 255, 0.3)'
                                }}
                              >
                                <img 
                                  src={logoUrl} 
                                  alt="شعار" 
                                  className="w-full h-full object-contain"
                                  crossOrigin="anonymous"
                                />
                              </div>
                            )}
                            <p 
                              className="text-white text-xs font-bold"
                              style={{ textShadow: '0 2px 4px rgba(0,0,0,0.5)' }}
                            >
                              منصة المعلم الذكي
                            </p>
                          </div>
                        </div>
                        
                        {/* Bottom Section - Content */}
                        {(displayTitle || displayMarketingText) && (
                          <div className="mt-auto pb-5 px-3">
                            <div 
                              className="rounded-xl p-4"
                              style={{
                                backgroundColor: 'rgba(255, 255, 255, 0.2)',
                                border: '1px solid rgba(255, 255, 255, 0.3)'
                              }}
                            >
                              {/* Title */}
                              {displayTitle && (
                                <h2 
                                  className="text-white text-base font-bold text-center mb-2 leading-snug"
                                  style={{ textShadow: '0 1px 3px rgba(0,0,0,0.3)' }}
                                >
                                  {displayTitle}
                                </h2>
                              )}
                              
                              {/* Divider */}
                              {displayTitle && displayMarketingText && (
                                <div 
                                  className="w-12 h-0.5 mx-auto mb-2"
                                  style={{ backgroundColor: 'rgba(255, 255, 255, 0.4)' }}
                                />
                              )}
                              
                              {/* Marketing Text */}
                              {displayMarketingText && (
                                <p 
                                  className="text-xs text-center leading-relaxed"
                                  style={{ color: 'rgba(255, 255, 255, 0.9)' }}
                                >
                                  "{displayMarketingText}"
                                </p>
                              )}
                            </div>
                            
                            {/* Website */}
                            <p 
                              className="text-[9px] text-center mt-3 font-medium tracking-wider"
                              style={{ color: 'rgba(255, 255, 255, 0.6)' }}
                            >
                              teacherhub.site
                            </p>
                          </div>
                        )}
                        
                        {/* Show website even without text content */}
                        {!displayTitle && !displayMarketingText && (
                          <div className="mt-auto pb-5 px-3">
                            <p 
                              className="text-[9px] text-center font-medium tracking-wider"
                              style={{ color: 'rgba(255, 255, 255, 0.6)' }}
                            >
                              teacherhub.site
                            </p>
                          </div>
                        )}
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
