import { supabase } from "@/integrations/supabase/client";
import { AttendanceRecord } from './types';

// Mark attendance via Supabase using the class's currently active session_id (uuid)
export const markAttendance = async (
  classId: string,
  studentId: string,
  status: "present" | "absent" = "present"
) => {
  try {
    // Always fetch the currently active session from the classes table
    const { data: classRow, error: classError } = await supabase
      .from("classes")
      .select("is_active")
      .eq("id", classId)
      .single();

    if (classError || !classRow || !classRow.is_active) {
      console.error("No active session found for this class. Cannot mark attendance.");
      return false;
    }

    const sessionId = classRow.is_active;

    // Find if record for this student/session exists
    const { data: existing, error: selectError } = await supabase
      .from("attendance_records")
      .select("id")
      .eq("class_id", classId)
      .eq("student_id", studentId) // <-- always use UUID
      .eq("session_id", sessionId);

    if (selectError) {
      console.error("Error fetching attendance record:", selectError.message);
      return false;
    }

    if (existing && existing.length > 0) {
      // Update
      const { error: updateError } = await supabase
        .from("attendance_records")
        .update({ status, timestamp: new Date().toISOString() })
        .eq("id", existing[0].id);
      if (updateError) {
        console.error("Error updating attendance:", updateError.message);
        return false;
      }
    } else {
      // Insert
      const { error: insertError } = await supabase.from("attendance_records").insert([
        {
          class_id: classId,
          student_id: studentId, // <-- always use UUID
          status: status,
          timestamp: new Date().toISOString(),
          session_id: sessionId,
        },
      ]);
      if (insertError) {
        console.error("Error inserting attendance:", insertError.message);
        return false;
      }
    }
    return true;
  } catch (err) {
    console.error("[markAttendance] Uncaught error:", err);
    return false;
  }
};

// Get or create today's session for a given class
export const getOrCreateTodaySession = async (classId: string) => {
  const todayStart = new Date();
  todayStart.setHours(0, 0, 0, 0);
  const todayEnd = new Date(todayStart);
  todayEnd.setDate(todayStart.getDate() + 1);

  // Try to find session that starts today
  const { data: sessions, error } = await supabase
    .from("class_sessions")
    .select("*")
    .eq("class_id", classId)
    .gte("start_time", todayStart.toISOString())
    .lt("start_time", todayEnd.toISOString());
  if (error) {
    console.error("Error fetching sessions:", error.message);
    return null;
  }
  if (sessions && sessions.length > 0) {
    return sessions[0];
  }
  // Create new session for today
  const { data: newSession, error: createError } = await supabase
    .from("class_sessions")
    .insert({
      class_id: classId,
      start_time: new Date().toISOString(),
    })
    .select()
    .single();
  if (createError) {
    console.error("Error creating today's session:", createError.message);
    return null;
  }
  return newSession;
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

// Reset attendance for today (for current session)
export const resetTodayAttendance = async (classId: string) => {
  try {
    const session = await getOrCreateTodaySession(classId);
    if (!session) {
      console.error("No session for today found/created.");
      return false;
    }
    // Delete all attendance records for this session
    const { error } = await supabase
      .from("attendance_records")
      .delete()
      .eq("class_id", classId)
      .eq("session_id", session.id);
    if (error) {
      console.error("Error deleting attendance records for today:", error.message);
      return false;
    }
    return true;
  } catch (err) {
    console.error("[resetTodayAttendance] Uncaught error:", err);
    return false;
  }
};

// Get today's attendance status for all students in a class (for today's session)
export const getStudentsAttendanceStatus = async (classId: string) => {
  const session = await getOrCreateTodaySession(classId);
  if (!session) {
    return [];
  }
  // Fetch all attendance_records for this class/session
  const { data: records, error } = await supabase
    .from("attendance_records")
    .select("student_id, status, timestamp")
    .eq("class_id", classId)
    .eq("session_id", session.id);

  if (error) {
    console.error("[getStudentsAttendanceStatus] Error:", error.message);
    return [];
  }

  // Get all enrolled students
  const { data: rels, error: relError } = await supabase
    .from("classes_students")
    .select("student_id")
    .eq("class_id", classId);
  if (relError) {
    console.error("[getStudentsAttendanceStatus] Join error:", relError.message);
    return [];
  }
  const studentIds = (rels ?? []).map((r) => r.student_id);

  // Fetch profile info for each student in class
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

  // Compose attendance status
  const statusMap: Record<string, "present" | "absent"> = {};
  (records ?? []).forEach((rec) => {
    statusMap[rec.student_id] = rec.status === "present" ? "present" : "absent";
  });

  const results = studentIds.map((studentUuid) => ({
    userId: profileData[studentUuid]?.user_id || studentUuid,
    uuid: studentUuid,
    name: profileData[studentUuid]?.name || "",
    status: statusMap[studentUuid] || "absent",
  }));

  return results;
};

// Mock face recognition API call
export const verifyFaceIdentity = async (imageBase64: string, userId: string): Promise<boolean> => {
  try {
    // Always return 80% random "success" first
    return Math.random() > 0.2;

    const backendPort = '8000';  // <— your custom backend port
    const protocol    = window.location.protocol;  // e.g. "http:"
    const hostname    = window.location.hostname;  // e.g. "127.0.0.1"
    const backendUrl  = `${protocol}//${hostname}:${backendPort}`;
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 5000);

    let response;
    try {
      response = await fetch(`${backendUrl}/predict`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        },
        body: JSON.stringify({
          image_base64: imageBase64
        }),
        signal: controller.signal
      });
    } catch (fetchError: any) {
      if (fetchError.name === "AbortError") {
        console.error('Face verification API timed out (5s exceeded)');
        return false;
      }
      throw fetchError;
    } finally {
      clearTimeout(timeoutId);
    }

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
