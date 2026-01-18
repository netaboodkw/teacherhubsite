import React from 'react';
import { cn } from '@/lib/utils';
import { LucideIcon } from 'lucide-react';
import { cva, type VariantProps } from 'class-variance-authority';

const glassIconVariants = cva(
  [
    "relative inline-flex items-center justify-center",
    "rounded-xl transition-all duration-300",
    "backdrop-blur-sm backdrop-saturate-150",
  ].join(" "),
  {
    variants: {
      variant: {
        default: [
          "bg-primary/10 text-primary",
          "border border-primary/20",
          "shadow-[0_2px_8px_hsl(var(--primary)/0.15)]",
          "hover:bg-primary/15 hover:shadow-[0_4px_12px_hsl(var(--primary)/0.2)]",
        ].join(" "),
        secondary: [
          "bg-secondary/40 text-secondary-foreground",
          "border border-border/30",
          "shadow-[0_2px_8px_hsl(0_0%_0%/0.05)]",
          "hover:bg-secondary/50",
        ].join(" "),
        accent: [
          "bg-accent/15 text-accent",
          "border border-accent/25",
          "shadow-[0_2px_8px_hsl(var(--accent)/0.15)]",
          "hover:bg-accent/20",
        ].join(" "),
        success: [
          "bg-success/10 text-success",
          "border border-success/20",
          "shadow-[0_2px_8px_hsl(var(--success)/0.15)]",
          "hover:bg-success/15",
        ].join(" "),
        destructive: [
          "bg-destructive/10 text-destructive",
          "border border-destructive/20",
          "shadow-[0_2px_8px_hsl(var(--destructive)/0.15)]",
          "hover:bg-destructive/15",
        ].join(" "),
        warning: [
          "bg-warning/10 text-warning",
          "border border-warning/20",
          "shadow-[0_2px_8px_hsl(var(--warning)/0.15)]",
          "hover:bg-warning/15",
        ].join(" "),
        muted: [
          "bg-muted/60 text-muted-foreground",
          "border border-border/30",
        ].join(" "),
        ghost: [
          "bg-transparent text-foreground/70",
          "hover:bg-muted/40",
        ].join(" "),
      },
      size: {
        xs: "p-1 rounded-lg",
        sm: "p-1.5 rounded-lg",
        default: "p-2 rounded-xl",
        lg: "p-2.5 rounded-xl",
        xl: "p-3 rounded-2xl",
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
        className: "shadow-[0_0_16px_hsl(var(--primary)/0.3)]",
      },
      {
        variant: "accent",
        glow: true,
        className: "shadow-[0_0_16px_hsl(var(--accent)/0.3)]",
      },
      {
        variant: "success",
        glow: true,
        className: "shadow-[0_0_16px_hsl(var(--success)/0.3)]",
      },
      {
        variant: "destructive",
        glow: true,
        className: "shadow-[0_0_16px_hsl(var(--destructive)/0.3)]",
      },
      {
        variant: "warning",
        glow: true,
        className: "shadow-[0_0_16px_hsl(var(--warning)/0.3)]",
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
