
import { initializeData } from '../storage';

// Get all classes for a teacher
export const getTeacherClasses = (teacherId: string) => {
  const refreshedData = initializeData();
  const { classes } = refreshedData;
  return classes.filter((c) => c.teacherId === teacherId);
};
