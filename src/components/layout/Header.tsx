import { Menu, Bell, Search } from 'lucide-react';
import { useLocation } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { useProfile } from '@/hooks/useProfile';
import { useAdminProfile } from '@/hooks/useAdminProfile';
import { useIsAdmin } from '@/hooks/useUserRole';

interface HeaderProps {
  onMenuClick: () => void;
}

export function Header({ onMenuClick }: HeaderProps) {
  const location = useLocation();
  const { isAdmin } = useIsAdmin();
  const { profile: teacherProfile } = useProfile();
  const { profile: adminProfile } = useAdminProfile();
  
  const isAdminRoute = location.pathname.startsWith('/admin');
  
  // Use admin profile for admin routes, teacher profile otherwise
  const displayName = isAdminRoute && isAdmin 
    ? (adminProfile?.full_name || 'مشرف')
    : (teacherProfile?.full_name || 'معلم');
  
  const roleLabel = isAdminRoute && isAdmin ? 'مشرف' : 'معلم';
  const initials = displayName.charAt(0);

  return (
    <header className="sticky top-0 z-30 bg-card/80 backdrop-blur-lg border-b border-border">
      <div className="flex items-center justify-between h-16 px-4 lg:px-6">
        {/* Left side */}
        <div className="flex items-center gap-4">
          <Button
            variant="ghost"
            size="icon"
            className="lg:hidden"
            onClick={onMenuClick}
          >
            <Menu className="w-5 h-5" />
          </Button>
          
          {/* Search - Hidden on mobile */}
          <div className="hidden md:flex items-center">
            <div className="relative">
              <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                placeholder="بحث..."
                className="w-64 pr-10 bg-muted/50 border-0 focus-visible:ring-1"
              />
            </div>
          </div>
        </div>

        {/* Right side */}
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="icon" className="relative">
            <Bell className="w-5 h-5" />
            <span className="absolute top-1 right-1 w-2 h-2 bg-destructive rounded-full" />
          </Button>
          
          <div className="flex items-center gap-3 pr-3 border-r border-border">
            <div className="hidden sm:block text-left">
              <p className="text-sm font-medium">{displayName}</p>
              <p className="text-xs text-muted-foreground">{roleLabel}</p>
            </div>
            <Avatar className="w-9 h-9 border-2 border-primary/20">
              <AvatarFallback className="bg-primary/10 text-primary font-medium">
                {initials}
              </AvatarFallback>
            </Avatar>
          </div>
        </div>
      </div>
    </header>
  );
}