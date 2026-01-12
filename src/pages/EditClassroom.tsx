import { useState, useEffect } from 'react';
import { TeacherLayout } from '@/components/layout/TeacherLayout';
import { useClassroom, useUpdateClassroom } from '@/hooks/useClassrooms';
import { useGradeLevels } from '@/hooks/useGradeLevels';
import { useProfile } from '@/hooks/useProfile';
import { useEducationLevels } from '@/hooks/useEducationLevels';
import { useTeacherTemplates } from '@/hooks/useTeacherTemplates';
import { useNavigate, useParams, Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ClassScheduleEditor, ClassSchedule } from '@/components/classrooms/ClassScheduleEditor';
import { ArrowRight, GraduationCap, Loader2, Settings, LayoutGrid, Plus } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';

const colorOptions = [
  { value: 'bg-primary', label: 'أزرق' },
  { value: 'bg-secondary', label: 'أخضر' },
  { value: 'bg-accent', label: 'بنفسجي' },
  { value: 'bg-warning', label: 'برتقالي' },
  { value: 'bg-destructive', label: 'أحمر' },
];

export default function EditClassroom() {
  const { classroomId } = useParams<{ classroomId: string }>();
  const { data: classroom, isLoading: classroomLoading } = useClassroom(classroomId || '');
  const updateClassroom = useUpdateClassroom();
  const navigate = useNavigate();
  const { profile, isLoading: profileLoading } = useProfile();
  const { data: educationLevels } = useEducationLevels();
  const { data: teacherTemplates = [] } = useTeacherTemplates();
  
  const teacherEducationLevelId = profile?.education_level_id || '';
  const teacherEducationLevel = educationLevels?.find(l => l.id === teacherEducationLevelId);
  
  const { data: gradeLevels, isLoading: gradeLevelsLoading } = useGradeLevels(teacherEducationLevelId || undefined);
  
  const [formData, setFormData] = useState({
    name: '',
    subject: '',
    schedule: '',
    color: 'bg-primary',
    education_level_id: '',
    grade_level_id: '',
    teacher_template_id: '',
  });
  const [classSchedule, setClassSchedule] = useState<ClassSchedule>({});
  const [initialized, setInitialized] = useState(false);

  // Initialize form data from classroom
  useEffect(() => {
    if (classroom && !initialized) {
      setFormData({
        name: classroom.name || '',
        subject: classroom.subject || '',
        schedule: classroom.schedule || '',
        color: classroom.color || 'bg-primary',
        education_level_id: classroom.education_level_id || teacherEducationLevelId,
        grade_level_id: classroom.grade_level_id || '',
        teacher_template_id: classroom.teacher_template_id || '',
      });
      setClassSchedule(classroom.class_schedule || {});
      setInitialized(true);
    }
  }, [classroom, teacherEducationLevelId, initialized]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!classroomId) return;
    
    await updateClassroom.mutateAsync({
      id: classroomId,
      name: formData.name,
      subject: formData.subject || 'مادة غير محددة',
      schedule: formData.schedule,
      color: formData.color,
      class_schedule: classSchedule,
      education_level_id: formData.education_level_id || null,
      subject_id: null, // No longer using subject_id
      grade_level_id: formData.grade_level_id || null,
      teacher_template_id: formData.teacher_template_id || null,
    });
    navigate(`/teacher/classrooms/${classroomId}`);
  };

  if (profileLoading || classroomLoading) {
    return (
      <TeacherLayout>
        <div className="flex items-center justify-center h-64">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </TeacherLayout>
    );
  }

  if (!classroom) {
    return (
      <TeacherLayout>
        <div className="flex items-center justify-center h-64">
          <p className="text-muted-foreground">الصف غير موجود</p>
        </div>
      </TeacherLayout>
    );
  }

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
              <Settings className="w-6 h-6 text-primary-foreground" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-foreground">تعديل الصف</h1>
              <p className="text-muted-foreground">تحديث إعدادات الصف الدراسي</p>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Education Level - Read Only */}
            <div className="space-y-2">
              <Label>المرحلة التعليمية</Label>
              <div className="flex items-center gap-2 p-3 bg-muted rounded-lg border">
                <GraduationCap className="h-4 w-4 text-muted-foreground" />
                <span className="font-medium">{teacherEducationLevel?.name_ar || 'غير محدد'}</span>
                <Badge variant="secondary" className="mr-auto">ثابت</Badge>
              </div>
            </div>

            {/* Grade Level */}
            <div className="space-y-2">
              <Label>الصف الدراسي</Label>
              <Select 
                value={formData.grade_level_id} 
                onValueChange={(value) => setFormData(prev => ({ ...prev, grade_level_id: value }))}
                disabled={!teacherEducationLevelId}
              >
                <SelectTrigger>
                  <SelectValue placeholder={
                    gradeLevelsLoading ? "جاري التحميل..." : 
                    gradeLevels?.length === 0 ? "لا توجد صفوف" :
                    "اختر الصف"
                  } />
                </SelectTrigger>
                <SelectContent>
                  {gradeLevels?.map((grade) => (
                    <SelectItem key={grade.id} value={grade.id}>
                      {grade.name_ar}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Classroom Name */}
            <div className="space-y-2">
              <Label htmlFor="name">اسم الفصل</Label>
              <Input
                id="name"
                placeholder="مثال: سادس - أول (رياضيات)"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                required
              />
            </div>

            {/* Subject Name */}
            <div className="space-y-2">
              <Label htmlFor="subject">المادة الدراسية</Label>
              <Input
                id="subject"
                placeholder="مثال: رياضيات، علوم، لغة عربية"
                value={formData.subject}
                onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
              />
            </div>

            {/* Teacher Template Selection */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label>قالب الدرجات (اختياري)</Label>
                <Link 
                  to="/teacher/templates" 
                  className="text-xs text-primary hover:underline flex items-center gap-1"
                >
                  <Plus className="h-3 w-3" />
                  إنشاء قالب
                </Link>
              </div>
              
              {teacherTemplates.length === 0 ? (
                <Alert>
                  <LayoutGrid className="h-4 w-4" />
                  <AlertDescription>
                    لا توجد قوالب خاصة بك.{' '}
                    <Link to="/teacher/templates" className="text-primary hover:underline">
                      إنشاء قالب جديد
                    </Link>
                  </AlertDescription>
                </Alert>
              ) : (
                <Select 
                  value={formData.teacher_template_id} 
                  onValueChange={(value) => setFormData(prev => ({ ...prev, teacher_template_id: value === 'none' ? '' : value }))}
                >
                  <SelectTrigger>
                    <LayoutGrid className="h-4 w-4 text-muted-foreground ml-2" />
                    <SelectValue placeholder="بدون قالب" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">بدون قالب</SelectItem>
                    {teacherTemplates.filter(t => t.is_active).map((template) => (
                      <SelectItem key={template.id} value={template.id}>
                        {template.name_ar}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            </div>

            {/* Schedule Editor */}
            <ClassScheduleEditor
              value={classSchedule}
              onChange={setClassSchedule}
            />

            <div className="space-y-2">
              <Label>لون الفصل</Label>
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
                disabled={updateClassroom.isPending}
              >
                {updateClassroom.isPending ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  'حفظ التغييرات'
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
