
// Types for the entire application
export type UserRole = "student" | "teacher" | "admin";

export interface User {
  userId: string;
  name: string;
  password: string;
  role: UserRole;
  phoneNumber?: string; // Optional phone number field
  photos?: string[]; // Base64 encoded photos for students
}

export interface ClassSession {
  sessionId: string;
  startTime: Date;
  endTime?: Date;
  attendanceRecords: AttendanceRecord[];
}

export interface Class {
  id: string;
  name: string;
  teacherId: string;
  studentIds: string[];
  isActive: string | null;   // <-- updated from boolean to string | null
  isOnlineMode: boolean;
  attendanceRecords: AttendanceRecord[]; // Current session records
  sessions: ClassSession[]; // All historical sessions
}

export interface AttendanceRecord {
  studentId: string;
  timestamp: Date;
  status?: "present" | "absent";
  sessionId?: string; // <-- ADDED
}

// Local storage keys
export const USERS_STORAGE_KEY = 'smart-class-tracker-users';
export const CLASSES_STORAGE_KEY = 'smart-class-tracker-classes';
