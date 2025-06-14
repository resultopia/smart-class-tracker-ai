
import { useState } from "react";
import type { StudentAttendanceStatus } from "@/components/StudentAttendanceRow";

export function useClassAttendanceState(initial: StudentAttendanceStatus[] = []) {
  const [studentsStatus, setStudentsStatus] = useState<StudentAttendanceStatus[]>(initial);
  return { studentsStatus, setStudentsStatus };
}
