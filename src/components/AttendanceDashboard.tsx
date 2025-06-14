
import { Class } from "@/lib/types";
import { useAttendanceSession } from "@/hooks/useAttendanceSession";
import AttendanceHeader from "./AttendanceHeader";
import AttendanceSessionPanel from "./AttendanceSessionPanel";

interface AttendanceDashboardProps {
  classData: Class;
  resetFlag?: boolean;
  onResetDone?: () => void;
}

const AttendanceDashboard = ({
  classData,
  resetFlag,
  onResetDone,
}: AttendanceDashboardProps) => {
  const {
    studentsStatus,
    loading,
    toggleAttendance,
    resetAttendance,
    exportToCSV,
  } = useAttendanceSession(classData, resetFlag, onResetDone);

  // Convert sessionId to boolean for activation/deactivation logic
  const isActive = !!classData.isActive;

  return (
    <div className="space-y-4">
      <AttendanceHeader
        onResetAttendance={resetAttendance}
        onExportCSV={exportToCSV}
        loading={loading}
        isClassActive={isActive}
      />
      <AttendanceSessionPanel
        studentsStatus={studentsStatus}
        onToggleAttendance={toggleAttendance}
        isClassActive={isActive}
        loading={loading}
      />
    </div>
  );
};

export default AttendanceDashboard;
