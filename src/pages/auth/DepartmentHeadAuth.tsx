import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { useIsMobile } from '@/hooks/use-mobile';
import { useSiteLogo } from '@/hooks/useSiteLogo';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { toast } from 'sonner';
import { Loader2, ArrowLeft, Mail, Lock, User, Eye, EyeOff, Phone, Users, ChevronRight, Sparkles, Shield } from 'lucide-react';
import heroBg from '@/assets/hero-bg.jpg';
import defaultLogo from '@/assets/logo.png';

export default function DepartmentHeadAuth() {
  const navigate = useNavigate();
  const { signIn, signUp } = useAuth();
  const isMobile = useIsMobile();
  const { logoUrl, isCustomLogo } = useSiteLogo();
  const displayLogo = isCustomLogo ? logoUrl : defaultLogo;
  
  // Animation state
  const [isVisible, setIsVisible] = useState(false);
  
  // Tab state
  const [activeTab, setActiveTab] = useState<'login' | 'register'>('login');
  
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
  const [phone, setPhone] = useState('');
  const [registerLoading, setRegisterLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  // Trigger entrance animation
  useEffect(() => {
    const timer = setTimeout(() => setIsVisible(true), 50);
    return () => clearTimeout(timer);
  }, []);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!loginEmail.trim() || !loginPassword) {
      toast.error('يرجى إدخال البريد الإلكتروني وكلمة المرور');
      return;
    }
    
    setLoginLoading(true);
    try {
      const { error, data } = await signIn(loginEmail.trim(), loginPassword);
      
      if (error) {
        if (error.message.includes('Invalid login credentials')) {
          toast.error('البريد الإلكتروني أو كلمة المرور غير صحيحة');
        } else {
          toast.error(error.message);
        }
        return;
      }
      
      // Check if user is a department head
      if (data?.user) {
        const { data: dhProfile } = await supabase
          .from('department_heads')
          .select('id')
          .eq('user_id', data.user.id)
          .maybeSingle();

        if (!dhProfile) {
          await supabase.auth.signOut();
          toast.error('هذا الحساب ليس حساب رئيس قسم');
          return;
        }
        
        if (navigator.vibrate) navigator.vibrate(15);
        toast.success('تم تسجيل الدخول بنجاح');
        setTimeout(() => {
          navigate('/department-head', { replace: true });
        }, 100);
      }
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
      
      // Create department head profile
      const { error: dhError } = await supabase
        .from('department_heads')
        .insert({
          user_id: data.user.id,
          email: email.toLowerCase().trim(),
          full_name: fullName.trim(),
          phone: phone.trim() || null,
        });

      if (dhError) {
        console.error('Error creating department head profile:', dhError);
        toast.error('حدث خطأ أثناء إنشاء الملف الشخصي');
        return;
      }

      // Add department_head role
      const { error: roleError } = await supabase
        .from('user_roles')
        .insert({
          user_id: data.user.id,
          role: 'department_head',
        });

      if (roleError) {
        console.error('Error assigning role:', roleError);
      }
      
      if (navigator.vibrate) navigator.vibrate(15);
      toast.success('تم إنشاء الحساب بنجاح');
      navigate('/department-head');
    } catch (error: any) {
      toast.error(error.message || 'حدث خطأ أثناء التسجيل');
    } finally {
      setRegisterLoading(false);
    }
  };

  const handleBack = () => {
    if (navigator.vibrate) navigator.vibrate(10);
    setIsVisible(false);
    setTimeout(() => {
      navigate('/auth/teacher');
    }, 200);
  };

  const gradientColor = 'from-emerald-400 to-teal-500';

  // Mobile iOS Style Layout
  if (isMobile) {
    return (
      <div 
        className={`fixed inset-0 z-[100] bg-background flex flex-col select-none overflow-hidden transition-all duration-300 ease-out ${
          isVisible ? 'opacity-100 translate-x-0' : 'opacity-0 translate-x-8'
        }`} 
        dir="rtl"
      >
        {/* Background Gradient */}
        <div className={`absolute inset-0 bg-gradient-to-br ${gradientColor} opacity-10`} />
        
        {/* Animated Background Shapes */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className={`absolute -top-20 -right-20 w-64 h-64 bg-gradient-to-br ${gradientColor} opacity-20 rounded-full blur-3xl`} />
          <div className={`absolute -bottom-20 -left-20 w-80 h-80 bg-gradient-to-br ${gradientColor} opacity-15 rounded-full blur-3xl`} />
        </div>

        {/* Back Button */}
        <div className="absolute top-6 right-6 z-20">
          <button
            type="button"
            onClick={handleBack}
            onTouchEnd={(e) => {
              e.preventDefault();
              handleBack();
            }}
            className="flex items-center gap-1 text-muted-foreground hover:text-foreground transition-colors touch-manipulation"
          >
            <ChevronRight className="w-5 h-5" />
            <span className="text-sm">رجوع</span>
          </button>
        </div>

        {/* Scrollable Content */}
        <div className="flex-1 overflow-y-auto overscroll-contain">
          <div className="min-h-full flex flex-col items-center px-4 sm:px-6 pt-14 pb-8">
            {/* Logo with Badge */}
            <div className="relative w-24 h-24 mb-4">
              <img 
                src={displayLogo} 
                alt="Teacher Hub" 
                className="w-full h-full object-contain drop-shadow-lg"
                onError={(e) => { e.currentTarget.src = defaultLogo; }}
              />
              <div className={`absolute -bottom-1 -right-1 w-8 h-8 rounded-full bg-gradient-to-br ${gradientColor} flex items-center justify-center shadow-lg`}>
                <Shield className="w-4 h-4 text-white" />
              </div>
            </div>

            {/* Title */}
            <h1 className="text-2xl font-bold text-foreground mb-2">
              رئيس القسم 🎓
            </h1>
            <p className="text-muted-foreground text-center mb-6">
              {activeTab === 'login' ? 'سجل دخولك للمتابعة' : 'أنشئ حسابك للبدء'}
            </p>

            {/* Tab Switcher - iOS Style */}
            <div className="w-full max-w-sm mb-6">
              <div className="bg-muted/50 backdrop-blur-sm rounded-2xl p-1 flex">
                <button
                  type="button"
                  onClick={() => setActiveTab('login')}
                  className={`flex-1 py-3 px-4 rounded-xl text-sm font-medium transition-all duration-300 touch-manipulation ${
                    activeTab === 'login'
                      ? 'bg-background shadow-md text-foreground'
                      : 'text-muted-foreground'
                  }`}
                >
                  تسجيل الدخول
                </button>
                <button
                  type="button"
                  onClick={() => setActiveTab('register')}
                  className={`flex-1 py-3 px-4 rounded-xl text-sm font-medium transition-all duration-300 touch-manipulation ${
                    activeTab === 'register'
                      ? 'bg-background shadow-md text-foreground'
                      : 'text-muted-foreground'
                  }`}
                >
                  حساب جديد
                </button>
              </div>
            </div>

            {/* Form Container */}
            <div className="w-full max-w-sm">
              {activeTab === 'login' ? (
                /* Login Form */
                <form onSubmit={handleLogin} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="login-email" className="text-sm font-medium">البريد الإلكتروني</Label>
                    <div className="relative">
                      <Mail className="absolute right-4 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                      <Input
                        id="login-email"
                        type="email"
                        placeholder="example@email.com"
                        value={loginEmail}
                        onChange={(e) => setLoginEmail(e.target.value)}
                        className="h-14 pr-12 rounded-2xl bg-muted/30 border-0 text-base"
                        dir="ltr"
                      />
                    </div>
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="login-password" className="text-sm font-medium">كلمة المرور</Label>
                    <div className="relative">
                      <Lock className="absolute right-4 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                      <Input
                        id="login-password"
                        type={showLoginPassword ? "text" : "password"}
                        placeholder="••••••••"
                        value={loginPassword}
                        onChange={(e) => setLoginPassword(e.target.value)}
                        className="h-14 pr-12 pl-12 rounded-2xl bg-muted/30 border-0 text-base"
                        dir="ltr"
                      />
                      <button
                        type="button"
                        onClick={() => setShowLoginPassword(!showLoginPassword)}
                        className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground touch-manipulation"
                      >
                        {showLoginPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                      </button>
                    </div>
                  </div>
                  
                  <button
                    type="submit"
                    disabled={loginLoading}
                    className={`w-full h-14 text-lg font-bold rounded-2xl shadow-lg bg-gradient-to-r ${gradientColor} text-white border-0 hover:opacity-90 active:scale-[0.98] transition-all duration-300 flex items-center justify-center gap-2 touch-manipulation mt-6`}
                  >
                    {loginLoading ? (
                      <Loader2 className="h-5 w-5 animate-spin" />
                    ) : (
                      <>
                        <Sparkles className="h-5 w-5" />
                        تسجيل الدخول
                      </>
                    )}
                  </button>
                </form>
              ) : (
                /* Register Form */
                <form onSubmit={handleRegister} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="fullName" className="text-sm font-medium">الاسم الكامل *</Label>
                    <div className="relative">
                      <User className="absolute right-4 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                      <Input
                        id="fullName"
                        type="text"
                        placeholder="أحمد محمد"
                        value={fullName}
                        onChange={(e) => setFullName(e.target.value)}
                        className="h-14 pr-12 rounded-2xl bg-muted/30 border-0 text-base"
                      />
                    </div>
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="email" className="text-sm font-medium">البريد الإلكتروني *</Label>
                    <div className="relative">
                      <Mail className="absolute right-4 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                      <Input
                        id="email"
                        type="email"
                        placeholder="example@email.com"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        className="h-14 pr-12 rounded-2xl bg-muted/30 border-0 text-base"
                        dir="ltr"
                      />
                    </div>
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="phone" className="text-sm font-medium">رقم الهاتف (اختياري)</Label>
                    <div className="relative">
                      <Phone className="absolute right-4 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                      <Input
                        id="phone"
                        type="tel"
                        placeholder="9XXXXXXX"
                        value={phone}
                        onChange={(e) => setPhone(e.target.value)}
                        className="h-14 pr-12 rounded-2xl bg-muted/30 border-0 text-base"
                        dir="ltr"
                        maxLength={8}
                      />
                    </div>
                  </div>
                  
                  <div className="space-y-3">
                    <div className="space-y-2">
                      <Label htmlFor="password" className="text-sm font-medium">كلمة المرور *</Label>
                      <div className="relative">
                        <Lock className="absolute right-4 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                        <Input
                          id="password"
                          type={showPassword ? "text" : "password"}
                          placeholder="••••••"
                          value={password}
                          onChange={(e) => setPassword(e.target.value)}
                          className="h-14 pr-12 pl-12 rounded-2xl bg-muted/30 border-0 text-base"
                          dir="ltr"
                        />
                        <button
                          type="button"
                          onClick={() => setShowPassword(!showPassword)}
                          className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground touch-manipulation"
                        >
                          {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                        </button>
                      </div>
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="confirmPassword" className="text-sm font-medium">تأكيد كلمة المرور *</Label>
                      <div className="relative">
                        <Lock className="absolute right-4 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                        <Input
                          id="confirmPassword"
                          type={showConfirmPassword ? "text" : "password"}
                          placeholder="••••••"
                          value={confirmPassword}
                          onChange={(e) => setConfirmPassword(e.target.value)}
                          className="h-14 pr-12 pl-12 rounded-2xl bg-muted/30 border-0 text-base"
                          dir="ltr"
                        />
                        <button
                          type="button"
                          onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                          className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground touch-manipulation"
                        >
                          {showConfirmPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                        </button>
                      </div>
                    </div>
                  </div>
                  
                  <button
                    type="submit"
                    disabled={registerLoading}
                    className={`w-full h-14 text-lg font-bold rounded-2xl shadow-lg bg-gradient-to-r ${gradientColor} text-white border-0 hover:opacity-90 active:scale-[0.98] transition-all duration-300 flex items-center justify-center gap-2 touch-manipulation mt-6 disabled:opacity-50`}
                  >
                    {registerLoading ? (
                      <Loader2 className="h-5 w-5 animate-spin" />
                    ) : (
                      <>
                        <Sparkles className="h-5 w-5" />
                        إنشاء الحساب
                      </>
                    )}
                  </button>
                </form>
              )}
            </div>

            {/* Teacher Link */}
            <button
              type="button"
              onClick={handleBack}
              onTouchEnd={(e) => {
                e.preventDefault();
                handleBack();
              }}
              className="mt-6 flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors touch-manipulation py-3 px-4 active:opacity-70"
            >
              <Users className="h-4 w-4" />
              <span className="text-sm">تسجيل كمعلم</span>
            </button>

            {/* Footer */}
            <p className="text-center text-sm text-muted-foreground mt-6">
              منصة كويتية 🇰🇼 صُممت للمعلم في الكويت
            </p>
          </div>
        </div>
      </div>
    );
  }

  // Desktop Web Layout (Original Design)
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
              <div className="flex items-center justify-center mb-2">
                <img src={displayLogo} alt="Teacher Hub" className="w-16 h-16 object-contain" />
              </div>
              <CardTitle className="text-2xl font-bold text-center">
                رئيس القسم
              </CardTitle>
              <CardDescription className="text-center">
                سجّل دخولك للوصول إلى لوحة التحكم
              </CardDescription>
            </CardHeader>
            
            <CardContent>
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
                  className="w-full h-11"
                  disabled={loginLoading}
                >
                  {loginLoading ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    'تسجيل الدخول'
                  )}
                </Button>
              </form>
            </CardContent>
          </Card>
          
          <p className="text-center text-sm text-muted-foreground mt-4">
            هل أنت معلم؟{' '}
            <Link to="/auth/teacher" className="text-primary hover:underline">
              سجل كمعلم
            </Link>
          </p>
        </div>
      </div>
      
      {/* Right Side - Image */}
      <div 
        className="hidden lg:flex flex-1 items-center justify-center p-12 relative"
        style={{
          backgroundImage: `url(${heroBg})`,
          backgroundSize: 'cover',
          backgroundPosition: 'center',
        }}
      >
        <div className="absolute inset-0 bg-gradient-to-br from-primary/80 to-primary-foreground/60" />
        <div className="relative z-10 text-center text-white max-w-lg">
          <h2 className="text-3xl font-bold mb-4">مرحباً برئيس القسم</h2>
          <p className="text-lg opacity-90">
            راقب أداء المعلمين وتصفح الفصول والطلاب والدرجات من مكان واحد
          </p>
        </div>
      </div>
    </div>
  );
}
