import { useState, useRef, useEffect, useCallback } from "react";
import { useToast } from "@/hooks/use-toast";
import { Class } from "@/lib/types";
import type { StudentAttendanceStatus } from "@/components/StudentAttendanceRow";
import * as api from "./useAttendanceSessionApi";
import { useClassAttendanceState } from "./useClassAttendanceState";
import { mapProfilesToStudentsStatus, mergeAttendanceWithProfiles } from "./attendanceSessionUtils";

// All Supabase, no localstorage!

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

  // Helper: Initialize all students as absent for a fresh list
  const initializeAllAbsent = useCallback(async () => {
    const profiles = await api.fetchProfiles(classData.id);
    setStudentsStatus(mapProfilesToStudentsStatus(profiles, "absent"));
  }, [classData.id, setStudentsStatus]);

  // Loads current attendance for a given session
  const loadAttendanceData = useCallback(async () => {
    setLoading(true);
    let sessionId = lastSessionIdRef.current;

    if (classData.isActive) {
      // Always use the last created session for the active class
      if (!sessionId) {
        sessionId = await api.fetchLatestSessionId(classData.id);
        if (sessionId) lastSessionIdRef.current = sessionId;
      }

      if (sessionId) {
        const [records, profiles] = await Promise.all([
          api.fetchAttendanceRecords(classData.id, sessionId),
          api.fetchProfiles(classData.id),
        ]);
        if (!records || records.length === 0) {
          setStudentsStatus(mapProfilesToStudentsStatus(profiles, "absent"));
        } else {
          setStudentsStatus(mergeAttendanceWithProfiles(records, profiles ?? []));
        }
      } else {
        await initializeAllAbsent();
      }
    } else {
      // Class inactive: blank the session id
      lastSessionIdRef.current = null;
      const profiles = await api.fetchProfiles(classData.id);
      const studentIds = classData.studentIds || [];
      setStudentsStatus(
        (studentIds ?? []).map((id) => ({
          uuid: id,
          userId: profiles?.find((p) => p.id === id)?.user_id || id,
          name: profiles?.find((p) => p.id === id)?.name || "",
          status: null,
        }))
      );
    }
    setLoading(false);
  }, [classData, setStudentsStatus, initializeAllAbsent]);

  // EFFECT: Handle class start/stop state instead of relying on ambiguous previous sessions
  useEffect(() => {
    const wasActive = prevActiveRef.current;
    const isActive = classData.isActive;
    prevActiveRef.current = isActive;

    if (isActive && !wasActive) {
      // Debug: Starting class, force-creating new session
      console.log(`[AttendanceSession] STARTING class: ${classData.id} (${classData.name})`);
      (async () => {
        setLoading(true);
        const newSession = await api.forceCreateSession(classData.id);
        if (newSession?.id) {
          lastSessionIdRef.current = newSession.id;
          console.log(`[AttendanceSession] New session created`, {
            classId: classData.id,
            sessionId: newSession.id,
            time: newSession.start_time
          });
        } else {
          lastSessionIdRef.current = null;
          console.warn(`[AttendanceSession] Failed to create new session for class: ${classData.id}`);
        }
        await initializeAllAbsent();
        setLoading(false);
      })();
    } else if (!isActive && wasActive) {
      // Debug: Stopping class, ending session
      console.log(`[AttendanceSession] STOPPING class: ${classData.id} (${classData.name})`);
      (async () => {
        setLoading(true);
        await api.endOpenSession(classData.id);
        // Log last session Id after ending
        console.log(`[AttendanceSession] Stopped session for class`, {
          classId: classData.id,
          lastSessionId: lastSessionIdRef.current,
          time: new Date().toISOString()
        });
        lastSessionIdRef.current = null;
        setStudentsStatus([]);
        await loadAttendanceData();
        setLoading(false);
      })();
    } else {
      // Debug: No state change, normal load
      console.log(`[AttendanceSession] LOAD: class: ${classData.id} (${classData.name}), isActive=${isActive}`);
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

  // Mark present/absent for the current session ONLY
  const toggleAttendance = async (
    uuid: string,
    currentStatus: "present" | "absent"
  ) => {
    if (!classData.isActive) return; // Safety: Only allow during active class
    setLoading(true);

    let sessionId = lastSessionIdRef.current;
    if (!sessionId) {
      sessionId = await api.fetchLatestSessionId(classData.id);
      if (!sessionId) {
        // If still null, force create a new one
        const newSession = await api.forceCreateSession(classData.id);
        if (newSession?.id) {
          sessionId = newSession.id;
          lastSessionIdRef.current = sessionId;
        }
      } else {
        lastSessionIdRef.current = sessionId;
      }
    }

    if (sessionId) {
      const newStatus = currentStatus === "present" ? "absent" : "present";
      const { error } = await api.toggleAttendanceRecord(
        classData.id,
        sessionId,
        uuid,
        newStatus
      );
      if (error) {
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
      toast({
        title: "Error",
        description: "No active session found or created for attendance.",
        variant: "destructive",
      });
    }
    setLoading(false);
  };

  // Reset all records for the current session ONLY (leave other sessions/history alone)
  const resetAttendance = async () => {
    setLoading(true);
    let sessionId = lastSessionIdRef.current;
    if (!sessionId) {
      // Always look for current, but should exist since start always .forceCreateSession
      sessionId = await api.fetchLatestSessionId(classData.id);
      if (sessionId) lastSessionIdRef.current = sessionId;
    }
    if (sessionId) {
      const { error } = await api.deleteAttendanceRecords(classData.id, sessionId);
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

  // Attendance table export: ONLY export current dashboard session, not history
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
