
import { useState, useRef, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import type { StudentAttendanceStatus } from "@/components/StudentAttendanceRow";
import { useToast } from "@/hooks/use-toast";
import { Class } from "@/lib/types";

// Always creates a brand new session
async function createNewClassSession(classId: string) {
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
// Ends any open session (sets end_time)
async function endLatestOpenSession(classId: string) {
  // Always try to end any open session, even if no students
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

// Helpers to prevent premature session creation
async function getLatestSessionId(classId: string) {
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

export function useAttendanceSession(classData: Class, resetFlag?: boolean, onResetDone?: () => void) {
  const [studentsStatus, setStudentsStatus] = useState<StudentAttendanceStatus[]>([]);
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();
  const lastSessionIdRef = useRef<string | null>(null);
  const prevActiveRef = useRef<boolean>(classData.isActive);

  // Load/update state for the current/latest session
  const loadAttendanceData = useCallback(async () => {
    setLoading(true);
    if (classData.isActive) {
      // ONLY fetch session. DO NOT create new.
      let sessionId: string | null = lastSessionIdRef.current;
      if (!sessionId) {
        sessionId = await getLatestSessionId(classData.id);
        if (sessionId) {
          lastSessionIdRef.current = sessionId;
        }
      }
      if (sessionId) {
        const { data: records, error } = await supabase
          .from("attendance_records")
          .select("student_id, status, timestamp")
          .eq("class_id", classData.id)
          .eq("session_id", sessionId);
        if (error) {
          setStudentsStatus([]);
        } else {
          const { data: rels, error: relError } = await supabase
            .from("classes_students")
            .select("student_id")
            .eq("class_id", classData.id);
          if (relError) {
            setStudentsStatus([]);
          } else {
            const studentIds = (rels ?? []).map((r) => r.student_id);
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
            setStudentsStatus(results);
          }
        }
      } else {
        // No session: treat as all absent
        const { data: rels } = await supabase
          .from("classes_students")
          .select("student_id")
          .eq("class_id", classData.id);
        const studentIds = (rels ?? []).map((r) => r.student_id);
        setStudentsStatus(
          studentIds.map((id) => ({
            uuid: id,
            userId: id,
            name: "",
            status: "absent" as const,
          }))
        );
      }
    } else {
      // Not active: clear session
      lastSessionIdRef.current = null;
      const studentIds = classData.studentIds || [];
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
      setStudentsStatus(
        studentIds.map((id) => ({
          uuid: id,
          userId: profileData[id]?.user_id || "",
          name: profileData[id]?.name || "",
          status: null as any,
        }))
      );
    }
    setLoading(false);
  }, [classData]);

  // Effect for session transitions and resets
  useEffect(() => {
    const wasActive = prevActiveRef.current;
    const isActive = classData.isActive;
    prevActiveRef.current = isActive;

    if (!isActive && wasActive) {
      // End latest open session (even if nobody marked)
      endLatestOpenSession(classData.id).then(() => {
        lastSessionIdRef.current = null;
        loadAttendanceData();
      });
    } else {
      loadAttendanceData();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [classData.isActive]);

  useEffect(() => {
    if (resetFlag) {
      lastSessionIdRef.current = null;
      loadAttendanceData();
      if (onResetDone) onResetDone();
    }
  }, [resetFlag, loadAttendanceData, onResetDone]);

  // Mutations:
  const toggleAttendance = async (uuid: string, currentStatus: "present" | "absent") => {
    if (!classData.isActive) return;
    setLoading(true);

    let sessionId = lastSessionIdRef.current;
    // Only create session on first toggle!
    if (!sessionId) {
      const session = await createNewClassSession(classData.id);
      if (session?.id) {
        sessionId = session.id;
        lastSessionIdRef.current = sessionId;
      }
    }
    if (sessionId) {
      const newStatus = currentStatus === "present" ? "absent" : "present";
      const { data: existing, error: selectError } = await supabase
        .from("attendance_records")
        .select("id")
        .eq("class_id", classData.id)
        .eq("student_id", uuid)
        .eq("session_id", sessionId);

      if (selectError) {
        toast({ title: "Error", description: "Failed to update attendance.", variant: "destructive" });
      } else if (existing && existing.length > 0) {
        const { error: updateError } = await supabase
          .from("attendance_records")
          .update({ status: newStatus, timestamp: new Date().toISOString() })
          .eq("id", existing[0].id);
        if (updateError) {
          toast({ title: "Error", description: "Failed to update attendance.", variant: "destructive" });
        } else {
          await loadAttendanceData();
          toast({ title: "Attendance Updated", description: `Student marked as ${newStatus}.` });
        }
      } else {
        const { error: insertError } = await supabase.from("attendance_records").insert([
          {
            class_id: classData.id,
            student_id: uuid,
            status: newStatus,
            timestamp: new Date().toISOString(),
            session_id: sessionId,
          },
        ]);
        if (insertError) {
          toast({ title: "Error", description: "Failed to update attendance.", variant: "destructive" });
        } else {
          await loadAttendanceData();
          toast({ title: "Attendance Updated", description: `Student marked as ${newStatus}.` });
        }
      }
    }
    setLoading(false);
  };

  const resetAttendance = async () => {
    setLoading(true);
    let sessionId = lastSessionIdRef.current;
    if (!sessionId) {
      const session = await createNewClassSession(classData.id);
      if (session?.id) {
        sessionId = session.id;
        lastSessionIdRef.current = sessionId;
      }
    }
    if (sessionId) {
      const { error } = await supabase
        .from("attendance_records")
        .delete()
        .eq("class_id", classData.id)
        .eq("session_id", sessionId);
      if (!error) {
        await loadAttendanceData();
        toast({ title: "Attendance Reset", description: "All attendance records for this session have been cleared." });
      } else {
        toast({ title: "Error", description: "Failed to reset attendance.", variant: "destructive" });
      }
    }
    setLoading(false);
  };

  const exportToCSV = () => {
    const headers = ['student_uuid', 'username', 'student_name', 'attendance_status'];
    const csvData = studentsStatus.map(student => [
      student.uuid,
      student.userId,
      student.name,
      student.status
    ]);
    const csvContent = [
      headers.join(','),
      ...csvData.map(row => row.join(','))
    ].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `attendance_${timestamp}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    toast({ title: "Export Successful", description: "Attendance data has been exported to CSV." });
  };

  return {
    studentsStatus,
    loading,
    toggleAttendance,
    resetAttendance,
    exportToCSV,
  };
}
// (File is very long, consider refactoring it into smaller hooks for future maintainability.)
