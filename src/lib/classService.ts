
import { toast } from "@/components/ui/use-toast";
import { Class, ClassSession } from './types';
import { initializeData, saveClasses } from './storage';

// Initialize state
let { classes } = initializeData();

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
export const createClass = (newClass: Omit<Class, "id" | "isActive" | "attendanceRecords" | "isOnlineMode" | "sessions">) => {
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
    isOnlineMode: false,
    attendanceRecords: [],
    sessions: [],
  });
  
  // Save to localStorage
  saveClasses(classes);
  
  return classId;
};

// Toggle online mode for a class
export const toggleOnlineMode = (classId: string, teacherId: string) => {
  // Refresh data from localStorage before modification
  const refreshedData = initializeData();
  classes = refreshedData.classes;
  
  const classToToggle = classes.find((c) => c.id === classId);
  if (!classToToggle || classToToggle.teacherId !== teacherId) {
    return false;
  }
  
  // Toggle the online mode
  classes = classes.map((c) => 
    c.id === classId ? { ...c, isOnlineMode: !c.isOnlineMode } : c
  );
  
  // Save to localStorage
  saveClasses(classes);
  
  return true;
};

// Bulk add students from CSV
export const bulkAddStudentsToClass = (classId: string, teacherId: string, studentIds: string[]) => {
  // Refresh data from localStorage before modification
  const refreshedData = initializeData();
  classes = refreshedData.classes;
  
  const classToUpdate = classes.find((c) => c.id === classId);
  if (!classToUpdate || classToUpdate.teacherId !== teacherId) {
    return false;
  }
  
  // Add new student IDs, avoiding duplicates
  const existingIds = new Set(classToUpdate.studentIds);
  const newIds = studentIds.filter(id => !existingIds.has(id));
  
  classes = classes.map((c) => 
    c.id === classId 
      ? { ...c, studentIds: [...c.studentIds, ...newIds] }
      : c
  );
  
  // Save to localStorage
  saveClasses(classes);
  
  return newIds.length;
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
  saveClasses(classes);
  
  toast({
    title: "Success",
    description: "Class has been deleted successfully.",
  });
  
  return true;
};

// Toggle class active status with session management
export const toggleClassStatus = (classId: string, teacherId: string) => {
  // Refresh data from localStorage before modification
  const refreshedData = initializeData();
  classes = refreshedData.classes;
  
  const classToToggle = classes.find((c) => c.id === classId);
  if (!classToToggle || classToToggle.teacherId !== teacherId) {
    return false;
  }
  
  if (classToToggle.isActive) {
    // Stopping the class - save current session
    const currentSession: ClassSession = {
      sessionId: `session_${Date.now()}`,
      startTime: new Date(Date.now() - 3600000), // Assume session started 1 hour ago for demo
      endTime: new Date(),
      attendanceRecords: [...classToToggle.attendanceRecords]
    };
    
    classes = classes.map((c) => 
      c.id === classId 
        ? { 
            ...c, 
            isActive: false, 
            attendanceRecords: [], // Reset current attendance
            sessions: [...c.sessions, currentSession] // Add to sessions history
          } 
        : c
    );
  } else {
    // Starting the class - deactivate other classes and reset attendance
    classes = classes.map((c) => 
      c.teacherId === teacherId ? { ...c, isActive: false } : c
    );
    
    classes = classes.map((c) => 
      c.id === classId 
        ? { 
            ...c, 
            isActive: true, 
            attendanceRecords: [] // Start with fresh attendance
          } 
        : c
    );
  }
  
  // Save to localStorage
  saveClasses(classes);
  
  return true;
};

// Get sessions for a specific date
export const getClassSessionsForDate = (classId: string, date: Date) => {
  const refreshedData = initializeData();
  classes = refreshedData.classes;
  
  const classObj = classes.find((c) => c.id === classId);
  if (!classObj) return [];
  
  const targetDate = new Date(date.getFullYear(), date.getMonth(), date.getDate());
  const nextDate = new Date(targetDate);
  nextDate.setDate(nextDate.getDate() + 1);
  
  return classObj.sessions.filter(session => {
    const sessionDate = new Date(session.startTime);
    return sessionDate >= targetDate && sessionDate < nextDate;
  });
};

// Update classes reference for storage event listener
export const updateClassesReference = (newClasses: Class[]) => {
  classes = newClasses;
};
