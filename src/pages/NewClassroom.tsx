import { useState, useEffect } from 'react';
import { TeacherLayout } from '@/components/layout/TeacherLayout';
import { useCreateClassroom } from '@/hooks/useClassrooms';
import { useGradeLevels } from '@/hooks/useGradeLevels';
import { useProfile } from '@/hooks/useProfile';
import { useEducationLevels } from '@/hooks/useEducationLevels';
import { useTeacherTemplates } from '@/hooks/useTeacherTemplates';
import { useNavigate, Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ClassScheduleEditor, ClassSchedule } from '@/components/classrooms/ClassScheduleEditor';
import { ArrowRight, GraduationCap, Loader2, LayoutGrid, Plus, AlertTriangle } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Card, CardContent } from '@/components/ui/card';

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

export default function NewClassroom() {
  const createClassroom = useCreateClassroom();
  const navigate = useNavigate();
  const { profile, isLoading: profileLoading } = useProfile();
  const { data: educationLevels } = useEducationLevels();
  const { data: teacherTemplates = [] } = useTeacherTemplates();
  
  // Teacher's education level is fixed from their profile
  const teacherEducationLevelId = profile?.education_level_id || '';
  const teacherEducationLevel = educationLevels?.find(l => l.id === teacherEducationLevelId);
  
  const { data: gradeLevels, isLoading: gradeLevelsLoading } = useGradeLevels(teacherEducationLevelId || undefined);
  
  const [formData, setFormData] = useState({
    sectionName: '', // e.g. "أول", "ثاني", "أ", "ب"
    subject: '', // e.g. "رياضيات", "علوم"
    schedule: '',
    color: 'bg-primary',
    education_level_id: '',
    grade_level_id: '',
    teacher_template_id: '',
  });
  const [classSchedule, setClassSchedule] = useState<ClassSchedule>({});

  // Set education level from profile
  useEffect(() => {
    if (teacherEducationLevelId) {
      setFormData(prev => ({ ...prev, education_level_id: teacherEducationLevelId }));
    }
  }, [teacherEducationLevelId]);

  // Generate classroom name from selected values
  const generateClassroomName = () => {
    const gradeLevel = gradeLevels?.find(g => g.id === formData.grade_level_id);
    const gradeName = gradeLevel?.name_ar || '';
    const sectionName = formData.sectionName.trim();
    const subjectName = formData.subject.trim();
    
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
  
  // Validate that we have a proper name before allowing submission
  const canSubmit = !gradeLevelsLoading && formData.grade_level_id && classroomName;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!canSubmit) {
      return;
    }
    
    await createClassroom.mutateAsync({
      name: classroomName,
      subject: formData.subject || 'مادة غير محددة',
      schedule: formData.schedule,
      color: formData.color,
      class_schedule: classSchedule,
      education_level_id: formData.education_level_id || null,
      subject_id: null,
      grade_level_id: formData.grade_level_id || null,
      teacher_template_id: formData.teacher_template_id || null,
    });
    navigate('/teacher/classrooms');
  };

  if (profileLoading) {
    return (
      <TeacherLayout>
        <div className="flex items-center justify-center h-64">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </TeacherLayout>
    );
  }

  // Check if teacher has no education level set
  if (!teacherEducationLevelId) {
    return (
      <TeacherLayout>
        <div className="max-w-2xl mx-auto animate-fade-in">
          <Button 
            variant="ghost" 
            onClick={() => navigate(-1)}
            className="mb-6"
          >
            <ArrowRight className="w-4 h-4 ml-2" />
            رجوع
          </Button>

          <Card className="border-destructive/50 bg-destructive/5">
            <CardContent className="p-6">
              <div className="flex items-start gap-4">
                <div className="p-3 rounded-xl bg-destructive/10">
                  <AlertTriangle className="w-6 h-6 text-destructive" />
                </div>
                <div className="flex-1">
                  <h2 className="text-xl font-bold text-destructive mb-2">
                    المرحلة التعليمية غير محددة
                  </h2>
                  <p className="text-muted-foreground mb-4">
                    يجب تحديد المرحلة التعليمية في ملفك الشخصي قبل إنشاء فصول جديدة.
                    هذا ضروري لربط الفصل بالصفوف الدراسية المناسبة.
                  </p>
                  <Button 
                    onClick={() => navigate('/teacher/settings')}
                    className="gradient-hero"
                  >
                    <GraduationCap className="w-4 h-4 ml-2" />
                    الذهاب للإعدادات
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
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
              <GraduationCap className="w-6 h-6 text-primary-foreground" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-foreground">صف دراسي جديد</h1>
              <p className="text-muted-foreground">أضف صفًا جديدًا لتبدأ بإدارته</p>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Education Level - Read Only (from teacher profile) */}
            <div className="space-y-2">
              <Label>المرحلة التعليمية</Label>
              <div className="flex items-center gap-2 p-3 bg-muted rounded-lg border">
                <GraduationCap className="h-4 w-4 text-muted-foreground" />
                <span className="font-medium">{teacherEducationLevel?.name_ar || 'غير محدد'}</span>
                <Badge variant="secondary" className="mr-auto">ثابت</Badge>
              </div>
              <p className="text-xs text-muted-foreground">
                المرحلة التعليمية محددة من ملفك الشخصي ولا يمكن تغييرها
              </p>
            </div>

            {/* Grade Level */}
            <div className="space-y-2">
              <Label>الصف الدراسي <span className="text-destructive">*</span></Label>
              <Select 
                value={formData.grade_level_id} 
                onValueChange={(value) => setFormData(prev => ({ ...prev, grade_level_id: value }))}
                disabled={!teacherEducationLevelId}
              >
                <SelectTrigger>
                  <SelectValue placeholder={
                    !teacherEducationLevelId ? "يجب تحديد المرحلة أولاً" : 
                    gradeLevelsLoading ? "جاري التحميل..." : 
                    gradeLevels?.length === 0 ? "لا توجد صفوف" :
                    "اختر الصف (مثال: سادس)"
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
                <div className="flex items-center gap-2 mt-1 text-sm">
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

            {/* Schedule Editor */}
            <ClassScheduleEditor
              value={classSchedule}
              onChange={setClassSchedule}
            />

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
                    {teacherTemplates.map((template) => (
                      <SelectItem key={template.id} value={template.id}>
                        {template.name_ar}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
              <p className="text-xs text-muted-foreground">
                يمكنك اختيار قالب درجات خاص بك لهذا الفصل
              </p>
            </div>

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
                disabled={createClassroom.isPending || !teacherEducationLevelId || !formData.grade_level_id}
              >
                {createClassroom.isPending ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  'إنشاء الفصل'
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
