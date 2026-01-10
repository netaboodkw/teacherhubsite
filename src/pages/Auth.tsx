import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { InputOTP, InputOTPGroup, InputOTPSlot } from '@/components/ui/input-otp';
import { toast } from 'sonner';
import { useAuth } from '@/hooks/useAuth';
import { Phone, ArrowLeft, Loader2, GraduationCap } from 'lucide-react';
import heroBg from '@/assets/hero-bg.jpg';

const DEFAULT_OTP = '12345';

export default function Auth() {
  const [step, setStep] = useState<'phone' | 'otp'>('phone');
  const [phone, setPhone] = useState('');
  const [otp, setOtp] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const { signIn, signUp } = useAuth();

  const handleSendOTP = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!phone || phone.length < 9) {
      toast.error('يرجى إدخال رقم هاتف صحيح');
      return;
    }

    setLoading(true);
    
    // Simulate OTP sending
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    toast.success(`تم إرسال رمز التحقق إلى ${phone}`);
    
    setStep('otp');
    setLoading(false);
  };

  const handleVerifyOTP = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (otp !== DEFAULT_OTP) {
      toast.error('رمز التحقق غير صحيح');
      return;
    }

    setLoading(true);

    try {
      // Create email from phone number for Supabase auth
      const email = `${phone}@phone.teacherhub.app`;
      const password = `phone_${phone}_secure_2024`;

      // Try to sign in first
      const { error: signInError } = await signIn(email, password);
      
      if (signInError) {
        // If sign in fails, try to sign up
        const { error: signUpError } = await signUp(email, password, phone);
        
        if (signUpError) {
          throw signUpError;
        }
        
        // New user - will need to complete profile
        toast.success('تم إنشاء حسابك بنجاح');
      } else {
        toast.success('مرحباً بعودتك!');
      }

      navigate('/');
    } catch (error: any) {
      toast.error(error.message || 'حدث خطأ أثناء التحقق');
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
              {step === 'phone' 
                ? 'أدخل رقم هاتفك للمتابعة' 
                : 'أدخل رمز التحقق المرسل إليك'}
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
                      جاري الإرسال...
                    </>
                  ) : (
                    'إرسال رمز التحقق'
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
            إدارة صفوفك بسهولة
          </h2>
          <p className="text-lg text-primary-foreground/90">
            تتبع الحضور، الدرجات، والسلوك من مكان واحد. 
            صُمم خصيصًا للمعلمين لتوفير الوقت والجهد.
          </p>
        </div>
      </div>
    </div>
  );
}
