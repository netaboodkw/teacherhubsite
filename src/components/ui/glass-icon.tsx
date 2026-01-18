import React from 'react';
import { cn } from '@/lib/utils';
import { LucideIcon } from 'lucide-react';
import { cva, type VariantProps } from 'class-variance-authority';

const glassIconVariants = cva(
  [
    "relative inline-flex items-center justify-center",
    "rounded-full transition-all duration-200",
  ].join(" "),
  {
    variants: {
      variant: {
        default: [
          "bg-primary/15 text-primary",
        ].join(" "),
        secondary: [
          "bg-muted text-muted-foreground",
        ].join(" "),
        accent: [
          "bg-accent/20 text-accent-foreground",
        ].join(" "),
        success: [
          "bg-emerald-500/15 text-emerald-600 dark:text-emerald-400",
        ].join(" "),
        destructive: [
          "bg-destructive/15 text-destructive",
        ].join(" "),
        warning: [
          "bg-amber-500/15 text-amber-600 dark:text-amber-400",
        ].join(" "),
        muted: [
          "bg-muted/80 text-muted-foreground",
        ].join(" "),
        ghost: [
          "bg-transparent text-foreground/70",
          "hover:bg-muted/40",
        ].join(" "),
        // Solid color variants for more vibrant looks
        blue: [
          "bg-blue-500/15 text-blue-600 dark:text-blue-400",
        ].join(" "),
        purple: [
          "bg-purple-500/15 text-purple-600 dark:text-purple-400",
        ].join(" "),
        pink: [
          "bg-pink-500/15 text-pink-600 dark:text-pink-400",
        ].join(" "),
        orange: [
          "bg-orange-500/15 text-orange-600 dark:text-orange-400",
        ].join(" "),
        cyan: [
          "bg-cyan-500/15 text-cyan-600 dark:text-cyan-400",
        ].join(" "),
        indigo: [
          "bg-indigo-500/15 text-indigo-600 dark:text-indigo-400",
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
        true: "",
        false: "",
      },
    },
    compoundVariants: [
      {
        variant: "default",
        glow: true,
        className: "shadow-[0_0_12px_hsl(var(--primary)/0.25)]",
      },
      {
        variant: "success",
        glow: true,
        className: "shadow-[0_0_12px_rgba(16,185,129,0.25)]",
      },
      {
        variant: "destructive",
        glow: true,
        className: "shadow-[0_0_12px_hsl(var(--destructive)/0.25)]",
      },
      {
        variant: "warning",
        glow: true,
        className: "shadow-[0_0_12px_rgba(245,158,11,0.25)]",
      },
      {
        variant: "blue",
        glow: true,
        className: "shadow-[0_0_12px_rgba(59,130,246,0.25)]",
      },
      {
        variant: "purple",
        glow: true,
        className: "shadow-[0_0_12px_rgba(168,85,247,0.25)]",
      },
    ],
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
  variant?: "default" | "secondary" | "accent" | "success" | "destructive" | "warning" | "muted" | "ghost" | "blue" | "purple" | "pink" | "orange" | "cyan" | "indigo";
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
