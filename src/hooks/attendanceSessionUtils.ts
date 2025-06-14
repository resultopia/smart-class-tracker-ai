
// Utility helpers for attendance session feature

import type { StudentAttendanceStatus } from "@/components/StudentAttendanceRow";

// Map a list of profiles to StudentAttendanceStatus list with given status
export function mapProfilesToStudentsStatus(
  profiles: Array<{ id: string; user_id: string; name: string }> | null | undefined,
  status: "present" | "absent" | null = null
): StudentAttendanceStatus[] {
  if (!profiles) return [];
  return profiles.map((profile) => ({
    uuid: profile.id,
    userId: profile.user_id,
    name: profile.name,
    status,
  }));
}

// Compose attendance status from records and profiles
export function mergeAttendanceWithProfiles(
  records: Array<{ student_id: string; status: string }>,
  profiles: Array<{ id: string; user_id: string; name: string }>
): StudentAttendanceStatus[] {
  const recordStatus: Record<string, "present" | "absent"> = {};
  for (const record of records || []) {
    recordStatus[record.student_id] = record.status === "present" ? "present" : "absent";
  }
  return profiles.map((profile) => ({
    uuid: profile.id,
    userId: profile.user_id,
    name: profile.name,
    status: recordStatus[profile.id] ?? "absent"
  }));
}
