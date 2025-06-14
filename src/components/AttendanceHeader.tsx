
import AttendanceActions from "./AttendanceActions";

interface AttendanceHeaderProps {
  onResetAttendance: () => void;
  onExportCSV: () => void;
  loading: boolean;
  isClassActive: boolean;
}

const AttendanceHeader = ({
  onResetAttendance,
  onExportCSV,
  loading,
  isClassActive,
}: AttendanceHeaderProps) => (
  <div className="flex justify-between items-center">
    <h3 className="text-lg font-medium">Today's Attendance</h3>
    <AttendanceActions
      onResetAttendance={onResetAttendance}
      onExportCSV={onExportCSV}
      loading={loading}
      isClassActive={isClassActive}
    />
  </div>
);

export default AttendanceHeader;
