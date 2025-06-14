
import { CardHeader, CardTitle } from "@/components/ui/card";
import { Wifi } from "lucide-react";
import DeleteClassButton from "./DeleteClassButton";
import { Button } from "@/components/ui/button";
import { Class } from "@/lib/types";

interface ClassCardHeaderProps {
  classData: Class;
  onDelete: () => void;
  onEditParticipants: () => void;
}

const ClassCardHeader = ({ classData, onDelete, onEditParticipants }: ClassCardHeaderProps) => {
  const studentCount = classData.studentIds.length;
  return (
    <CardHeader className="pb-2">
      <CardTitle className="text-lg font-medium flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span>{classData.name}</span>
          <DeleteClassButton onDelete={onDelete} disabled={!!classData.isActive} />
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
