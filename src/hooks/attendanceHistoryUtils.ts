
import { AttendanceRecord, ClassSession } from "@/lib/types";

// Map session rows from Supabase to ClassSession[]
export function mapSessions(sessionRows: any[]): ClassSession[] {
  return sessionRows?.map((row) => ({
    sessionId: row.id,
    startTime: new Date(row.start_time),
    endTime: row.end_time ? new Date(row.end_time) : undefined,
    attendanceRecords: [],
  })) || [];
}

// Map attendance rows to AttendanceRecord[]
export function mapAttendanceRecords(recordsRows: any[]): AttendanceRecord[] {
  return recordsRows?.map((row) => ({
    studentId: row.student_id,
    timestamp: new Date(row.timestamp),
    status: row.status as "present" | "absent",
    sessionId: row.session_id,
  })) || [];
}

// Ensure student records are in class roster order, fill absent if missing
export function getAllRecordsForSession(
  session: ClassSession,
  studentIds: string[],
  recordsArray: AttendanceRecord[]
): AttendanceRecord[] {
  return studentIds.map((studentId) => {
    const record = recordsArray.find(
      r => r.sessionId === session.sessionId && r.studentId === studentId
    );
    if (record) return record;
    return {
      studentId,
      timestamp: session.startTime,
      status: "absent",
      sessionId: session.sessionId,
    };
  });
}
