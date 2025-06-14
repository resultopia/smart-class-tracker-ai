import { useNavigate } from "react-router-dom";
import { useAuth } from "@/lib/auth-context";
import UserInfo from "@/components/UserInfo";
import ClassList from "@/components/ClassList";
import { useToast } from "@/components/ui/use-toast";
import { useTeacherClasses } from "@/hooks/useTeacherClasses";
import ClassCreationSection from "@/components/ClassCreationSection";

const TeacherDashboard = () => {
  const { currentUser } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const { classes, students, loadClasses, isUUID } = useTeacherClasses();
  
  // Helper: get teacherUUID from first class (they should match) or fallback
  const teacherUUID = classes.length > 0 ? classes[0].teacherId : null;

  // Role checks
  if (!currentUser) {
    navigate("/");
    return null;
  }

  if (currentUser.role !== "teacher") {
    toast({
      title: "Access Denied",
      description: "Only teachers can access this page.",
      variant: "destructive",
    });
    navigate("/");
    return null;
  }

  return (
    <div className="min-h-screen bg-slate-50 py-8">
      <div className="container max-w-4xl mx-auto px-4">
        <div className="flex items-center justify-between mb-8">
          <h1 className="text-2xl font-bold">Teacher Dashboard</h1>
          <UserInfo />
        </div>
        <div className="bg-white rounded-lg p-6 mb-8 shadow">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-medium">Your Classes</h2>
            <ClassCreationSection
              students={students}
              loadClasses={loadClasses}
              isUUID={isUUID}
            />
          </div>
          {classes.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              No classes created yet. Create your first class to get started.
            </div>
          ) : (
            // We pass teacherUUID (the teacher's profile UUID, not userId) to ensure correct permission checks.
            <ClassList
              classes={classes}
              teacherId={teacherUUID || currentUser?.userId || ""}
              onStatusChange={loadClasses}
            />
          )}
        </div>
      </div>
    </div>
  );
};

export default TeacherDashboard;
