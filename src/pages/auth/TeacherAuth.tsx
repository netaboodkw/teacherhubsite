import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { InputOTP, InputOTPGroup, InputOTPSlot } from '@/components/ui/input-otp';
import { toast } from 'sonner';
import { useAuth } from '@/hooks/useAuth';
import { Phone, ArrowLeft, Loader2, GraduationCap, Timer } from 'lucide-react';
import heroBg from '@/assets/hero-bg.jpg';
import { supabase } from '@/integrations/supabase/client';

const KUWAIT_PHONE_REGEX = /^[569]\d{7}$/;
const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL;
const RESEND_COOLDOWN = 60; // seconds

export default function TeacherAuth() {
  const [step, setStep] = useState<'phone' | 'otp'>('phone');
  const [phone, setPhone] = useState('');
  const [otp, setOtp] = useState('');
  const [loading, setLoading] = useState(false);
  const [isNewUser, setIsNewUser] = useState(false);
  const [resendLoading, setResendLoading] = useState(false);
  const [countdown, setCountdown] = useState(0);
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const navigate = useNavigate();
  const { signIn, signUp } = useAuth();

  // Countdown timer effect
  useEffect(() => {
    if (countdown > 0) {
      timerRef.current = setTimeout(() => {
        setCountdown(countdown - 1);
      }, 1000);
    }
    return () => {
      if (timerRef.current) {
        clearTimeout(timerRef.current);
      }
    };
  }, [countdown]);

  // Start countdown when entering OTP step
  useEffect(() => {
    if (step === 'otp') {
      setCountdown(RESEND_COOLDOWN);
    } else {
      setCountdown(0);
    }
  }, [step]);

  const validateKuwaitiPhone = (phoneNumber: string): boolean => {
    return KUWAIT_PHONE_REGEX.test(phoneNumber);
  };

  const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value.replace(/\D/g, '').slice(0, 8);
    setPhone(value);
  };

  const sendOTP = async (phoneNumber: string): Promise<boolean> => {
    try {
      const response = await fetch(`${SUPABASE_URL}/functions/v1/send-otp`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ phone: phoneNumber, action: 'send' }),
      });

      const data = await response.json();

      if (!response.ok) {
        toast.error(data.error || 'فشل في إرسال رمز التحقق');
        return false;
      }

      return true;
    } catch (error) {
      console.error('Error sending OTP:', error);
      toast.error('حدث خطأ أثناء إرسال رمز التحقق');
      return false;
    }
  };

  const verifyOTP = async (phoneNumber: string, otpCode: string): Promise<boolean> => {
    try {
      const response = await fetch(`${SUPABASE_URL}/functions/v1/send-otp`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ phone: phoneNumber, action: 'verify', otp: otpCode }),
      });

      const data = await response.json();

      if (!response.ok) {
        toast.error(data.error || 'فشل في التحقق');
        return false;
      }

      return data.verified === true;
    } catch (error) {
      console.error('Error verifying OTP:', error);
      toast.error('حدث خطأ أثناء التحقق');
      return false;
    }
  };

  const handleSendOTP = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateKuwaitiPhone(phone)) {
      toast.error('يرجى إدخال رقم هاتف كويتي صحيح (8 أرقام يبدأ بـ 5 أو 6 أو 9)');
      return;
    }

    setLoading(true);
    
    try {
      const emailFromPhone = `${phone}@phone.teacherhub.app`;
      const passwordFromPhone = `phone_${phone}_secure_2024`;
      
      // Check if user exists (without logging in)
      const { error: signInError } = await supabase.auth.signInWithPassword({
        email: emailFromPhone,
        password: passwordFromPhone,
      });
      
      // Sign out immediately - we just wanted to check if user exists
      await supabase.auth.signOut();
      
      if (!signInError) {
        // Existing user - will need to verify OTP then sign in
        setIsNewUser(false);
      } else {
        // New user
        setIsNewUser(true);
      }
      
      // Always send OTP regardless of user existence
      const otpSent = await sendOTP(phone);
      
      if (otpSent) {
        toast.success(`تم إرسال رمز التحقق إلى ${phone}`);
        setStep('otp');
      }
    } catch (error) {
      console.error('Error in handleSendOTP:', error);
      toast.error('حدث خطأ، يرجى المحاولة مرة أخرى');
    } finally {
      setLoading(false);
    }
  };

  const handleResendOTP = async () => {
    if (countdown > 0) return;
    
    setResendLoading(true);
    const otpSent = await sendOTP(phone);
    if (otpSent) {
      toast.success('تم إعادة إرسال رمز التحقق');
      setCountdown(RESEND_COOLDOWN);
    }
    setResendLoading(false);
  };

  const handleVerifyOTP = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (otp.length !== 6) {
      toast.error('يرجى إدخال رمز التحقق كاملاً');
      return;
    }

    setLoading(true);

    try {
      // Verify OTP with Twilio
      const isVerified = await verifyOTP(phone, otp);
      
      if (!isVerified) {
        setLoading(false);
        return;
      }

      const emailFromPhone = `${phone}@phone.teacherhub.app`;
      const passwordFromPhone = `phone_${phone}_secure_2024`;

      if (isNewUser) {
        // New user - sign up
        const { error: signUpError } = await signUp(emailFromPhone, passwordFromPhone, phone);
        
        if (signUpError) {
          if (signUpError.message.includes('already registered')) {
            // User already exists, try to sign in
            const { error: signInError } = await signIn(emailFromPhone, passwordFromPhone);
            if (signInError) throw signInError;
            toast.success('مرحباً بعودتك!');
            navigate('/teacher');
            return;
          }
          throw signUpError;
        }
        
        toast.success('تم إنشاء حسابك بنجاح');
        navigate('/complete-profile');
      } else {
        // Existing user - sign in
        const { error: signInError } = await signIn(emailFromPhone, passwordFromPhone);
        if (signInError) throw signInError;
        
        // Check if profile is complete
        const { data: profile } = await supabase
          .from('profiles')
          .select('is_profile_complete')
          .eq('user_id', (await supabase.auth.getUser()).data.user?.id)
          .single();
        
        if (profile?.is_profile_complete) {
          toast.success('مرحباً بعودتك!');
          navigate('/teacher');
        } else {
          navigate('/complete-profile');
        }
      }
    } catch (error: any) {
      toast.error(error.message || 'حدث خطأ أثناء التحقق');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex" dir="rtl">
      <div className="flex-1 flex items-center justify-center p-8 bg-background">
        <Card className="w-full max-w-md border-0 shadow-none">
          <CardHeader className="text-center">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl gradient-hero mb-4 mx-auto">
              <GraduationCap className="w-8 h-8 text-primary-foreground" />
            </div>
            <CardTitle className="text-2xl font-bold">TeacherHub</CardTitle>
            <CardDescription>
              {step === 'phone' ? 'أدخل رقم هاتفك للمتابعة' : 'أدخل رمز التحقق المرسل إليك'}
            </CardDescription>
          </CardHeader>
          <CardContent>
            {step === 'phone' ? (
              <form onSubmit={handleSendOTP} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="phone">رقم الهاتف</Label>
                  <div className="relative">
                    <Phone className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="phone"
                      type="tel"
                      placeholder="9xxxxxxx"
                      value={phone}
                      onChange={handlePhoneChange}
                      className="pr-10"
                      dir="ltr"
                      maxLength={8}
                    />
                  </div>
                  <p className="text-xs text-muted-foreground">
                    رقم هاتف كويتي من 8 أرقام (يبدأ بـ 5 أو 6 أو 9)
                  </p>
                </div>
                <Button type="submit" className="w-full gradient-hero h-12" disabled={loading}>
                  {loading ? (
                    <>
                      <Loader2 className="ml-2 h-4 w-4 animate-spin" />
                      جاري الإرسال...
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
                      maxLength={6}
                      value={otp}
                      onChange={(value) => setOtp(value)}
                    >
                      <InputOTPGroup>
                        <InputOTPSlot index={0} />
                        <InputOTPSlot index={1} />
                        <InputOTPSlot index={2} />
                        <InputOTPSlot index={3} />
                        <InputOTPSlot index={4} />
                        <InputOTPSlot index={5} />
                      </InputOTPGroup>
                    </InputOTP>
                  </div>
                </div>
                
                <Button type="submit" className="w-full gradient-hero h-12" disabled={loading || otp.length !== 6}>
                  {loading ? (
                    <>
                      <Loader2 className="ml-2 h-4 w-4 animate-spin" />
                      جاري التحقق...
                    </>
                  ) : (
                    'تحقق'
                  )}
                </Button>
                
                <div className="text-center space-y-2">
                  {countdown > 0 ? (
                    <div className="flex items-center justify-center gap-2 text-sm text-muted-foreground">
                      <Timer className="h-4 w-4" />
                      <span>إعادة الإرسال بعد {countdown} ثانية</span>
                    </div>
                  ) : (
                    <Button
                      type="button"
                      variant="link"
                      onClick={handleResendOTP}
                      disabled={resendLoading}
                      className="text-sm"
                    >
                      {resendLoading ? (
                        <>
                          <Loader2 className="ml-2 h-3 w-3 animate-spin" />
                          جاري الإرسال...
                        </>
                      ) : (
                        'إعادة إرسال رمز التحقق'
                      )}
                    </Button>
                  )}
                </div>
              </form>
            )}
          </CardContent>
        </Card>
      </div>

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
            إدارة صفوفك بسهولة
          </h2>
          <p className="text-lg text-primary-foreground/90">
            تتبع الحضور، الدرجات، والسلوك من مكان واحد. صُمم خصيصًا للمعلمين لتوفير الوقت والجهد.
          </p>
        </div>
      </div>
    </div>
  );
}
