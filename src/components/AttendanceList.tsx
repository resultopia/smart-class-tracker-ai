
import { useEffect, useState } from "react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { AttendanceRecord, getUserById } from "@/lib/data";

interface AttendanceListProps {
  attendanceRecords: AttendanceRecord[];
}

const AttendanceList = ({ attendanceRecords }: AttendanceListProps) => {
  const [userNames, setUserNames] = useState<Record<string, string>>({});
  useEffect(() => {
    const fetchUsers = async () => {
      const names: Record<string, string> = {};
      for (let record of attendanceRecords) {
        const user = await getUserById(record.studentId);
        names[record.studentId] = user?.name || "Unknown";
      }
      setUserNames(names);
    };
    fetchUsers();
  }, [attendanceRecords]);
  // Sort records by timestamp (newest first)
  const sortedRecords = [...attendanceRecords].sort(
    (a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
  );
  if (sortedRecords.length === 0) {
    return <p className="text-center py-4">No attendance records yet.</p>;
  }
  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Student ID</TableHead>
          <TableHead>Name</TableHead>
          <TableHead>Time</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {sortedRecords.map((record, index) => (
          <TableRow key={index}>
            <TableCell>{record.studentId}</TableCell>
            <TableCell>{userNames[record.studentId] || "Loading..."}</TableCell>
            <TableCell>
              {new Date(record.timestamp).toLocaleString()}
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
};

export default AttendanceList;
