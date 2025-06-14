
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

  return (
    <div className="space-y-4">
      <AttendanceHeader
        onResetAttendance={resetAttendance}
        onExportCSV={exportToCSV}
        loading={loading}
        isClassActive={classData.isActive}
      />
      <AttendanceSessionPanel
        studentsStatus={studentsStatus}
        onToggleAttendance={toggleAttendance}
        isClassActive={classData.isActive}
        loading={loading}
      />
    </div>
  );
};

export default AttendanceDashboard;
