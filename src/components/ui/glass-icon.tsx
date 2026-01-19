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
        // Custom colors for pages
        blue: [
          "bg-blue-500 text-white",
          "shadow-md shadow-blue-500/30",
        ].join(" "),
        purple: [
          "bg-purple-500 text-white",
          "shadow-md shadow-purple-500/30",
        ].join(" "),
        green: [
          "bg-emerald-500 text-white",
          "shadow-md shadow-emerald-500/30",
        ].join(" "),
        orange: [
          "bg-orange-500 text-white",
          "shadow-md shadow-orange-500/30",
        ].join(" "),
        pink: [
          "bg-pink-500 text-white",
          "shadow-md shadow-pink-500/30",
        ].join(" "),
        cyan: [
          "bg-cyan-500 text-white",
          "shadow-md shadow-cyan-500/30",
        ].join(" "),
        indigo: [
          "bg-indigo-500 text-white",
          "shadow-md shadow-indigo-500/30",
        ].join(" "),
        amber: [
          "bg-amber-500 text-white",
          "shadow-md shadow-amber-500/30",
        ].join(" "),
        rose: [
          "bg-rose-500 text-white",
          "shadow-md shadow-rose-500/30",
        ].join(" "),
        teal: [
          "bg-teal-500 text-white",
          "shadow-md shadow-teal-500/30",
        ].join(" "),
      },
      size: {
        xs: "p-1.5",
        sm: "p-2.5",
        default: "p-3",
        lg: "p-3.5",
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
  xs: "w-4 h-4",
  sm: "w-5 h-5",
  default: "w-6 h-6",
  lg: "w-7 h-7",
  xl: "w-8 h-8",
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
export type GlassIconVariant = "default" | "secondary" | "accent" | "success" | "destructive" | "warning" | "muted" | "ghost" | "outline" | "blue" | "purple" | "green" | "orange" | "pink" | "cyan" | "indigo" | "amber" | "rose" | "teal";

export interface GlassIconWrapperProps extends React.HTMLAttributes<HTMLSpanElement> {
  children: React.ReactNode;
  variant?: GlassIconVariant;
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
