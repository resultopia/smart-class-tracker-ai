
import { useState } from "react";
import CreateClassDialog from "@/components/CreateClassDialog";
import { useAuth } from "@/lib/auth-context";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/components/ui/use-toast";
import { Class } from "@/lib/types";

interface Props {
  students: any[];
  loadClasses: () => void;
  isUUID: (id: string) => boolean;
}

const ClassCreationSection = ({ students, loadClasses, isUUID }: Props) => {
  const { currentUser } = useAuth();
  const { toast } = useToast();
  const [className, setClassName] = useState("");
  const [selectedStudents, setSelectedStudents] = useState<string[]>([]);
  const [csvStudents, setCsvStudents] = useState<string[]>([]);
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [loading, setLoading] = useState(false);

  // Helper to map userIds (username) to UUIDs (id column)
  const findUUIDsForUserIds = async (userIds: string[]) => {
    if (userIds.length === 0) return [];
    const { data, error } = await supabase
      .from("profiles")
      .select("user_id, id")
      .in("user_id", userIds);
    if (error) return [];
    // If some ids are missing, filter accordingly
    return userIds.map(
      (uid) => data?.find((d) => d.user_id === uid)?.id
    ).filter(Boolean);
  };

  // Map current teacher username to their profiles.id (uuid)
  const findTeacherUUID = async () => {
    if (!currentUser) return null;
    const { data, error } = await supabase
      .from("profiles")
      .select("user_id, id")
      .eq("user_id", currentUser.userId)
      .maybeSingle();
    if (error || !data) return null;
    return data.id;
  };

  const handleCreateClass = async () => {
    if (!currentUser) return;

    if (!className.trim()) {
      toast({
        title: "Error",
        description: "Please enter a class name.",
        variant: "destructive",
      });
      return;
    }
    const allStudentUsernames = [...selectedStudents, ...csvStudents];
    if (allStudentUsernames.length === 0) {
      toast({
        title: "Error",
        description: "Please select at least one student or upload a CSV file.",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);

    // Map teacher username to their uuid
    const teacherUUID = await findTeacherUUID();
    if (!teacherUUID) {
      toast({
        title: "Error",
        description: "Could not find teacher profile. Cannot create class.",
        variant: "destructive",
      });
      setLoading(false);
      return;
    }

    // Map allStudentUsernames to their uuid
    const studentUUIDs = await findUUIDsForUserIds(allStudentUsernames);
    if (!studentUUIDs || studentUUIDs.length === 0) {
      toast({
        title: "Error",
        description: "Could not resolve selected students.",
        variant: "destructive",
      });
      setLoading(false);
      return;
    }

    // Insert new class with teacher_id as uuid
    const { data: classData, error } = await supabase
      .from("classes")
      .insert([
        {
          name: className,
          teacher_id: teacherUUID,
        },
      ])
      .select()
      .single();
    if (error || !classData) {
      toast({
        title: "Error",
        description: "Failed to create class in database.",
        variant: "destructive",
      });
      setLoading(false);
      return;
    }
    // Add students (UUIDs) to classes_students
    const studentJoins = studentUUIDs.map((studentUuid) => ({
      class_id: classData.id,
      student_id: studentUuid,
    }));

    await supabase.from("classes_students").insert(studentJoins);
    toast({
      title: "Success",
      description: `New class created successfully with ${studentUUIDs.length} students.`,
    });
    setClassName("");
    setSelectedStudents([]);
    setCsvStudents([]);
    setCreateDialogOpen(false);
    setLoading(false);
    loadClasses();
  };

  return (
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
      loading={loading}
    />
  );
};

export default ClassCreationSection;
