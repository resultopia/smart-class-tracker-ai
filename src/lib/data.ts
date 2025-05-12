
import { toast } from "@/components/ui/use-toast";

// Types
import { User, UserRole, Class, AttendanceRecord, USERS_STORAGE_KEY, CLASSES_STORAGE_KEY } from "./types";

// Local storage keys
// Now imported from types.ts

// Default data
const defaultUsers: User[] = [
  { userId: "admin", name: "Administrator", password: "lol", role: "admin" },
  { userId: "teacher1", name: "John Doe", password: "lol", role: "teacher" },
  { userId: "student1", name: "Alice Smith", password: "lol", role: "student" },
  { userId: "student2", name: "Bob Johnson", password: "lol", role: "student" },
];

const defaultClasses: Class[] = [
  {
    id: "class1",
    name: "Introduction to Computer Science",
    teacherId: "teacher1",
    studentIds: ["student1", "student2"],
    isActive: false,
    attendanceRecords: [],
  },
];

// Initialize or load data from localStorage
const initializeData = () => {
  // Load users or use defaults
  const storedUsersJSON = localStorage.getItem(USERS_STORAGE_KEY);
  let users: User[] = storedUsersJSON ? JSON.parse(storedUsersJSON) : defaultUsers;
  
  // Load classes or use defaults
  const storedClassesJSON = localStorage.getItem(CLASSES_STORAGE_KEY);
  let classes: Class[] = [];
  
  if (storedClassesJSON) {
    // Need to restore Date objects which are serialized as strings in JSON
    const parsedClasses = JSON.parse(storedClassesJSON);
    classes = parsedClasses.map((cls: any) => ({
      ...cls,
      attendanceRecords: cls.attendanceRecords.map((record: any) => ({
        ...record,
        timestamp: new Date(record.timestamp)
      }))
    }));
  } else {
    classes = defaultClasses;
  }
  
  return { users, classes };
};

// Get initial data
let { users, classes } = initializeData();

// Helper function to save users to localStorage
const saveUsers = () => {
  localStorage.setItem(USERS_STORAGE_KEY, JSON.stringify(users));
};

// Helper function to save classes to localStorage
const saveClasses = () => {
  localStorage.setItem(CLASSES_STORAGE_KEY, JSON.stringify(classes));
};

// Storage event listener to sync data across tabs/windows
window.addEventListener('storage', (event) => {
  if (event.key === USERS_STORAGE_KEY) {
    // Update users from another tab/window
    const newUsers = JSON.parse(event.newValue || '[]');
    users = newUsers;
  } else if (event.key === CLASSES_STORAGE_KEY) {
    // Update classes from another tab/window
    const parsedClasses = JSON.parse(event.newValue || '[]');
    classes = parsedClasses.map((cls: any) => ({
      ...cls,
      attendanceRecords: cls.attendanceRecords.map((record: any) => ({
        ...record,
        timestamp: new Date(record.timestamp)
      }))
    }));
  }
});

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
  // Refresh data from localStorage before authentication
  const refreshedData = initializeData();
  users = refreshedData.users;
  
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
  // Refresh data from localStorage before modification
  const refreshedData = initializeData();
  users = refreshedData.users;
  
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
  
  // Save to localStorage
  saveUsers();
  
  return true;
};

// Delete user
export const deleteUser = (userId: string) => {
  // Refresh data from localStorage before modification
  const refreshedData = initializeData();
  users = refreshedData.users;
  classes = refreshedData.classes;
  
  // First check if user exists
  const user = users.find((user) => user.userId === userId);
  if (!user) {
    toast({
      title: "Error",
      description: `User ID '${userId}' does not exist.`,
      variant: "destructive",
    });
    return false;
  }
  
  // If user is a teacher, check if they're associated with any classes
  if (user.role === "teacher" && classes.some((c) => c.teacherId === userId)) {
    toast({
      title: "Error",
      description: `Cannot delete teacher '${userId}' as they are associated with classes.`,
      variant: "destructive",
    });
    return false;
  }
  
  // If user is a student, remove them from any classes
  if (user.role === "student") {
    classes = classes.map((c) => ({
      ...c,
      studentIds: c.studentIds.filter((id) => id !== userId),
    }));
    // Save updated classes
    saveClasses();
  }
  
  // Remove the user
  users = users.filter((user) => user.userId !== userId);
  
  // Save to localStorage
  saveUsers();
  
  return true;
};

// Get all classes for a teacher
export const getTeacherClasses = (teacherId: string) => {
  // Refresh data from localStorage
  const refreshedData = initializeData();
  classes = refreshedData.classes;
  
  return classes.filter((c) => c.teacherId === teacherId);
};

// Get active class for a student
export const getStudentActiveClass = (studentId: string) => {
  // Refresh data from localStorage
  const refreshedData = initializeData();
  classes = refreshedData.classes;
  
  return classes.find((c) => c.isActive && c.studentIds.includes(studentId));
};

