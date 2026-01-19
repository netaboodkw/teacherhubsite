import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { ProtectedRoute } from "@/components/auth/ProtectedRoute";
import { ThemeProvider } from "@/contexts/ThemeContext";
import { SwipeBackOverlay } from "@/components/navigation/SwipeBackOverlay";
import { FloatingThemeToggle } from "@/components/theme/FloatingThemeToggle";

// Landing & Auth
import Landing from "./pages/Landing";
import Welcome from "./pages/Welcome";
import TeacherAuth from "./pages/auth/TeacherAuth";
import AdminAuth from "./pages/auth/AdminAuth";
import DepartmentHeadAuth from "./pages/auth/DepartmentHeadAuth";
import NotFound from "./pages/NotFound";

// Admin Pages
import AdminDashboard from "./pages/admin/AdminDashboard";
import TeachersPage from "./pages/admin/TeachersPage";
import AdminSettingsPage from "./pages/admin/AdminSettingsPage";
import CurriculumTreePage from "./pages/admin/CurriculumTreePage";
import ArchivedClassroomsPage from "./pages/admin/ArchivedClassroomsPage";
import UsersManagementPage from "./pages/admin/UsersManagementPage";
import SubscriptionsPage from "./pages/admin/SubscriptionsPage";
import SubscribersPage from "./pages/admin/SubscribersPage";
import AIContentCreatorPage from "./pages/admin/AIContentCreatorPage";
import EmailManagementPage from "./pages/admin/EmailManagementPage";

// Teacher Pages
import TeacherDashboard from "./pages/teacher/TeacherDashboard";
import TeacherTemplates from "./pages/teacher/TeacherTemplates";
import TeacherSubscription from "./pages/teacher/TeacherSubscription";
import TeacherSchedule from "./pages/teacher/TeacherSchedule";
import TeacherFingerprint from "./pages/teacher/Fingerprint";
import NotificationSettings from "./pages/teacher/NotificationSettings";
import SubscriptionSuccess from "./pages/teacher/SubscriptionSuccess";
import SubscriptionError from "./pages/teacher/SubscriptionError";

import Classrooms from "./pages/Classrooms";
import NewClassroom from "./pages/NewClassroom";
import EditClassroom from "./pages/EditClassroom";
import ClassroomView from "./pages/ClassroomView";
import Students from "./pages/Students";
import StudentDetail from "./pages/StudentDetail";
import NewStudent from "./pages/NewStudent";
import Attendance from "./pages/Attendance";
import Grades from "./pages/Grades";
import Reports from "./pages/Reports";
import Settings from "./pages/Settings";

