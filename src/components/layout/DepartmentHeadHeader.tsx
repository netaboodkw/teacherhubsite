import { Menu, User } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useSupervisedTeachers } from '@/hooks/useDepartmentHeads';
import { useDepartmentHeadContext } from '@/contexts/DepartmentHeadContext';
import { Badge } from '@/components/ui/badge';
import { NotificationBell } from '@/components/notifications/NotificationBell';

interface DepartmentHeadHeaderProps {
  onMenuClick: () => void;
  showTeacherSelector?: boolean;
}

export function DepartmentHeadHeader({ onMenuClick, showTeacherSelector = true }: DepartmentHeadHeaderProps) {
  const { data: teachers = [], isLoading } = useSupervisedTeachers();
  const { selectedTeacherId, setSelectedTeacherId } = useDepartmentHeadContext();

  const selectedTeacher = teachers.find((t: any) => t.user_id === selectedTeacherId);

  return (
    <header className="sticky top-0 z-30 bg-card border-b border-border">
      <div className="flex items-center justify-between px-4 py-3">
        <div className="flex items-center gap-3">
          <Button
            variant="ghost"
            size="icon"
            className="lg:hidden"
            onClick={onMenuClick}
          >
            <Menu className="h-5 w-5" />
          </Button>
          
          <Badge variant="outline" className="bg-amber-500/10 text-amber-600 border-amber-500/30">
            وضع المشاهدة فقط
          </Badge>
          
          <NotificationBell />
        </div>

        {/* Teacher Selector */}
        {showTeacherSelector && (
          <div className="flex items-center gap-3">
            <span className="text-sm text-muted-foreground hidden sm:block">اختر المعلم:</span>
            <Select
              value={selectedTeacherId || ''}
              onValueChange={(value) => setSelectedTeacherId(value || null)}
              disabled={isLoading || teachers.length === 0}
            >
              <SelectTrigger className="w-[200px] sm:w-[250px]">
                <SelectValue placeholder={isLoading ? "جاري التحميل..." : "اختر معلماً"}>
                  {selectedTeacher && (
                    <div className="flex items-center gap-2">
                      <Avatar className="h-6 w-6">
                        <AvatarImage src={selectedTeacher.avatar_url || undefined} />
                        <AvatarFallback className="text-xs">
                          <User className="h-3 w-3" />
                        </AvatarFallback>
                      </Avatar>
                      <span className="truncate">{selectedTeacher.full_name}</span>
                    </div>
                  )}
                </SelectValue>
              </SelectTrigger>
              <SelectContent>
                {teachers.map((teacher: any) => (
                  <SelectItem key={teacher.user_id} value={teacher.user_id}>
                    <div className="flex items-center gap-2">
                      <Avatar className="h-6 w-6">
                        <AvatarImage src={teacher.avatar_url || undefined} />
                        <AvatarFallback className="text-xs">
                          <User className="h-3 w-3" />
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex flex-col">
                        <span>{teacher.full_name}</span>
                        {teacher.subject && (
                          <span className="text-xs text-muted-foreground">{teacher.subject}</span>
                        )}
                      </div>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        )}
      </div>
    </header>
  );
}
