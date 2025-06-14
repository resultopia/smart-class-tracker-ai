
import { Button } from "@/components/ui/button";
import { Check, X } from "lucide-react";

export interface StudentAttendanceStatus {
  uuid: string;
  userId: string;
  name: string;
  status: "present" | "absent";
}

type StudentAttendanceRowProps = {
  student: StudentAttendanceStatus;
  onToggleAttendance: (uuid: string, currentStatus: "present" | "absent") => void;
}

const StudentAttendanceRow = ({ student, onToggleAttendance }: StudentAttendanceRowProps) => (
  <tr>
    <td className="p-4 align-middle">{student.uuid}</td>
    <td className="p-4 align-middle">{student.userId}</td>
    <td className="p-4 align-middle">{student.name}</td>
    <td className="p-4 align-middle">
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
    </td>
    <td className="p-4 align-middle text-right">
      <Button
        variant={student.status === "present" ? "destructive" : "default"}
        size="sm"
        onClick={() => onToggleAttendance(student.uuid, student.status)}
      >
        {student.status === "present" ? "Mark Absent" : "Mark Present"}
      </Button>
    </td>
  </tr>
);

export default StudentAttendanceRow;
