import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/hooks/useAuth';
import { useEducationLevels } from '@/hooks/useEducationLevels';
import { supabase } from '@/integrations/supabase/client';
import { User, School, Phone, Loader2, GraduationCap } from 'lucide-react';

export default function CompleteProfile() {
  const [fullName, setFullName] = useState('');
  const [schoolName, setSchoolName] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [educationLevelId, setEducationLevelId] = useState('');
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { data: educationLevels, isLoading: levelsLoading } = useEducationLevels();

  // Extract phone number from email (phone@phone.teacherhub.app format)
  useEffect(() => {
    if (user?.email) {
      const match = user.email.match(/^(\d+)@phone\.teacherhub\.app$/);
      if (match) {
        setPhoneNumber(match[1]);
      }
    }
  }, [user]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!fullName.trim() || !schoolName.trim() || !educationLevelId) {
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
      navigate('/auth/teacher');
      return;
    }

    setLoading(true);

    try {
      const { error } = await supabase
        .from('profiles')
        .update({
          full_name: fullName.trim(),
          school_name: schoolName.trim(),
          phone: phoneNumber,
          education_level_id: educationLevelId,
          is_profile_complete: true,
        })
        .eq('user_id', user.id);

      if (error) throw error;

      toast({
        title: 'تم الحفظ',
        description: 'تم حفظ بياناتك بنجاح',
      });

      navigate('/teacher');
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
            {/* Phone Number - Read Only */}
            <div className="space-y-2">
              <Label htmlFor="phone">رقم الهاتف</Label>
              <div className="relative">
                <Phone className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  id="phone"
                  type="text"
                  value={phoneNumber}
                  className="pr-10 bg-muted"
                  dir="ltr"
                  disabled
                  readOnly
                />
              </div>
              <p className="text-xs text-muted-foreground">رقم الهاتف مرتبط بحسابك ولا يمكن تغييره</p>
            </div>

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
                  maxLength={100}
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
                  maxLength={200}
                />
              </div>
            </div>

            {/* Education Level - Required */}
            <div className="space-y-2">
              <Label>المرحلة التعليمية *</Label>
              <Select value={educationLevelId} onValueChange={setEducationLevelId}>
                <SelectTrigger>
                  <div className="flex items-center gap-2">
                    <GraduationCap className="h-4 w-4 text-muted-foreground" />
                    <SelectValue placeholder={levelsLoading ? "جاري التحميل..." : "اختر المرحلة"} />
                  </div>
                </SelectTrigger>
                <SelectContent>
                  {educationLevels?.map((level) => (
                    <SelectItem key={level.id} value={level.id}>
                      {level.name_ar}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <p className="text-xs text-muted-foreground">لا يمكن تغيير المرحلة لاحقاً</p>
            </div>

            <Button type="submit" className="w-full" disabled={loading || !educationLevelId}>
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
