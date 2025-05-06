
import { toast } from "@/components/ui/use-toast";

// Types
export type UserRole = "student" | "teacher";

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
}

// Mock storage
let users: User[] = [
  { userId: "teacher1", name: "John Doe", password: "lol", role: "teacher" },
  { userId: "student1", name: "Alice Smith", password: "lol", role: "student" },
  { userId: "student2", name: "Bob Johnson", password: "lol", role: "student" },
];

let classes: Class[] = [
  {
    id: "class1",
    name: "Introduction to Computer Science",
    teacherId: "teacher1",
    studentIds: ["student1", "student2"],
    isActive: false,
    attendanceRecords: [],
  },
];

// Get all users
export const getAllUsers = () => {
  return [...users];
};

// Get users by role
export const getUsersByRole = (role: UserRole) => {
  return users.filter((user) => user.role === role);
};

// Get user by ID
export const getUserById = (userId: string) => {
  return users.find((user) => user.userId === userId);
};

// Authenticate user
export const authenticateUser = (userId: string, password: string) => {
  const user = users.find((user) => user.userId === userId);
  
  if (!user) {
    return null;
  }
  
  if (user.password === password) {
    return user;
  }
  
  return null;
};

// Add new user
export const addUser = (newUser: Omit<User, "password"> & { password: string }) => {
  if (users.some((user) => user.userId === newUser.userId)) {
    toast({
      title: "Error",
      description: `User ID '${newUser.userId}' already exists.`,
      variant: "destructive",
    });
    return false;
  }
  
  users.push({
    userId: newUser.userId,
    name: newUser.name,
    password: newUser.password,
    role: newUser.role,
  });
  
  return true;
};

// Get all classes for a teacher
export const getTeacherClasses = (teacherId: string) => {
  return classes.filter((c) => c.teacherId === teacherId);
};

// Get active class for a student
export const getStudentActiveClass = (studentId: string) => {
  return classes.find((c) => c.isActive && c.studentIds.includes(studentId));
};

// Create new class
export const createClass = (newClass: Omit<Class, "id" | "isActive" | "attendanceRecords">) => {
  const classId = `class${classes.length + 1}`;
  
  classes.push({
    id: classId,
    name: newClass.name,
    teacherId: newClass.teacherId,
    studentIds: newClass.studentIds,
    isActive: false,
    attendanceRecords: [],
  });
  
  return classId;
};

// Toggle class active status
export const toggleClassStatus = (classId: string, teacherId: string) => {
  // If we're trying to activate a class, first deactivate any active classes from this teacher
  const classToToggle = classes.find((c) => c.id === classId);
  if (!classToToggle || classToToggle.teacherId !== teacherId) {
    return false;
  }
  
  if (!classToToggle.isActive) {
    // Deactivate any other active classes from this teacher
    classes = classes.map((c) => 
      c.teacherId === teacherId ? { ...c, isActive: false } : c
    );
  }
  
  // Toggle the requested class
  classes = classes.map((c) => 
    c.id === classId ? { ...c, isActive: !c.isActive } : c
  );
  
  return true;
};

// Mark attendance
export const markAttendance = (classId: string, studentId: string) => {
  const classObj = classes.find((c) => c.id === classId);
  
  if (!classObj || !classObj.isActive || !classObj.studentIds.includes(studentId)) {
    return false;
  }
  
  classObj.attendanceRecords.push({
    studentId,
    timestamp: new Date(),
  });
  
  return true;
};

// Mock face recognition API call
export const verifyFaceIdentity = async (imageUrl: string, userId: string): Promise<boolean> => {
  // In a real application, this would call an external API
  // For demo purposes, we'll simulate with a delay and random success rate (80% success)
  await new Promise((resolve) => setTimeout(resolve, 1500));
  
  // For testing, if userId contains "fail" we'll fail the verification
  if (userId.toLowerCase().includes("fail")) {
    return false;
  }
  
  return Math.random() > 0.2; // 80% success rate
};
