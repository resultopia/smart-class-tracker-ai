// This file serves as a central export point for all data-related functionality

// Re-export all types
export * from './types';

// Re-export storage functions
export { initializeData, saveUsers, saveClasses, setupStorageListeners } from './storage';

// Re-export user service functions
export { 
  getAllUsers, 
  getUsersByRole, 
  getUserById, 
  authenticateUser, 
  addUser, 
  deleteUser,
  updateUsersReference
} from './userService';

// Re-export class service functions
export { 
  getTeacherClasses, 
  getStudentActiveClass, 
  createClass, 
  deleteClass, 
  toggleClassStatus,
  toggleOnlineMode,
  bulkAddStudentsToClass,
  getClassSessionsForDate,
  updateClassesReference,
  updateClassParticipants
} from './classService';

// Re-export attendance service functions
export { 
  markAttendance, 
  getClassAttendance,
  resetTodayAttendance,
  getStudentsAttendanceStatus,
  verifyFaceIdentity
} from './attendanceService';
