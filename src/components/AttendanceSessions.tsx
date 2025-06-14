import { Button } from "@/components/ui/button";
import { Clock, Trash2 } from "lucide-react";
import { format } from "date-fns";
import { cn } from "@/lib/utils";
import { ClassSession } from "@/lib/types";

interface Props {
  dateSessions: ClassSession[];
  selectedSession: ClassSession | null;
  onSessionSelect: (session: ClassSession) => void;
  onDeleteSession: (sessionId: string) => void;
  selectedDate: Date;
}

const AttendanceSessions = ({
  dateSessions,
  selectedSession,
  onSessionSelect,
  onDeleteSession,
  selectedDate,
}: Props) => (
  <div className="mb-4">
    <h4 className="font-medium mb-3">
      Class sessions on {format(selectedDate, 'MMM dd, yyyy')}:
    </h4>
    <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
      {dateSessions.map((session, index) => (
        <Button
          key={session.sessionId}
          variant={selectedSession?.sessionId === session.sessionId ? "default" : "outline"}
          className={cn(
            "justify-between h-auto p-3 flex-1 flex items-center group",
            selectedSession?.sessionId === session.sessionId && "text-white"
          )}
          onClick={() => onSessionSelect(session)}
        >
          <div className="flex items-center space-x-2">
            <Clock className="h-4 w-4" />
            <div className="text-left">
              <div className="font-medium">Class {index + 1}</div>
              <div className={cn(
                "text-xs",
                selectedSession?.sessionId === session.sessionId 
                  ? "text-white" 
                  : "text-muted-foreground"
              )}>
                {format(new Date(session.startTime), 'HH:mm')} - {session.endTime ? format(new Date(session.endTime), 'HH:mm') : ""}
              </div>
            </div>
          </div>
          <Button
            variant="destructive"
            size="icon"
            className="ml-2 opacity-80 group-hover:opacity-100"
            onClick={e => {
              e.stopPropagation();
              onDeleteSession(session.sessionId);
            }}
            tabIndex={-1}
            type="button"
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        </Button>
      ))}
    </div>
  </div>
);

export default AttendanceSessions;
