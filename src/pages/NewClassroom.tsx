import { useState } from 'react';
import { MainLayout } from '@/components/layout/MainLayout';
import { useCreateClassroom } from '@/hooks/useClassrooms';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { ClassScheduleEditor, ClassSchedule } from '@/components/classrooms/ClassScheduleEditor';
import { ArrowRight, GraduationCap, Loader2 } from 'lucide-react';

const colorOptions = [
  { value: 'bg-primary', label: 'أزرق' },
  { value: 'bg-secondary', label: 'أخضر' },
  { value: 'bg-accent', label: 'بنفسجي' },
  { value: 'bg-warning', label: 'برتقالي' },
  { value: 'bg-destructive', label: 'أحمر' },
];

export default function NewClassroom() {
  const createClassroom = useCreateClassroom();
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    name: '',
    subject: '',
    schedule: '',
    color: 'bg-primary',
  });
  const [classSchedule, setClassSchedule] = useState<ClassSchedule>({});

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await createClassroom.mutateAsync({
      ...formData,
      class_schedule: classSchedule,
    });
    navigate('/classrooms');
  };

  return (
    <MainLayout>
      <div className="max-w-2xl mx-auto animate-fade-in">
        {/* Back button */}
        <Button 
          variant="ghost" 
          onClick={() => navigate(-1)}
          className="mb-6"
        >
          <ArrowRight className="w-4 h-4 ml-2" />
          رجوع
        </Button>

        {/* Form Card */}
        <div className="bg-card rounded-2xl border border-border p-6 lg:p-8 shadow-sm">
          <div className="flex items-center gap-4 mb-8">
            <div className="p-3 rounded-xl gradient-hero">
              <GraduationCap className="w-6 h-6 text-primary-foreground" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-foreground">صف دراسي جديد</h1>
              <p className="text-muted-foreground">أضف صفًا جديدًا لتبدأ بإدارته</p>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="name">اسم الصف</Label>
              <Input
                id="name"
                placeholder="مثال: الصف الأول - أ"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="subject">المادة الدراسية</Label>
              <Input
                id="subject"
                placeholder="مثال: الرياضيات"
                value={formData.subject}
                onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
                required
              />
            </div>

            {/* Schedule Editor */}
            <ClassScheduleEditor
              value={classSchedule}
              onChange={setClassSchedule}
            />

            <div className="space-y-2">
              <Label>لون الصف</Label>
              <div className="flex gap-3 flex-wrap">
                {colorOptions.map((color) => (
                  <button
                    key={color.value}
                    type="button"
                    onClick={() => setFormData({ ...formData, color: color.value })}
                    className={`w-10 h-10 rounded-full ${color.value} transition-all ${
                      formData.color === color.value 
                        ? 'ring-2 ring-offset-2 ring-primary scale-110' 
                        : 'hover:scale-105'
                    }`}
                    title={color.label}
                  />
                ))}
              </div>
            </div>

            <div className="flex gap-3 pt-4">
              <Button 
                type="submit" 
                className="flex-1 gradient-hero"
                disabled={createClassroom.isPending}
              >
                {createClassroom.isPending ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  'إنشاء الصف'
                )}
              </Button>
              <Button type="button" variant="outline" onClick={() => navigate(-1)}>
                إلغاء
              </Button>
            </div>
          </form>
        </div>
      </div>
    </MainLayout>
  );
}
