
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
    <div className="border rounded-lg shadow overflow-x-auto bg-white">
      <table className="min-w-full divide-y divide-border text-base">
        <thead className="bg-muted">
          <tr>
            <th className="px-5 py-3 text-left text-sm font-bold text-gray-700 tracking-wider">Name</th>
            <th className="px-5 py-3 text-left text-sm font-bold text-gray-700 tracking-wider">Status</th>
            {isClassActive && (
              <th className="px-5 py-3 text-left text-sm font-bold text-gray-700 tracking-wider">Action</th>
            )}
          </tr>
        </thead>
        <tbody>
          {studentsStatus.map((student) => (
            <tr key={student.uuid} className="hover:bg-muted/50 transition">
              <td className="px-5 py-4 font-medium">
                {student.name || student.userId}
                <span className="text-muted-foreground text-xs ml-1">
                  ({student.userId})
                </span>
              </td>
              <td className="px-5 py-4">
                <span className={`inline-flex items-center px-3 py-1.5 rounded-full text-sm font-semibold
                  ${student.status === "present"
                    ? "bg-green-100 text-green-800 shadow"
                    : student.status === "absent"
                      ? "bg-red-100 text-red-800 shadow"
                      : "bg-gray-100 text-gray-500"
                  }`}>
                  {student.status ? student.status : "N/A"}
                </span>
              </td>
              {isClassActive && (
                <td className="px-5 py-4">
                  <button
                    className={`px-4 py-2 rounded-lg font-semibold text-base shadow 
                      ${student.status === "present"
                        ? "bg-red-600 text-white hover:bg-red-700"
                        : "bg-green-600 text-white hover:bg-green-700"
                      } 
                      transition-colors duration-200 disabled:opacity-40`}
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
      {studentsStatus.length === 0 && (
        <div className="py-10 text-center text-gray-400 text-base font-medium">
          No students found in this class.
        </div>
      )}
    </div>
  );
};

export default AttendanceTable;

