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

// Pastel colors for classroom selection
const colorOptions = [
  { value: 'bg-blue-200', label: 'أزرق فاتح' },
  { value: 'bg-green-200', label: 'أخضر فاتح' },
  { value: 'bg-purple-200', label: 'بنفسجي فاتح' },
  { value: 'bg-orange-200', label: 'برتقالي فاتح' },
  { value: 'bg-pink-200', label: 'وردي فاتح' },
  { value: 'bg-yellow-200', label: 'أصفر فاتح' },
  { value: 'bg-teal-200', label: 'فيروزي فاتح' },
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
    sectionName: '', // e.g. "الثالث", "A"
    subject: '',
    schedule: '',
    color: 'bg-blue-200',
    education_level_id: '',
    grade_level_id: '',
    teacher_template_id: '',
  });
  const [classSchedule, setClassSchedule] = useState<ClassSchedule>({});
  const [initialized, setInitialized] = useState(false);

  // Extract section name from classroom name (e.g., "سادس - أول (رياضيات)" -> "أول")
  const extractSectionName = (name: string) => {
    const match = name.match(/- (.+?) \(/);
    return match ? match[1].trim() : '';
  };

  // Initialize form data from classroom
  useEffect(() => {
    if (classroom && !initialized) {
      setFormData({
        sectionName: extractSectionName(classroom.name || ''),
        subject: classroom.subject || '',
        schedule: classroom.schedule || '',
        color: classroom.color || 'bg-blue-200',
        education_level_id: classroom.education_level_id || teacherEducationLevelId,
        grade_level_id: classroom.grade_level_id || '',
        teacher_template_id: classroom.teacher_template_id || '',
      });
      setClassSchedule(classroom.class_schedule || {});
      setInitialized(true);
    }
  }, [classroom, teacherEducationLevelId, initialized]);

  // Generate classroom name from selected values
  const generateClassroomName = () => {
    const gradeLevel = gradeLevels?.find(g => g.id === formData.grade_level_id);
    const gradeName = gradeLevel?.name_ar || '';
    const sectionName = formData.sectionName.trim();
    const subjectName = formData.subject.trim();
    
    // If gradeLevels are still loading, return the original name
    if (!gradeName && gradeLevelsLoading) {
      return classroom?.name || '';
    }
    
    if (!gradeName) return '';
    
    let name = gradeName;
    if (sectionName) {
      name += ` - ${sectionName}`;
    }
    if (subjectName) {
      name += ` (${subjectName})`;
    }
    return name;
  };

  const classroomName = generateClassroomName();
  
  // Get a valid name for submission (never empty)
  const getSubmitName = () => {
    if (classroomName) return classroomName;
    // Fallback to original classroom name if available
    if (classroom?.name) return classroom.name;
    return 'فصل جديد';
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!classroomId) return;
    
    const submitName = getSubmitName();
    
    await updateClassroom.mutateAsync({
      id: classroomId,
      name: submitName,
      subject: formData.subject || 'مادة غير محددة',
      schedule: formData.schedule,
      color: formData.color,
      class_schedule: classSchedule,
      education_level_id: formData.education_level_id || null,
      subject_id: null,
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

            {/* Section Name */}
            <div className="space-y-2">
              <Label htmlFor="sectionName">اسم الشعبة <span className="text-destructive">*</span></Label>
              <Input
                id="sectionName"
                placeholder="مثال: الثالث، A، ب"
                value={formData.sectionName}
                onChange={(e) => setFormData({ ...formData, sectionName: e.target.value })}
                className="text-lg"
              />
              <p className="text-xs text-muted-foreground">
                أدخل اسم أو رقم الشعبة للتمييز بين الفصول
              </p>
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

            {/* Preview of classroom name */}
            <div className="p-4 bg-primary/5 border border-primary/20 rounded-lg space-y-3">
              <div>
                <Label className="text-xs text-muted-foreground">مثال:</Label>
                <div className="flex items-center gap-2 mt-1 text-sm flex-wrap">
                  <span className="text-muted-foreground">الصف:</span>
                  <Badge variant="outline">الأول</Badge>
                  <span className="text-muted-foreground">الشعبة:</span>
                  <Badge variant="outline">الثالث</Badge>
                  <span className="text-muted-foreground">المادة:</span>
                  <Badge variant="outline">رياضيات</Badge>
                </div>
                <p className="text-xs text-muted-foreground mt-2">النتيجة: <span className="font-semibold text-foreground">أولى - ثالث (رياضيات)</span></p>
              </div>
              
              <div className="border-t pt-3">
                <Label className="text-sm text-muted-foreground">اسم الصف الكامل:</Label>
                <p className="text-xl font-bold text-primary mt-1">
                  {classroomName || 'اختر الصف والشعبة لمعاينة الاسم'}
                </p>
              </div>
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
