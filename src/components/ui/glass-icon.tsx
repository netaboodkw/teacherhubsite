import React from 'react';
import { cn } from '@/lib/utils';
import { LucideIcon } from 'lucide-react';
import { cva, type VariantProps } from 'class-variance-authority';

const glassIconVariants = cva(
  [
    "relative inline-flex items-center justify-center",
    "rounded-2xl transition-all duration-200",
  ].join(" "),
  {
    variants: {
      variant: {
        default: [
          "bg-gradient-to-br from-sky-300 via-blue-400 to-teal-400 text-white",
          "shadow-lg shadow-blue-400/30",
        ].join(" "),
        secondary: [
          "bg-muted text-muted-foreground",
        ].join(" "),
        accent: [
          "bg-gradient-to-br from-violet-300 via-purple-400 to-fuchsia-400 text-white",
          "shadow-lg shadow-purple-400/30",
        ].join(" "),
        success: [
          "bg-gradient-to-br from-emerald-300 via-green-400 to-teal-400 text-white",
          "shadow-lg shadow-green-400/30",
        ].join(" "),
        destructive: [
          "bg-gradient-to-br from-red-300 via-rose-400 to-pink-400 text-white",
          "shadow-lg shadow-rose-400/30",
        ].join(" "),
        warning: [
          "bg-gradient-to-br from-amber-300 via-orange-400 to-yellow-400 text-white",
          "shadow-lg shadow-orange-400/30",
        ].join(" "),
        muted: [
          "bg-muted/80 text-muted-foreground",
        ].join(" "),
        ghost: [
          "bg-transparent text-foreground/70",
          "hover:bg-muted/40",
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
        className: "shadow-[0_0_20px_rgba(59,130,246,0.4)]",
      },
      {
        variant: "success",
        glow: true,
        className: "shadow-[0_0_20px_rgba(16,185,129,0.4)]",
      },
      {
        variant: "destructive",
        glow: true,
        className: "shadow-[0_0_20px_rgba(244,63,94,0.4)]",
      },
      {
        variant: "warning",
        glow: true,
        className: "shadow-[0_0_20px_rgba(245,158,11,0.4)]",
      },
      {
        variant: "accent",
        glow: true,
        className: "shadow-[0_0_20px_rgba(168,85,247,0.4)]",
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
