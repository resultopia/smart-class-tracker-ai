
import { initializeData, saveClasses } from '../storage';

export const bulkAddStudentsToClass = (classId: string, teacherId: string, studentIds: string[]) => {
  const refreshedData = initializeData();
  let { classes } = refreshedData;
  const classToUpdate = classes.find((c) => c.id === classId);
  if (!classToUpdate || classToUpdate.teacherId !== teacherId) {
    return false;
  }
  const existingIds = new Set(classToUpdate.studentIds);
  const newIds = studentIds.filter(id => !existingIds.has(id));

  classes = classes.map((c) => 
    c.id === classId 
      ? { ...c, studentIds: [...c.studentIds, ...newIds] }
      : c
  );

  saveClasses(classes);
  
  return newIds.length;
};
