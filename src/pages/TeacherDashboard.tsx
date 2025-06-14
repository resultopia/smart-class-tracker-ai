
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/lib/auth-context";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/components/ui/use-toast";
import UserInfo from "@/components/UserInfo";
import CreateClassDialog from "@/components/CreateClassDialog";
import ClassList from "@/components/ClassList";
import { Class } from "@/lib/types";
import { Button } from "@/components/ui/button";

const TeacherDashboard = () => {
  const { currentUser } = useAuth();
  const [classes, setClasses] = useState<Class[]>([]);
  const [className, setClassName] = useState("");
  const [selectedStudents, setSelectedStudents] = useState<string[]>([]);
  const [csvStudents, setCsvStudents] = useState<string[]>([]);
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [students, setStudents] = useState<any[]>([]);
  const navigate = useNavigate();
  const { toast } = useToast();

  // Helper: check for valid UUIDs (rudimentary UUID v4 check)
  const isUUID = (id: string) =>
    /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/.test(
      id
    );

  useEffect(() => {
    if (!currentUser) {
      navigate("/");
      return;
    }

    if (currentUser.role !== "teacher") {
      toast({
        title: "Access Denied",
        description: "Only teachers can access this page.",
        variant: "destructive",
      });
      navigate("/");
      return;
    }

    loadClasses();

    // Load students from Supabase
    const loadStudents = async () => {
      const { data: profiles } = await supabase
        .from("profiles")
        .select("*")
        .eq("role", "student");
      if (profiles) {
        // Filter to only those with real UUID user_id
        const validProfiles = profiles.filter((s: any) =>
          isUUID(String(s.user_id))
        );
        setStudents(validProfiles);
        console.log("Loaded students:", validProfiles);
      }
    };
    loadStudents();
  }, [currentUser, navigate]);

  const loadClasses = async () => {
    if (!currentUser) return;
    const { data: classRows } = await supabase
      .from("classes")
      .select("*")
      .eq("teacher_id", currentUser.userId);
    if (classRows) {
      const classList: Class[] = [];
      for (const cls of classRows) {
        const { data: joined } = await supabase
          .from("classes_students")
          .select("student_id")
          .eq("class_id", cls.id);
        const studentIds = joined ? joined.map((j) => j.student_id) : [];
        classList.push({
          id: cls.id,
          name: cls.name,
          teacherId: cls.teacher_id,
          studentIds,
          isActive: cls.is_active,
          isOnlineMode: cls.is_online_mode,
          attendanceRecords: [],
          sessions: [],
        });
      }
      setClasses(classList);
    }
  };

  const handleCreateClass = async () => {
    if (!currentUser) return;
    console.log("Creating class. Current user:", currentUser);

    if (!className.trim()) {
      toast({
        title: "Error",
        description: "Please enter a class name.",
        variant: "destructive",
      });
      return;
    }

    // Allow only student IDs that resemble UUIDs
    const allStudents = [...selectedStudents, ...csvStudents].filter(isUUID);
    console.log("All students to add (filtered uuids):", allStudents);
    console.log("Class name:", className);

    if (allStudents.length === 0) {
      toast({
        title: "Error",
        description: "Please select at least one student or upload a CSV file.",
        variant: "destructive",
      });
      return;
    }

    // Check teacher id is uuid
    if (!isUUID(currentUser.userId)) {
      toast({
        title: "Error",
        description: "Current teacher ID is invalid. Cannot create class.",
        variant: "destructive",
      });
      return;
    }

    const { data: classData, error } = await supabase
      .from("classes")
      .insert([
        {
          name: className,
          teacher_id: currentUser.userId,
        },
      ])
      .select()
      .single();

    if (error || !classData) {
      console.error("Supabase error creating class:", error);
      toast({
        title: "Error",
        description: "Failed to create class in database.",
        variant: "destructive",
      });
      return;
    }

    const studentJoins = allStudents.map((studentId) => ({
      class_id: classData.id,
      student_id: studentId,
    }));
    await supabase.from("classes_students").insert(studentJoins);

    toast({
      title: "Success",
      description: `New class created successfully with ${allStudents.length} students.`,
    });

    setClassName("");
    setSelectedStudents([]);
    setCsvStudents([]);
    setCreateDialogOpen(false);
    loadClasses();
  };

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
            <CreateClassDialog
              open={createDialogOpen}
              setOpen={setCreateDialogOpen}
              students={students}
              selectedStudents={selectedStudents}
              setSelectedStudents={setSelectedStudents}
              csvStudents={csvStudents}
              setCsvStudents={setCsvStudents}
              className={className}
              setClassName={setClassName}
              onCreate={handleCreateClass}
            />
          </div>
          {classes.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              No classes created yet. Create your first class to get started.
            </div>
          ) : (
            <ClassList 
              classes={classes}
              teacherId={currentUser?.userId || ""}
              onStatusChange={loadClasses}
            />
          )}
        </div>
      </div>
    </div>
  );
};

export default TeacherDashboard;
