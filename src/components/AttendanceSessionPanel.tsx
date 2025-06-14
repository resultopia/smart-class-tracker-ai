
import AttendanceTable from "./AttendanceTable";
import type { StudentAttendanceStatus } from "./StudentAttendanceRow";

interface AttendanceSessionPanelProps {
  studentsStatus: StudentAttendanceStatus[];
  onToggleAttendance: (uuid: string, currentStatus: "present" | "absent") => void;
  isClassActive: boolean;
  loading: boolean;
}

const AttendanceSessionPanel = ({
  studentsStatus,
  onToggleAttendance,
  isClassActive,
  loading,
}: AttendanceSessionPanelProps) => {
  return (
    <>
      {loading && (
        <div className="text-center py-4 text-muted-foreground text-sm">
          Loading attendance...
        </div>
      )}
      <AttendanceTable
        studentsStatus={studentsStatus}
        onToggleAttendance={onToggleAttendance}
        isClassActive={isClassActive}
      />
    </>
  );
};

export default AttendanceSessionPanel;
