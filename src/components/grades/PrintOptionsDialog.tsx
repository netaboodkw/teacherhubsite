import { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Separator } from '@/components/ui/separator';
import { Printer, FileSpreadsheet, School, User, Users } from 'lucide-react';

interface PrintOptionsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onPrint: (options: PrintOptions) => void;
  onExportExcel: (options: PrintOptions) => void;
  schoolName?: string | null;
  principalName?: string | null;
  departmentHeadName?: string | null;
}

export interface PrintOptions {
  showSchoolName: boolean;
  showPrincipalName: boolean;
  showDepartmentHeadName: boolean;
}

export function PrintOptionsDialog({
  open,
  onOpenChange,
  onPrint,
  onExportExcel,
  schoolName,
  principalName,
  departmentHeadName,
}: PrintOptionsDialogProps) {
  const [options, setOptions] = useState<PrintOptions>({
    showSchoolName: true,
    showPrincipalName: true,
    showDepartmentHeadName: true,
  });

  const handlePrint = () => {
    onPrint(options);
    onOpenChange(false);
  };

  const handleExportExcel = () => {
    onExportExcel(options);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent dir="rtl" className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Printer className="w-5 h-5" />
            خيارات الطباعة والتصدير
          </DialogTitle>
          <DialogDescription>
            اختر البيانات الإضافية التي تريد إظهارها في الطباعة أو التصدير
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <p className="text-sm font-medium text-muted-foreground">البيانات الإضافية أسفل الجدول:</p>
          
          {/* School Name */}
          <div className="flex items-center justify-between p-3 rounded-lg border bg-muted/30">
            <div className="flex items-center gap-3">
              <School className="w-5 h-5 text-primary" />
              <div>
                <Label htmlFor="showSchoolName" className="font-medium">اسم المدرسة</Label>
                {schoolName ? (
                  <p className="text-sm text-muted-foreground">{schoolName}</p>
                ) : (
                  <p className="text-sm text-amber-600">غير محدد في الإعدادات</p>
                )}
              </div>
            </div>
            <Switch
              id="showSchoolName"
              checked={options.showSchoolName && !!schoolName}
              onCheckedChange={(checked) => setOptions(prev => ({ ...prev, showSchoolName: checked }))}
              disabled={!schoolName}
            />
          </div>

          {/* Principal Name */}
          <div className="flex items-center justify-between p-3 rounded-lg border bg-muted/30">
            <div className="flex items-center gap-3">
              <User className="w-5 h-5 text-primary" />
              <div>
                <Label htmlFor="showPrincipalName" className="font-medium">اسم مدير/ة المدرسة</Label>
                {principalName ? (
                  <p className="text-sm text-muted-foreground">{principalName}</p>
                ) : (
                  <p className="text-sm text-amber-600">غير محدد في الإعدادات</p>
                )}
              </div>
            </div>
            <Switch
              id="showPrincipalName"
              checked={options.showPrincipalName && !!principalName}
              onCheckedChange={(checked) => setOptions(prev => ({ ...prev, showPrincipalName: checked }))}
              disabled={!principalName}
            />
          </div>

          {/* Department Head Name */}
          <div className="flex items-center justify-between p-3 rounded-lg border bg-muted/30">
            <div className="flex items-center gap-3">
              <Users className="w-5 h-5 text-primary" />
              <div>
                <Label htmlFor="showDepartmentHeadName" className="font-medium">اسم رئيس/ة القسم</Label>
                {departmentHeadName ? (
                  <p className="text-sm text-muted-foreground">{departmentHeadName}</p>
                ) : (
                  <p className="text-sm text-amber-600">غير محدد في الإعدادات</p>
                )}
              </div>
            </div>
            <Switch
              id="showDepartmentHeadName"
              checked={options.showDepartmentHeadName && !!departmentHeadName}
              onCheckedChange={(checked) => setOptions(prev => ({ ...prev, showDepartmentHeadName: checked }))}
              disabled={!departmentHeadName}
            />
          </div>
        </div>

        <Separator />

        <DialogFooter className="flex flex-col sm:flex-row gap-2">
          <Button variant="outline" onClick={handleExportExcel} className="flex-1">
            <FileSpreadsheet className="w-4 h-4 ml-2" />
            تصدير Excel
          </Button>
          <Button onClick={handlePrint} className="flex-1">
            <Printer className="w-4 h-4 ml-2" />
            طباعة
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
