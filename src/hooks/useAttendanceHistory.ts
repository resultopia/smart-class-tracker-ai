import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/components/ui/use-toast";
import { Class, AttendanceRecord, ClassSession } from "@/lib/types";

// Custom hook for attendance history logic
export function useAttendanceHistory(classData: Class) {
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(new Date());
  const [filteredRecords, setFilteredRecords] = useState<AttendanceRecord[]>([]);
  const [allRecords, setAllRecords] = useState<AttendanceRecord[]>([]);
  const [dateSessions, setDateSessions] = useState<ClassSession[]>([]);
  const [selectedSession, setSelectedSession] = useState<ClassSession | null>(null);
  const [userLookup, setUserLookup] = useState<Record<string, string>>({});
  const { toast } = useToast();

  // Load attendance and sessions from Supabase
  useEffect(() => {
    const fetchAttendance = async () => {
      let filteredSessions: ClassSession[] = [];
      let attendance: AttendanceRecord[] = [];

      if (selectedDate) {
        const dateStart = new Date(selectedDate);
        dateStart.setHours(0, 0, 0, 0);
        const dateEnd = new Date(dateStart);
        dateEnd.setDate(dateStart.getDate() + 1);

        const { data: sessionRows } = await supabase
          .from("class_sessions")
          .select("*")
          .eq("class_id", classData.id)
          .gte("start_time", dateStart.toISOString())
          .lt("start_time", dateEnd.toISOString());

        filteredSessions = sessionRows?.map((row) => ({
          sessionId: row.id,
          startTime: new Date(row.start_time),
          endTime: row.end_time ? new Date(row.end_time) : undefined,
          attendanceRecords: [],
        })) || [];
      } else {
        const { data: sessionRows } = await supabase
          .from("class_sessions")
          .select("*")
          .eq("class_id", classData.id);
        filteredSessions = sessionRows?.map((row) => ({
          sessionId: row.id,
          startTime: new Date(row.start_time),
          endTime: row.end_time ? new Date(row.end_time) : undefined,
          attendanceRecords: [],
        })) || [];
      }
      setDateSessions(filteredSessions);

      const { data: recordsRows } = await supabase
        .from("attendance_records")
        .select("*")
        .eq("class_id", classData.id);
      attendance = recordsRows?.map((row) => ({
        studentId: row.student_id,
        timestamp: new Date(row.timestamp),
        status: row.status as "present" | "absent",
        sessionId: row.session_id,
      })) || [];
      setAllRecords(attendance);

      if (!selectedDate) {
        setFilteredRecords(attendance);
      } else {
        const todaySessionIds = filteredSessions.map(s => s.sessionId);
        setFilteredRecords(attendance.filter(rec => rec.sessionId && todaySessionIds.includes(rec.sessionId)));
      }
    };
    fetchAttendance();
    // eslint-disable-next-line
  }, [classData.id, selectedDate]);

  // User lookup from profiles (Supabase)
  useEffect(() => {
    const fetchUserNames = async () => {
      const ids = classData.studentIds;
      if (!ids.length) return;
      // Fetch profiles, but map UUIDs to names (id field, not user_id)
      const { data: profiles } = await supabase
        .from("profiles")
        .select("id,name")
        .in("id", ids);
      if (profiles) {
        const lookup = Object.fromEntries(
          profiles.map((p: { id: string, name: string }) => [p.id, p.name])
        );
        setUserLookup(lookup);
      }
    };
    fetchUserNames();
  }, [classData.studentIds]);

  // Get attendance records for session
  const getAllRecordsForSession = (session: ClassSession): AttendanceRecord[] => {
    return classData.studentIds.map((studentId) => {
      const record = allRecords.find(
        r => r.sessionId === session.sessionId && r.studentId === studentId
      );
      if (record) return record;
      return {
        studentId,
        timestamp: session.startTime,
        status: "absent" as const,
        sessionId: session.sessionId,
      };
    });
  };

  const handleSessionSelect = (session: ClassSession) => {
    setSelectedSession(session);
    setFilteredRecords(getAllRecordsForSession(session));
  };

  const deleteSession = async (sessionId: string) => {
    await supabase
      .from("attendance_records")
      .delete()
      .eq("session_id", sessionId);

    await supabase
      .from("class_sessions")
      .delete()
      .eq("id", sessionId);

    toast({
      title: "Session Deleted",
      description: "The class session has been deleted successfully.",
    });

    setSelectedSession(null);
    setFilteredRecords([]);
    setDateSessions(dateSessions.filter((s) => s.sessionId !== sessionId));
  };

  // Fix: Refetch records after toggling attendance!
  const toggleAttendanceStatus = async (studentId: string, currentStatus: "present" | "absent") => {
    if (!selectedSession) return;
    const newStatus = currentStatus === "present" ? "absent" : "present";
    const record = allRecords.find(
      r => r.sessionId === selectedSession.sessionId && r.studentId === studentId
    );
    if (record) {
      await supabase
        .from("attendance_records")
        .update({ status: newStatus, timestamp: new Date().toISOString() })
        .eq("session_id", selectedSession.sessionId)
        .eq("student_id", studentId);
    } else {
      await supabase.from("attendance_records").insert({
        class_id: classData.id,
        session_id: selectedSession.sessionId,
        student_id: studentId,
        timestamp: new Date().toISOString(),
        status: newStatus,
      });
    }
    toast({
      title: "Attendance Updated",
      description: `Student marked as ${newStatus}.`,
    });

    // Refetch attendance for all records to update state
    const { data: recordsRows } = await supabase
      .from("attendance_records")
      .select("*")
      .eq("class_id", classData.id);
    const updatedAttendance = recordsRows?.map((row) => ({
      studentId: row.student_id,
      timestamp: new Date(row.timestamp),
      status: row.status as "present" | "absent",
      sessionId: row.session_id,
    })) || [];
    setAllRecords(updatedAttendance);

    // Update filteredRecords for the current session:
    setFilteredRecords(
      updatedAttendance.filter(r => r.sessionId === selectedSession.sessionId)
    );
  };

  // Export CSV
  const exportFilteredCSV = async () => {
    const headers = ['student_id', 'student_name', 'date', 'time', 'status'];
    const csvData: string[][] = [];
    for (const record of filteredRecords) {
      const name = userLookup[record.studentId] || "Unknown";
      const recordDate = new Date(record.timestamp);
      csvData.push([
        record.studentId,
        name,
        recordDate.toLocaleDateString(),
        recordDate.toLocaleTimeString(),
        record.status || "present"
      ]);
    }
    const csvContent = [
      headers.join(','),
      ...csvData.map(row => row.join(','))
    ].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const sessionStr = selectedSession ? `_session${dateSessions.indexOf(selectedSession) + 1}` : '';
    const dateStr = selectedDate ? selectedDate.toISOString().slice(0, 10) : 'all-dates';
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `attendance_${dateStr}${sessionStr}_${classData.name.replace(/\s+/g, '_')}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    toast({
      title: "Export Successful",
      description: `Attendance data exported successfully.`
    });
  };

  const clearDateFilter = () => {
    setSelectedDate(undefined);
    setSelectedSession(null);
    setFilteredRecords(allRecords);
  };

  return {
    selectedDate,
    setSelectedDate,
    filteredRecords,
    allRecords,
    dateSessions,
    selectedSession,
    setSelectedSession,
    userLookup,
    exportFilteredCSV,
    clearDateFilter,
    handleSessionSelect,
    deleteSession,
    toggleAttendanceStatus,
    classData
  };
}
