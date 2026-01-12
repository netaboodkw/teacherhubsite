import { useState, useRef, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Slider } from '@/components/ui/slider';
import { Camera, Loader2, ZoomIn, ZoomOut, RotateCw } from 'lucide-react';
import { toast } from 'sonner';
import ReactCrop, { Crop, PixelCrop, centerCrop, makeAspectCrop } from 'react-image-crop';
import 'react-image-crop/dist/ReactCrop.css';

interface StudentAvatarUploadProps {
  studentId: string;
  currentAvatarUrl: string | null;
  initials: string;
  onUpload: (url: string) => void;
  size?: 'sm' | 'md' | 'lg';
}

function centerAspectCrop(
  mediaWidth: number,
  mediaHeight: number,
  aspect: number,
) {
  return centerCrop(
    makeAspectCrop(
      {
        unit: '%',
        width: 90,
      },
      aspect,
      mediaWidth,
      mediaHeight,
    ),
    mediaWidth,
    mediaHeight,
  );
}

export function StudentAvatarUpload({ 
  studentId, 
  currentAvatarUrl, 
  initials, 
  onUpload,
  size = 'md'
}: StudentAvatarUploadProps) {
  const [uploading, setUploading] = useState(false);
  const [imgSrc, setImgSrc] = useState<string>('');
  const [crop, setCrop] = useState<Crop>();
  const [completedCrop, setCompletedCrop] = useState<PixelCrop>();
  const [scale, setScale] = useState(1);
  const [rotate, setRotate] = useState(0);
  const [dialogOpen, setDialogOpen] = useState(false);
  const imgRef = useRef<HTMLImageElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const sizeClasses = {
    sm: 'w-12 h-12',
    md: 'w-16 h-16',
    lg: 'w-24 h-24',
  };

  const onSelectFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith('image/')) {
      toast.error('يرجى اختيار صورة صالحة');
      return;
    }

    // Validate file size (max 10MB before crop)
    if (file.size > 10 * 1024 * 1024) {
      toast.error('حجم الصورة يجب أن يكون أقل من 10 ميجابايت');
      return;
    }

    const reader = new FileReader();
    reader.addEventListener('load', () => {
      setImgSrc(reader.result?.toString() || '');
      setScale(1);
      setRotate(0);
      setDialogOpen(true);
    });
    reader.readAsDataURL(file);
    
    // Reset input
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const onImageLoad = useCallback((e: React.SyntheticEvent<HTMLImageElement>) => {
    const { width, height } = e.currentTarget;
    setCrop(centerAspectCrop(width, height, 1));
  }, []);

  const getCroppedImg = async (): Promise<Blob | null> => {
    const image = imgRef.current;
    if (!image || !completedCrop) return null;

    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    if (!ctx) return null;

    const scaleX = image.naturalWidth / image.width;
    const scaleY = image.naturalHeight / image.height;

    // Calculate the actual crop dimensions
    const cropX = completedCrop.x * scaleX;
    const cropY = completedCrop.y * scaleY;
    const cropWidth = completedCrop.width * scaleX;
    const cropHeight = completedCrop.height * scaleY;

    // Set canvas size to desired output (256x256 for avatar)
    const outputSize = 256;
    canvas.width = outputSize;
    canvas.height = outputSize;

    // Apply rotation if needed
    ctx.save();
    ctx.translate(outputSize / 2, outputSize / 2);
    ctx.rotate((rotate * Math.PI) / 180);
    ctx.scale(scale, scale);
    ctx.translate(-outputSize / 2, -outputSize / 2);

    // Draw the cropped image
    ctx.drawImage(
      image,
      cropX,
      cropY,
      cropWidth,
      cropHeight,
      0,
      0,
      outputSize,
      outputSize
    );

    ctx.restore();

    return new Promise((resolve) => {
      canvas.toBlob(
        (blob) => resolve(blob),
        'image/jpeg',
        0.9
      );
    });
  };

  const handleSave = async () => {
    setUploading(true);

    try {
      const croppedBlob = await getCroppedImg();
      if (!croppedBlob) {
        throw new Error('فشل في معالجة الصورة');
      }

      const fileName = `${studentId}-${Date.now()}.jpg`;
      const filePath = fileName;

      const { error: uploadError } = await supabase.storage
        .from('student-avatars')
        .upload(filePath, croppedBlob, { 
          upsert: true,
          contentType: 'image/jpeg'
        });

      if (uploadError) throw uploadError;

      const { data } = supabase.storage
        .from('student-avatars')
        .getPublicUrl(filePath);

      onUpload(data.publicUrl);
      toast.success('تم رفع الصورة بنجاح');
      setDialogOpen(false);
      setImgSrc('');
    } catch (error: any) {
      toast.error('فشل في رفع الصورة: ' + error.message);
    } finally {
      setUploading(false);
    }
  };

  return (
    <>
      <div className="relative group">
        <Avatar className={`${sizeClasses[size]} border-2 border-primary/20`}>
          <AvatarImage src={currentAvatarUrl || undefined} alt="صورة الطالب" />
          <AvatarFallback className="bg-primary/10 text-primary font-semibold">
            {initials}
          </AvatarFallback>
        </Avatar>
        
        <input
          type="file"
          ref={fileInputRef}
          className="hidden"
          accept="image/*"
          onChange={onSelectFile}
        />
        
        <Button
          type="button"
          variant="secondary"
          size="icon"
          className="absolute -bottom-1 -left-1 h-7 w-7 rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
          onClick={() => fileInputRef.current?.click()}
          disabled={uploading}
        >
          {uploading ? (
            <Loader2 className="h-3 w-3 animate-spin" />
          ) : (
            <Camera className="h-3 w-3" />
          )}
        </Button>
      </div>

      {/* Image Crop Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent dir="rtl" className="max-w-[95vw] sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>تعديل صورة الطالب</DialogTitle>
          </DialogHeader>

          <div className="space-y-4">
            {/* Crop Area */}
            <div className="flex justify-center bg-muted/50 rounded-lg p-2 overflow-hidden max-h-[50vh]">
              {imgSrc && (
                <ReactCrop
                  crop={crop}
                  onChange={(_, percentCrop) => setCrop(percentCrop)}
                  onComplete={(c) => setCompletedCrop(c)}
                  aspect={1}
                  circularCrop
                  className="max-h-[45vh]"
                >
                  <img
                    ref={imgRef}
                    src={imgSrc}
                    alt="صورة للتعديل"
                    style={{
                      transform: `scale(${scale}) rotate(${rotate}deg)`,
                      maxHeight: '45vh',
                      width: 'auto',
                    }}
                    onLoad={onImageLoad}
                  />
                </ReactCrop>
              )}
            </div>

            {/* Controls */}
            <div className="space-y-4">
              {/* Zoom */}
              <div className="flex items-center gap-3">
                <ZoomOut className="h-4 w-4 text-muted-foreground shrink-0" />
                <Slider
                  value={[scale]}
                  min={0.5}
                  max={3}
                  step={0.1}
                  onValueChange={([value]) => setScale(value)}
                  className="flex-1"
                />
                <ZoomIn className="h-4 w-4 text-muted-foreground shrink-0" />
              </div>

              {/* Rotate */}
              <div className="flex items-center justify-center gap-2">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setRotate((r) => (r - 90) % 360)}
                >
                  <RotateCw className="h-4 w-4 ml-1 scale-x-[-1]" />
                  يسار
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setRotate((r) => (r + 90) % 360)}
                >
                  <RotateCw className="h-4 w-4 ml-1" />
                  يمين
                </Button>
              </div>
            </div>
          </div>

          <DialogFooter className="flex-row-reverse gap-2 sm:gap-0">
            <Button onClick={handleSave} disabled={uploading || !completedCrop}>
              {uploading ? <Loader2 className="h-4 w-4 animate-spin ml-2" /> : null}
              حفظ الصورة
            </Button>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>
              إلغاء
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
