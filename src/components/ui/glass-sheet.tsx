import * as React from "react";
import * as SheetPrimitive from "@radix-ui/react-dialog";
import { cva, type VariantProps } from "class-variance-authority";
import { X } from "lucide-react";

import { cn } from "@/lib/utils";

const GlassSheet = SheetPrimitive.Root;

const GlassSheetTrigger = SheetPrimitive.Trigger;

const GlassSheetClose = SheetPrimitive.Close;

const GlassSheetPortal = SheetPrimitive.Portal;

const GlassSheetOverlay = React.forwardRef<
  React.ElementRef<typeof SheetPrimitive.Overlay>,
  React.ComponentPropsWithoutRef<typeof SheetPrimitive.Overlay>
>(({ className, ...props }, ref) => (
  <SheetPrimitive.Overlay
    className={cn(
      "fixed inset-0 z-50",
      "bg-background/40 backdrop-blur-sm",
      "data-[state=open]:animate-in data-[state=closed]:animate-out",
      "data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0",
      className
    )}
    {...props}
    ref={ref}
  />
));
GlassSheetOverlay.displayName = SheetPrimitive.Overlay.displayName;

const sheetVariants = cva(
  cn(
    "fixed z-50 gap-4 p-6",
    "bg-background/80 backdrop-blur-xl",
    "border border-border/30",
    "shadow-2xl",
    "transition ease-in-out",
    "data-[state=closed]:duration-200 data-[state=open]:duration-300",
    "data-[state=open]:animate-in data-[state=closed]:animate-out"
  ),
  {
    variants: {
      side: {
        top: cn(
          "inset-x-0 top-0",
          "border-b rounded-b-3xl",
          "data-[state=closed]:slide-out-to-top data-[state=open]:slide-in-from-top",
          "pt-[calc(env(safe-area-inset-top)+1.5rem)]"
        ),
        bottom: cn(
          "inset-x-0 bottom-0",
          "border-t rounded-t-3xl",
          "data-[state=closed]:slide-out-to-bottom data-[state=open]:slide-in-from-bottom",
          "pb-[calc(env(safe-area-inset-bottom)+1.5rem)]"
        ),
        left: cn(
          "inset-y-0 left-0 h-full w-3/4 sm:max-w-sm",
          "border-r rounded-r-3xl",
          "data-[state=closed]:slide-out-to-left data-[state=open]:slide-in-from-left"
        ),
        right: cn(
          "inset-y-0 right-0 h-full w-3/4 sm:max-w-sm",
          "border-l rounded-l-3xl",
          "data-[state=closed]:slide-out-to-right data-[state=open]:slide-in-from-right"
        ),
      },
    },
    defaultVariants: {
      side: "bottom",
    },
  }
);

interface GlassSheetContentProps
  extends React.ComponentPropsWithoutRef<typeof SheetPrimitive.Content>,
    VariantProps<typeof sheetVariants> {}

const GlassSheetContent = React.forwardRef<
  React.ElementRef<typeof SheetPrimitive.Content>,
  GlassSheetContentProps
>(({ side = "bottom", className, children, ...props }, ref) => (
  <GlassSheetPortal>
    <GlassSheetOverlay />
    <SheetPrimitive.Content
      ref={ref}
      className={cn(sheetVariants({ side }), className)}
      {...props}
    >
      {/* Drag handle for bottom sheets */}
      {side === "bottom" && (
        <div className="absolute top-2 left-1/2 -translate-x-1/2 w-10 h-1 rounded-full bg-muted-foreground/30" />
      )}
      {children}
      <SheetPrimitive.Close className="absolute right-4 top-4 rounded-full p-2 bg-muted/50 hover:bg-muted transition-colors focus:outline-none focus:ring-2 focus:ring-ring disabled:pointer-events-none">
        <X className="h-4 w-4" />
        <span className="sr-only">Close</span>
      </SheetPrimitive.Close>
    </SheetPrimitive.Content>
  </GlassSheetPortal>
));
GlassSheetContent.displayName = SheetPrimitive.Content.displayName;

const GlassSheetHeader = ({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) => (
  <div
    className={cn(
      "flex flex-col space-y-2 text-center sm:text-right",
      className
    )}
    {...props}
  />
);
GlassSheetHeader.displayName = "GlassSheetHeader";

const GlassSheetFooter = ({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) => (
  <div
    className={cn(
      "flex flex-col-reverse sm:flex-row sm:justify-end sm:space-x-2",
      className
    )}
    {...props}
  />
);
GlassSheetFooter.displayName = "GlassSheetFooter";

const GlassSheetTitle = React.forwardRef<
  React.ElementRef<typeof SheetPrimitive.Title>,
  React.ComponentPropsWithoutRef<typeof SheetPrimitive.Title>
>(({ className, ...props }, ref) => (
  <SheetPrimitive.Title
    ref={ref}
    className={cn("text-lg font-semibold text-foreground", className)}
    {...props}
  />
));
GlassSheetTitle.displayName = SheetPrimitive.Title.displayName;

const GlassSheetDescription = React.forwardRef<
  React.ElementRef<typeof SheetPrimitive.Description>,
  React.ComponentPropsWithoutRef<typeof SheetPrimitive.Description>
>(({ className, ...props }, ref) => (
  <SheetPrimitive.Description
    ref={ref}
    className={cn("text-sm text-muted-foreground", className)}
    {...props}
  />
));
GlassSheetDescription.displayName = SheetPrimitive.Description.displayName;

export {
  GlassSheet,
  GlassSheetPortal,
  GlassSheetOverlay,
  GlassSheetTrigger,
  GlassSheetClose,
  GlassSheetContent,
  GlassSheetHeader,
  GlassSheetFooter,
  GlassSheetTitle,
  GlassSheetDescription,
};
