
import { Button } from "@/components/ui/button";
import { Check, X, Minus } from "lucide-react";

export interface StudentAttendanceStatus {
  uuid: string;
  userId: string;
  name: string;
  status: "present" | "absent" | null;
}

type StudentAttendanceRowProps = {
  student: StudentAttendanceStatus;
  onToggleAttendance: (uuid: string, currentStatus: "present" | "absent") => void;
  isClassActive: boolean;
}

// Show userId and name even when class is not active
const StudentAttendanceRow = ({ student, onToggleAttendance, isClassActive }: StudentAttendanceRowProps) => (
  <tr>
    <td className="p-4 align-middle">{student.userId || <span className="text-gray-400 italic">Unknown</span>}</td>
    <td className="p-4 align-middle">{student.name || <span className="text-gray-400 italic">Unknown</span>}</td>
    <td className="p-4 align-middle">
      {isClassActive ? (
        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
          student.status === "present" 
            ? "bg-green-100 text-green-800" 
            : "bg-red-100 text-red-800"
        }`}>
          {student.status === "present" ? (
            <>
              <Check className="w-3 h-3 mr-1" />
              Present
            </>
          ) : (
            <>
              <X className="w-3 h-3 mr-1" />
              Absent
            </>
          )}
        </span>
      ) : (
        <span
          className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-500"
        >
          <Minus className="w-3 h-3 mr-1" />
          Not Marked
        </span>
      )}
    </td>
    <td className="p-4 align-middle text-right">
      <Button
        variant={student.status === "present" ? "destructive" : "default"}
        size="sm"
        onClick={() => isClassActive && onToggleAttendance(student.uuid, student.status!)}
        disabled={!isClassActive}
        className={!isClassActive ? "opacity-50 cursor-not-allowed bg-gray-200 text-gray-500" : ""}
      >
        {isClassActive
          ? (student.status === "present" ? "Mark Absent" : "Mark Present")
          : "Mark Attendance"}
      </Button>
    </td>
  </tr>
);

export default StudentAttendanceRow;

