import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { InputOTP, InputOTPGroup, InputOTPSlot } from '@/components/ui/input-otp';
import { toast } from 'sonner';
import { useAuth } from '@/hooks/useAuth';
import { Phone, ArrowLeft, Loader2, GraduationCap, Mail, Lock, Shield } from 'lucide-react';
import heroBg from '@/assets/hero-bg.jpg';

const DEFAULT_OTP = '12345';

export default function Auth() {
  const [authMode, setAuthMode] = useState<'teacher' | 'admin'>('teacher');
  const [step, setStep] = useState<'phone' | 'otp'>('phone');
  const [phone, setPhone] = useState('');
  const [otp, setOtp] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [isNewUser, setIsNewUser] = useState(false);
  const navigate = useNavigate();
  const { signIn, signUp } = useAuth();

  const handleSendOTP = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!phone || phone.length < 9) {
      toast.error('يرجى إدخال رقم هاتف صحيح');
      return;
    }

    setLoading(true);
    
    try {
      // Check if user exists by trying to sign in
      const emailFromPhone = `${phone}@phone.teacherhub.app`;
      const passwordFromPhone = `phone_${phone}_secure_2024`;
      
      const { error: signInError } = await signIn(emailFromPhone, passwordFromPhone);
      
      // If sign in succeeds, user exists
      if (!signInError) {
        setIsNewUser(false);
        toast.success('مرحباً بعودتك!');
        navigate('/dashboard');
        return;
      }
      
      // If error is "Invalid login credentials", user doesn't exist
      // For any other error, we'll treat as new user to be safe
      setIsNewUser(true);
      
      // Simulate OTP sending
      await new Promise(resolve => setTimeout(resolve, 500));
      
      toast.success(`تم إرسال رمز التحقق إلى ${phone}`);
      setStep('otp');
    } catch (error) {
      // Treat as new user
      setIsNewUser(true);
      toast.success(`تم إرسال رمز التحقق إلى ${phone}`);
      setStep('otp');
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOTP = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (otp !== DEFAULT_OTP) {
      toast.error('رمز التحقق غير صحيح');
      return;
    }

    setLoading(true);

    try {
      const emailFromPhone = `${phone}@phone.teacherhub.app`;
      const passwordFromPhone = `phone_${phone}_secure_2024`;

      // New user - sign up
      const { error: signUpError } = await signUp(emailFromPhone, passwordFromPhone, phone);
      
      if (signUpError) {
        // If user already exists (race condition), try to sign in
        if (signUpError.message.includes('already registered')) {
          const { error: signInError } = await signIn(emailFromPhone, passwordFromPhone);
          if (signInError) throw signInError;
          toast.success('مرحباً بعودتك!');
          navigate('/dashboard');
          return;
        }
        throw signUpError;
      }
      
      // New user created - go to complete profile
      toast.success('تم إنشاء حسابك بنجاح');
      navigate('/complete-profile');
    } catch (error: any) {
      toast.error(error.message || 'حدث خطأ أثناء التحقق');
    } finally {
      setLoading(false);
    }
  };

  const handleAdminLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!email || !password) {
      toast.error('يرجى إدخال البريد الإلكتروني وكلمة المرور');
      return;
    }

    setLoading(true);

    try {
      const { error } = await signIn(email, password);
      
      if (error) {
        if (error.message.includes('Invalid login credentials')) {
          toast.error('البريد الإلكتروني أو كلمة المرور غير صحيحة');
        } else {
          toast.error(error.message);
        }
        return;
      }
      
      toast.success('مرحباً بك!');
      navigate('/dashboard');
    } catch (error: any) {
      toast.error(error.message || 'حدث خطأ أثناء تسجيل الدخول');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex" dir="rtl">
      {/* Form Section */}
      <div className="flex-1 flex items-center justify-center p-8 bg-background">
        <Card className="w-full max-w-md border-0 shadow-none">
          <CardHeader className="text-center">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl gradient-hero mb-4 mx-auto">
              <GraduationCap className="w-8 h-8 text-primary-foreground" />
            </div>
            <CardTitle className="text-2xl font-bold">TeacherHub</CardTitle>
            <CardDescription>
              {authMode === 'teacher' 
                ? (step === 'phone' ? 'أدخل رقم هاتفك للمتابعة' : 'أدخل رمز التحقق المرسل إليك')
                : 'تسجيل دخول المشرفين'}
            </CardDescription>
          </CardHeader>
          <CardContent>
            {authMode === 'teacher' ? (
              // Teacher Phone Login
              <>
                {step === 'phone' ? (
                  <form onSubmit={handleSendOTP} className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="phone">رقم الهاتف</Label>
                      <div className="relative">
                        <Phone className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                        <Input
                          id="phone"
                          type="tel"
                          placeholder="05xxxxxxxx"
                          value={phone}
                          onChange={(e) => setPhone(e.target.value)}
                          className="pr-10"
                          dir="ltr"
                        />
                      </div>
                    </div>
                    <Button type="submit" className="w-full gradient-hero h-12" disabled={loading}>
                      {loading ? (
                        <>
                          <Loader2 className="ml-2 h-4 w-4 animate-spin" />
                          جاري التحقق...
                        </>
                      ) : (
                        'متابعة'
                      )}
                    </Button>
                  </form>
                ) : (
                  <form onSubmit={handleVerifyOTP} className="space-y-6">
                    <Button
                      type="button"
                      variant="ghost"
                      className="mb-4"
                      onClick={() => {
                        setStep('phone');
                        setOtp('');
                      }}
                    >
                      <ArrowLeft className="ml-2 h-4 w-4" />
                      تغيير رقم الهاتف
                    </Button>
                    
                    <div className="space-y-2">
                      <Label>رمز التحقق</Label>
                      <p className="text-sm text-muted-foreground mb-4">
                        تم إرسال الرمز إلى {phone}
                      </p>
                      <div className="flex justify-center" dir="ltr">
                        <InputOTP
                          maxLength={5}
                          value={otp}
                          onChange={(value) => setOtp(value)}
                        >
                          <InputOTPGroup>
                            <InputOTPSlot index={0} />
                            <InputOTPSlot index={1} />
                            <InputOTPSlot index={2} />
                            <InputOTPSlot index={3} />
                            <InputOTPSlot index={4} />
                          </InputOTPGroup>
                        </InputOTP>
                      </div>
                    </div>
                    
                    <Button type="submit" className="w-full gradient-hero h-12" disabled={loading || otp.length !== 5}>
                      {loading ? (
                        <>
                          <Loader2 className="ml-2 h-4 w-4 animate-spin" />
                          جاري التحقق...
                        </>
                      ) : (
                        'تحقق'
                      )}
                    </Button>
                    
                    <p className="text-center text-sm text-muted-foreground">
                      رمز التحقق الافتراضي: <span className="font-mono font-bold">12345</span>
                    </p>
                  </form>
                )}

                {/* Switch to Admin */}
                <div className="mt-6 pt-6 border-t">
                  <Button
                    type="button"
                    variant="ghost"
                    className="w-full text-muted-foreground"
                    onClick={() => {
                      setAuthMode('admin');
                      setStep('phone');
                      setOtp('');
                    }}
                  >
                    <Shield className="ml-2 h-4 w-4" />
                    تسجيل دخول المشرفين
                  </Button>
                </div>
              </>
            ) : (
              // Admin Email Login
              <>
                <form onSubmit={handleAdminLogin} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="email">البريد الإلكتروني</Label>
                    <div className="relative">
                      <Mail className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                      <Input
                        id="email"
                        type="email"
                        placeholder="admin@example.com"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        className="pr-10"
                        dir="ltr"
                      />
                    </div>
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="password">كلمة المرور</Label>
                    <div className="relative">
                      <Lock className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                      <Input
                        id="password"
                        type="password"
                        placeholder="••••••••"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        className="pr-10"
                        dir="ltr"
                      />
                    </div>
                  </div>
                  
                  <Button type="submit" className="w-full gradient-hero h-12" disabled={loading}>
                    {loading ? (
                      <>
                        <Loader2 className="ml-2 h-4 w-4 animate-spin" />
                        جاري تسجيل الدخول...
                      </>
                    ) : (
                      'تسجيل الدخول'
                    )}
                  </Button>
                </form>

                {/* Switch to Teacher */}
                <div className="mt-6 pt-6 border-t">
                  <Button
                    type="button"
                    variant="ghost"
                    className="w-full text-muted-foreground"
                    onClick={() => {
                      setAuthMode('teacher');
                      setEmail('');
                      setPassword('');
                    }}
                  >
                    <Phone className="ml-2 h-4 w-4" />
                    تسجيل دخول المعلمين
                  </Button>
                </div>
              </>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Hero Section */}
      <div 
        className="hidden lg:flex flex-1 items-center justify-center p-12 relative overflow-hidden"
        style={{
          backgroundImage: `url(${heroBg})`,
          backgroundSize: 'cover',
          backgroundPosition: 'center',
        }}
      >
        <div className="absolute inset-0 bg-gradient-to-br from-primary/80 to-secondary/80" />
        <div className="relative z-10 text-center max-w-lg">
          <h2 className="text-4xl font-bold text-primary-foreground mb-4">
            {authMode === 'teacher' ? 'إدارة صفوفك بسهولة' : 'لوحة إدارة النظام'}
          </h2>
          <p className="text-lg text-primary-foreground/90">
            {authMode === 'teacher' 
              ? 'تتبع الحضور، الدرجات، والسلوك من مكان واحد. صُمم خصيصًا للمعلمين لتوفير الوقت والجهد.'
              : 'إدارة المراحل التعليمية والمواد والمعلمين من مكان واحد.'}
          </p>
        </div>
      </div>
    </div>
  );
}
