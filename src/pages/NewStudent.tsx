import { useState, useEffect } from 'react';
import { TeacherLayout } from '@/components/layout/TeacherLayout';
import { useCreateStudent } from '@/hooks/useStudents';
import { useClassrooms } from '@/hooks/useClassrooms';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { StudentAvatarUpload } from '@/components/students/StudentAvatarUpload';
import { ArrowRight, Users, Loader2, HeartPulse, Phone } from 'lucide-react';
import { toast } from 'sonner';

export default function NewStudent() {
  const createStudent = useCreateStudent();
  const { data: classrooms = [] } = useClassrooms();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const preselectedClassroomId = searchParams.get('classroomId');

  const [formData, setFormData] = useState({
    name: '',
    student_id: '',
    classroom_id: '',
    notes: '',
    special_needs: false,
    avatar_url: '',
    parent_name: '',
    parent_phone: '',
  });

  // Auto-select classroom if provided in URL
  useEffect(() => {
    if (preselectedClassroomId && classrooms.length > 0) {
      const classroomExists = classrooms.some(c => c.id === preselectedClassroomId);
      if (classroomExists) {
        setFormData(prev => ({ ...prev, classroom_id: preselectedClassroomId }));
      }
    }
  }, [preselectedClassroomId, classrooms]);

  // Generate unique student ID
  const generateStudentId = () => {
    const timestamp = Date.now().toString(36).toUpperCase();
    const random = Math.random().toString(36).substring(2, 5).toUpperCase();
    return `STU-${timestamp}-${random}`;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // التحقق من الحقول المطلوبة
    if (!formData.name.trim()) {
      toast.error('يجب إدخال اسم الطالب');
      return;
    }
    if (!formData.classroom_id) {
      toast.error('يجب اختيار الصف الدراسي');
      return;
    }
    
    // Generate student_id if not provided
    const studentData = {
      ...formData,
      student_id: formData.student_id.trim() || generateStudentId(),
    };

    try {
      await createStudent.mutateAsync(studentData);
      // Navigate back to classroom if came from there, otherwise to students list
      if (preselectedClassroomId) {
        navigate(`/teacher/classrooms/${preselectedClassroomId}`);
      } else {
        navigate('/teacher/students');
      }
    } catch (error) {
      // Error handled by hook
    }
  };

  const initials = formData.name
    .split(' ')
    .map(n => n[0])
    .join('')
    .slice(0, 2) || '؟';

  return (
    <TeacherLayout>
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
              <Label htmlFor="student_id">الرقم التعريفي (اختياري)</Label>
              <Input
                id="student_id"
                placeholder="سيتم توليده تلقائياً إذا تُرك فارغاً"
                value={formData.student_id}
                onChange={(e) => setFormData({ ...formData, student_id: e.target.value })}
              />
              <p className="text-xs text-muted-foreground">اتركه فارغاً للتوليد التلقائي</p>
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

            {/* Parent Information */}
            <div className="space-y-4 p-4 rounded-lg border border-border bg-muted/30">
              <div className="flex items-center gap-2 text-muted-foreground">
                <Phone className="w-4 h-4" />
                <span className="text-sm font-medium">بيانات ولي الأمر (اختياري)</span>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="parent_name">اسم ولي الأمر</Label>
                  <Input
                    id="parent_name"
                    placeholder="اسم ولي الأمر"
                    value={formData.parent_name}
                    onChange={(e) => setFormData({ ...formData, parent_name: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="parent_phone">رقم جوال ولي الأمر</Label>
                  <Input
                    id="parent_phone"
                    type="tel"
                    placeholder="05xxxxxxxx"
                    value={formData.parent_phone}
                    onChange={(e) => setFormData({ ...formData, parent_phone: e.target.value })}
                    dir="ltr"
                    className="text-left"
                  />
                </div>
              </div>
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
    </TeacherLayout>
  );
}
