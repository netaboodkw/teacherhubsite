import React from 'react';
import { LucideIcon } from 'lucide-react';
import { GlassIcon } from '@/components/ui/glass-icon';
import { cn } from '@/lib/utils';

interface PageHeaderProps {
  icon: LucideIcon;
  title: string;
  subtitle?: string;
  actions?: React.ReactNode;
  className?: string;
}

/**
 * PageHeader - Unified page header component
 * 
 * Always shows a colored icon next to the title for consistency
 */
export function PageHeader({ icon, title, subtitle, actions, className }: PageHeaderProps) {
  return (
    <div className={cn(
      "flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4",
      className
    )}>
      <div className="flex items-center gap-3">
        <GlassIcon icon={icon} variant="default" size="lg" />
        <div>
          <h1 className="text-2xl lg:text-3xl font-bold text-foreground">{title}</h1>
          {subtitle && (
            <p className="text-muted-foreground mt-1">{subtitle}</p>
          )}
        </div>
      </div>
      {actions && (
        <div className="flex gap-2 flex-wrap">
          {actions}
        </div>
      )}
    </div>
  );
}
