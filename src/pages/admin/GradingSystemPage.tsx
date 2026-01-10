import { AdminLayout } from '@/components/layout/AdminLayout';
import { GradingSystemManager } from '@/components/admin/GradingSystemManager';
import { FileText } from 'lucide-react';

export default function GradingSystemPage() {
  return (
    <AdminLayout>
      <div className="space-y-6">
        <div className="flex items-center gap-3">
          <FileText className="h-8 w-8 text-primary" />
          <div>
            <h1 className="text-2xl font-bold">نظام الدرجات</h1>
            <p className="text-muted-foreground">إدارة فترات التقييم وقوالب الدرجات</p>
          </div>
        </div>

        <GradingSystemManager />
      </div>
    </AdminLayout>
  );
}
