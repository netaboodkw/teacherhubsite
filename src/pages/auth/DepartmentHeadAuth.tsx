import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { toast } from 'sonner';
import { Loader2, ArrowLeft, Mail, Lock, User, Eye, EyeOff, Phone, Users } from 'lucide-react';
import heroBg from '@/assets/hero-bg.jpg';
import logo from '@/assets/logo.png';

export default function DepartmentHeadAuth() {
  const navigate = useNavigate();
  const { signIn, signUp } = useAuth();
  
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
      
      // Check if user is a department head
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        const { data: dhProfile } = await supabase
          .from('department_heads')
          .select('id')
          .eq('user_id', user.id)
          .maybeSingle();

        if (!dhProfile) {
          await supabase.auth.signOut();
          toast.error('هذا الحساب ليس حساب رئيس قسم');
          return;
        }
      }
      
      toast.success('تم تسجيل الدخول بنجاح');
      navigate('/department-head');
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
      
      toast.success('تم إنشاء الحساب بنجاح');
      navigate('/department-head');
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
              <div className="flex items-center justify-center mb-2">
                <img src={logo} alt="Teacher Hub" className="w-16 h-16 object-contain" />
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
