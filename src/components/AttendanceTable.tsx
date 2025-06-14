
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from "@/components/ui/table";
import StudentAttendanceRow, { StudentAttendanceStatus } from "./StudentAttendanceRow";

interface AttendanceTableProps {
  studentsStatus: StudentAttendanceStatus[];
  onToggleAttendance: (uuid: string, currentStatus: "present" | "absent") => void;
  isClassActive: boolean; // new prop
}

const AttendanceTable = ({ studentsStatus, onToggleAttendance, isClassActive }: AttendanceTableProps) => (
  <div className="border rounded-md">
    <Table>
      <TableHeader>
        <TableRow>
          {/* Removed UUID column */}
          <TableHead>Username</TableHead>
          <TableHead>Name</TableHead>
          <TableHead>Status</TableHead>
          <TableHead className="text-right">Actions</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {studentsStatus.length === 0 ? (
          <TableRow>
            <TableCell colSpan={4} className="text-center py-4">
              No students in this class.
            </TableCell>
          </TableRow>
        ) : (
          studentsStatus.map((student) => (
            <StudentAttendanceRow
              key={student.uuid}
              student={student}
              onToggleAttendance={onToggleAttendance}
              isClassActive={isClassActive}
            />
          ))
        )}
      </TableBody>
    </Table>
  </div>
);

export default AttendanceTable;
