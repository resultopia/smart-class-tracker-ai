
import type { StudentAttendanceStatus } from "./StudentAttendanceRow";

interface AttendanceTableProps {
  studentsStatus: StudentAttendanceStatus[];
  onToggleAttendance: (uuid: string, currentStatus: "present" | "absent") => void;
  isClassActive: boolean;
}

const AttendanceTable = ({
  studentsStatus,
  onToggleAttendance,
  isClassActive,
}: AttendanceTableProps) => {
  return (
    <div className="border rounded-md overflow-x-auto">
      <table className="min-w-full divide-y divide-border">
        <thead>
          <tr>
            <th className="px-4 py-2 text-left text-xs font-medium text-muted-foreground">Name</th>
            <th className="px-4 py-2 text-left text-xs font-medium text-muted-foreground">Status</th>
            {isClassActive && (
              <th className="px-4 py-2 text-left text-xs font-medium text-muted-foreground">Toggle</th>
            )}
          </tr>
        </thead>
        <tbody>
          {studentsStatus.map((student) => (
            <tr key={student.uuid}>
              <td className="px-4 py-2">{student.name || student.userId}</td>
              <td className="px-4 py-2">
                <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                  student.status === "present"
                    ? "bg-green-100 text-green-800"
                    : student.status === "absent"
                      ? "bg-red-100 text-red-800"
                      : "bg-gray-100 text-gray-500"
                }`}>
                  {student.status ? student.status : "N/A"}
                </span>
              </td>
              {isClassActive && (
                <td className="px-4 py-2">
                  <button
                    className="px-2 py-1 rounded bg-primary text-white text-xs"
                    onClick={() => onToggleAttendance(student.uuid, student.status === "present" ? "present" : "absent")}
                    disabled={student.status === null}
                  >
                    Mark {student.status === "present" ? "Absent" : "Present"}
                  </button>
                </td>
              )}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default AttendanceTable;
