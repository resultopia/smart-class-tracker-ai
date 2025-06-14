
import { toast } from "@/components/ui/use-toast";
import { saveClasses, initializeData } from '../storage';

export const deleteClass = (classId: string, teacherId: string) => {
  const refreshedData = initializeData();
  let { classes } = refreshedData;
  const classToDelete = classes.find((c) => c.id === classId);

  if (!classToDelete) {
    toast({
      title: "Error",
      description: "Class not found.",
      variant: "destructive",
    });
    return false;
  }
  
  if (classToDelete.teacherId !== teacherId) {
    toast({
      title: "Error",
      description: "You don't have permission to delete this class.",
      variant: "destructive",
    });
    return false;
  }
  
  if (classToDelete.isActive) {
    toast({
      title: "Error",
      description: "Cannot delete an active class. Please stop the class first.",
      variant: "destructive",
    });
    return false;
  }
  
  classes = classes.filter((c) => c.id !== classId);
  saveClasses(classes);

  toast({
    title: "Success",
    description: "Class has been deleted successfully.",
  });

  return true;
};
