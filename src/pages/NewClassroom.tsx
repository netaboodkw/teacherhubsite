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
import { Switch } from '@/components/ui/switch';
import { ClassScheduleEditor, ClassSchedule } from '@/components/classrooms/ClassScheduleEditor';
import { ArrowRight, GraduationCap, Loader2, LayoutGrid, Plus, AlertTriangle, Trophy, BarChart3, Award } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Card, CardContent } from '@/components/ui/card';

// Colors for classroom selection (hex values for proper display)
const colorOptions = [
  { value: '#3b82f6', label: 'أزرق', bg: 'bg-blue-500' },
  { value: '#22c55e', label: 'أخضر', bg: 'bg-green-500' },
  { value: '#a855f7', label: 'بنفسجي', bg: 'bg-purple-500' },
  { value: '#f97316', label: 'برتقالي', bg: 'bg-orange-500' },
  { value: '#ec4899', label: 'وردي', bg: 'bg-pink-500' },
  { value: '#eab308', label: 'أصفر', bg: 'bg-yellow-500' },
  { value: '#14b8a6', label: 'فيروزي', bg: 'bg-teal-500' },
  { value: '#ef4444', label: 'أحمر', bg: 'bg-red-500' },
  { value: '#6366f1', label: 'نيلي', bg: 'bg-indigo-500' },
  { value: '#06b6d4', label: 'سماوي', bg: 'bg-cyan-500' },
  { value: '#84cc16', label: 'ليموني', bg: 'bg-lime-500' },
  { value: '#f43f5e', label: 'قرمزي', bg: 'bg-rose-500' },
  { value: '#8b5cf6', label: 'بنفسجي غامق', bg: 'bg-violet-500' },
  { value: '#0ea5e9', label: 'أزرق فاتح', bg: 'bg-sky-500' },
  { value: '#10b981', label: 'زمردي', bg: 'bg-emerald-500' },
  { value: '#f59e0b', label: 'كهرماني', bg: 'bg-amber-500' },
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
    color: '#3b82f6',
    education_level_id: '',
    grade_level_id: '',
    teacher_template_id: '',
    show_badges: true,
    show_leaderboard: true,
    show_stats_banner: true,
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
      show_badges: formData.show_badges,
      show_leaderboard: formData.show_leaderboard,
      show_stats_banner: formData.show_stats_banner,
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
            <div className="p-3 rounded-xl bg-primary">
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

            {/* Display Settings */}
            <div className="space-y-4 border-t pt-6">
              <Label className="text-base font-semibold">إعدادات العرض</Label>
              
              <div className="space-y-4">
                <div className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                  <div className="flex items-center gap-2">
                    <BarChart3 className="h-4 w-4 text-muted-foreground" />
                    <div>
                      <Label>إظهار شريط الإحصائيات</Label>
                      <p className="text-xs text-muted-foreground">رسالة اليوم ونسبة التفاعل والطالب المتميز</p>
                    </div>
                  </div>
                  <Switch
                    checked={formData.show_stats_banner}
                    onCheckedChange={(checked) => setFormData({ ...formData, show_stats_banner: checked })}
                  />
                </div>

                <div className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                  <div className="flex items-center gap-2">
                    <Trophy className="h-4 w-4 text-muted-foreground" />
                    <div>
                      <Label>إظهار جدول المتميزين</Label>
                      <p className="text-xs text-muted-foreground">ترتيب أفضل 5 طلاب أسبوعياً</p>
                    </div>
                  </div>
                  <Switch
                    checked={formData.show_leaderboard}
                    onCheckedChange={(checked) => setFormData({ ...formData, show_leaderboard: checked })}
                  />
                </div>

                <div className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                  <div className="flex items-center gap-2">
                    <Award className="h-4 w-4 text-muted-foreground" />
                    <div>
                      <Label>إظهار الشارات والميداليات</Label>
                      <p className="text-xs text-muted-foreground">شارات الإنجازات تحت صورة الطالب</p>
                    </div>
                  </div>
                  <Switch
                    checked={formData.show_badges}
                    onCheckedChange={(checked) => setFormData({ ...formData, show_badges: checked })}
                  />
                </div>
              </div>
            </div>

            <div className="space-y-2">
              <Label>لون الفصل</Label>
              <div className="flex gap-2 flex-wrap items-center">
                {colorOptions.map((color) => (
                  <button
                    key={color.value}
                    type="button"
                    onClick={() => setFormData({ ...formData, color: color.value })}
                    className={`w-9 h-9 rounded-full transition-all ${
                      formData.color === color.value 
                        ? 'ring-2 ring-offset-2 ring-primary scale-110' 
                        : 'hover:scale-105'
                    }`}
                    style={{ backgroundColor: color.value }}
                    title={color.label}
                  />
                ))}
                {/* Custom Color Picker */}
                <div className="relative">
                  <input
                    type="color"
                    value={formData.color}
                    onChange={(e) => setFormData({ ...formData, color: e.target.value })}
                    className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                    title="اختر لون مخصص"
                  />
                  <div 
                    className={`w-9 h-9 rounded-full border-2 border-dashed border-muted-foreground/50 flex items-center justify-center transition-all hover:border-primary hover:scale-105 ${
                      !colorOptions.some(c => c.value === formData.color) 
                        ? 'ring-2 ring-offset-2 ring-primary scale-110' 
                        : ''
                    }`}
                    style={{ 
                      backgroundColor: !colorOptions.some(c => c.value === formData.color) 
                        ? formData.color 
                        : 'transparent' 
                    }}
                  >
                    {colorOptions.some(c => c.value === formData.color) && (
                      <Plus className="w-4 h-4 text-muted-foreground" />
                    )}
                  </div>
                </div>
              </div>
              {!colorOptions.some(c => c.value === formData.color) && (
                <p className="text-xs text-muted-foreground">
                  اللون المخصص: {formData.color}
                </p>
              )}
            </div>

            <div className="flex gap-3 pt-4">
              <Button 
                type="submit" 
                className="flex-1"
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