// Create new class
export const createClass = (newClass: Omit<Class, "id" | "isActive" | "attendanceRecords">) => {
  // Refresh data from localStorage before modification
  const refreshedData = initializeData();
  classes = refreshedData.classes;
  
  const classId = `class${classes.length + 1}`;
  
  classes.push({
    id: classId,
    name: newClass.name,
    teacherId: newClass.teacherId,
    studentIds: newClass.studentIds,
    isActive: false,
    attendanceRecords: [],
  });
  
  // Save to localStorage
  saveClasses();
  
  return classId;
};

// Delete a class
export const deleteClass = (classId: string, teacherId: string) => {
  // Refresh data from localStorage before modification
  const refreshedData = initializeData();
  classes = refreshedData.classes;
  
  // Find the class
  const classToDelete = classes.find((c) => c.id === classId);
  
  // Check if the class exists and belongs to the teacher
  if (!classToDelete) {
    toast({
      title: "Error",
      description: "Class not found.",
      variant: "destructive",
    });
    return false;
  }
  
  if (classToDelete.teacherId !== teacherId) {
    toast({
      title: "Error",
      description: "You don't have permission to delete this class.",
      variant: "destructive",
    });
    return false;
  }
  
  // Check if the class is active
  if (classToDelete.isActive) {
    toast({
      title: "Error",
      description: "Cannot delete an active class. Please stop the class first.",
      variant: "destructive",
    });
    return false;
  }
  
  // Remove the class
  classes = classes.filter((c) => c.id !== classId);
  
  // Save to localStorage
  saveClasses();
  
  toast({
    title: "Success",
    description: "Class has been deleted successfully.",
  });
  
  return true;
};

// Toggle class active status
export const toggleClassStatus = (classId: string, teacherId: string) => {
  // Refresh data from localStorage before modification
  const refreshedData = initializeData();
  classes = refreshedData.classes;
  
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
  
  // Save to localStorage
  saveClasses();
  
  return true;
};

// Mark attendance
export const markAttendance = (classId: string, studentId: string, status: "present" | "absent" = "present") => {
  // Refresh data from localStorage before modification
  const refreshedData = initializeData();
  classes = refreshedData.classes;
  
  const classObj = classes.find((c) => c.id === classId);
  
  if (!classObj || !classObj.studentIds.includes(studentId)) {
    return false;
  }
  
  // Remove any existing attendance record for this student today
  const today = new Date();
  const todayStart = new Date(today.getFullYear(), today.getMonth(), today.getDate());
  classObj.attendanceRecords = classObj.attendanceRecords.filter(record => 
    !(record.studentId === studentId && record.timestamp >= todayStart)
  );
  
  // Add new record
  classObj.attendanceRecords.push({
    studentId,
    timestamp: new Date(),
    status
  });
  
  // Save to localStorage
  saveClasses();
  
  return true;
};

// Get attendance records for a specific class
export const getClassAttendance = (classId: string) => {
  // Refresh data from localStorage
  const refreshedData = initializeData();
  classes = refreshedData.classes;
  
  const classObj = classes.find((c) => c.id === classId);
  if (!classObj) return [];
  
  return classObj.attendanceRecords;
};

// Reset all attendance statuses for a class today
export const resetTodayAttendance = (classId: string) => {
  // Refresh data from localStorage
  const refreshedData = initializeData();
  classes = refreshedData.classes;
  
  const classObj = classes.find((c) => c.id === classId);
  if (!classObj) return false;
  
  // Remove all attendance records for today
  const today = new Date();
  const todayStart = new Date(today.getFullYear(), today.getMonth(), today.getDate());
  classObj.attendanceRecords = classObj.attendanceRecords.filter(record => 
    record.timestamp < todayStart
  );
  
  // Save to localStorage
  saveClasses();
  
  return true;
};

// Get today's attendance status for each student in a class
export const getStudentsAttendanceStatus = (classId: string) => {
  // Refresh data from localStorage
  const refreshedData = initializeData();
  classes = refreshedData.classes;
  
  const classObj = classes.find((c) => c.id === classId);
  if (!classObj) return [];
  
  const today = new Date();
  const todayStart = new Date(today.getFullYear(), today.getMonth(), today.getDate());
  
  return classObj.studentIds.map(studentId => {
    const user = getUserById(studentId);
    const todayRecord = classObj.attendanceRecords.find(record => 
      record.studentId === studentId && record.timestamp >= todayStart
    );
    
    return {
      userId: studentId,
      name: user?.name || "Unknown",
      status: todayRecord?.status || "absent"
    };
  });
};

// Mock face recognition API call
export const verifyFaceIdentity = async (imageBase64: string, userId: string): Promise<boolean> => {
  try {
    // Make API call to the facial verification service
    const response = await fetch('http://127.0.0.1:8000/predict', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      },
      body: JSON.stringify({
        image_base64: imageBase64
      })
    });
    
    if (!response.ok) {
      console.error('Face verification API error:', response.statusText);
      return false;
    }
    
    const data = await response.json();
    
    // Check if the API response matches the logged-in user
    return data.name === userId;
  } catch (error) {
    console.error('Face verification error:', error);
    // For demo purposes, fallback to the previous random success rate
    // For testing, if userId contains "fail" we'll fail the verification
    if (userId.toLowerCase().includes("fail")) {
      return false;
    }
    
    return Math.random() > 0.2; // 80% success rate as fallback
  }
};
