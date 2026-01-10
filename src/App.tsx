import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { ProtectedRoute } from "@/components/auth/ProtectedRoute";

// Landing & Auth
import Landing from "./pages/Landing";
import Auth from "./pages/Auth";
import CompleteProfile from "./pages/CompleteProfile";
import NotFound from "./pages/NotFound";

// Admin Pages
import AdminDashboard from "./pages/admin/AdminDashboard";
import EducationLevelsPage from "./pages/admin/EducationLevelsPage";
import GradeLevelsPage from "./pages/admin/GradeLevelsPage";
import SubjectsPage from "./pages/admin/SubjectsPage";
import GradingSystemPage from "./pages/admin/GradingSystemPage";
import TeachersPage from "./pages/admin/TeachersPage";
import SubjectGradingSetup from "./pages/SubjectGradingSetup";

// Teacher Pages
import TeacherDashboard from "./pages/teacher/TeacherDashboard";
import Classrooms from "./pages/Classrooms";
import NewClassroom from "./pages/NewClassroom";
import ClassroomView from "./pages/ClassroomView";
import Students from "./pages/Students";
import StudentDetail from "./pages/StudentDetail";
import NewStudent from "./pages/NewStudent";
import Attendance from "./pages/Attendance";
import Grades from "./pages/Grades";
import Reports from "./pages/Reports";
import Settings from "./pages/Settings";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <Routes>
          {/* Public Routes */}
          <Route path="/" element={<Landing />} />
          <Route path="/auth" element={<Auth />} />
          <Route path="/complete-profile" element={<CompleteProfile />} />

          {/* Legacy redirects */}
          <Route path="/dashboard" element={<Navigate to="/teacher" replace />} />
          <Route path="/classrooms" element={<Navigate to="/teacher/classrooms" replace />} />
          <Route path="/students" element={<Navigate to="/teacher/students" replace />} />
          <Route path="/attendance" element={<Navigate to="/teacher/attendance" replace />} />
          <Route path="/grades" element={<Navigate to="/teacher/grades" replace />} />
          <Route path="/reports" element={<Navigate to="/teacher/reports" replace />} />
          <Route path="/settings" element={<Navigate to="/teacher/settings" replace />} />

          {/* Admin Routes */}
          <Route path="/admin" element={<ProtectedRoute><AdminDashboard /></ProtectedRoute>} />
          <Route path="/admin/education-levels" element={<ProtectedRoute><EducationLevelsPage /></ProtectedRoute>} />
          <Route path="/admin/grade-levels" element={<ProtectedRoute><GradeLevelsPage /></ProtectedRoute>} />
          <Route path="/admin/subjects" element={<ProtectedRoute><SubjectsPage /></ProtectedRoute>} />
          <Route path="/admin/grading-system" element={<ProtectedRoute><GradingSystemPage /></ProtectedRoute>} />
          <Route path="/admin/teachers" element={<ProtectedRoute><TeachersPage /></ProtectedRoute>} />
          <Route path="/admin/subject-grading" element={<ProtectedRoute><SubjectGradingSetup /></ProtectedRoute>} />
          <Route path="/admin/settings" element={<ProtectedRoute><Settings /></ProtectedRoute>} />

          {/* Teacher Routes */}
          <Route path="/teacher" element={<ProtectedRoute><TeacherDashboard /></ProtectedRoute>} />
          <Route path="/teacher/classrooms" element={<ProtectedRoute><Classrooms /></ProtectedRoute>} />
          <Route path="/teacher/classrooms/new" element={<ProtectedRoute><NewClassroom /></ProtectedRoute>} />
          <Route path="/teacher/classrooms/:classroomId" element={<ProtectedRoute><ClassroomView /></ProtectedRoute>} />
          <Route path="/teacher/students" element={<ProtectedRoute><Students /></ProtectedRoute>} />
          <Route path="/teacher/students/:studentId" element={<ProtectedRoute><StudentDetail /></ProtectedRoute>} />
          <Route path="/teacher/students/new" element={<ProtectedRoute><NewStudent /></ProtectedRoute>} />
          <Route path="/teacher/attendance" element={<ProtectedRoute><Attendance /></ProtectedRoute>} />
          <Route path="/teacher/grades" element={<ProtectedRoute><Grades /></ProtectedRoute>} />
          <Route path="/teacher/reports" element={<ProtectedRoute><Reports /></ProtectedRoute>} />
          <Route path="/teacher/settings" element={<ProtectedRoute><Settings /></ProtectedRoute>} />

          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
