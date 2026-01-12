import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { useEducationLevels } from '@/hooks/useEducationLevels';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { toast } from 'sonner';
import { Loader2, ArrowLeft, Mail, Lock, User, Building2, BookOpen, GraduationCap, Eye, EyeOff, Phone } from 'lucide-react';
import heroBg from '@/assets/hero-bg.jpg';

export default function TeacherAuth() {
  const navigate = useNavigate();
  const { signIn, signUp } = useAuth();
  const { data: educationLevels = [] } = useEducationLevels();
  
  // Login state
  const [loginEmail, setLoginEmail] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  const [loginLoading, setLoginLoading] = useState(false);
  const [showLoginPassword, setShowLoginPassword] = useState(false);
  
  // Register state
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [schoolName, setSchoolName] = useState('');
  const [educationLevelId, setEducationLevelId] = useState('');
  const [subject, setSubject] = useState('');
  const [phone, setPhone] = useState('');
  const [registerLoading, setRegisterLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!loginEmail.trim() || !loginPassword) {
      toast.error('يرجى إدخال البريد الإلكتروني وكلمة المرور');
      return;
    }
    
    setLoginLoading(true);
    try {
      const { error } = await signIn(loginEmail.trim(), loginPassword);
      
      if (error) {
        if (error.message.includes('Invalid login credentials')) {
          toast.error('البريد الإلكتروني أو كلمة المرور غير صحيحة');
        } else {
          toast.error(error.message);
        }
        return;
      }
      
      toast.success('تم تسجيل الدخول بنجاح');
      navigate('/teacher');
    } catch (error: any) {
      toast.error(error.message || 'حدث خطأ أثناء تسجيل الدخول');
    } finally {
      setLoginLoading(false);
    }
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validation
    if (!fullName.trim()) {
      toast.error('يرجى إدخال الاسم الكامل');
      return;
    }
    
    if (!email.trim()) {
      toast.error('يرجى إدخال البريد الإلكتروني');
      return;
    }
    
    if (!password) {
      toast.error('يرجى إدخال كلمة المرور');
      return;
    }
    
    if (password.length < 6) {
      toast.error('كلمة المرور يجب أن تكون 6 أحرف على الأقل');
      return;
    }
    
    if (password !== confirmPassword) {
      toast.error('كلمة المرور غير متطابقة');
      return;
    }
    
    if (!educationLevelId) {
      toast.error('يرجى اختيار المرحلة الدراسية');
      return;
    }
    
    setRegisterLoading(true);
    try {
      // Sign up user
      const { data, error: signUpError } = await signUp(email.trim(), password, fullName.trim());
      
      if (signUpError) {
        if (signUpError.message.includes('already registered')) {
          toast.error('هذا البريد الإلكتروني مسجل بالفعل');
        } else {
          toast.error(signUpError.message);
        }
        return;
      }
      
      if (!data.user) {
        toast.error('حدث خطأ أثناء إنشاء الحساب');
        return;
      }
      
      // Wait a moment for the trigger to create profile, then update it
      await new Promise(resolve => setTimeout(resolve, 500));
      
      // Update profile with additional info
      const { error: profileError } = await supabase
        .from('profiles')
        .update({
          school_name: schoolName.trim() || null,
          education_level_id: educationLevelId,
          subject: subject.trim() || null,
          phone: phone.trim() || null,
          is_profile_complete: true,
        })
        .eq('user_id', data.user.id);
      
      if (profileError) {
        console.error('Profile update error:', profileError);
        // Don't fail registration if profile update fails
      }
      
      toast.success('تم إنشاء الحساب بنجاح');
      navigate('/teacher');
    } catch (error: any) {
      toast.error(error.message || 'حدث خطأ أثناء التسجيل');
    } finally {
      setRegisterLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex" dir="rtl">
      {/* Left Side - Form */}
      <div className="flex-1 flex items-center justify-center p-4 sm:p-8 bg-background">
        <div className="w-full max-w-md">
          <Link 
            to="/" 
            className="inline-flex items-center gap-2 text-muted-foreground hover:text-foreground mb-6 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            العودة للرئيسية
          </Link>
          
          <Card className="border-0 shadow-lg">
            <CardHeader className="space-y-1 pb-4">
              <CardTitle className="text-2xl font-bold text-center">
                مرحباً بك 👋
              </CardTitle>
              <CardDescription className="text-center">
                سجّل دخولك أو أنشئ حساباً جديداً
              </CardDescription>
            </CardHeader>
            
            <CardContent>
              <Tabs defaultValue="login" className="w-full">
                <TabsList className="grid w-full grid-cols-2 mb-6">
                  <TabsTrigger value="login">تسجيل الدخول</TabsTrigger>
                  <TabsTrigger value="register">حساب جديد</TabsTrigger>
                </TabsList>
                
                {/* Login Tab */}
                <TabsContent value="login">
                  <form onSubmit={handleLogin} className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="login-email">البريد الإلكتروني</Label>
                      <div className="relative">
                        <Mail className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                        <Input
                          id="login-email"
                          type="email"
                          placeholder="example@email.com"
                          value={loginEmail}
                          onChange={(e) => setLoginEmail(e.target.value)}
                          className="pr-10"
                          dir="ltr"
                        />
                      </div>
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="login-password">كلمة المرور</Label>
                      <div className="relative">
                        <Lock className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                        <Input
                          id="login-password"
                          type={showLoginPassword ? "text" : "password"}
                          placeholder="••••••••"
                          value={loginPassword}
                          onChange={(e) => setLoginPassword(e.target.value)}
                          className="pr-10 pl-10"
                          dir="ltr"
                        />
                        <button
                          type="button"
                          onClick={() => setShowLoginPassword(!showLoginPassword)}
                          className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                        >
                          {showLoginPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                        </button>
                      </div>
                    </div>
                    
                    <Button 
                      type="submit" 
                      className="w-full gradient-hero h-11"
                      disabled={loginLoading}
                    >
                      {loginLoading ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        'تسجيل الدخول'
                      )}
                    </Button>
                  </form>
                </TabsContent>
                
                {/* Register Tab */}
                <TabsContent value="register">
                  <form onSubmit={handleRegister} className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="fullName">الاسم الكامل *</Label>
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
                      <Label htmlFor="email">البريد الإلكتروني *</Label>
                      <div className="relative">
                        <Mail className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                        <Input
                          id="email"
                          type="email"
                          placeholder="example@email.com"
                          value={email}
                          onChange={(e) => setEmail(e.target.value)}
                          className="pr-10"
                          dir="ltr"
                        />
                      </div>
                    </div>
                    
                    <div className="grid grid-cols-2 gap-3">
                      <div className="space-y-2">
                        <Label htmlFor="password">كلمة المرور *</Label>
                        <div className="relative">
                          <Lock className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                          <Input
                            id="password"
                            type={showPassword ? "text" : "password"}
                            placeholder="••••••"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            className="pr-10 pl-8"
                            dir="ltr"
                          />
                          <button
                            type="button"
                            onClick={() => setShowPassword(!showPassword)}
                            className="absolute left-2 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                          >
                            {showPassword ? <EyeOff className="h-3 w-3" /> : <Eye className="h-3 w-3" />}
                          </button>
                        </div>
                      </div>
                      
                      <div className="space-y-2">
                        <Label htmlFor="confirmPassword">تأكيد كلمة المرور *</Label>
                        <div className="relative">
                          <Lock className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                          <Input
                            id="confirmPassword"
                            type={showConfirmPassword ? "text" : "password"}
                            placeholder="••••••"
                            value={confirmPassword}
                            onChange={(e) => setConfirmPassword(e.target.value)}
                            className="pr-10 pl-8"
                            dir="ltr"
                          />
                          <button
                            type="button"
                            onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                            className="absolute left-2 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                          >
                            {showConfirmPassword ? <EyeOff className="h-3 w-3" /> : <Eye className="h-3 w-3" />}
                          </button>
                        </div>
                      </div>
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="educationLevel">المرحلة الدراسية *</Label>
                      <Select value={educationLevelId} onValueChange={setEducationLevelId}>
                        <SelectTrigger id="educationLevel">
                          <GraduationCap className="h-4 w-4 text-muted-foreground ml-2" />
                          <SelectValue placeholder="اختر المرحلة" />
                        </SelectTrigger>
                        <SelectContent>
                          {educationLevels.map(level => (
                            <SelectItem key={level.id} value={level.id}>
                              {level.name_ar}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="subject">المادة (اختياري)</Label>
                      <div className="relative">
                        <BookOpen className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                        <Input
                          id="subject"
                          type="text"
                          placeholder="الرياضيات، اللغة العربية..."
                          value={subject}
                          onChange={(e) => setSubject(e.target.value)}
                          className="pr-10"
                        />
                      </div>
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="phone">رقم الهاتف (اختياري)</Label>
                      <div className="relative">
                        <Phone className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                        <Input
                          id="phone"
                          type="tel"
                          placeholder="0512345678"
                          value={phone}
                          onChange={(e) => setPhone(e.target.value)}
                          className="pr-10"
                          dir="ltr"
                        />
                      </div>
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="schoolName">اسم المدرسة (اختياري)</Label>
                      <div className="relative">
                        <Building2 className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                        <Input
                          id="schoolName"
                          type="text"
                          placeholder="مدرسة الكويت الثانوية"
                          value={schoolName}
                          onChange={(e) => setSchoolName(e.target.value)}
                          className="pr-10"
                        />
                      </div>
                    </div>
                    
                    <Button 
                      type="submit" 
                      className="w-full gradient-hero h-11"
                      disabled={registerLoading}
                    >
                      {registerLoading ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        'إنشاء الحساب'
                      )}
                    </Button>
                  </form>
                </TabsContent>
              </Tabs>
            </CardContent>
          </Card>
          
          <p className="text-center text-sm text-muted-foreground mt-6">
            للدخول كمشرف؟{' '}
            <Link to="/auth/admin" className="text-primary hover:underline">
              صفحة المشرف
            </Link>
          </p>
        </div>
      </div>
      
      {/* Right Side - Image (hidden on mobile) */}
      <div className="hidden lg:flex lg:flex-1 relative overflow-hidden">
        <img
          src={heroBg}
          alt="Teacher"
          className="absolute inset-0 w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-l from-primary/80 to-primary/60 flex items-center justify-center p-12">
          <div className="text-center text-primary-foreground max-w-lg">
            <h2 className="text-3xl font-bold mb-4">
              منصة المعلم الذكية
            </h2>
            <p className="text-lg opacity-90">
              أدر صفوفك وتابع درجات طلابك وسجّل الحضور بسهولة ويسر
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
