
import { supabase } from "@/integrations/supabase/client";
import { getClassStudentProfiles, getAttendanceRecords, createNewClassSession, endLatestOpenSession, getLatestSessionId } from "./attendanceSessionApi";
import type { StudentAttendanceStatus } from "@/components/StudentAttendanceRow";

// API logic for the attendance session feature

export async function fetchProfiles(classId: string) {
  return await getClassStudentProfiles(classId);
}

export async function fetchAttendanceRecords(classId: string, sessionId: string) {
  return await getAttendanceRecords(classId, sessionId);
}

export async function createSession(classId: string) {
  return await createNewClassSession(classId);
}

export async function endOpenSession(classId: string) {
  return await endLatestOpenSession(classId);
}

export async function fetchLatestSessionId(classId: string) {
  return await getLatestSessionId(classId);
}

export async function toggleAttendanceRecord(classId: string, sessionId: string, uuid: string, newStatus: "present" | "absent") {
  // Upsert-style logic
  const { data: existing, error: selectError } = await supabase
    .from("attendance_records")
    .select("id")
    .eq("class_id", classId)
    .eq("student_id", uuid)
    .eq("session_id", sessionId);

  if (selectError) {
    return { error: selectError };
  } else if (existing && existing.length > 0) {
    const { error: updateError } = await supabase
      .from("attendance_records")
      .update({ status: newStatus, timestamp: new Date().toISOString() })
      .eq("id", existing[0].id);
    return { error: updateError ?? null };
  } else {
    const { error: insertError } = await supabase.from("attendance_records").insert([
      {
        class_id: classId,
        student_id: uuid,
        status: newStatus,
        timestamp: new Date().toISOString(),
        session_id: sessionId,
      },
    ]);
    return { error: insertError ?? null };
  }
}

export async function deleteAttendanceRecords(classId: string, sessionId: string) {
  const { error } = await supabase
    .from("attendance_records")
    .delete()
    .eq("class_id", classId)
    .eq("session_id", sessionId);
  return { error };
}
