
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { AttendanceRecord, ClassSession } from "@/lib/types";

interface Props {
  filteredRecords: AttendanceRecord[];
  selectedSession: ClassSession | null;
  toggleAttendanceStatus: (studentId: string, currentStatus: "present" | "absent") => void;
  userLookup: Record<string, string>;
}

const AttendanceRecordsTable = ({
  filteredRecords,
  selectedSession,
  toggleAttendanceStatus,
  userLookup,
}: Props) => {
  return (
    <div className="border rounded-md">
      <Table>
        <TableHeader>
          <TableRow>
            {/* Removed Student ID column */}
            <TableHead>Name</TableHead>
            <TableHead>Date</TableHead>
            <TableHead>Time</TableHead>
            <TableHead>Status</TableHead>
            {selectedSession && <TableHead>Actions</TableHead>}
          </TableRow>
        </TableHeader>
        <TableBody>
          {filteredRecords.map((record, index) => {
            const recordDate = new Date(record.timestamp);
            const currentStatus = record.status || "present";
            const isPresent = currentStatus === "present";
            return (
              <TableRow key={index}>
                {/* Removed studentId cell */}
                <TableCell>{userLookup[record.studentId] || "Loading..."}</TableCell>
                <TableCell>{recordDate.toLocaleDateString()}</TableCell>
                <TableCell>{recordDate.toLocaleTimeString()}</TableCell>
                <TableCell>
                  <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                    isPresent
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
                      className={
                        isPresent
                          ? "bg-red-700 hover:bg-red-800 text-white border-none"
                          : "bg-green-700 hover:bg-green-800 text-white border-none"
                      }
                      onClick={() => toggleAttendanceStatus(record.studentId, currentStatus)}
                    >
                      Mark {isPresent ? "Absent" : "Present"}
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
};

export default AttendanceRecordsTable;

