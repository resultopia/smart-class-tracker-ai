
import { supabase } from "@/integrations/supabase/client";
import type { StudentAttendanceStatus } from "@/components/StudentAttendanceRow";

export async function createNewClassSession(classId: string) {
  const { data, error } = await supabase
    .from("class_sessions")
    .insert({
      class_id: classId,
      start_time: new Date().toISOString(),
    })
    .select()
    .single();
  if (error) {
    console.error("Error creating new session:", error.message);
    return null;
  }
  return data;
}

export async function endLatestOpenSession(classId: string) {
  const { data: sessions, error } = await supabase
    .from("class_sessions")
    .select("*")
    .eq("class_id", classId)
    .is("end_time", null)
    .order("start_time", { ascending: false })
    .limit(1);
  if (error) {
    console.error("Error fetching latest open session:", error.message);
    return null;
  }
  if (!sessions || sessions.length === 0) return null;
  const latestSession = sessions[0];
  const { error: updateError } = await supabase
    .from("class_sessions")
    .update({ end_time: new Date().toISOString() })
    .eq("id", latestSession.id);
  if (updateError) {
    console.error("Error updating end_time for session:", updateError.message);
    return null;
  }
  return latestSession.id;
}

export async function getLatestSessionId(classId: string) {
  const { data: sessions, error } = await supabase
    .from("class_sessions")
    .select("*")
    .eq("class_id", classId)
    .is("end_time", null)
    .order("start_time", { ascending: false })
    .limit(1);
  if (error) return null;
  if (!sessions || sessions.length === 0) return null;
  return sessions[0].id;
}

// Fetch profile info for all class students
export async function getClassStudentProfiles(classId: string) {
  const { data: rels, error: relError } = await supabase
    .from("classes_students")
    .select("student_id")
    .eq("class_id", classId);
  if (relError) {
    return [];
  }
  const studentIds = (rels ?? []).map((r) => r.student_id);
  if (studentIds.length === 0) return [];
  const { data: profiles } = await supabase
    .from("profiles")
    .select("id, user_id, name")
    .in("id", studentIds);
  return profiles;
}

// Fetch attendance records for a session
export async function getAttendanceRecords(classId: string, sessionId: string) {
  const { data: records, error } = await supabase
    .from("attendance_records")
    .select("student_id, status, timestamp")
    .eq("class_id", classId)
    .eq("session_id", sessionId);
  if (error) return [];
  return records ?? [];
}
