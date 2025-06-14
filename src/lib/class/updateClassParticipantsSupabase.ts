
import { supabase } from "@/integrations/supabase/client";

/**
 * Updates the participants of a class on Supabase.
 * Removes all current students from classes_students for the class, then inserts the new list.
 * Returns true on success, false otherwise.
 */
export async function updateClassParticipantsSupabase(classId: string, studentIds: string[]): Promise<boolean> {
  // Remove all current students for this class
  const { error: deleteError } = await supabase
    .from("classes_students")
    .delete()
    .eq("class_id", classId);

  if (deleteError) {
    console.error("[updateClassParticipantsSupabase] Delete error:", deleteError);
    return false;
  }

  // Insert new list (skip insert if empty)
  if (studentIds.length > 0) {
    const inserts = studentIds.map((studentId) => ({
      class_id: classId,
      student_id: studentId,
    }));
    const { error: insertError } = await supabase
      .from("classes_students")
      .insert(inserts);
    if (insertError) {
      console.error("[updateClassParticipantsSupabase] Insert error:", insertError);
      return false;
    }
  }

  return true;
}
