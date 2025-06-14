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
import { 
  getClassAttendance, 
  getUserById,
  saveClasses,
  initializeData
} from "@/lib/data";
import { getClassSessionsForDate } from "@/lib/classService";
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

  useEffect(() => {
    const records = getClassAttendance(classData.id);
    setAllRecords(records);
    filterRecordsByDate(records, selectedDate);
  }, [classData.id, selectedDate]);

  const filterRecordsByDate = (records: AttendanceRecord[], date: Date | undefined) => {
    if (!date) {
      setFilteredRecords(records);
      setDateSessions([]);
      setSelectedSession(null);
      return;
    }
    
    // Get sessions for selected date
    const sessions = getClassSessionsForDate(classData.id, date);
    setDateSessions(sessions);
    setSelectedSession(null);
    
    if (sessions.length === 0) {
      // No sessions found, show current day records if any
      const filtered = records.filter(record => {
        const recordDate = new Date(record.timestamp);
        return recordDate.toDateString() === date.toDateString();
      });
      setFilteredRecords(filtered);
    } else {
      // Show message to select a session
      setFilteredRecords([]);
    }
  };

  // Util: Get combined attendance list for session (present + absent)
  const getAllRecordsForSession = (session: ClassSession): AttendanceRecord[] => {
    // Map student ID to record, including explicit 'absent' if none found
    return classData.studentIds.map((studentId) => {
      const record = session.attendanceRecords.find(r => r.studentId === studentId);
      if (record) return record;
      // Explicitly type as AttendanceRecord, status as "absent"
      return {
        studentId,
        timestamp: session.startTime, // use session start as created time
        status: "absent" as const
      };
    });
  };

  const handleSessionSelect = (session: ClassSession) => {
    setSelectedSession(session);
    setFilteredRecords(getAllRecordsForSession(session));
  };

  const deleteSession = (sessionId: string) => {
    const refreshedData = initializeData();
    const classes = refreshedData.classes;
    
    const updatedClasses = classes.map(cls => {
      if (cls.id === classData.id) {
        return {
          ...cls,
          sessions: cls.sessions.filter(session => session.sessionId !== sessionId)
        };
      }
      return cls;
    });
    
    saveClasses(updatedClasses);
    
    // Refresh the sessions for the selected date
    if (selectedDate) {
      const sessions = getClassSessionsForDate(classData.id, selectedDate);
      setDateSessions(sessions);
      if (selectedSession?.sessionId === sessionId) {
        setSelectedSession(null);
        setFilteredRecords([]);
      }
    }
    
    toast({
      title: "Session Deleted",
      description: "The class session has been deleted successfully."
    });
  };

  const toggleAttendanceStatus = (studentId: string, currentStatus: "present" | "absent") => {
    if (!selectedSession) return;
    
    const refreshedData = initializeData();
    const classes = refreshedData.classes;
    
    const newStatus: "present" | "absent" = currentStatus === "present" ? "absent" : "present";
    
    const updatedClasses = classes.map(cls => {
      if (cls.id === classData.id) {
        return {
          ...cls,
          sessions: cls.sessions.map(session => {
            if (session.sessionId === selectedSession.sessionId) {
              // Update (toggle) or add missing record
              const existingRecordIdx = session.attendanceRecords.findIndex(
                r => r.studentId === studentId
              );
              let updatedAttendanceRecords;
              if (existingRecordIdx >= 0) {
                // Toggle, update status
                updatedAttendanceRecords = session.attendanceRecords.map(r =>
                  r.studentId === studentId
                    ? { ...r, status: newStatus, timestamp: new Date() }
                    : r
                );
              } else {
                // Add new present record
                updatedAttendanceRecords = [
                  ...session.attendanceRecords,
                  { studentId, timestamp: new Date(), status: newStatus }
                ];
              }
              return {
                ...session,
                attendanceRecords: updatedAttendanceRecords
              };
            }
            return session;
          })
        };
      }
      return cls;
    });
    
    saveClasses(updatedClasses);
    
    // Get updated sessions for correct timestamp and new attendance
    const refreshed = initializeData();
    const thisClass = refreshed.classes.find(c => c.id === classData.id);
    const thisSession = thisClass?.sessions.find(
      s => s.sessionId === selectedSession.sessionId
    );
    setSelectedSession(thisSession || null);
    setFilteredRecords(thisSession ? getAllRecordsForSession(thisSession) : []);
    
    toast({
      title: "Attendance Updated",
      description: `Student marked as ${newStatus}.`
    });
  };

  const exportFilteredCSV = () => {
    const headers = ['student_id', 'student_name', 'date', 'time', 'status'];
    const csvData = filteredRecords.map(record => {
      const student = getUserById(record.studentId);
      const recordDate = new Date(record.timestamp);
      return [
        record.studentId,
        student?.name || "Unknown",
        recordDate.toLocaleDateString(),
        recordDate.toLocaleTimeString(),
        record.status || "present"
      ];
    });
    
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
    filterRecordsByDate(allRecords, undefined);
  };

  useEffect(() => {
    const fetchUserNames = async () => {
      const lookup: Record<string, string> = {};
      for (const studentId of classData.studentIds) {
        const user = await getUserById(studentId);
        lookup[studentId] = user?.name || "Unknown";
      }
      setUserLookup(lookup);
    };
    fetchUserNames();
  }, [classData.studentIds]);

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
