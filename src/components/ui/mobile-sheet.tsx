import * as React from "react";
import { Drawer, DrawerContent, DrawerHeader, DrawerTitle, DrawerDescription, DrawerFooter, DrawerClose } from "@/components/ui/drawer";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogClose } from "@/components/ui/dialog";
import { useIsMobile } from "@/hooks/use-mobile";
import { cn } from "@/lib/utils";
import { X } from "lucide-react";
import { Button } from "./button";

interface MobileSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  children: React.ReactNode;
  title?: string;
  description?: string;
  className?: string;
}

export function MobileSheet({ 
  open, 
  onOpenChange, 
  children, 
  title, 
  description,
  className 
}: MobileSheetProps) {
  const isMobile = useIsMobile();

  if (isMobile) {
    return (
      <Drawer open={open} onOpenChange={onOpenChange}>
        <DrawerContent className={cn("max-h-[90vh]", className)}>
          {/* Drag Handle */}
          <div className="mx-auto w-12 h-1.5 flex-shrink-0 rounded-full bg-muted-foreground/20 mt-4" />
          
          {(title || description) && (
            <DrawerHeader className="text-right pb-2">
              {title && (
                <DrawerTitle className="text-xl font-bold">
                  {title}
                </DrawerTitle>
              )}
              {description && (
                <DrawerDescription className="text-base">
                  {description}
                </DrawerDescription>
              )}
            </DrawerHeader>
          )}
          
          <div className="px-4 pb-6 overflow-y-auto">
            {children}
          </div>
        </DrawerContent>
      </Drawer>
    );
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className={cn("max-w-lg", className)} dir="rtl">
        {(title || description) && (
          <DialogHeader>
            {title && <DialogTitle className="text-xl">{title}</DialogTitle>}
            {description && <DialogDescription className="text-base">{description}</DialogDescription>}
          </DialogHeader>
        )}
        {children}
      </DialogContent>
    </Dialog>
  );
}

interface MobileSheetFooterProps {
  children: React.ReactNode;
  className?: string;
}

export function MobileSheetFooter({ children, className }: MobileSheetFooterProps) {
  const isMobile = useIsMobile();

  if (isMobile) {
    return (
      <div className={cn("pt-4 pb-[env(safe-area-inset-bottom)]", className)}>
        {children}
      </div>
    );
  }

  return <div className={cn("pt-4", className)}>{children}</div>;
}
