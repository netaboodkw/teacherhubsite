import { useState, useEffect } from 'react';
import { useNavigate, Link, useSearchParams } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { useEducationLevels } from '@/hooks/useEducationLevels';
import { useUserRole } from '@/hooks/useUserRole';
import { useSystemSettings } from '@/hooks/useSystemSettings';
import { useSiteLogo } from '@/hooks/useSiteLogo';
import { useIsMobile } from '@/hooks/use-mobile';
import { useBiometricAuth } from '@/hooks/useBiometricAuth';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Checkbox } from '@/components/ui/checkbox';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { ScrollArea } from '@/components/ui/scroll-area';
import { toast } from 'sonner';
import { Loader2, ArrowLeft, ChevronRight, Mail, Lock, User, Building2, BookOpen, GraduationCap, Eye, EyeOff, Phone, LogOut, AlertTriangle, FileText, Sparkles, Users, Fingerprint } from 'lucide-react';
import heroBg from '@/assets/hero-bg.jpg';
import defaultLogo from '@/assets/logo.png';

export default function TeacherAuth() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { user, signIn, signUp, signOut } = useAuth();
  const { data: userRole } = useUserRole();
  const { data: educationLevels = [] } = useEducationLevels();
  const { data: systemSettings } = useSystemSettings();
  const { logoUrl, isCustomLogo } = useSiteLogo();
  const displayLogo = isCustomLogo ? logoUrl : defaultLogo;
  const isMobile = useIsMobile();
  const { 
    isAvailable: biometricAvailable, 
    isEnabled: biometricEnabled, 
    biometricLogin, 
    saveCredentials,
    getBiometryDisplayName,
    isNative 
  } = useBiometricAuth();
  
  const [biometricLoading, setBiometricLoading] = useState(false);
  const [showBiometricSetup, setShowBiometricSetup] = useState(false);
  
  // Get initial tab from URL params (default to register)
  const initialTab = searchParams.get('tab') === 'login' ? 'login' : 'register';
  const [activeTab, setActiveTab] = useState<'login' | 'register'>(initialTab);
  
  // Get pre-filled email from URL params (for quick re-login)
  const prefilledEmail = searchParams.get('email') || '';
  
  // Terms settings - Always require terms acceptance
  const termsContent = (systemSettings?.find(s => s.key === 'terms_content')?.value as string) || 'الشروط والأحكام الخاصة باستخدام منصة Teacher Hub.\n\nباستخدامك للمنصة فإنك توافق على:\n1. الحفاظ على سرية بيانات الطلاب\n2. استخدام المنصة للأغراض التعليمية فقط\n3. عدم مشاركة حسابك مع الآخرين\n4. الالتزام بقوانين دولة الكويت';
  const termsEnabled = true;
  
  // Check if user is logged in with a different role
  const isLoggedInWithDifferentRole = user && userRole && userRole.role !== 'user';
  
  // Login state - pre-fill email if available
  const [loginEmail, setLoginEmail] = useState(prefilledEmail);
  const [loginPassword, setLoginPassword] = useState('');
  const [loginLoading, setLoginLoading] = useState(false);
  const [showLoginPassword, setShowLoginPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(() => {
    return localStorage.getItem('rememberMe') === 'true';
  });
  const [showForgotPassword, setShowForgotPassword] = useState(false);
  const [forgotPasswordEmail, setForgotPasswordEmail] = useState('');
  const [forgotPasswordLoading, setForgotPasswordLoading] = useState(false);
  
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
  const [acceptedTerms, setAcceptedTerms] = useState(false);
  const [showTermsDialog, setShowTermsDialog] = useState(false);

  const handleSwitchAccount = async () => {
    await signOut();
    toast.success('تم تسجيل الخروج، يمكنك الآن تسجيل الدخول بحساب معلم');
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!loginEmail.trim() || !loginPassword) {
      toast.error('يرجى إدخال البريد الإلكتروني وكلمة المرور');
      return;
    }
    
    if (isLoggedInWithDifferentRole) {
      await signOut();
    }
    
    setLoginLoading(true);
    
    // Save remember me preference
    localStorage.setItem('rememberMe', rememberMe.toString());
    
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
      
      if (data?.session) {
        // Check if biometric is available and ask to save credentials
        if (biometricAvailable && !biometricEnabled && isNative) {
          setShowBiometricSetup(true);
        }
        
        toast.success('تم تسجيل الدخول بنجاح');
        if (navigator.vibrate) navigator.vibrate(15);
        setTimeout(() => {
          navigate('/teacher', { replace: true });
        }, 100);
      }
    } catch (error: any) {
      toast.error(error.message || 'حدث خطأ أثناء تسجيل الدخول');
    } finally {
      setLoginLoading(false);
    }
  };

  // Handle biometric login
  const handleBiometricLogin = async () => {
    setBiometricLoading(true);
    
    try {
      const credentials = await biometricLogin();
      
      if (!credentials) {
        toast.error('فشل التحقق من الهوية');
        setBiometricLoading(false);
        return;
      }
      
      const { error, data } = await signIn(credentials.username, credentials.password);
      
      if (error) {
        toast.error('فشل تسجيل الدخول، يرجى تسجيل الدخول يدوياً');
        setBiometricLoading(false);
        return;
      }
      
      if (data?.session) {
        toast.success('تم تسجيل الدخول بنجاح');
        if (navigator.vibrate) navigator.vibrate(15);
        navigate('/teacher', { replace: true });
      }
    } catch (error) {
      toast.error('حدث خطأ أثناء تسجيل الدخول');
    } finally {
      setBiometricLoading(false);
    }
  };

  // Save credentials for biometric login
  const handleSaveBiometric = async () => {
    const saved = await saveCredentials(loginEmail.trim(), loginPassword);
    if (saved) {
      toast.success(`تم تفعيل ${getBiometryDisplayName()} بنجاح`);
    }
    setShowBiometricSetup(false);
  };

  // Auto-trigger biometric login on mount if enabled
  useEffect(() => {
    if (biometricEnabled && biometricAvailable && isNative && !user) {
      handleBiometricLogin();
    }
  }, [biometricEnabled, biometricAvailable, isNative]);

  // Handle forgot password
  const handleForgotPassword = async () => {
    const emailToReset = forgotPasswordEmail || loginEmail;
    
    if (!emailToReset.trim()) {
      toast.error('يرجى إدخال البريد الإلكتروني');
      return;
    }
    
    setForgotPasswordLoading(true);
    
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(emailToReset.trim(), {
        redirectTo: `${window.location.origin}/auth/reset-password`,
      });
      
      if (error) {
        toast.error(error.message);
        return;
      }
      
      toast.success('تم إرسال رابط إعادة التعيين إلى بريدك الإلكتروني');
      setShowForgotPassword(false);
      setForgotPasswordEmail('');
      
    } catch (err: any) {
      toast.error(err.message || 'حدث خطأ');
    } finally {
      setForgotPasswordLoading(false);
    }
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    
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
    
    if (!phone.trim()) {
      toast.error('يرجى إدخال رقم الهاتف');
      return;
    }
    
    if (!educationLevelId) {
      toast.error('يرجى اختيار المرحلة الدراسية');
      return;
    }

    if (termsEnabled && !acceptedTerms) {
      toast.error('يرجى الموافقة على الشروط والأحكام');
      return;
    }
    
    setRegisterLoading(true);
    try {
      const { data, error: signUpError } = await signUp(
        email.trim(), 
        password, 
        fullName.trim(),
        {
          education_level_id: educationLevelId,
          phone: phone.trim() || undefined,
          school_name: schoolName.trim() || undefined,
          subject: subject.trim() || undefined,
        }
      );
      
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
      
      await new Promise(resolve => setTimeout(resolve, 500));
      
      try {
        await supabase.functions.invoke('send-email', {
          body: {
            type: 'welcome',
            to: email.trim(),
            data: { name: fullName.trim() },
          },
        });
      } catch (emailError) {
        console.error('Failed to send welcome email:', emailError);
      }
      
      if (navigator.vibrate) navigator.vibrate(15);
      toast.success('تم إنشاء الحساب بنجاح');
      navigate('/teacher');
    } catch (error: any) {
      console.error('Registration error:', error);
      toast.error(error.message || 'حدث خطأ أثناء التسجيل');
    } finally {
      setRegisterLoading(false);
    }
  };

  const gradientColor = 'from-sky-400 to-violet-400';

  // Mobile iOS Style Layout
  if (isMobile) {
    return (
      <div className="fixed inset-0 z-[100] bg-background flex flex-col select-none" dir="rtl">
        {/* Background Gradient */}
        <div className={`absolute inset-0 bg-gradient-to-br ${gradientColor} opacity-10 pointer-events-none`} />
        
        {/* Animated Background Shapes */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className={`absolute -top-20 -right-20 w-64 h-64 bg-gradient-to-br ${gradientColor} opacity-20 rounded-full blur-3xl`} />
          <div className={`absolute -bottom-20 -left-20 w-80 h-80 bg-gradient-to-br ${gradientColor} opacity-15 rounded-full blur-3xl`} />
        </div>

        {/* Back Button - iOS Safe Area */}
        <div className="sticky top-0 z-20 bg-background/80 backdrop-blur-lg border-b border-border/50 safe-area-inset-top">
          <div className="flex items-center justify-between px-4 py-3">
            <button
              type="button"
              onClick={() => navigate('/welcome')}
              className="flex items-center gap-1 text-primary font-medium touch-manipulation min-h-[44px] min-w-[44px]"
            >
              <ChevronRight className="w-5 h-5" />
              <span className="text-base">رجوع</span>
            </button>
            <h2 className="text-base font-semibold text-foreground">
              {activeTab === 'login' ? 'تسجيل الدخول' : 'حساب جديد'}
            </h2>
            <div className="w-16" /> {/* Spacer for centering */}
          </div>
        </div>

        {/* Scrollable Content - iOS optimized with keyboard handling */}
        <div 
          className="flex-1 overflow-y-auto overscroll-contain"
          style={{
            WebkitOverflowScrolling: 'touch',
          }}
        >
          <div className="flex flex-col items-center px-5 pt-6 pb-12">
            {/* Logo */}
            <div className="w-20 h-20 mb-4 flex items-center justify-center">
              <img 
                src={displayLogo} 
                alt="Teacher Hub" 
                className="w-full h-full object-contain drop-shadow-lg"
                onError={(e) => { e.currentTarget.src = defaultLogo; }}
              />
            </div>

            {/* Title */}
            <h1 className="text-xl font-bold text-foreground mb-1">
              {activeTab === 'login' ? 'مرحباً بعودتك 👋' : 'إنشاء حساب جديد ✨'}
            </h1>
            <p className="text-muted-foreground text-sm text-center mb-5">
              {activeTab === 'login' ? 'سجل دخولك للمتابعة' : 'أنشئ حسابك للبدء'}
            </p>

            {/* Tab Switcher - iOS Style with larger touch targets */}
            <div className="w-full max-w-sm mb-5">
              <div className="bg-muted/60 backdrop-blur-sm rounded-xl p-1 flex">
                <button
                  type="button"
                  onClick={() => setActiveTab('register')}
                  className={`flex-1 py-3.5 px-4 rounded-lg text-base font-semibold transition-all duration-200 touch-manipulation min-h-[48px] ${
                    activeTab === 'register'
                      ? 'bg-background shadow-md text-foreground'
                      : 'text-muted-foreground active:bg-background/50'
                  }`}
                >
                  حساب جديد
                </button>
                <button
                  type="button"
                  onClick={() => setActiveTab('login')}
                  className={`flex-1 py-3.5 px-4 rounded-lg text-base font-semibold transition-all duration-200 touch-manipulation min-h-[48px] ${
                    activeTab === 'login'
                      ? 'bg-background shadow-md text-foreground'
                      : 'text-muted-foreground active:bg-background/50'
                  }`}
                >
                  تسجيل الدخول
                </button>
              </div>
            </div>

            {/* Form Container */}
            <div className="w-full max-w-sm">
              {activeTab === 'login' ? (
                /* Login Form */
                <form onSubmit={handleLogin} className="space-y-5">
                  <div className="space-y-2">
                    <Label htmlFor="login-email" className="text-sm font-semibold text-foreground">البريد الإلكتروني</Label>
                    <div className="relative">
                      <Mail className="absolute right-4 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground pointer-events-none" />
                      <Input
                        id="login-email"
                        type="email"
                        inputMode="email"
                        autoComplete="email"
                        autoCapitalize="none"
                        autoCorrect="off"
                        spellCheck="false"
                        placeholder="example@email.com"
                        value={loginEmail}
                        onChange={(e) => setLoginEmail(e.target.value)}
                        className="h-[52px] pr-12 rounded-xl bg-muted/40 border border-border/50 text-base focus:border-primary focus:ring-2 focus:ring-primary/20"
                        dir="ltr"
                        style={{ fontSize: '16px' }} // Prevents iOS zoom
                      />
                    </div>
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="login-password" className="text-sm font-semibold text-foreground">كلمة المرور</Label>
                    <div className="relative">
                      <Lock className="absolute right-4 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground pointer-events-none" />
                      <Input
                        id="login-password"
                        type={showLoginPassword ? "text" : "password"}
                        autoComplete="current-password"
                        placeholder="••••••••"
                        value={loginPassword}
                        onChange={(e) => setLoginPassword(e.target.value)}
                        className="h-[52px] pr-12 pl-14 rounded-xl bg-muted/40 border border-border/50 text-base focus:border-primary focus:ring-2 focus:ring-primary/20"
                        dir="ltr"
                        style={{ fontSize: '16px' }}
                      />
                      <button
                        type="button"
                        onClick={() => setShowLoginPassword(!showLoginPassword)}
                        className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground p-2 touch-manipulation min-h-[44px] min-w-[44px] flex items-center justify-center"
                      >
                        {showLoginPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                      </button>
                    </div>
                  </div>
                  
                  {/* Remember Me Option */}
                  <div className="flex items-center gap-3 py-2">
                    <Checkbox
                      id="remember-me-mobile"
                      checked={rememberMe}
                      onCheckedChange={(checked) => setRememberMe(checked === true)}
                      className="h-5 w-5"
                    />
                    <Label 
                      htmlFor="remember-me-mobile" 
                      className="text-sm text-muted-foreground cursor-pointer flex-1"
                    >
                      تذكرني (البقاء متصلاً)
                    </Label>
                  </div>
                  
                  {/* Forgot Password Link */}
                  <button
                    type="button"
                    onClick={() => {
                      setForgotPasswordEmail(loginEmail);
                      setShowForgotPassword(true);
                    }}
                    className="text-sm text-primary hover:underline w-full text-center py-2"
                  >
                    نسيت كلمة المرور؟
                  </button>
                  
                  <button
                    type="submit"
                    disabled={loginLoading}
                    className={`w-full h-[52px] text-base font-bold rounded-xl shadow-lg bg-gradient-to-r ${gradientColor} text-white border-0 active:scale-[0.98] transition-all duration-200 flex items-center justify-center gap-2 touch-manipulation mt-8 disabled:opacity-50`}
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
                  
                  {/* Biometric Login Button */}
                  {biometricEnabled && biometricAvailable && isNative && (
                    <button
                      type="button"
                      onClick={handleBiometricLogin}
                      disabled={biometricLoading}
                      className="w-full h-[52px] text-base font-bold rounded-xl border-2 border-primary/30 bg-primary/10 text-primary active:scale-[0.98] transition-all duration-200 flex items-center justify-center gap-3 touch-manipulation disabled:opacity-50"
                    >
                      {biometricLoading ? (
                        <Loader2 className="h-5 w-5 animate-spin" />
                      ) : (
                        <>
                          <Fingerprint className="h-6 w-6" />
                          الدخول بـ {getBiometryDisplayName()}
                        </>
                      )}
                    </button>
                  )}
                  
                  {/* Biometric Setup Dialog */}
                  {showBiometricSetup && (
                    <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
                      <div className="bg-background rounded-2xl p-6 max-w-sm w-full space-y-4">
                        <div className="text-center">
                          <Fingerprint className="h-16 w-16 mx-auto text-primary mb-4" />
                          <h3 className="text-lg font-bold mb-2">تفعيل {getBiometryDisplayName()}</h3>
                          <p className="text-muted-foreground text-sm">
                            هل تريد استخدام {getBiometryDisplayName()} لتسجيل الدخول السريع في المرات القادمة؟
                          </p>
                        </div>
                        <div className="flex gap-3">
                          <button
                            onClick={() => setShowBiometricSetup(false)}
                            className="flex-1 py-3 rounded-xl border border-border text-muted-foreground font-medium"
                          >
                            ليس الآن
                          </button>
                          <button
                            onClick={handleSaveBiometric}
                            className={`flex-1 py-3 rounded-xl bg-gradient-to-r ${gradientColor} text-white font-bold`}
                          >
                            تفعيل
                          </button>
                        </div>
                      </div>
                    </div>
                  )}
                  
                  {/* Forgot Password Modal */}
                  {showForgotPassword && (
                    <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
                      <div className="bg-background rounded-2xl p-6 max-w-sm w-full space-y-4">
                        <div className="text-center">
                          <Mail className="h-12 w-12 mx-auto text-primary mb-4" />
                          <h3 className="text-lg font-bold mb-2">نسيت كلمة المرور؟</h3>
                          <p className="text-muted-foreground text-sm">
                            أدخل بريدك الإلكتروني وسنرسل لك رابط إعادة التعيين
                          </p>
                        </div>
                        <div className="space-y-2">
                          <Input
                            type="email"
                            placeholder="example@email.com"
                            value={forgotPasswordEmail}
                            onChange={(e) => setForgotPasswordEmail(e.target.value)}
                            className="h-12 rounded-xl text-center"
                            dir="ltr"
                            style={{ fontSize: '16px' }}
                          />
                        </div>
                        <div className="flex gap-3">
                          <button
                            type="button"
                            onClick={() => setShowForgotPassword(false)}
                            className="flex-1 py-3 rounded-xl border border-border text-muted-foreground font-medium"
                          >
                            إلغاء
                          </button>
                          <button
                            type="button"
                            onClick={handleForgotPassword}
                            disabled={forgotPasswordLoading}
                            className={`flex-1 py-3 rounded-xl bg-gradient-to-r ${gradientColor} text-white font-bold disabled:opacity-50 flex items-center justify-center`}
                          >
                            {forgotPasswordLoading ? (
                              <Loader2 className="h-5 w-5 animate-spin" />
                            ) : (
                              'إرسال'
                            )}
                          </button>
                        </div>
                      </div>
                    </div>
                  )}
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
                    <Label htmlFor="phone" className="text-sm font-medium">رقم الهاتف *</Label>
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
                  
                  <div className="space-y-2">
                    <Label htmlFor="educationLevel" className="text-sm font-medium">المرحلة الدراسية *</Label>
                    <Select value={educationLevelId} onValueChange={setEducationLevelId}>
                      <SelectTrigger 
                        id="educationLevel" 
                        className="h-14 rounded-2xl bg-muted/30 border-0 text-base"
                      >
                        <div className="flex items-center gap-2">
                          <GraduationCap className="h-5 w-5 text-muted-foreground" />
                          <SelectValue placeholder="اختر المرحلة" />
                        </div>
                      </SelectTrigger>
                      <SelectContent 
                        className="z-[200] bg-background border border-border shadow-xl"
                        position="popper"
                        sideOffset={4}
                      >
                        {educationLevels.map(level => (
                          <SelectItem 
                            key={level.id} 
                            value={level.id}
                            className="py-3 text-base cursor-pointer"
                          >
                            {level.name_ar}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="subject" className="text-sm font-medium">المادة (اختياري)</Label>
                    <div className="relative">
                      <BookOpen className="absolute right-4 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                      <Input
                        id="subject"
                        type="text"
                        placeholder="الرياضيات، اللغة العربية..."
                        value={subject}
                        onChange={(e) => setSubject(e.target.value)}
                        className="h-14 pr-12 rounded-2xl bg-muted/30 border-0 text-base"
                      />
                    </div>
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="schoolName" className="text-sm font-medium">اسم المدرسة (اختياري)</Label>
                    <div className="relative">
                      <Building2 className="absolute right-4 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                      <Input
                        id="schoolName"
                        type="text"
                        placeholder="مدرسة الكويت الثانوية"
                        value={schoolName}
                        onChange={(e) => setSchoolName(e.target.value)}
                        className="h-14 pr-12 rounded-2xl bg-muted/30 border-0 text-base"
                      />
                    </div>
                  </div>
                  
                  {/* Terms and Conditions */}
                  {termsEnabled && termsContent && (
                    <div className="flex items-start space-x-3 space-x-reverse bg-muted/30 rounded-2xl p-4">
                      <Checkbox
                        id="terms"
                        checked={acceptedTerms}
                        onCheckedChange={(checked) => setAcceptedTerms(checked === true)}
                        className="mt-0.5"
                      />
                      <div className="flex-1">
                        <Label htmlFor="terms" className="text-sm cursor-pointer leading-relaxed">
                          أوافق على{' '}
                          <Dialog open={showTermsDialog} onOpenChange={setShowTermsDialog}>
                            <DialogTrigger asChild>
                              <button type="button" className="text-primary hover:underline inline-flex items-center gap-1 font-medium">
                                <FileText className="h-3.5 w-3.5" />
                                الشروط والأحكام
                              </button>
                            </DialogTrigger>
                            <DialogContent className="max-w-2xl max-h-[80vh]">
                              <DialogHeader>
                                <DialogTitle className="flex items-center gap-2">
                                  <FileText className="h-5 w-5" />
                                  الشروط والأحكام
                                </DialogTitle>
                              </DialogHeader>
                              <ScrollArea className="h-[60vh] mt-4">
                                <div className="prose prose-sm dark:prose-invert whitespace-pre-wrap" dir="rtl">
                                  {termsContent}
                                </div>
                              </ScrollArea>
                            </DialogContent>
                          </Dialog>
                        </Label>
                      </div>
                    </div>
                  )}
                  
                  <button
                    type="submit"
                    disabled={registerLoading || (termsEnabled && !acceptedTerms)}
                    className={`w-full h-[52px] text-base font-bold rounded-xl shadow-lg bg-gradient-to-r ${gradientColor} text-white border-0 active:scale-[0.98] transition-all duration-200 flex items-center justify-center gap-2 touch-manipulation mt-6 disabled:opacity-50`}
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

            {/* Department Head Link */}
            <button
              type="button"
              onClick={() => navigate('/auth/department-head')}
              className="mt-6 flex items-center gap-2 text-muted-foreground transition-colors touch-manipulation py-3 px-4 active:opacity-70 min-h-[44px]"
            >
              <Users className="h-4 w-4" />
              <span className="text-sm">تسجيل كرئيس قسم</span>
            </button>

            {/* Footer */}
            <p className="text-center text-sm text-muted-foreground mt-4 pb-6">
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
              <CardTitle className="text-2xl font-bold text-center">
                مرحباً بك 👋
              </CardTitle>
              <CardDescription className="text-center">
                سجّل دخولك أو أنشئ حساباً جديداً
              </CardDescription>
            </CardHeader>
            
            <CardContent>
              {/* Alert for logged in users with different role */}
              {isLoggedInWithDifferentRole && (
                <Alert className="mb-4 border-amber-200 bg-amber-50 dark:border-amber-800 dark:bg-amber-950">
                  <AlertTriangle className="h-4 w-4 text-amber-600" />
                  <AlertDescription className="text-amber-800 dark:text-amber-200">
                    أنت مسجل دخول كـ <strong>{userRole?.role === 'admin' ? 'مشرف' : 'رئيس قسم'}</strong>.
                    <Button 
                      variant="link" 
                      className="p-0 h-auto mr-1 text-amber-800 dark:text-amber-200 underline"
                      onClick={handleSwitchAccount}
                    >
                      <LogOut className="h-3 w-3 ml-1" />
                      تسجيل الخروج للتبديل
                    </Button>
                  </AlertDescription>
                </Alert>
              )}
              
              <Tabs defaultValue={initialTab} className="w-full">
                <TabsList className="grid w-full grid-cols-2 mb-6">
                  <TabsTrigger value="register">حساب جديد</TabsTrigger>
                  <TabsTrigger value="login">تسجيل الدخول</TabsTrigger>
                </TabsList>
                
                {/* Login Tab */}
                <TabsContent value="login">
                  <form onSubmit={handleLogin} className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="login-email-web">البريد الإلكتروني</Label>
                      <div className="relative">
                        <Mail className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                        <Input
                          id="login-email-web"
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
                      <Label htmlFor="login-password-web">كلمة المرور</Label>
                      <div className="relative">
                        <Lock className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                        <Input
                          id="login-password-web"
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
                    
                    {/* Remember Me Option - Desktop */}
                    <div className="flex items-center gap-2">
                      <Checkbox
                        id="remember-me-desktop"
                        checked={rememberMe}
                        onCheckedChange={(checked) => setRememberMe(checked === true)}
                      />
                      <Label 
                        htmlFor="remember-me-desktop" 
                        className="text-sm text-muted-foreground cursor-pointer"
                      >
                        تذكرني (البقاء متصلاً)
                      </Label>
                    </div>
                    
                    {/* Forgot Password Link - Desktop */}
                    <div className="text-center">
                      <button
                        type="button"
                        onClick={() => {
                          setForgotPasswordEmail(loginEmail);
                          setShowForgotPassword(true);
                        }}
                        className="text-sm text-primary hover:underline"
                      >
                        نسيت كلمة المرور؟
                      </button>
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
                </TabsContent>
                
                {/* Register Tab */}
                <TabsContent value="register">
                  <form onSubmit={handleRegister} className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="fullName-web">الاسم الكامل *</Label>
                      <div className="relative">
                        <User className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                        <Input
                          id="fullName-web"
                          type="text"
                          placeholder="أحمد محمد"
                          value={fullName}
                          onChange={(e) => setFullName(e.target.value)}
                          className="pr-10"
                        />
                      </div>
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="email-web">البريد الإلكتروني *</Label>
                      <div className="relative">
                        <Mail className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                        <Input
                          id="email-web"
                          type="email"
                          placeholder="example@email.com"
                          value={email}
                          onChange={(e) => setEmail(e.target.value)}
                          className="pr-10"
                          dir="ltr"
                        />
                      </div>
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="phone-web">رقم الهاتف *</Label>
                      <div className="relative">
                        <Phone className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                        <Input
                          id="phone-web"
                          type="tel"
                          placeholder="9XXXXXXX"
                          value={phone}
                          onChange={(e) => setPhone(e.target.value)}
                          className="pr-10"
                          dir="ltr"
                          maxLength={8}
                        />
                      </div>
                    </div>
                    
                    <div className="grid grid-cols-2 gap-3">
                      <div className="space-y-2">
                        <Label htmlFor="password-web">كلمة المرور *</Label>
                        <div className="relative">
                          <Lock className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                          <Input
                            id="password-web"
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
                        <Label htmlFor="confirmPassword-web">تأكيد كلمة المرور *</Label>
                        <div className="relative">
                          <Lock className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                          <Input
                            id="confirmPassword-web"
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
                      <Label htmlFor="educationLevel-web">المرحلة الدراسية *</Label>
                      <Select value={educationLevelId} onValueChange={setEducationLevelId}>
                        <SelectTrigger id="educationLevel-web">
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
                      <Label htmlFor="subject-web">المادة (اختياري)</Label>
                      <div className="relative">
                        <BookOpen className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                        <Input
                          id="subject-web"
                          type="text"
                          placeholder="الرياضيات، اللغة العربية..."
                          value={subject}
                          onChange={(e) => setSubject(e.target.value)}
                          className="pr-10"
                        />
                      </div>
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="schoolName-web">اسم المدرسة (اختياري)</Label>
                      <div className="relative">
                        <Building2 className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                        <Input
                          id="schoolName-web"
                          type="text"
                          placeholder="مدرسة الكويت الثانوية"
                          value={schoolName}
                          onChange={(e) => setSchoolName(e.target.value)}
                          className="pr-10"
                        />
                      </div>
                    </div>
                    
                    {/* Terms and Conditions */}
                    {termsEnabled && termsContent && (
                      <div className="flex items-start space-x-2 space-x-reverse">
                        <Checkbox
                          id="terms-web"
                          checked={acceptedTerms}
                          onCheckedChange={(checked) => setAcceptedTerms(checked === true)}
                          className="mt-1"
                        />
                        <div className="flex-1">
                          <Label htmlFor="terms-web" className="text-sm cursor-pointer">
                            أوافق على{' '}
                            <Dialog open={showTermsDialog} onOpenChange={setShowTermsDialog}>
                              <DialogTrigger asChild>
                                <button type="button" className="text-primary hover:underline inline-flex items-center gap-1">
                                  <FileText className="h-3 w-3" />
                                  الشروط والأحكام
                                </button>
                              </DialogTrigger>
                              <DialogContent className="max-w-2xl max-h-[80vh]">
                                <DialogHeader>
                                  <DialogTitle className="flex items-center gap-2">
                                    <FileText className="h-5 w-5" />
                                    الشروط والأحكام
                                  </DialogTitle>
                                </DialogHeader>
                                <ScrollArea className="h-[60vh] mt-4">
                                  <div className="prose prose-sm dark:prose-invert whitespace-pre-wrap" dir="rtl">
                                    {termsContent}
                                  </div>
                                </ScrollArea>
                              </DialogContent>
                            </Dialog>
                          </Label>
                        </div>
                      </div>
                    )}
                    
                    <Button 
                      type="submit" 
                      className="w-full h-11"
                      disabled={registerLoading || (termsEnabled && !acceptedTerms)}
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
          
          {/* Department Head Link */}
          <div className="text-center mt-4">
            <Link 
              to="/auth/department-head"
              className="inline-flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors text-sm"
            >
              <Users className="h-4 w-4" />
              تسجيل كرئيس قسم
            </Link>
          </div>
          
          <p className="text-center text-sm text-muted-foreground mt-6">
            منصة كويتية 🇰🇼 صُممت للمعلم في الكويت
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
