
import { useEffect, useState, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth-context";
import { useToast } from "@/components/ui/use-toast";
import { Class } from "@/lib/types";

export const useTeacherClasses = () => {
  const { currentUser } = useAuth();
  const { toast } = useToast();

  const [classes, setClasses] = useState<Class[]>([]);
  const [students, setStudents] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  // Helper: check for valid UUIDs (rudimentary UUID v4 check)
  const isUUID = (id: string) =>
    /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/.test(id);

  const loadClasses = useCallback(async () => {
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
  }, [currentUser]);

  const loadStudents = useCallback(async () => {
    setLoading(true);
    try {
      const { data: profiles, error } = await supabase
        .from("profiles")
        .select("*")
        .eq("role", "student");
      if (error) {
        toast({
          title: "Error Loading Students",
          description: error.message,
          variant: "destructive",
        });
        setStudents([]);
      } else if (!profiles || profiles.length === 0) {
        setStudents([]);
      } else {
        setStudents(profiles);
      }
    } catch (e) {
      setStudents([]);
    }
    setLoading(false);
  }, [toast]);

  useEffect(() => {
    if (!currentUser) return;
    loadClasses();
    loadStudents();
  }, [currentUser, loadClasses, loadStudents]);

  return {
    classes,
    students,
    loadClasses,
    loading,
    isUUID,
  };
};
