import { useState, ReactNode } from 'react';
import { TeacherSidebar } from './TeacherSidebar';
import { Header } from './Header';

interface TeacherLayoutProps {
  children: ReactNode;
}

export function TeacherLayout({ children }: TeacherLayoutProps) {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <div className="min-h-screen bg-background flex" dir="rtl">
      <TeacherSidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />
      <div className="flex-1 flex flex-col min-h-screen">
        <Header onMenuClick={() => setSidebarOpen(true)} />
        <main className="flex-1 p-4 md:p-6 lg:p-8 overflow-auto">
          {children}
        </main>
      </div>
    </div>
  );
}
