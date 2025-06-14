
import { supabase } from "@/integrations/supabase/client";
import { Class } from "@/lib/types";
import { AttendanceRecord, ClassSession } from "@/lib/types";

// Fetch sessions for a class, filtered by date if provided
export async function fetchSessions(classId: string, selectedDate?: Date) {
  if (selectedDate) {
    const dateStart = new Date(selectedDate);
    dateStart.setHours(0, 0, 0, 0);
    const dateEnd = new Date(dateStart);
    dateEnd.setDate(dateStart.getDate() + 1);

    const { data: sessionRows } = await supabase
      .from("class_sessions")
      .select("*")
      .eq("class_id", classId)
      .gte("start_time", dateStart.toISOString())
      .lt("start_time", dateEnd.toISOString());

    return sessionRows || [];
  } else {
    const { data: sessionRows } = await supabase
      .from("class_sessions")
      .select("*")
      .eq("class_id", classId);
    return sessionRows || [];
  }
}

// Fetch all attendance records for a class
export async function fetchAttendanceRecords(classId: string) {
  const { data: recordsRows } = await supabase
    .from("attendance_records")
    .select("*")
    .eq("class_id", classId);
  return recordsRows || [];
}

// Fetch student profile names for an array of ids
export async function fetchUserNames(studentIds: string[]) {
  if (!studentIds.length) return {};
  const { data: profiles } = await supabase
    .from("profiles")
    .select("id,name")
    .in("id", studentIds);
  if (!profiles) return {};
  return Object.fromEntries(
    profiles.map((p: { id: string, name: string }) => [p.id, p.name])
  );
}
