
import { Class } from "@/lib/types";

interface ClassTodayAttendanceSummaryProps {
  classData: Class;
}

const ClassTodayAttendanceSummary = ({ classData }: ClassTodayAttendanceSummaryProps) => {
  const today = new Date();
  const todayStart = new Date(today.getFullYear(), today.getMonth(), today.getDate());
  const todayAttendanceCount = classData.attendanceRecords.filter(
    (record) => new Date(record.timestamp) >= todayStart && record.status === "present"
  ).length;

  return (
    <div className="text-sm">
      <span className="font-medium text-green-600">{todayAttendanceCount}</span> present today
    </div>
  );
};

export default ClassTodayAttendanceSummary;
