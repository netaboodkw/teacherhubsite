import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { useEducationLevels } from '@/hooks/useEducationLevels';
import { useSubjects } from '@/hooks/useSubjects';
import { User, School, GraduationCap, BookOpen, Loader2 } from 'lucide-react';

export default function CompleteProfile() {
  const [fullName, setFullName] = useState('');
  const [schoolName, setSchoolName] = useState('');
  const [selectedLevelId, setSelectedLevelId] = useState('');
  const [selectedSubjectId, setSelectedSubjectId] = useState('');
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();
  const navigate = useNavigate();
  const { user } = useAuth();
  
  const { data: levels, isLoading: levelsLoading } = useEducationLevels();
  const { data: subjects, isLoading: subjectsLoading } = useSubjects(selectedLevelId || undefined);

  // Reset subject when level changes
  useEffect(() => {
    setSelectedSubjectId('');
  }, [selectedLevelId]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!fullName.trim() || !schoolName.trim() || !selectedLevelId || !selectedSubjectId) {
      toast({
        title: 'خطأ',
        description: 'يرجى ملء جميع الحقول',
        variant: 'destructive',
      });
      return;
    }

    if (!user) {
      toast({
        title: 'خطأ',
        description: 'يرجى تسجيل الدخول أولاً',
        variant: 'destructive',
      });
      navigate('/auth');
      return;
    }

    setLoading(true);

    try {
      const selectedSubject = subjects?.find(s => s.id === selectedSubjectId);
      
      const { error } = await supabase
        .from('profiles')
        .update({
          full_name: fullName.trim(),
          school_name: schoolName.trim(),
          subject: selectedSubject?.name_ar || '',
          education_level_id: selectedLevelId,
          subject_id: selectedSubjectId,
          is_profile_complete: true,
        })
        .eq('user_id', user.id);

      if (error) throw error;

      toast({
        title: 'تم الحفظ',
        description: 'تم حفظ بياناتك بنجاح',
      });

      navigate('/dashboard');
    } catch (error: any) {
      toast({
        title: 'خطأ',
        description: error.message || 'حدث خطأ أثناء الحفظ',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-8 bg-background" dir="rtl">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl font-bold">أكمل ملفك الشخصي</CardTitle>
          <CardDescription>
            أدخل بياناتك للبدء في استخدام التطبيق
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="fullName">الاسم الكامل</Label>
              <div className="relative">
                <User className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  id="fullName"
                  type="text"
                  placeholder="أحمد محمد"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  className="pr-10"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="schoolName">اسم المدرسة</Label>
              <div className="relative">
                <School className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  id="schoolName"
                  type="text"
                  placeholder="مدرسة الأمل الابتدائية"
                  value={schoolName}
                  onChange={(e) => setSchoolName(e.target.value)}
                  className="pr-10"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label>المرحلة التعليمية</Label>
              <Select value={selectedLevelId} onValueChange={setSelectedLevelId}>
                <SelectTrigger className="w-full">
                  <GraduationCap className="h-4 w-4 ml-2 text-muted-foreground" />
                  <SelectValue placeholder="اختر المرحلة التعليمية" />
                </SelectTrigger>
                <SelectContent>
                  {levelsLoading ? (
                    <div className="flex justify-center p-2">
                      <Loader2 className="h-4 w-4 animate-spin" />
                    </div>
                  ) : (
                    levels?.map((level) => (
                      <SelectItem key={level.id} value={level.id}>
                        {level.name_ar}
                      </SelectItem>
                    ))
                  )}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>المادة التي تدرسها</Label>
              <Select 
                value={selectedSubjectId} 
                onValueChange={setSelectedSubjectId}
                disabled={!selectedLevelId}
              >
                <SelectTrigger className="w-full">
                  <BookOpen className="h-4 w-4 ml-2 text-muted-foreground" />
                  <SelectValue placeholder={selectedLevelId ? "اختر المادة" : "اختر المرحلة أولاً"} />
                </SelectTrigger>
                <SelectContent>
                  {subjectsLoading ? (
                    <div className="flex justify-center p-2">
                      <Loader2 className="h-4 w-4 animate-spin" />
                    </div>
                  ) : subjects?.length === 0 ? (
                    <div className="p-2 text-center text-muted-foreground text-sm">
                      لا توجد مواد في هذه المرحلة
                    </div>
                  ) : (
                    subjects?.map((subject) => (
                      <SelectItem key={subject.id} value={subject.id}>
                        {subject.name_ar}
                      </SelectItem>
                    ))
                  )}
                </SelectContent>
              </Select>
            </div>

            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? (
                <>
                  <Loader2 className="ml-2 h-4 w-4 animate-spin" />
                  جاري الحفظ...
                </>
              ) : (
                'حفظ والمتابعة'
              )}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
