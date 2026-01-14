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
import { Mail, Lock, Loader2, LogOut, AlertTriangle } from 'lucide-react';
import logo from '@/assets/logo.png';

export default function AdminAuth() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const { user, signIn, signOut } = useAuth();
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

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-900 to-slate-800 p-4" dir="rtl">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-background/90 mb-4 mx-auto">
            <img src={logo} alt="Teacher Hub" className="w-14 h-14 object-contain" />
          </div>
          <CardTitle className="text-2xl font-bold">لوحة تحكم المشرفين</CardTitle>
          <CardDescription>
            تسجيل الدخول للوحة التحكم
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
          
          <form onSubmit={handleLogin} className="space-y-4">
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
            
            <Button type="submit" className="w-full h-12" disabled={loading}>
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
        </CardContent>
      </Card>
    </div>
  );
}
