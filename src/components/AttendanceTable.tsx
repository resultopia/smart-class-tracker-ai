
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from "@/components/ui/table";
import StudentAttendanceRow, { StudentAttendanceStatus } from "./StudentAttendanceRow";

interface AttendanceTableProps {
  studentsStatus: StudentAttendanceStatus[];
  onToggleAttendance: (uuid: string, currentStatus: "present" | "absent") => void;
}

const AttendanceTable = ({ studentsStatus, onToggleAttendance }: AttendanceTableProps) => (
  <div className="border rounded-md">
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Student UUID</TableHead>
          <TableHead>Username</TableHead>
          <TableHead>Name</TableHead>
          <TableHead>Status</TableHead>
          <TableHead className="text-right">Actions</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {studentsStatus.length === 0 ? (
          <TableRow>
            <TableCell colSpan={5} className="text-center py-4">
              No students in this class.
            </TableCell>
          </TableRow>
        ) : (
          studentsStatus.map((student) => (
            <StudentAttendanceRow
              key={student.uuid}
              student={student}
              onToggleAttendance={onToggleAttendance}
            />
          ))
        )}
      </TableBody>
    </Table>
  </div>
);

export default AttendanceTable;

