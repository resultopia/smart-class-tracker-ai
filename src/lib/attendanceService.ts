import { supabase } from "@/integrations/supabase/client";
import { AttendanceRecord } from './types';

// Mark attendance via Supabase
export const markAttendance = async (
  classId: string,
  studentId: string,
  status: "present" | "absent" = "present"
) => {
  try {
    // Find today's start (midnight)
    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);

    // 1. Delete any existing attendance record for today (single per student per class per day)
    const { data: existing, error: selectError } = await supabase
      .from("attendance_records")
      .select("id, timestamp")
      .eq("class_id", classId)
      .eq("student_id", studentId);

    let recordToDelete: string | null = null;
    if (existing && existing.length > 0) {
      for (const rec of existing) {
        const recDate = new Date(rec.timestamp);
        if (recDate >= todayStart) {
          recordToDelete = rec.id;
          break;
        }
      }
    }
    if (recordToDelete) {
      await supabase
        .from("attendance_records")
        .delete()
        .eq("id", recordToDelete);
    }

    // 2. Insert new record for today
    const { error: insertError } = await supabase.from("attendance_records").insert([
      {
        class_id: classId,
        student_id: studentId,
        status: status,
        timestamp: new Date().toISOString(),
      },
    ]);
    if (insertError) {
      console.error("[markAttendance] Error inserting attendance:", insertError.message);
      return false;
    }
    return true;
  } catch (err) {
    console.error("[markAttendance] Uncaught error:", err);
    return false;
  }
};

// Get all attendance records for a class (not used much in UI, but for data/history)
export const getClassAttendance = async (classId: string) => {
  const { data, error } = await supabase
    .from("attendance_records")
    .select("*")
    .eq("class_id", classId);
  if (error) {
    console.error("[getClassAttendance] Error:", error.message);
    return [];
  }
  return data;
};

// Reset all attendance statuses for a class for today
export const resetTodayAttendance = async (classId: string) => {
  try {
    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);

    // Fetch all attendance records for this class where timestamp >= today's start
    const { data: records, error } = await supabase
      .from("attendance_records")
      .select("id, timestamp")
      .eq("class_id", classId);

    if (error) {
      console.error("[resetTodayAttendance] Fetch error:", error.message);
      return false;
    }
    const toDelete = (records ?? []).filter((rec) => new Date(rec.timestamp) >= todayStart);
    if (toDelete.length === 0) return true;

    const ids = toDelete.map((rec) => rec.id);
    const { error: delError } = await supabase.from("attendance_records").delete().in("id", ids);
    if (delError) {
      console.error("[resetTodayAttendance] Delete error:", delError.message);
      return false;
    }
    return true;
  } catch (err) {
    console.error("[resetTodayAttendance] Uncaught error:", err);
    return false;
  }
};

// Get today's attendance status for all students in a class
export const getStudentsAttendanceStatus = async (classId: string) => {
  // 1. Fetch all today's attendance_records for this class
  const todayStart = new Date();
  todayStart.setHours(0, 0, 0, 0);

  const { data: records, error } = await supabase
    .from("attendance_records")
    .select("student_id, status, timestamp")
    .eq("class_id", classId);

  if (error) {
    console.error("[getStudentsAttendanceStatus] Error:", error.message);
    return [];
  }

  // 2. Build a map: student_id -> status for TODAY
  const todayMap: Record<string, "present" | "absent"> = {};
  (records ?? []).forEach((rec) => {
    const recDate = new Date(rec.timestamp);
    if (recDate >= todayStart) {
      todayMap[rec.student_id] = (rec.status === "present" ? "present" : "absent");
    }
  });

  // 3. To list all enrolled students for this class, we need to query classes_students
  const { data: rels, error: relError } = await supabase
    .from("classes_students")
    .select("student_id")
    .eq("class_id", classId);
  if (relError) {
    console.error("[getStudentsAttendanceStatus] Join error:", relError.message);
    return [];
  }
  const studentIds = (rels ?? []).map((r) => r.student_id);

  // 4. Fetch profile info for each student in class
  let profileData: Record<string, { user_id: string; name: string }> = {};
  if (studentIds.length > 0) {
    const { data: profiles } = await supabase
      .from("profiles")
      .select("id, user_id, name")
      .in("id", studentIds);
    if (profiles && Array.isArray(profiles)) {
      profiles.forEach((row) => {
        profileData[row.id] = { user_id: row.user_id, name: row.name };
      });
    }
  }

  // 5. Compose result
  const results = studentIds.map((studentUuid) => ({
    userId: profileData[studentUuid]?.user_id || studentUuid,
    uuid: studentUuid,
    name: profileData[studentUuid]?.name || "",
    status: todayMap[studentUuid] || "absent",
  }));

  return results;
};

// Mock face recognition API call
export const verifyFaceIdentity = async (imageBase64: string, userId: string): Promise<boolean> => {
  try {
    const backendPort = '8000';  // <— your custom backend port
    const protocol    = window.location.protocol;  // e.g. "http:"
    const hostname    = window.location.hostname;  // e.g. "127.0.0.1"
    const backendUrl  = `${protocol}//${hostname}:${backendPort}`;
    const response = await fetch(`${backendUrl}/predict`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      },
      body: JSON.stringify({
        image_base64: imageBase64
      })
    });
    
    if (!response.ok) {
      console.error('Face verification API error:', response.statusText);
      return false;
    }
    
    const data = await response.json();
    
    // Check if the API response matches the logged-in user
    return data.name === userId;
  } catch (error) {
    console.error('Face verification error:', error);
    // For demo purposes, fallback to the previous random success rate
    // For testing, if userId contains "fail" we'll fail the verification
    if (userId.toLowerCase().includes("fail")) {
      return false;
    }
    
    return Math.random() > 0.2; // 80% success rate as fallback
  }
};
