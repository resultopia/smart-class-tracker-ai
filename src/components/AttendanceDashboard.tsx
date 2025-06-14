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
  resetFlag?: boolean; // ← New: for parent to force reset after stopping
  onResetDone?: () => void; // ← New: callback to unset resetFlag
}

const AttendanceDashboard = ({ classData, resetFlag, onResetDone }: AttendanceDashboardProps) => {
  const [studentsStatus, setStudentsStatus] = useState<StudentAttendanceStatus[]>([]);
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  // Loads attendance status for the CURRENT session only.
  // Always reflects the active session. Past ones are not loaded.
  const loadAttendanceData = async () => {
    setLoading(true);
    // Ensure we only get the active session's data if class is active;
    // Otherwise, show all as absent (reset/ready for new session)
    if (classData.isActive) {
      const attendanceStatusArr = await getStudentsAttendanceStatus(classData.id);
      setStudentsStatus(attendanceStatusArr);
    } else {
      // Not active, so reset everyone to absent (preparing for new session)
      setStudentsStatus(
        classData.studentIds.map((id) => ({
          uuid: id,
          userId: "",
          name: "",
          status: "absent",
        }))
      );
    }
    setLoading(false);
  };

  // On classData (and on reset), reload
  useEffect(() => {
    loadAttendanceData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [classData]);

  // On resetFlag set by parent (ClassCard) after stop, force reset
  useEffect(() => {
    if (resetFlag) {
      loadAttendanceData();
      // Notify parent reset is done to rearm flag for next time
      if (onResetDone) onResetDone();
    }
    // eslint-disable-next-line
  }, [resetFlag]);

  const toggleAttendance = async (uuid: string, currentStatus: "present" | "absent") => {
    if (!classData.isActive) return; // Don't allow toggling if class is stopped!
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
            disabled={loading || !classData.isActive}
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
