
import { initializeData, saveClasses } from '../storage';

export const toggleOnlineMode = (classId: string, teacherId: string) => {
  const refreshedData = initializeData();
  let { classes } = refreshedData;
  
  const classToToggle = classes.find((c) => c.id === classId);
  if (!classToToggle || classToToggle.teacherId !== teacherId) {
    return false;
  }

  classes = classes.map((c) => 
    c.id === classId ? { ...c, isOnlineMode: !c.isOnlineMode } : c
  );

  saveClasses(classes);
  return true;
};
