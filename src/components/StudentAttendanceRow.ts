
export type StudentAttendanceStatus = {
  uuid: string;
  userId: string;
  name: string;
  status: "present" | "absent" | null;
};
