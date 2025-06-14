
import { supabase } from "@/integrations/supabase/client";
import { Class } from "@/lib/types";

/**
 * Given a student's userId, find the active class for the student (from Supabase).
 * Returns the class object or null if no active class found.
 */
export async function getStudentActiveClassSupabase(studentId: string): Promise<Class | null> {
  // 1. Find student's UUID from profiles
  const { data: studentProfile, error: profileError } = await supabase
    .from("profiles")
    .select("id, user_id")
    .eq("user_id", studentId)
    .maybeSingle();

  if (!studentProfile) return null;

  const studentUUID = studentProfile.id;

  // 2. Find any classes where is_active is not null AND where student is enrolled
  const { data: classRows, error } = await supabase
    .from("classes_students")
    .select("class_id, classes(*)")
    .eq("student_id", studentUUID);

  if (!classRows || classRows.length === 0) return null;

  // Now, for each class, check if there is an active session
  for (const row of classRows) {
    const cls = row.classes;
    if (cls && cls.is_active) {
      // Build the Class type object
      return {
        id: cls.id,
        name: cls.name,
        teacherId: cls.teacher_id,
        studentIds: [], // Not fetching studentIds for now, not needed
        isActive: cls.is_active,
        isOnlineMode: cls.is_online_mode,
        attendanceRecords: [],
        sessions: [],
      };
    }
  }

  return null;
}