// Department Head Pages
import DepartmentHeadDashboard from "./pages/department-head/DepartmentHeadDashboard";
import DepartmentHeadReports from "./pages/department-head/DepartmentHeadReports";
import TeacherDetailsView from "./pages/department-head/TeacherDetailsView";
import DHDashboardNew from "./pages/department-head/DHDashboardNew";
import DHClassrooms from "./pages/department-head/DHClassrooms";
import DHClassroomView from "./pages/department-head/DHClassroomView";
import DHStudents from "./pages/department-head/DHStudents";
import DHGrades from "./pages/department-head/DHGrades";
import DHInvitations from "./pages/department-head/DHInvitations";
import DHTemplates from "./pages/department-head/DHTemplates";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <ThemeProvider>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        
        <BrowserRouter>
          <FloatingThemeToggle />
          <SwipeBackOverlay />
          <Routes>
            {/* Public Routes - Welcome is the main entry for mobile */}
            <Route path="/" element={<Welcome />} />
            <Route path="/landing" element={<Landing />} />
            <Route path="/welcome" element={<Welcome />} />
            <Route path="/auth/teacher" element={<TeacherAuth />} />
            <Route path="/auth/admin" element={<AdminAuth />} />
            <Route path="/auth/department-head" element={<DepartmentHeadAuth />} />

            {/* Legacy redirects */}
            <Route path="/auth" element={<Navigate to="/auth/teacher" replace />} />
            <Route path="/dashboard" element={<Navigate to="/teacher" replace />} />
            <Route path="/classrooms" element={<Navigate to="/teacher/classrooms" replace />} />
            <Route path="/students" element={<Navigate to="/teacher/students" replace />} />
            <Route path="/attendance" element={<Navigate to="/teacher/attendance" replace />} />
            <Route path="/grades" element={<Navigate to="/teacher/grades" replace />} />
            <Route path="/reports" element={<Navigate to="/teacher/reports" replace />} />
            <Route path="/settings" element={<Navigate to="/teacher/settings" replace />} />

            {/* Admin Routes */}
            <Route path="/admin" element={<ProtectedRoute><AdminDashboard /></ProtectedRoute>} />
            <Route path="/admin/curriculum-tree" element={<ProtectedRoute><CurriculumTreePage /></ProtectedRoute>} />
            <Route path="/admin/teachers" element={<ProtectedRoute><TeachersPage /></ProtectedRoute>} />
            <Route path="/admin/users" element={<ProtectedRoute><UsersManagementPage /></ProtectedRoute>} />
            <Route path="/admin/archived-classrooms" element={<ProtectedRoute><ArchivedClassroomsPage /></ProtectedRoute>} />
            <Route path="/admin/settings" element={<ProtectedRoute><AdminSettingsPage /></ProtectedRoute>} />
            <Route path="/admin/subscriptions" element={<ProtectedRoute><SubscriptionsPage /></ProtectedRoute>} />
            <Route path="/admin/subscribers" element={<ProtectedRoute><SubscribersPage /></ProtectedRoute>} />
            <Route path="/admin/ai-content" element={<ProtectedRoute><AIContentCreatorPage /></ProtectedRoute>} />
            <Route path="/admin/emails" element={<ProtectedRoute><EmailManagementPage /></ProtectedRoute>} />

            {/* Teacher Routes */}
            <Route path="/teacher" element={<ProtectedRoute><TeacherDashboard /></ProtectedRoute>} />
            <Route path="/teacher/classrooms" element={<ProtectedRoute><Classrooms /></ProtectedRoute>} />
            <Route path="/teacher/classrooms/new" element={<ProtectedRoute><NewClassroom /></ProtectedRoute>} />
            <Route path="/teacher/classrooms/:classroomId" element={<ProtectedRoute><ClassroomView /></ProtectedRoute>} />
            <Route path="/teacher/classrooms/:classroomId/edit" element={<ProtectedRoute><EditClassroom /></ProtectedRoute>} />
            <Route path="/teacher/schedule" element={<ProtectedRoute><TeacherSchedule /></ProtectedRoute>} />
            <Route path="/teacher/fingerprint" element={<ProtectedRoute><TeacherFingerprint /></ProtectedRoute>} />
            <Route path="/teacher/students" element={<ProtectedRoute><Students /></ProtectedRoute>} />
            <Route path="/teacher/students/:studentId" element={<ProtectedRoute><StudentDetail /></ProtectedRoute>} />
            <Route path="/teacher/students/new" element={<ProtectedRoute><NewStudent /></ProtectedRoute>} />
            <Route path="/teacher/attendance" element={<ProtectedRoute><Attendance /></ProtectedRoute>} />
            <Route path="/teacher/grades" element={<ProtectedRoute><Grades /></ProtectedRoute>} />
            <Route path="/teacher/templates" element={<ProtectedRoute><TeacherTemplates /></ProtectedRoute>} />
            <Route path="/teacher/subscription" element={<ProtectedRoute><TeacherSubscription /></ProtectedRoute>} />
            <Route path="/teacher/subscription/success" element={<ProtectedRoute><SubscriptionSuccess /></ProtectedRoute>} />
            <Route path="/teacher/subscription/error" element={<ProtectedRoute><SubscriptionError /></ProtectedRoute>} />
            <Route path="/teacher/payments" element={<Navigate to="/teacher/subscription" replace />} />
            <Route path="/teacher/reports" element={<ProtectedRoute><Reports /></ProtectedRoute>} />
            <Route path="/teacher/settings" element={<ProtectedRoute><Settings /></ProtectedRoute>} />
            <Route path="/teacher/notifications" element={<ProtectedRoute><NotificationSettings /></ProtectedRoute>} />

            {/* Department Head Routes */}
            <Route path="/department-head" element={<ProtectedRoute><DHDashboardNew /></ProtectedRoute>} />
            <Route path="/department-head/invitations" element={<ProtectedRoute><DHInvitations /></ProtectedRoute>} />
            <Route path="/department-head/templates" element={<ProtectedRoute><DHTemplates /></ProtectedRoute>} />
            <Route path="/department-head/classrooms" element={<ProtectedRoute><DHClassrooms /></ProtectedRoute>} />
            <Route path="/department-head/classrooms/:classroomId" element={<ProtectedRoute><DHClassroomView /></ProtectedRoute>} />
            <Route path="/department-head/students" element={<ProtectedRoute><DHStudents /></ProtectedRoute>} />
            <Route path="/department-head/grades" element={<ProtectedRoute><DHGrades /></ProtectedRoute>} />
            <Route path="/department-head/reports" element={<ProtectedRoute><DepartmentHeadReports /></ProtectedRoute>} />
            <Route path="/department-head/old" element={<ProtectedRoute><DepartmentHeadDashboard /></ProtectedRoute>} />
            <Route path="/department-head/teacher/:teacherId" element={<ProtectedRoute><TeacherDetailsView /></ProtectedRoute>} />

            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </TooltipProvider>
    </ThemeProvider>
  </QueryClientProvider>
);

export default App;
