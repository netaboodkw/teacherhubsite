import { useState } from 'react';
import { MainLayout } from '@/components/layout/MainLayout';
import { useCreateStudent } from '@/hooks/useStudents';
import { useClassrooms } from '@/hooks/useClassrooms';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { StudentAvatarUpload } from '@/components/students/StudentAvatarUpload';
import { ArrowRight, Users, Loader2, HeartPulse } from 'lucide-react';

export default function NewStudent() {
  const createStudent = useCreateStudent();
  const { data: classrooms = [] } = useClassrooms();
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    name: '',
    student_id: '',
    classroom_id: '',
    notes: '',
    special_needs: false,
    avatar_url: '',
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await createStudent.mutateAsync(formData);
    navigate('/students');
  };

  const initials = formData.name
    .split(' ')
    .map(n => n[0])
    .join('')
    .slice(0, 2) || '؟';

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
              <Users className="w-6 h-6 text-primary-foreground" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-foreground">طالب جديد</h1>
              <p className="text-muted-foreground">أضف طالبًا جديدًا إلى صفوفك</p>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Avatar Upload */}
            <div className="flex flex-col items-center gap-2">
              <Label>صورة الطالب (اختياري)</Label>
              <StudentAvatarUpload
                studentId={`new-${Date.now()}`}
                currentAvatarUrl={formData.avatar_url || null}
                initials={initials}
                onUpload={(url) => setFormData({ ...formData, avatar_url: url })}
                size="lg"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="name">اسم الطالب</Label>
              <Input
                id="name"
                placeholder="الاسم الكامل"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="student_id">الرقم التعريفي</Label>
              <Input
                id="student_id"
                placeholder="مثال: STU001"
                value={formData.student_id}
                onChange={(e) => setFormData({ ...formData, student_id: e.target.value })}
                required
              />
            </div>

            <div className="space-y-2">
              <Label>الصف الدراسي</Label>
              <Select 
                value={formData.classroom_id} 
                onValueChange={(value) => setFormData({ ...formData, classroom_id: value })}
                required
              >
                <SelectTrigger>
                  <SelectValue placeholder="اختر الصف" />
                </SelectTrigger>
                <SelectContent>
                  {classrooms.map((classroom) => (
                    <SelectItem key={classroom.id} value={classroom.id}>
                      {classroom.name} - {classroom.subject}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Special Needs Toggle */}
            <div className="flex items-center justify-between p-4 rounded-lg border border-border bg-muted/30">
              <div className="flex items-center gap-3">
                <HeartPulse className="w-5 h-5 text-amber-500" />
                <div>
                  <Label htmlFor="special_needs" className="font-medium">احتياجات خاصة / يحتاج متابعة</Label>
                  <p className="text-sm text-muted-foreground">تفعيل هذا الخيار سيظهر أيقونة خاصة بجانب اسم الطالب</p>
                </div>
              </div>
              <Switch
                id="special_needs"
                checked={formData.special_needs}
                onCheckedChange={(checked) => setFormData({ ...formData, special_needs: checked })}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="notes">ملاحظات (اختياري)</Label>
              <Textarea
                id="notes"
                placeholder="ملاحظات خاصة بالطالب..."
                value={formData.notes}
                onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                rows={3}
              />
            </div>

            <div className="flex gap-3 pt-4">
              <Button 
                type="submit" 
                className="flex-1 gradient-hero"
                disabled={createStudent.isPending}
              >
                {createStudent.isPending ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  'إضافة الطالب'
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
