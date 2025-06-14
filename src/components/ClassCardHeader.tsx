import { CardHeader, CardTitle } from "@/components/ui/card";
import { Wifi } from "lucide-react";
import DeleteClassButton from "./DeleteClassButton";
import { Button } from "@/components/ui/button";
import { Class } from "@/lib/types";
import { useToast } from "@/components/ui/use-toast";
import { supabase } from "@/integrations/supabase/client";
import React from "react";

interface ClassCardHeaderProps {
  classData: Class;
  onDelete: () => void;
  onEditParticipants: () => void;
  teacherId: string;
}

const ClassCardHeader = ({
  classData,
  onDelete,
  onEditParticipants,
  teacherId,
}: ClassCardHeaderProps) => {
  const { toast } = useToast();

  // Handler to delete class from Supabase
  const handleDeleteClass = async () => {
    // Debug: Log IDs to help resolve mismatch
    console.log("[DeleteClassButton] classData.teacherId:", classData.teacherId, "prop teacherId:", teacherId);
    
    // Prevent deleting active classes
    if (classData.isActive) {
      toast({
        title: "Cannot Delete Active Class",
        description: "Stop the class session before deleting.",
        variant: "destructive",
      });
      return;
    }

    // Double-check: Only teacher can delete their own class
    if (classData.teacherId !== teacherId) {
      toast({
        title: "Permission Denied",
        description: `Only the class teacher can delete this class. (Debug: Expected ${classData.teacherId}, got ${teacherId})`,
        variant: "destructive",
      });
      return;
    }

    // Delete class from Supabase
    const { error } = await supabase
      .from("classes")
      .delete()
      .eq("id", classData.id);

    // Also clean up from classes_students, class_sessions if relevant (optional advanced)
    // await supabase.from("classes_students").delete().eq("class_id", classData.id);
    // await supabase.from("class_sessions").delete().eq("class_id", classData.id);

    if (!error) {
      toast({
        title: "Class Deleted",
        description: `${classData.name} has been deleted.`,
      });
      onDelete(); // Trigger class list refresh in parent
    } else {
      toast({
        title: "Error Deleting Class",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const studentCount = classData.studentIds.length;
  return (
    <CardHeader className="pb-2">
      <CardTitle className="text-lg font-medium flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span>{classData.name}</span>
          {/* Pass handleDeleteClass here */}
          <DeleteClassButton onDelete={handleDeleteClass} disabled={!!classData.isActive} />
        </div>
        {classData.isOnlineMode && (
          <div className="flex items-center text-blue-600" data-testid="online-mode">
            <Wifi className="h-4 w-4 mr-1" />
            <span className="text-xs">Online</span>
          </div>
        )}
      </CardTitle>
      <div className="flex items-center text-sm text-muted-foreground">
        <span>{studentCount} student{studentCount !== 1 && "s"}</span>
        <Button
          variant="ghost"
          size="sm"
          className="ml-2 p-1 h-7"
          onClick={onEditParticipants}
        >
          Edit Participants
        </Button>
      </div>
    </CardHeader>
  );
};

export default ClassCardHeader;
