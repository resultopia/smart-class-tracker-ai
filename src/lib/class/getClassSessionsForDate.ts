
import { initializeData } from '../storage';

export const getClassSessionsForDate = (classId: string, date: Date) => {
  const refreshedData = initializeData();
  const { classes } = refreshedData;
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
