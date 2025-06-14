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

  // Helper: Always get the list of student IDs from the database relation table
  const fetchStudentIdsFromDb = useCallback(async () => {
    // NOTE: We want the freshest list, just in case
    const { supabase } = await import("@/integrations/supabase/client");
    const { data: rels, error } = await supabase
      .from("classes_students")
      .select("student_id")
      .eq("class_id", classData.id);
    if (error) {
      console.error("Unable to load students from database:", error);
      return [];
    }
    return (rels ?? []).map((r: { student_id: string }) => r.student_id);
  }, [classData.id]);

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
      // Session is active: Combine attendance records with profiles
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
      // Session is not active: Show all students using list from classes_students
      try {
        const studentIds = await fetchStudentIdsFromDb();
        let profiles = await api.fetchProfiles(classData.id);
        // filter profiles so only the ones matching class_students will be shown
        profiles = (profiles || []).filter((p: any) => studentIds.includes(p.id));

        // fallback: for students not found as profiles, create a placeholder
        const statusList: StudentAttendanceStatus[] = [];
        for (const id of studentIds) {
          const profile = profiles.find((p: any) => p.id === id);
          statusList.push({
            uuid: id,
            userId: profile?.user_id || id,
            name: profile?.name || id,
            status: null,
          });
        }
        setStudentsStatus(statusList);
      } catch (e) {
        console.error("Failed to load students for dashboard:", e);
        setStudentsStatus([]);
      }
    }
    setLoading(false);
  }, [
    classData,
    setStudentsStatus,
    fetchStudentIdsFromDb,
    initializeAllAbsent,
  ]);

  // --- NEW: Always fetch data on first mount and when classData.id changes ---
  useEffect(() => {
    loadAttendanceData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [classData.id]);
  // --------------------------------------------------------------------------

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

// NOTE: This file is getting quite long! Please consider asking me to refactor it for better maintainability.
