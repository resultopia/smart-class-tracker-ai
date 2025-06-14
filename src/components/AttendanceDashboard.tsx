import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { 
  getStudentsAttendanceStatus,
  markAttendance,
  resetTodayAttendance
} from "@/lib/data";
import { RefreshCcw, FileDown } from "lucide-react";
import { Class } from "@/lib/types";
import { supabase } from "@/integrations/supabase/client";
import AttendanceTable from "./AttendanceTable";
import type { StudentAttendanceStatus } from "./StudentAttendanceRow";

interface AttendanceDashboardProps {
  classData: Class;
}

const AttendanceDashboard = ({ classData }: AttendanceDashboardProps) => {
  const [studentsStatus, setStudentsStatus] = useState<StudentAttendanceStatus[]>([]);
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    if (classData) {
      loadAttendanceData();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [classData]);

  // Loads attendance status for today's session
  const loadAttendanceData = async () => {
    setLoading(true);
    const attendanceStatusArr = await getStudentsAttendanceStatus(classData.id);
    setStudentsStatus(attendanceStatusArr);
    setLoading(false);
  };

  const toggleAttendance = async (uuid: string, currentStatus: "present" | "absent") => {
    setLoading(true);
    const newStatus = currentStatus === "present" ? "absent" : "present";
    const success = await markAttendance(classData.id, uuid, newStatus);

    if (success) {
      await loadAttendanceData();
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
    setLoading(false);
  };

  const handleResetAttendance = async () => {
    setLoading(true);
    const success = await resetTodayAttendance(classData.id);
    if (success) {
      await loadAttendanceData();
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
    setLoading(false);
  };

  const exportToCSV = () => {
    const headers = ['student_uuid', 'username', 'student_name', 'attendance_status'];
    const csvData = studentsStatus.map(student => [
      student.uuid,
      student.userId,
      student.name,
      student.status
    ]);
    const csvContent = [
      headers.join(','),
      ...csvData.map(row => row.join(','))
    ].join('\n');
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
            disabled={loading}
          >
            <RefreshCcw className="h-4 w-4 mr-2" />
            Reset All
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={exportToCSV}
            disabled={loading}
          >
            <FileDown className="h-4 w-4 mr-2" />
            Export CSV
          </Button>
        </div>
      </div>
      {loading && (
        <div className="text-center py-4 text-muted-foreground text-sm">
          Loading attendance...
        </div>
      )}
      <AttendanceTable studentsStatus={studentsStatus} onToggleAttendance={toggleAttendance} />
    </div>
  );
};
export default AttendanceDashboard;
