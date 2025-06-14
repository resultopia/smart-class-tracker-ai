
import { initializeData, saveClasses } from '../storage';
import { ClassSession, Class } from '../types';

// Toggle class active status with session management
export const toggleClassStatus = (classId: string, teacherId: string) => {
  // Refresh data from localStorage before modification
  const refreshedData = initializeData();
  let { classes } = refreshedData;
  
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
