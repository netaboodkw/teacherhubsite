import { useState, useCallback, memo, useRef, useEffect } from 'react';
import { Input } from '@/components/ui/input';
import { Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';

interface MobileGradeCellProps {
  value: number | null;
  maxScore: number;
  onSave: (score: number) => Promise<void>;
  isEditable?: boolean;
  className?: string;
}

export const MobileGradeCell = memo(function MobileGradeCell({
  value,
  maxScore,
  onSave,
  isEditable = true,
  className
}: MobileGradeCellProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [inputValue, setInputValue] = useState('');
  const [saving, setSaving] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const debounceRef = useRef<NodeJS.Timeout>();

  useEffect(() => {
    if (isEditing && inputRef.current) {
      inputRef.current.focus();
      inputRef.current.select();
    }
  }, [isEditing]);

  const handleClick = () => {
    if (!isEditable || saving) return;
    setInputValue(value !== null ? String(value) : '');
    setIsEditing(true);
  };

  const handleSave = useCallback(async (newValue: string) => {
    const score = parseFloat(newValue);
    
    if (isNaN(score) || score < 0 || score > maxScore) {
      setIsEditing(false);
      return;
    }
    
    // If same value, just close
    if (value === score) {
      setIsEditing(false);
      return;
    }
    
    setSaving(true);
    setIsEditing(false);
    
    try {
      await onSave(score);
    } finally {
      setSaving(false);
    }
  }, [value, maxScore, onSave]);

  const handleBlur = () => {
    if (debounceRef.current) {
      clearTimeout(debounceRef.current);
    }
    handleSave(inputValue);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      inputRef.current?.blur();
    } else if (e.key === 'Escape') {
      setIsEditing(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value.replace(/[^\d.]/g, '');
    setInputValue(val);
  };

  const getColor = () => {
    if (value === null) return 'bg-muted/30 text-muted-foreground';
    const percentage = (value / maxScore) * 100;
    if (percentage >= 90) return 'bg-success/20 text-success';
    if (percentage >= 70) return 'bg-primary/20 text-primary';
    if (percentage >= 50) return 'bg-warning/20 text-warning';
    return 'bg-destructive/20 text-destructive';
  };

  if (isEditing) {
    return (
      <Input
        ref={inputRef}
        type="text"
        inputMode="decimal"
        value={inputValue}
        onChange={handleChange}
        onBlur={handleBlur}
        onKeyDown={handleKeyDown}
        className={cn(
          "w-12 h-10 p-0 text-center text-sm font-bold border-primary",
          className
        )}
      />
    );
  }

  return (
    <button
      onClick={handleClick}
      disabled={!isEditable || saving}
      className={cn(
        "w-12 h-10 rounded-md flex items-center justify-center text-sm font-bold transition-all",
        "hover:scale-105 active:scale-95 touch-manipulation",
        isEditable ? "cursor-pointer" : "cursor-default",
        getColor(),
        className
      )}
    >
      {saving ? (
        <Loader2 className="h-3 w-3 animate-spin" />
      ) : (
        value !== null ? value : '-'
      )}
    </button>
  );
});
