import { useRef, useState, useEffect } from 'react';
import { User, GripVertical, Check, X, Clock, FileText } from 'lucide-react';
import { cn } from '@/lib/utils';

interface Student {
  id: string;
  name: string;
  avatar_url: string | null;
}

interface AttendanceRecord {
  student_id: string;
  status: 'present' | 'absent' | 'late' | 'excused';
}

interface GlassDraggableStudentProps {
  student: Student;
  position: { x: number; y: number };
  isArrangeMode: boolean;
  onPositionChange: (studentId: string, x: number, y: number) => void;
  onTap: (student: Student) => void;
  getShortName: (name: string) => string;
  containerRef: React.RefObject<HTMLDivElement>;
}

export function GlassDraggableStudent({ 
  student, 
  position, 
  isArrangeMode, 
  onPositionChange, 
  onTap, 
  getShortName,
  containerRef,
}: GlassDraggableStudentProps) {
  const [isDragging, setIsDragging] = useState(false);
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });
  const nodeRef = useRef<HTMLDivElement>(null);

  const handleDragStart = (clientX: number, clientY: number) => {
    if (!isArrangeMode || !nodeRef.current) return;
    
    const rect = nodeRef.current.getBoundingClientRect();
    setDragOffset({
      x: clientX - rect.left,
      y: clientY - rect.top
    });
    setIsDragging(true);
  };

  const handleDrag = (clientX: number, clientY: number) => {
    if (!isDragging || !containerRef.current) return;
    
    const containerRect = containerRef.current.getBoundingClientRect();
    const nodeWidth = nodeRef.current?.offsetWidth || 100;
    const nodeHeight = nodeRef.current?.offsetHeight || 120;
    
    let newX = clientX - containerRect.left - dragOffset.x;
    let newY = clientY - containerRect.top - dragOffset.y;
    
    newX = Math.max(0, Math.min(newX, containerRect.width - nodeWidth));
    newY = Math.max(0, Math.min(newY, containerRect.height - nodeHeight));
    
    onPositionChange(student.id, newX, newY);
  };

  const handleDragEnd = () => {
    setIsDragging(false);
  };

  const handleMouseDown = (e: React.MouseEvent) => {
    if (!isArrangeMode) return;
    e.preventDefault();
    handleDragStart(e.clientX, e.clientY);
  };

  const handleTouchStart = (e: React.TouchEvent) => {
    if (!isArrangeMode) return;
    const touch = e.touches[0];
    handleDragStart(touch.clientX, touch.clientY);
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (!isDragging) return;
    e.preventDefault();
    const touch = e.touches[0];
    handleDrag(touch.clientX, touch.clientY);
  };

  useEffect(() => {
    if (!isDragging) return;

    const handleMouseMove = (e: MouseEvent) => {
      handleDrag(e.clientX, e.clientY);
    };

    const handleMouseUp = () => {
      handleDragEnd();
    };

    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleMouseUp);

    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isDragging, dragOffset]);

  return (
    <div
      ref={nodeRef}
      style={{
        position: 'absolute',
        left: position.x,
        top: position.y,
        zIndex: isDragging ? 100 : 1,
        cursor: isArrangeMode ? (isDragging ? 'grabbing' : 'grab') : 'pointer',
        touchAction: isArrangeMode ? 'none' : 'auto',
      }}
      className={cn(
        "flex flex-col items-center p-3 rounded-2xl select-none transition-all",
        "glass-card",
        isDragging 
          ? 'shadow-xl scale-105 ring-2 ring-primary/50' 
          : 'hover:shadow-lg'
      )}
      onClick={() => !isArrangeMode && !isDragging && onTap(student)}
      onMouseDown={handleMouseDown}
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleDragEnd}
    >
      {isArrangeMode && (
        <div className="absolute -top-2 -right-2 p-2 bg-primary text-primary-foreground rounded-full z-10 shadow-lg">
          <GripVertical className="h-4 w-4" />
        </div>
      )}
      <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-full bg-primary/10 flex items-center justify-center overflow-hidden mb-2 backdrop-blur-sm">
        {student.avatar_url ? (
          <img
            src={student.avatar_url}
            alt={student.name}
            className="w-full h-full object-cover"
            draggable={false}
          />
        ) : (
          <User className="h-8 w-8 sm:h-10 sm:w-10 text-primary" />
        )}
      </div>
      <p className="text-sm text-center font-medium truncate w-full leading-tight px-1 max-w-[90px]">
        {getShortName(student.name)}
      </p>
    </div>
  );
}

interface GlassAttendanceStudentProps {
  student: Student;
  status: AttendanceRecord['status'] | null;
  onTap: (student: Student) => void;
  getShortName: (name: string) => string;
}

