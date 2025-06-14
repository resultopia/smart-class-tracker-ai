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
import { mapProfilesToStudentsStatus, mergeAttendanceWithProfiles } from "./attendanceSessionUtils";
import * as api from "./useAttendanceSessionApi";

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

  const initializeAllAbsent = useCallback(async () => {
    const profiles = await api.fetchProfiles(classData.id);
    setStudentsStatus(mapProfilesToStudentsStatus(profiles, "absent"));
  }, [classData.id, setStudentsStatus]);

  // Load attendance and profiles, split logic for readability
  const loadAttendanceData = useCallback(
    async () => {
      setLoading(true);
      if (classData.isActive) {
        let sessionId = lastSessionIdRef.current;
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
    },
    [classData, setStudentsStatus, initializeAllAbsent]
  );

  useEffect(() => {
    const wasActive = prevActiveRef.current;
    const isActive = classData.isActive;
    prevActiveRef.current = isActive;

    if (isActive && !wasActive) {
      (async () => {
        const newSession = await api.createSession(classData.id);
        lastSessionIdRef.current = newSession?.id || null;
        await initializeAllAbsent();
      })();
    } else if (!isActive && wasActive) {
      (async () => {
        await api.endOpenSession(classData.id);
        lastSessionIdRef.current = null;
        setStudentsStatus([]);
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

  // Mutations
  const toggleAttendance = async (
    uuid: string,
    currentStatus: "present" | "absent"
  ) => {
    if (!classData.isActive) return;
    setLoading(true);
    let sessionId = lastSessionIdRef.current;
    if (!sessionId) {
      const session = await api.createSession(classData.id);
      if (session?.id) {
        sessionId = session.id;
        lastSessionIdRef.current = sessionId;
      }
    }
    if (sessionId) {
      const newStatus = currentStatus === "present" ? "absent" : "present";
      const { error } = await api.toggleAttendanceRecord(classData.id, sessionId, uuid, newStatus);
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
    }
    setLoading(false);
  };

  const resetAttendance = async () => {
    setLoading(true);
    let sessionId = lastSessionIdRef.current;
    if (!sessionId) {
      const session = await api.createSession(classData.id);
      if (session?.id) {
        sessionId = session.id;
        lastSessionIdRef.current = sessionId;
      }
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
