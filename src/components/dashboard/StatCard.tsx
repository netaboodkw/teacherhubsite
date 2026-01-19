import { LucideIcon } from 'lucide-react';
import { cn } from '@/lib/utils';

interface StatCardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  icon: LucideIcon;
  trend?: {
    value: number;
    isPositive: boolean;
  };
  variant?: 'primary' | 'secondary' | 'accent' | 'success';
}

const variantStyles = {
  primary: 'bg-primary',
  secondary: 'bg-secondary',
  accent: 'bg-accent',
  success: 'bg-success',
};

export function StatCard({ title, value, subtitle, icon: Icon, trend, variant = 'primary' }: StatCardProps) {
  return (
    <div className="group relative overflow-hidden rounded-2xl bg-card p-6 shadow-sm border border-border hover:shadow-md transition-all duration-300">
      {/* Background decoration */}
      <div className={cn(
        "absolute top-0 left-0 w-24 h-24 rounded-full opacity-10 -translate-x-8 -translate-y-8 transition-transform group-hover:scale-150",
        variantStyles[variant]
      )} />
      
      <div className="relative flex items-start justify-between">
        <div className="space-y-2">
          <p className="text-sm font-medium text-muted-foreground">{title}</p>
          <p className="text-3xl font-bold text-foreground">{value}</p>
          {subtitle && (
            <p className="text-sm text-muted-foreground">{subtitle}</p>
          )}
          {trend && (
            <div className={cn(
              "inline-flex items-center gap-1 text-xs font-medium px-2 py-1 rounded-full",
              trend.isPositive 
                ? "bg-success/10 text-success" 
                : "bg-destructive/10 text-destructive"
            )}>
              {trend.isPositive ? '↑' : '↓'} {Math.abs(trend.value)}%
            </div>
          )}
        </div>
        
        <div className={cn(
          "p-3 rounded-xl text-primary-foreground",
          variantStyles[variant]
        )}>
          <Icon className="w-6 h-6" />
        </div>
      </div>
    </div>
  );
}
