
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
} from "@/lib/data";
import { getClassSessionsForDate } from "@/lib/classService";
import { CalendarIcon, FileDown, Filter, Clock } from "lucide-react";
import { format } from "date-fns";
import { Class, AttendanceRecord, ClassSession } from "@/lib/types";
import { cn } from "@/lib/utils";

interface AttendanceHistoryProps {
  classData: Class;
}

const AttendanceHistory = ({ classData }: AttendanceHistoryProps) => {
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(new Date());
  const [filteredRecords, setFilteredRecords] = useState<AttendanceRecord[]>([]);
  const [allRecords, setAllRecords] = useState<AttendanceRecord[]>([]);
  const [dateSessions, setDateSessions] = useState<ClassSession[]>([]);
  const [selectedSession, setSelectedSession] = useState<ClassSession | null>(null);
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

  const handleSessionSelect = (session: ClassSession) => {
    setSelectedSession(session);
    setFilteredRecords(session.attendanceRecords);
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
            <div className="mb-4">
              <h4 className="font-medium mb-3">
                Class sessions on {format(selectedDate, 'MMM dd, yyyy')}:
              </h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                {dateSessions.map((session, index) => (
                  <Button
                    key={session.sessionId}
                    variant={selectedSession?.sessionId === session.sessionId ? "default" : "outline"}
                    className="justify-start h-auto p-3"
                    onClick={() => handleSessionSelect(session)}
                  >
                    <div className="flex items-center space-x-2">
                      <Clock className="h-4 w-4" />
                      <div className="text-left">
                        <div className="font-medium">Class {index + 1}</div>
                        <div className="text-xs text-muted-foreground">
                          {format(new Date(session.startTime), 'HH:mm')} - {
                            session.endTime ? format(new Date(session.endTime), 'HH:mm') : 'Ongoing'
                          }
                        </div>
                        <div className="text-xs text-muted-foreground">
                          {session.attendanceRecords.length} records
                        </div>
                      </div>
                    </div>
                  </Button>
                ))}
              </div>
            </div>
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
            <div className="border rounded-md">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Student ID</TableHead>
                    <TableHead>Name</TableHead>
                    <TableHead>Date</TableHead>
                    <TableHead>Time</TableHead>
                    <TableHead>Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredRecords.map((record, index) => {
                    const student = getUserById(record.studentId);
                    const recordDate = new Date(record.timestamp);
                    return (
                      <TableRow key={index}>
                        <TableCell>{record.studentId}</TableCell>
                        <TableCell>{student?.name || "Unknown"}</TableCell>
                        <TableCell>{recordDate.toLocaleDateString()}</TableCell>
                        <TableCell>{recordDate.toLocaleTimeString()}</TableCell>
                        <TableCell>
                          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                            (record.status || "present") === "present" 
                              ? "bg-green-100 text-green-800" 
                              : "bg-red-100 text-red-800"
                          }`}>
                            {record.status || "present"}
                          </span>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default AttendanceHistory;
