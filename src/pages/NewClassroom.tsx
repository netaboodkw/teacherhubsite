import { useState, useEffect } from 'react';
import { TeacherLayout } from '@/components/layout/TeacherLayout';
import { useCreateClassroom } from '@/hooks/useClassrooms';
import { useEducationLevels } from '@/hooks/useEducationLevels';
import { useGradeLevels } from '@/hooks/useGradeLevels';
import { useSubjects } from '@/hooks/useSubjects';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
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
  const { data: levels, isLoading: levelsLoading } = useEducationLevels();
  const [selectedLevelId, setSelectedLevelId] = useState('');
  const { data: gradeLevels, isLoading: gradeLevelsLoading } = useGradeLevels(selectedLevelId || undefined);
  const [selectedGradeLevelId, setSelectedGradeLevelId] = useState('');
  const { data: subjects, isLoading: subjectsLoading } = useSubjects(selectedLevelId || undefined, selectedGradeLevelId || undefined);
  
  const [formData, setFormData] = useState({
    name: '',
    subject: '',
    schedule: '',
    color: 'bg-primary',
    education_level_id: '',
    subject_id: '',
    grade_level_id: '',
  });
  const [classSchedule, setClassSchedule] = useState<ClassSchedule>({});

  // Reset grade level and subject when education level changes
  useEffect(() => {
    setFormData(prev => ({ ...prev, subject_id: '', subject: '', grade_level_id: '' }));
  }, [selectedLevelId]);

  // Update subject name when subject is selected
  useEffect(() => {
    if (formData.subject_id && subjects) {
      const selectedSubject = subjects.find(s => s.id === formData.subject_id);
      if (selectedSubject) {
        setFormData(prev => ({ ...prev, subject: selectedSubject.name_ar }));
      }
    }
  }, [formData.subject_id, subjects]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await createClassroom.mutateAsync({
      name: formData.name,
      subject: formData.subject,
      schedule: formData.schedule,
      color: formData.color,
      class_schedule: classSchedule,
      education_level_id: formData.education_level_id || null,
      subject_id: formData.subject_id || null,
      grade_level_id: formData.grade_level_id || null,
    });
    navigate('/teacher/classrooms');
  };

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
            {/* Education Level */}
            <div className="space-y-2">
              <Label>المرحلة التعليمية</Label>
              <Select 
                value={selectedLevelId} 
                onValueChange={(value) => {
                  setSelectedLevelId(value);
                  setFormData(prev => ({ ...prev, education_level_id: value }));
                }}
              >
                <SelectTrigger>
                  <SelectValue placeholder={levelsLoading ? "جاري التحميل..." : "اختر المرحلة"} />
                </SelectTrigger>
                <SelectContent>
                  {levels?.map((level) => (
                    <SelectItem key={level.id} value={level.id}>
                      {level.name_ar}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Grade Level */}
            <div className="space-y-2">
              <Label>الصف الدراسي</Label>
              <Select 
                value={formData.grade_level_id} 
                onValueChange={(value) => {
                  setFormData(prev => ({ ...prev, grade_level_id: value, subject_id: '', subject: '' }));
                  setSelectedGradeLevelId(value);
                }}
                disabled={!selectedLevelId}
              >
                <SelectTrigger>
                  <SelectValue placeholder={
                    !selectedLevelId ? "اختر المرحلة أولاً" : 
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

            {/* Subject */}
            <div className="space-y-2">
              <Label>المادة الدراسية</Label>
              <Select 
                value={formData.subject_id} 
                onValueChange={(value) => setFormData(prev => ({ ...prev, subject_id: value }))}
                disabled={!formData.grade_level_id}
              >
                <SelectTrigger>
                  <SelectValue placeholder={
                    !formData.grade_level_id ? "اختر الصف أولاً" : 
                    subjectsLoading ? "جاري التحميل..." : 
                    subjects?.length === 0 ? "لا توجد مواد" :
                    "اختر المادة"
                  } />
                </SelectTrigger>
                <SelectContent>
                  {subjects?.map((subject) => (
                    <SelectItem key={subject.id} value={subject.id}>
                      {subject.name_ar}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="name">اسم الفصل</Label>
              <Input
                id="name"
                placeholder="مثال: الصف الأول - أ"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                required
              />
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
                disabled={createClassroom.isPending}
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
