
import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/use-toast";
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
  const { toast } = useToast();

  useEffect(() => {
    if (classData) {
      (async () => { await loadAttendanceData(); })();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [classData]);

  // Loads attendance and merges with class students: ensures all students in class appear
  const loadAttendanceData = async () => {
    // 1. Get today's attendance status for class
    const attendanceStatusArr = await getStudentsAttendanceStatus(classData.id);
    // 2. Fetch all student profiles in the class
    const studentUuids = classData.studentIds;
    let profilesLookup: Record<string, { user_id: string; name: string }> = {};
    if (studentUuids.length > 0) {
      const { data: profiles } = await supabase
        .from("profiles")
        .select("id, user_id, name")
        .in("id", studentUuids);
      if (profiles && Array.isArray(profiles)) {
        profiles.forEach(row => {
          profilesLookup[row.id] = { user_id: row.user_id, name: row.name };
        });
      }
    }
    // 3. Map each student in class to their attendance status (default: absent)
    const statusMap: Record<string, "present" | "absent"> = {};
    attendanceStatusArr.forEach(s => {
      statusMap[s.userId] = s.status;
    });

    const allStudents: StudentAttendanceStatus[] = studentUuids.map(studentUuid => ({
      uuid: studentUuid,
      userId: profilesLookup[studentUuid]?.user_id || studentUuid,
      name: profilesLookup[studentUuid]?.name || "",
      status: statusMap[studentUuid] || "absent"
    }));

    setStudentsStatus(allStudents);
  };

  const toggleAttendance = async (uuid: string, currentStatus: "present" | "absent") => {
    const newStatus = currentStatus === "present" ? "absent" : "present";
    console.log("[toggleAttendance] called with:", {
      classId: classData.id,
      uuid,
      currentStatus,
      newStatus
    });
    const success = await markAttendance(classData.id, uuid, newStatus);

    if (success) {
      loadAttendanceData();
      toast({
        title: "Attendance Updated",
        description: `Student marked as ${newStatus}.`
      });
    } else {
      console.error("[toggleAttendance] Failed markAttendance:", {
        classId: classData.id,
        uuid,
        newStatus
      });
      toast({
        title: "Error",
        description: "Failed to update attendance.",
        variant: "destructive"
      });
    }
  };

  const handleResetAttendance = async () => {
    const success = await resetTodayAttendance(classData.id);
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
      <AttendanceTable studentsStatus={studentsStatus} onToggleAttendance={toggleAttendance} />
    </div>
  );
};
export default AttendanceDashboard;
