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
  const [sessionInitializing, setSessionInitializing] = useState(false);
  const { toast } = useToast();
  // Now stores the session_id (uuid or null)
  const activeSessionIdRef = useRef<string | null>(classData.isActive ?? null);
  const prevSessionIdRef = useRef<string | null>(classData.isActive ?? null);

  // Helper: Initialize all students as absent for a fresh list
  const initializeAllAbsent = useCallback(async () => {
    const profiles = await api.fetchProfiles(classData.id);
    setStudentsStatus(mapProfilesToStudentsStatus(profiles, "absent"));
  }, [classData.id, setStudentsStatus]);

  // Loads current attendance for a given session
  const loadAttendanceData = useCallback(async () => {
    setLoading(true);

    let sessionId: string | null = classData.isActive ?? null;

    if (sessionId) {
      // Fetch records for this session id
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
      // Class is not active - show all with status null
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
  }, [
    classData,
    setStudentsStatus,
    initializeAllAbsent,
  ]);

  // EFFECT: Detect change of sessionId (isActive) and reload data if needed
  useEffect(() => {
    if (classData.isActive !== prevSessionIdRef.current) {
      activeSessionIdRef.current = classData.isActive ?? null;
      prevSessionIdRef.current = classData.isActive ?? null;
      loadAttendanceData();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [classData.isActive]);

  useEffect(() => {
    if (resetFlag) {
      activeSessionIdRef.current = classData.isActive ?? null;
      loadAttendanceData();
      if (onResetDone) onResetDone();
    }
  }, [resetFlag, loadAttendanceData, onResetDone, classData.isActive]);

  // Mark present/absent for the current session ONLY
  const toggleAttendance = async (
    uuid: string,
    currentStatus: "present" | "absent"
  ) => {
    if (!classData.isActive) return;
    if (sessionInitializing) {
      toast({
        title: "Please Wait",
        description: "Session is still being set up. Try again shortly.",
        variant: "default",
      });
      return;
    }

    setLoading(true);
    let sessionId: string | null = classData.isActive ?? null;
    if (!sessionId) {
      setLoading(false);
      toast({
        title: "Error",
        description: "No session id found for this active class. Please restart class.",
        variant: "destructive",
      });
      return;
    }
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
    setLoading(false);
  };

  // Reset all records for the current session ONLY
  const resetAttendance = async () => {
    setLoading(true);
    let sessionId: string | null = classData.isActive ?? null;
    if (!sessionId) {
      setLoading(false);
      toast({
        title: "Error",
        description: "No session id for current class. Try restarting class.",
        variant: "destructive",
      });
      return;
    }
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
    loading: loading || sessionInitializing,
    toggleAttendance,
    resetAttendance,
    exportToCSV,
  };
}
