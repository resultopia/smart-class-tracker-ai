
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { getUserById } from "@/lib/data";
import { AttendanceRecord, ClassSession } from "@/lib/types";

interface AttendanceTableProps {
  filteredRecords: AttendanceRecord[];
  selectedSession: ClassSession | null;
  toggleAttendanceStatus: (studentId: string, currentStatus: "present" | "absent") => void;
}

const AttendanceTable = ({
  filteredRecords,
  selectedSession,
  toggleAttendanceStatus,
}: AttendanceTableProps) => (
  <div className="border rounded-md">
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Student ID</TableHead>
          <TableHead>Name</TableHead>
          <TableHead>Date</TableHead>
          <TableHead>Time</TableHead>
          <TableHead>Status</TableHead>
          {selectedSession && <TableHead>Actions</TableHead>}
        </TableRow>
      </TableHeader>
      <TableBody>
        {filteredRecords.map((record, index) => {
          const student = getUserById(record.studentId);
          const recordDate = new Date(record.timestamp);
          const currentStatus = record.status || "present";
          return (
            <TableRow key={index}>
              <TableCell>{record.studentId}</TableCell>
              <TableCell>{student?.name || "Unknown"}</TableCell>
              <TableCell>{recordDate.toLocaleDateString()}</TableCell>
              <TableCell>{recordDate.toLocaleTimeString()}</TableCell>
              <TableCell>
                <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                  currentStatus === "present" 
                    ? "bg-green-100 text-green-800" 
                    : "bg-red-100 text-red-800"
                }`}>
                  {currentStatus}
                </span>
              </TableCell>
              {selectedSession && (
                <TableCell>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => toggleAttendanceStatus(record.studentId, currentStatus)}
                  >
                    Mark {currentStatus === "present" ? "Absent" : "Present"}
                  </Button>
                </TableCell>
              )}
            </TableRow>
          );
        })}
      </TableBody>
    </Table>
  </div>
);

export default AttendanceTable;
