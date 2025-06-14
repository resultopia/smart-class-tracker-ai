
import { useState, useEffect } from "react";
import { Calendar } from "@/components/ui/calendar";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from "@/components/ui/table";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { useToast } from "@/components/ui/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { CalendarIcon, FileDown, Filter, Clock, Trash2 } from "lucide-react";
import { format } from "date-fns";
import { Class, AttendanceRecord, ClassSession } from "@/lib/types";
import { cn } from "@/lib/utils";
import AttendanceSessionList from "./AttendanceSessionList";
import AttendanceTable from "./AttendanceTable";

interface AttendanceHistoryProps {
  classData: Class;
}

const AttendanceHistory = ({ classData }: AttendanceHistoryProps) => {
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
        // Get class_sessions for selected date
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
        // All sessions for the class
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

      // Attendance records for the class
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

      // Set filteredByDate records for this day and session
      if (!selectedDate) {
        setFilteredRecords(attendance);
      } else {
        const todaySessionIds = filteredSessions.map(s => s.sessionId);
        setFilteredRecords(attendance.filter(rec => rec.sessionId && todaySessionIds.includes(rec.sessionId)));
      }
    };
    fetchAttendance();
  }, [classData.id, selectedDate]);

  // User lookup from profiles (Supabase)
  useEffect(() => {
    const fetchUserNames = async () => {
      const ids = classData.studentIds;
      if (!ids.length) return;
      const { data: profiles } = await supabase
        .from("profiles")
        .select("user_id,name")
        .in("user_id", ids);
      if (profiles) {
        const lookup = Object.fromEntries(
          profiles.map((p: { user_id: string, name: string }) => [p.user_id, p.name])
        );
        setUserLookup(lookup);
      }
    };
    fetchUserNames();
  }, [classData.studentIds]);

  // Get all records for selected session
  const getAllRecordsForSession = (session: ClassSession): AttendanceRecord[] => {
    // For each student, get record (or mark absent)
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

  // Delete a session and related attendance (Supabase)
  const deleteSession = async (sessionId: string) => {
    // First, delete attendance records for this session
    await supabase
      .from("attendance_records")
      .delete()
      .eq("session_id", sessionId);

    // Then, delete the class session
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

  // Toggle attendance status for a student in a session via Supabase
  const toggleAttendanceStatus = async (studentId: string, currentStatus: "present" | "absent") => {
    if (!selectedSession) return;
    const newStatus = currentStatus === "present" ? "absent" : "present";
    const record = allRecords.find(
      r => r.sessionId === selectedSession.sessionId && r.studentId === studentId
    );
    if (record) {
      // Update record
      await supabase
        .from("attendance_records")
        .update({ status: newStatus, timestamp: new Date().toISOString() })
        .eq("session_id", selectedSession.sessionId)
        .eq("student_id", studentId);
    } else {
      // Insert new record
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
    // Refresh UI state
    setSelectedSession({ ...selectedSession }); // force rerender
    setFilteredRecords(getAllRecordsForSession(selectedSession));
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
    const dateStr = selectedDate ? format(selectedDate, 'yyyy-MM-dd') : 'all-dates';
    const sessionStr = selectedSession ? `_session${dateSessions.indexOf(selectedSession) + 1}` : '';
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

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span>Attendance History</span>
            <div className="flex items-center space-x-2">
              <Popover>
                <PopoverTrigger asChild>
                  <Button variant="outline" size="sm">
                    <CalendarIcon className="h-4 w-4 mr-2" />
                    {selectedDate ? format(selectedDate, 'MMM dd, yyyy') : 'All dates'}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    mode="single"
                    selected={selectedDate}
                    onSelect={setSelectedDate}
                    initialFocus
                    className={cn("p-3 pointer-events-auto")}
                  />
                </PopoverContent>
              </Popover>
              
              {selectedDate && (
                <Button variant="ghost" size="sm" onClick={clearDateFilter}>
                  <Filter className="h-4 w-4 mr-2" />
                  Clear filter
                </Button>
              )}
              
              {filteredRecords.length > 0 && (
                <Button variant="outline" size="sm" onClick={exportFilteredCSV}>
                  <FileDown className="h-4 w-4 mr-2" />
                  Export CSV
                </Button>
              )}
            </div>
          </CardTitle>
        </CardHeader>
        <CardContent>
          {/* Show sessions for selected date */}
          {selectedDate && dateSessions.length > 0 && (
            <AttendanceSessionList
              dateSessions={dateSessions}
              selectedSession={selectedSession}
              onSessionSelect={handleSessionSelect}
              onDeleteSession={deleteSession}
              selectedDate={selectedDate}
            />
          )}

          {filteredRecords.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              {selectedDate && dateSessions.length > 0 
                ? "Select a class session above to view attendance records."
                : selectedDate 
                  ? `No attendance records found for ${format(selectedDate, 'MMM dd, yyyy')}.`
                  : "No attendance records found for the selected criteria."
              }
            </div>
          ) : (
            <AttendanceTable
              filteredRecords={filteredRecords}
              selectedSession={selectedSession}
              toggleAttendanceStatus={toggleAttendanceStatus}
            />
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default AttendanceHistory;
