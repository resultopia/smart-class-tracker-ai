
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
    // No UUID filter!
    const allStudents = [...selectedStudents, ...csvStudents];
    if (allStudents.length === 0) {
      toast({
        title: "Error",
        description: "Please select at least one student or upload a CSV file.",
        variant: "destructive",
      });
      return;
    }
    if (!isUUID(currentUser.userId)) {
      toast({
        title: "Error",
        description: "Current teacher ID is invalid. Cannot create class.",
        variant: "destructive",
      });
      return;
    }
    setLoading(true);
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
      toast({
        title: "Error",
        description: "Failed to create class in database.",
        variant: "destructive",
      });
      setLoading(false);
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