export function GlassAttendanceStudent({ student, status, onTap, getShortName }: GlassAttendanceStudentProps) {
  const getAttendanceIcon = (status: AttendanceRecord['status'] | null) => {
    switch (status) {
      case 'present': return <Check className="h-4 w-4 sm:h-5 sm:w-5 text-green-600" />;
      case 'absent': return <X className="h-4 w-4 sm:h-5 sm:w-5 text-red-600" />;
      case 'late': return <Clock className="h-4 w-4 sm:h-5 sm:w-5 text-yellow-600" />;
      case 'excused': return <FileText className="h-4 w-4 sm:h-5 sm:w-5 text-blue-600" />;
      default: return null;
    }
  };

  const getAttendanceStyle = (status: AttendanceRecord['status'] | null) => {
    switch (status) {
      case 'present': return 'ring-2 ring-green-500/50 bg-green-500/10';
      case 'absent': return 'ring-2 ring-red-500/50 bg-red-500/10';
      case 'late': return 'ring-2 ring-yellow-500/50 bg-yellow-500/10';
      case 'excused': return 'ring-2 ring-blue-500/50 bg-blue-500/10';
      default: return '';
    }
  };

  return (
    <div
      className={cn(
        "flex flex-col items-center p-3 rounded-2xl cursor-pointer transition-all",
        "glass-card-interactive active:scale-95",
        getAttendanceStyle(status)
      )}
      onClick={() => onTap(student)}
    >
      <div className="relative w-14 h-14 sm:w-16 sm:h-16 rounded-full bg-primary/10 flex items-center justify-center overflow-hidden mb-2 backdrop-blur-sm">
        {student.avatar_url ? (
          <img
            src={student.avatar_url}
            alt={student.name}
            className="w-full h-full object-cover"
          />
        ) : (
          <User className="h-7 w-7 sm:h-8 sm:w-8 text-primary" />
        )}
        {status && (
          <div className="absolute -bottom-1 -right-1 bg-background/80 backdrop-blur-sm rounded-full p-0.5 shadow-lg">
            {getAttendanceIcon(status)}
          </div>
        )}
      </div>
      <p className="text-sm text-center font-medium truncate w-full leading-tight">
        {getShortName(student.name)}
      </p>
    </div>
  );
}

interface GlassStudentIconProps {
  student: Student & { special_needs?: boolean; notes?: string | null };
  onTap: (student: Student) => void;
  getShortName: (name: string) => string;
  showBadges?: boolean;
  badges?: React.ReactNode;
  notesCount?: number;
  hasNotes?: boolean;
}

export function GlassStudentIcon({ 
  student, 
  onTap, 
  getShortName, 
  showBadges,
  badges,
  notesCount = 0,
  hasNotes = false,
}: GlassStudentIconProps) {
  return (
    <div
      className={cn(
        "relative flex flex-col items-center p-3 rounded-2xl cursor-pointer transition-all",
        "glass-card-interactive active:scale-95"
      )}
      onClick={() => onTap(student)}
    >
      {/* Status Icons */}
      <div className="absolute -top-1 right-0 flex gap-0.5">
        {student.special_needs && (
          <div className="p-0.5 bg-amber-500/20 backdrop-blur-sm rounded-full">
            <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-amber-600 dark:text-amber-400">
              <path d="M19 14c1.49-1.46 3-3.21 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.76 0-3 .5-4.5 2-1.5-1.5-2.74-2-4.5-2A5.5 5.5 0 0 0 2 8.5c0 2.3 1.5 4.05 3 5.5l7 7Z"/>
              <path d="M3.22 12H9.5l.5-1 2 4.5 2-7 1.5 3.5h5.27"/>
            </svg>
          </div>
        )}
        {hasNotes && (
          <div className="p-0.5 bg-blue-500/20 backdrop-blur-sm rounded-full">
            <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-blue-600 dark:text-blue-400">
              <path d="M16 3H5a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V8Z"/>
              <path d="M15 3v4a2 2 0 0 0 2 2h4"/>
            </svg>
          </div>
        )}
        {student.notes && (
          <div className="p-0.5 bg-purple-500/20 backdrop-blur-sm rounded-full">
            <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-purple-600 dark:text-purple-400">
              <path d="M7.9 20A9 9 0 1 0 4 16.1L2 22Z"/>
            </svg>
          </div>
        )}
      </div>

      <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-full bg-primary/10 flex items-center justify-center overflow-hidden mb-2 mt-1 backdrop-blur-sm">
        {student.avatar_url ? (
          <img
            src={student.avatar_url}
            alt={student.name}
            className="w-full h-full object-cover"
          />
        ) : (
          <User className="h-8 w-8 sm:h-10 sm:w-10 text-primary" />
        )}
      </div>
      <p className="text-sm text-center font-medium truncate w-full leading-tight max-w-[90px]">
        {getShortName(student.name)}
      </p>
      {showBadges && badges && (
        <div className="mt-1">
          {badges}
        </div>
      )}
    </div>
  );
}
