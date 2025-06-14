
import { initializeData, saveClasses } from '../storage';

// NEW: Update student list for a class (add/remove any students)
export const updateClassParticipants = (classId: string, teacherId: string, studentIds: string[]) => {
  const refreshedData = initializeData();
  let { classes } = refreshedData;
  const classToUpdate = classes.find((c) => c.id === classId);
  if (!classToUpdate || classToUpdate.teacherId !== teacherId) {
    return false;
  }
  classes = classes.map((c) =>
    c.id === classId ? { ...c, studentIds: [...studentIds] } : c
  );
  saveClasses(classes);
  return true;
};
