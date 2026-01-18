import React from 'react';
import { cn } from '@/lib/utils';
import { LucideIcon } from 'lucide-react';
import { cva, type VariantProps } from 'class-variance-authority';

/**
 * GlassIcon - Unified icon component using design system tokens
 * 
 * Variants:
 * - default: Primary gradient (for navigation/active states)
 * - secondary: Muted background (for inactive/secondary states)
 * - accent: Accent color (for special highlights)
 * - success: Success state
 * - destructive: Error/danger state  
 * - warning: Warning state
 * - muted: Very subtle background
 * - ghost: No background, just icon color
 * - outline: Border only, no background
 */
const glassIconVariants = cva(
  [
    "relative inline-flex items-center justify-center",
    "rounded-xl transition-all duration-200",
  ].join(" "),
  {
    variants: {
      variant: {
        // Primary - Uses design system gradient
        default: [
          "gradient-primary text-primary-foreground",
          "shadow-md",
        ].join(" "),
        // Secondary - Muted background
        secondary: [
          "bg-muted text-muted-foreground",
        ].join(" "),
        // Accent - Uses accent color
        accent: [
          "bg-accent text-accent-foreground",
          "shadow-md",
        ].join(" "),
        // Success state
        success: [
          "bg-success text-success-foreground",
          "shadow-md",
        ].join(" "),
        // Destructive/Error state
        destructive: [
          "bg-destructive text-destructive-foreground",
          "shadow-md",
        ].join(" "),
        // Warning state
        warning: [
          "bg-warning text-warning-foreground",
          "shadow-md",
        ].join(" "),
        // Very muted/subtle
        muted: [
          "bg-muted/60 text-muted-foreground",
        ].join(" "),
        // Ghost - no background
        ghost: [
          "bg-transparent text-foreground/70",
          "hover:bg-muted/40",
        ].join(" "),
        // Outline - border only
        outline: [
          "bg-transparent border border-border text-foreground",
          "hover:bg-muted/20",
        ].join(" "),
      },
      size: {
        xs: "p-1.5",
        sm: "p-2",
        default: "p-2.5",
        lg: "p-3",
        xl: "p-4",
      },
      glow: {
        true: "shadow-glow",
        false: "",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
      glow: false,
    },
  }
);

const iconSizeMap = {
  xs: "w-3 h-3",
  sm: "w-4 h-4",
  default: "w-5 h-5",
  lg: "w-6 h-6",
  xl: "w-7 h-7",
};

export interface GlassIconProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof glassIconVariants> {
  icon: LucideIcon;
  iconClassName?: string;
}

const GlassIcon = React.forwardRef<HTMLDivElement, GlassIconProps>(
  ({ className, variant, size, glow, icon: Icon, iconClassName, ...props }, ref) => {
    const iconSize = iconSizeMap[size || "default"];
    
    return (
      <div
        ref={ref}
        className={cn(glassIconVariants({ variant, size, glow, className }))}
        {...props}
      >
        <Icon className={cn(iconSize, "flex-shrink-0", iconClassName)} />
      </div>
    );
  }
);

GlassIcon.displayName = "GlassIcon";

// Wrapper component for inline icon usage with glass effect
export interface GlassIconWrapperProps extends React.HTMLAttributes<HTMLSpanElement> {
  children: React.ReactNode;
  variant?: "default" | "secondary" | "accent" | "success" | "destructive" | "warning" | "muted" | "ghost";
  size?: "xs" | "sm" | "default" | "lg" | "xl";
  glow?: boolean;
}

const GlassIconWrapper = React.forwardRef<HTMLSpanElement, GlassIconWrapperProps>(
  ({ className, variant = "default", size = "default", glow = false, children, ...props }, ref) => {
    return (
      <span
        ref={ref}
        className={cn(glassIconVariants({ variant, size, glow, className }))}
        {...props}
      >
        {children}
      </span>
    );
  }
);

GlassIconWrapper.displayName = "GlassIconWrapper";

export { GlassIcon, GlassIconWrapper, glassIconVariants };
