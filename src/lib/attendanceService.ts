
import { AttendanceRecord, Class } from './types';
import { initializeData, saveClasses } from './storage';
import { getUserById } from './userService';

// Initialize state
let { classes } = initializeData();

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
  saveClasses(classes);
  
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
  saveClasses(classes);
  
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
