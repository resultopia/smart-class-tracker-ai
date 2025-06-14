
import { initializeData } from '../storage';

// Get active class for a student
export const getStudentActiveClass = (studentId: string) => {
  const refreshedData = initializeData();
  const { classes } = refreshedData;
  return classes.find((c) => c.isActive && c.studentIds.includes(studentId));
};
