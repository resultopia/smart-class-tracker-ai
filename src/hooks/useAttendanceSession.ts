
import { useState, useRef, useEffect, useCallback } from "react";
import { useToast } from "@/hooks/use-toast";
import { Class } from "@/lib/types";
import type { StudentAttendanceStatus } from "@/components/StudentAttendanceRow";
import {
  createNewClassSession,
  endLatestOpenSession,
  getLatestSessionId,
  getClassStudentProfiles,
  getAttendanceRecords,
} from "./attendanceSessionApi";
import { useClassAttendanceState } from "./useClassAttendanceState";
import { supabase } from "@/integrations/supabase/client";

// Main orchestrator hook
export function useAttendanceSession(
  classData: Class,
  resetFlag?: boolean,
  onResetDone?: () => void
) {
  const { studentsStatus, setStudentsStatus } = useClassAttendanceState([]);
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();
  const lastSessionIdRef = useRef<string | null>(null);
  const prevActiveRef = useRef<boolean>(classData.isActive);

  // Helper to ALWAYS reset dashboard to all students absent for a new session
  const initializeAllAbsent = useCallback(async () => {
    const profiles = await getClassStudentProfiles(classData.id);
    const studentIds = (profiles ?? []).map((row) => row.id);
    const absents = studentIds.map((id) => ({
      uuid: id,
      userId: profiles.find((p) => p.id === id)?.user_id || id,
      name: profiles.find((p) => p.id === id)?.name || "",
      status: "absent" as const,
    }));
    setStudentsStatus(absents);
  }, [classData.id, setStudentsStatus]);

  // Load attendance and profiles
  const loadAttendanceData = useCallback(
    async () => {
      setLoading(true);

      if (classData.isActive) {
        // Always get latest open session for this class
        let sessionId = lastSessionIdRef.current;
        if (!sessionId) {
          sessionId = await getLatestSessionId(classData.id);
          if (sessionId) lastSessionIdRef.current = sessionId;
        }
        if (sessionId) {
          // Fetch attendance records and profiles
          const [records, profiles] = await Promise.all([
            getAttendanceRecords(classData.id, sessionId),
            getClassStudentProfiles(classData.id),
          ]);
          // If there are no records for the new session, everyone should show as absent!
          if (!records || records.length === 0) {
            const studentIds = (profiles ?? []).map((row) => row.id) || [];
            setStudentsStatus(
              studentIds.map((studentUuid) => ({
                userId: profiles.find((p) => p.id === studentUuid)?.user_id || studentUuid,
                uuid: studentUuid,
                name: profiles.find((p) => p.id === studentUuid)?.name || "",
                status: "absent" as const,
              }))
            );
          } else {
            // If records exist, show their real status
            const profileData: Record<string, { user_id: string; name: string }> = {};
            if (profiles && Array.isArray(profiles)) {
              profiles.forEach((row) => {
                profileData[row.id] = { user_id: row.user_id, name: row.name };
              });
            }
            const statusMap: Record<string, "present" | "absent"> = {};
            (records ?? []).forEach((rec) => {
              statusMap[rec.student_id] = rec.status === "present" ? "present" : "absent";
            });
            const studentIds = (profiles ?? []).map((row) => row.id) || [];
            const results = studentIds.map((studentUuid) => ({
              userId: profileData[studentUuid]?.user_id || studentUuid,
              uuid: studentUuid,
              name: profileData[studentUuid]?.name || "",
              status: statusMap[studentUuid] || "absent",
            }));
            setStudentsStatus(results);
          }
        } else {
          // No open session: treat all as absent
          await initializeAllAbsent();
        }
      } else {
        // If class is inactive, clear records
        lastSessionIdRef.current = null;
        const studentIds = classData.studentIds || [];
        setStudentsStatus(
          studentIds.map((id) => ({
            uuid: id,
            userId: "",
            name: "",
            status: null as any,
          }))
        );
      }
      setLoading(false);
    },
    [classData, setStudentsStatus, initializeAllAbsent]
  );

  // Handle effect for activation/deactivation of class
  useEffect(() => {
    const wasActive = prevActiveRef.current;
    const isActive = classData.isActive;
    prevActiveRef.current = isActive;

    if (isActive && !wasActive) {
      (async () => {
        // Class starting: always create a new session for a fresh dashboard
        const newSession = await createNewClassSession(classData.id);
        lastSessionIdRef.current = newSession?.id || null;
        await initializeAllAbsent();
      })();
    } else if (!isActive && wasActive) {
      (async () => {
        await endLatestOpenSession(classData.id);
        lastSessionIdRef.current = null;
        setStudentsStatus([]);
        // Optionally initialize dashboard to empty/absent here
        loadAttendanceData();
      })();
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
  const toggleAttendance = async (
    uuid: string,
    currentStatus: "present" | "absent"
  ) => {
    if (!classData.isActive) return;
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
      const newStatus = currentStatus === "present" ? "absent" : "present";
      const { data: existing, error: selectError } = await supabase
        .from("attendance_records")
        .select("id")
        .eq("class_id", classData.id)
        .eq("student_id", uuid)
        .eq("session_id", sessionId);

      if (selectError) {
        toast({
          title: "Error",
          description: "Failed to update attendance.",
          variant: "destructive",
        });
      } else if (existing && existing.length > 0) {
        const { error: updateError } = await supabase
          .from("attendance_records")
          .update({ status: newStatus, timestamp: new Date().toISOString() })
          .eq("id", existing[0].id);
        if (updateError) {
          toast({
            title: "Error",
            description: "Failed to update attendance.",
            variant: "destructive",
          });
        } else {
          await loadAttendanceData();
          toast({
            title: "Attendance Updated",
            description: `Student marked as ${newStatus}.`,
          });
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
          toast({
            title: "Error",
            description: "Failed to update attendance.",
            variant: "destructive",
          });
        } else {
          await loadAttendanceData();
          toast({
            title: "Attendance Updated",
            description: `Student marked as ${newStatus}.`,
          });
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
        await initializeAllAbsent();
        toast({
          title: "Attendance Reset",
          description: "All attendance records for this session have been cleared.",
        });
      } else {
        toast({
          title: "Error",
          description: "Failed to reset attendance.",
          variant: "destructive",
        });
      }
    }
    setLoading(false);
  };

  const exportToCSV = () => {
    const headers = ["student_uuid", "username", "student_name", "attendance_status"];
    const csvData = studentsStatus.map((student) => [
      student.uuid,
      student.userId,
      student.name,
      student.status,
    ]);
    const csvContent = [
      headers.join(","),
      ...csvData.map((row) => row.join(",")),
    ].join("\n");
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const timestamp = new Date().toISOString().replace(/[:.]/g, "-");
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", `attendance_${timestamp}.csv`);
    link.style.visibility = "hidden";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    toast({
      title: "Export Successful",
      description: "Attendance data has been exported to CSV.",
    });
  };

  return {
    studentsStatus,
    loading,
    toggleAttendance,
    resetAttendance,
    exportToCSV,
  };
}
