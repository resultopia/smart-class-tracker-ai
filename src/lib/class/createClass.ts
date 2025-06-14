
import { saveClasses, initializeData } from '../storage';
import { Class } from '../types';

export const createClass = (newClass: Omit<Class, "id" | "isActive" | "attendanceRecords" | "isOnlineMode" | "sessions">) => {
  const refreshedData = initializeData();
  let { classes } = refreshedData;
  
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
  
  saveClasses(classes);
  return classId;
};
