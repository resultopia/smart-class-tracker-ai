
import { useState, useEffect } from "react";
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/use-toast";
import { 
  getClassAttendance, 
  getUserById, 
  markAttendance, 
  resetTodayAttendance, 
  getStudentsAttendanceStatus 
} from "@/lib/data";
import { Check, X, RefreshCcw, FileDown } from "lucide-react";
import { Class } from "@/lib/types";

interface AttendanceDashboardProps {
  classData: Class;
}

interface StudentAttendanceStatus {
  userId: string;
  name: string;
  status: "present" | "absent";
}

const AttendanceDashboard = ({ classData }: AttendanceDashboardProps) => {
  const [studentsStatus, setStudentsStatus] = useState<StudentAttendanceStatus[]>([]);
  const { toast } = useToast();

  useEffect(() => {
    if (classData) {
      // Use an IIFE to handle async useEffect
      (async () => {
        await loadAttendanceData();
      })();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [classData]);

  const loadAttendanceData = async () => {
    const statusData = await getStudentsAttendanceStatus(classData.id);
    setStudentsStatus(statusData);
  };

  const toggleAttendance = (studentId: string, currentStatus: "present" | "absent") => {
    const newStatus = currentStatus === "present" ? "absent" : "present";
    const success = markAttendance(classData.id, studentId, newStatus);

    if (success) {
      loadAttendanceData();
      toast({
        title: "Attendance Updated",
        description: `Student marked as ${newStatus}.`
      });
    } else {
      toast({
        title: "Error",
        description: "Failed to update attendance.",
        variant: "destructive"
      });
    }
  };

  const handleResetAttendance = () => {
    const success = resetTodayAttendance(classData.id);
    if (success) {
      loadAttendanceData();
      toast({
        title: "Attendance Reset",
        description: "All attendance records for today have been cleared."
      });
    } else {
      toast({
        title: "Error",
        description: "Failed to reset attendance.",
        variant: "destructive"
      });
    }
  };

  const exportToCSV = () => {
    // Prepare CSV data
    const headers = ['user_id', 'student_name', 'attendance_status'];
    const csvData = studentsStatus.map(student => [
      student.userId,
      student.name,
      student.status
    ]);
    
    // Convert to CSV format
    const csvContent = [
      headers.join(','),
      ...csvData.map(row => row.join(','))
    ].join('\n');
    
    // Create download link
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
    
    toast({
      title: "Export Successful",
      description: "Attendance data has been exported to CSV."
    });
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-medium">Today's Attendance</h3>
        <div className="space-x-2">
          <Button 
            variant="outline" 
            size="sm" 
            onClick={handleResetAttendance}
          >
            <RefreshCcw className="h-4 w-4 mr-2" />
            Reset All
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={exportToCSV}
          >
            <FileDown className="h-4 w-4 mr-2" />
            Export CSV
          </Button>
        </div>
      </div>
      
      <div className="border rounded-md">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Student ID</TableHead>
              <TableHead>Name</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {studentsStatus.length === 0 ? (
              <TableRow>
                <TableCell colSpan={4} className="text-center py-4">
                  No students in this class.
                </TableCell>
              </TableRow>
            ) : (
              studentsStatus.map((student) => (
                <TableRow key={student.userId}>
                  <TableCell>{student.userId}</TableCell>
                  <TableCell>{student.name}</TableCell>
                  <TableCell>
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                      student.status === "present" 
                        ? "bg-green-100 text-green-800" 
                        : "bg-red-100 text-red-800"
                    }`}>
                      {student.status === "present" ? (
                        <>
                          <Check className="w-3 h-3 mr-1" />
                          Present
                        </>
                      ) : (
                        <>
                          <X className="w-3 h-3 mr-1" />
                          Absent
                        </>
                      )}
                    </span>
                  </TableCell>
                  <TableCell className="text-right">
                    <Button
                      variant={student.status === "present" ? "destructive" : "default"}
                      size="sm"
                      onClick={() => toggleAttendance(student.userId, student.status)}
                    >
                      {student.status === "present" ? "Mark Absent" : "Mark Present"}
                    </Button>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
};

export default AttendanceDashboard;
