import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { toast } from 'sonner';
import { useAuth } from '@/hooks/useAuth';
import { useUserRole } from '@/hooks/useUserRole';
import { Mail, Lock, Loader2, Shield, LogOut, AlertTriangle } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import logo from '@/assets/logo.png';

export default function AdminAuth() {
  const [action, setAction] = useState<'login' | 'signup'>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const { user, signIn, signUp, signOut } = useAuth();
  const { data: userRole } = useUserRole();
  
  // Check if user is logged in with a different role
  const isLoggedInWithDifferentRole = user && userRole && userRole.role !== 'admin';

  const handleSwitchAccount = async () => {
    await signOut();
    toast.success('تم تسجيل الخروج، يمكنك الآن تسجيل الدخول كمشرف');
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!email || !password) {
      toast.error('يرجى إدخال البريد الإلكتروني وكلمة المرور');
      return;
    }

    // Sign out current user if logged in with different role
    if (isLoggedInWithDifferentRole) {
      await signOut();
    }

    setLoading(true);

    try {
      const { error, data } = await signIn(email, password);
      
      if (error) {
        if (error.message.includes('Invalid login credentials')) {
          toast.error('البريد الإلكتروني أو كلمة المرور غير صحيحة');
        } else {
          toast.error(error.message);
        }
        return;
      }
      
      // Wait for session to be confirmed
      if (data?.session) {
        toast.success('مرحباً بك!');
        setTimeout(() => {
          navigate('/admin', { replace: true });
        }, 100);
      }
    } catch (error: any) {
      toast.error(error.message || 'حدث خطأ أثناء تسجيل الدخول');
    } finally {
      setLoading(false);
    }
  };

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!email || !password || !confirmPassword) {
      toast.error('يرجى ملء جميع الحقول');
      return;
    }

    if (password !== confirmPassword) {
      toast.error('كلمات المرور غير متطابقة');
      return;
    }

    if (password.length < 6) {
      toast.error('كلمة المرور يجب أن تكون 6 أحرف على الأقل');
      return;
    }

    setLoading(true);

    try {
      const { data, error } = await signUp(email, password, 'مشرف');
      
      if (error) {
        if (error.message.includes('already registered')) {
          toast.error('هذا البريد الإلكتروني مسجل بالفعل');
        } else {
          toast.error(error.message);
        }
        return;
      }

      // Add admin role and create admin profile for the new user
      if (data?.user) {
        // Add admin role
        const { error: roleError } = await supabase
          .from('user_roles')
          .insert({ user_id: data.user.id, role: 'admin' });
        
        if (roleError) {
          console.error('Error adding admin role:', roleError);
        }

        // Create admin profile in admin_profiles table
        const { error: adminProfileError } = await supabase
          .from('admin_profiles')
          .insert({ 
            user_id: data.user.id, 
            full_name: 'مشرف',
            email: email 
          });
        
        if (adminProfileError) {
          console.error('Error creating admin profile:', adminProfileError);
        }

        // Mark regular profile as complete (to avoid redirect to complete-profile)
        const { error: profileError } = await supabase
          .from('profiles')
          .update({ is_profile_complete: true })
          .eq('user_id', data.user.id);
        
        if (profileError) {
          console.error('Error updating profile:', profileError);
        }
      }
      
      toast.success('تم إنشاء الحساب بنجاح! يمكنك الآن تسجيل الدخول');
      setAction('login');
      setPassword('');
      setConfirmPassword('');
    } catch (error: any) {
      toast.error(error.message || 'حدث خطأ أثناء إنشاء الحساب');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-900 to-slate-800 p-4" dir="rtl">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-background/90 mb-4 mx-auto">
            <img src={logo} alt="Teacher Hub" className="w-14 h-14 object-contain" />
          </div>
          <CardTitle className="text-2xl font-bold">لوحة تحكم المشرفين</CardTitle>
          <CardDescription>
            {action === 'login' ? 'تسجيل الدخول للوحة التحكم' : 'إنشاء حساب مشرف جديد'}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {/* Alert for logged in users with different role */}
          {isLoggedInWithDifferentRole && (
            <Alert className="mb-4 border-amber-200 bg-amber-50 dark:border-amber-800 dark:bg-amber-950">
              <AlertTriangle className="h-4 w-4 text-amber-600" />
              <AlertDescription className="text-amber-800 dark:text-amber-200">
                أنت مسجل دخول كـ <strong>{userRole?.role === 'user' ? 'معلم' : 'رئيس قسم'}</strong>.
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
          
          <form onSubmit={action === 'login' ? handleLogin : handleSignup} className="space-y-4">
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

            {action === 'signup' && (
              <div className="space-y-2">
                <Label htmlFor="confirmPassword">تأكيد كلمة المرور</Label>
                <div className="relative">
                  <Lock className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="confirmPassword"
                    type="password"
                    placeholder="••••••••"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    className="pr-10"
                    dir="ltr"
                  />
                </div>
              </div>
            )}
            
            <Button type="submit" className="w-full h-12" disabled={loading}>
              {loading ? (
                <>
                  <Loader2 className="ml-2 h-4 w-4 animate-spin" />
                  {action === 'login' ? 'جاري تسجيل الدخول...' : 'جاري إنشاء الحساب...'}
                </>
              ) : (
                action === 'login' ? 'تسجيل الدخول' : 'إنشاء حساب'
              )}
            </Button>
          </form>

          <div className="mt-6 text-center">
            <Button
              type="button"
              variant="link"
              className="text-primary"
              onClick={() => {
                setAction(action === 'login' ? 'signup' : 'login');
                setPassword('');
                setConfirmPassword('');
              }}
            >
              {action === 'login' ? 'إنشاء حساب مشرف جديد' : 'لديك حساب؟ تسجيل الدخول'}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
