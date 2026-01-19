import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { MobileSheet, MobileSheetFooter } from '@/components/ui/mobile-sheet';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { User, Plus, Minus, MessageSquare, Loader2, ThumbsUp, ThumbsDown, ExternalLink } from 'lucide-react';
import { cn } from '@/lib/utils';
interface SelectedStudent {
  id: string;
  name: string;
  avatar_url: string | null;
}

interface MobileStudentNoteSheetProps {
  student: SelectedStudent | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSave: (noteType: 'positive' | 'negative' | 'note', description: string) => Promise<void>;
  saving: boolean;
}

const QUICK_POSITIVE = [
  'مشاركة ممتازة',
  'إجابة صحيحة',
  'سلوك مميز',
  'تعاون مع الزملاء',
  'التزام بالنظام',
  'إبداع في الحل',
];

const QUICK_NEGATIVE = [
  'عدم الانتباه',
  'الحديث مع الزملاء',
  'عدم إحضار الكتاب',
  'عدم حل الواجب',
  'التأخر عن الحصة',
  'إزعاج الآخرين',
];

export function MobileStudentNoteSheet({ 
  student, 
  open, 
  onOpenChange,
  onSave,
  saving
}: MobileStudentNoteSheetProps) {
  const navigate = useNavigate();
  const [noteType, setNoteType] = useState<'positive' | 'negative' | 'note'>('positive');
  const [noteDescription, setNoteDescription] = useState('');
  const [activeTab, setActiveTab] = useState<'positive' | 'negative'>('positive');

  const handleOpenStudentProfile = () => {
    if (student) {
      onOpenChange(false);
      navigate(`/teacher/students/${student.id}`);
    }
  };

  const handleQuickNote = async (note: string, type: 'positive' | 'negative') => {
    await onSave(type, note);
    onOpenChange(false);
    setNoteDescription('');
  };

  const handleCustomSave = async () => {
    if (!noteDescription.trim()) return;
    await onSave(noteType, noteDescription);
    onOpenChange(false);
    setNoteDescription('');
  };

  return (
    <MobileSheet
      open={open}
      onOpenChange={onOpenChange}
    >
      <div className="space-y-5">
        {/* Student Header */}
        <div className="flex items-center gap-4 pb-4 border-b border-border/50">
          <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center overflow-hidden shrink-0">
            {student?.avatar_url ? (
              <img
                src={student.avatar_url}
                alt={student.name}
                className="w-full h-full object-cover"
              />
            ) : (
              <User className="h-8 w-8 text-primary" />
            )}
          </div>
          <div className="flex-1 min-w-0">
            <h2 className="text-xl font-bold truncate">{student?.name}</h2>
            <p className="text-muted-foreground">إضافة ملاحظة سلوكية</p>
          </div>
          <Button
            variant="ghost"
            size="icon"
            onClick={handleOpenStudentProfile}
            className="shrink-0 h-10 w-10"
            title="فتح ملف الطالب"
          >
            <ExternalLink className="h-5 w-5" />
          </Button>
        </div>

        {/* Quick Actions Tabs */}
        <div className="flex gap-2 p-1 bg-muted rounded-xl">
          <Button
            variant={activeTab === 'positive' ? 'default' : 'ghost'}
            className={cn(
              "flex-1 h-12 gap-2 rounded-lg",
              activeTab === 'positive' && "bg-green-600 hover:bg-green-700"
            )}
            onClick={() => setActiveTab('positive')}
          >
            <ThumbsUp className="w-5 h-5" />
            إيجابي
          </Button>
          <Button
            variant={activeTab === 'negative' ? 'default' : 'ghost'}
            className={cn(
              "flex-1 h-12 gap-2 rounded-lg",
              activeTab === 'negative' && "bg-red-600 hover:bg-red-700"
            )}
            onClick={() => setActiveTab('negative')}
          >
            <ThumbsDown className="w-5 h-5" />
            سلبي
          </Button>
        </div>

        {/* Quick Options */}
        <div className="space-y-3">
          <Label className="text-muted-foreground">اختر ملاحظة سريعة</Label>
          <div className="grid grid-cols-2 gap-2">
            {(activeTab === 'positive' ? QUICK_POSITIVE : QUICK_NEGATIVE).map((option) => (
              <Button
                key={option}
                variant="outline"
                size="lg"
                disabled={saving}
                className={cn(
                  "h-14 text-sm justify-start px-4",
                  activeTab === 'positive' 
                    ? "border-green-200 bg-green-50 text-green-700 hover:bg-green-100 dark:bg-green-950/30 dark:border-green-800 dark:text-green-400"
                    : "border-red-200 bg-red-50 text-red-700 hover:bg-red-100 dark:bg-red-950/30 dark:border-red-800 dark:text-red-400"
                )}
                onClick={() => handleQuickNote(option, activeTab)}
              >
                {saving ? <Loader2 className="h-4 w-4 animate-spin ml-2" /> : null}
                {option}
              </Button>
            ))}
          </div>
        </div>

        {/* Divider */}
        <div className="relative py-2">
          <div className="absolute inset-0 flex items-center">
            <span className="w-full border-t" />
          </div>
          <div className="relative flex justify-center text-xs uppercase">
            <span className="bg-background px-3 text-muted-foreground">أو اكتب ملاحظة مخصصة</span>
          </div>
        </div>

        {/* Custom Note */}
        <div className="space-y-3">
          <RadioGroup
            value={noteType}
            onValueChange={(v) => setNoteType(v as 'positive' | 'negative' | 'note')}
            className="flex gap-4"
          >
            <div className="flex items-center gap-2">
              <RadioGroupItem value="positive" id="pos" />
              <Label htmlFor="pos" className="flex items-center gap-1 text-green-600">
                <Plus className="h-4 w-4" />
                إيجابي
              </Label>
            </div>
            <div className="flex items-center gap-2">
              <RadioGroupItem value="negative" id="neg" />
              <Label htmlFor="neg" className="flex items-center gap-1 text-red-600">
                <Minus className="h-4 w-4" />
                سلبي
              </Label>
            </div>
            <div className="flex items-center gap-2">
              <RadioGroupItem value="note" id="note" />
              <Label htmlFor="note" className="flex items-center gap-1">
                <MessageSquare className="h-4 w-4" />
                ملاحظة
              </Label>
            </div>
          </RadioGroup>

          <Textarea
            placeholder="اكتب الملاحظة هنا..."
            value={noteDescription}
            onChange={(e) => setNoteDescription(e.target.value)}
            className="min-h-[100px] text-base"
          />
        </div>

        <MobileSheetFooter>
          <Button 
            className="w-full h-14 text-lg" 
            onClick={handleCustomSave}
            disabled={saving || !noteDescription.trim()}
          >
            {saving ? <Loader2 className="h-5 w-5 animate-spin ml-2" /> : null}
            حفظ الملاحظة
          </Button>
        </MobileSheetFooter>
      </div>
    </MobileSheet>
  );
}
