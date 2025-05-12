
// Types for the entire application
export type UserRole = "student" | "teacher" | "admin";

export interface User {
  userId: string;
  name: string;
  password: string;
  role: UserRole;
}

export interface Class {
  id: string;
  name: string;
  teacherId: string;
  studentIds: string[];
  isActive: boolean;
  attendanceRecords: AttendanceRecord[];
}

export interface AttendanceRecord {
  studentId: string;
  timestamp: Date;
  status?: "present" | "absent";
}

// Local storage keys
export const USERS_STORAGE_KEY = 'smart-class-tracker-users';
export const CLASSES_STORAGE_KEY = 'smart-class-tracker-classes';
