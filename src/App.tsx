
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import Login from "./pages/Login";
import TeacherDashboard from "./pages/TeacherDashboard";
import StudentAttendance from "./pages/StudentAttendance";
import Register from "./pages/Register";
import AdminLogin from "./pages/AdminLogin";
import { AuthProvider, useAuth } from "./lib/auth-context";

const queryClient = new QueryClient();

// Protected route component
const ProtectedRoute = ({ 
  children, 
  requiredRole 
}: { 
  children: React.ReactNode;
  requiredRole?: "student" | "teacher" | "admin";
}) => {
  const { currentUser, isLoading } = useAuth();
  
  if (isLoading) {
    return <div className="min-h-screen flex items-center justify-center">Loading...</div>;
  }
  
  if (!currentUser) {
    return <Navigate to="/" replace />;
  }
  
  if (requiredRole && currentUser.role !== requiredRole) {
    return <Navigate to="/" replace />;
  }
  
  return <>{children}</>;
};

// Main app with routing
const AppRoutes = () => {
  return (
    <Routes>
      <Route path="/" element={<Login />} />
      <Route path="/admin-login" element={<AdminLogin />} />
      <Route 
        path="/register" 
        element={
          <ProtectedRoute requiredRole="admin">
            <Register />
          </ProtectedRoute>
        } 
      />
      <Route 
        path="/teacher-dashboard" 
        element={
          <ProtectedRoute requiredRole="teacher">
            <TeacherDashboard />
          </ProtectedRoute>
        } 
      />
      <Route 
        path="/student-attendance" 
        element={
          <ProtectedRoute requiredRole="student">
            <StudentAttendance />
          </ProtectedRoute>
        } 
      />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
};

const App = () => (
  <QueryClientProvider client={queryClient}>
    <BrowserRouter>
      <AuthProvider>
        <TooltipProvider>
          <Toaster />
          <Sonner />
          <AppRoutes />
        </TooltipProvider>
      </AuthProvider>
    </BrowserRouter>
  </QueryClientProvider>
);

export default App;
