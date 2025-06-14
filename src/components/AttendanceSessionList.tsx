
import { Button } from "@/components/ui/button";
import { Clock, Trash2 } from "lucide-react";
import { format } from "date-fns";
import { cn } from "@/lib/utils";
import { ClassSession } from "@/lib/types";

interface AttendanceSessionListProps {
  dateSessions: ClassSession[];
  selectedSession: ClassSession | null;
  onSessionSelect: (session: ClassSession) => void;
  onDeleteSession: (sessionId: string) => void;
  selectedDate: Date;
}

const AttendanceSessionList = ({
  dateSessions,
  selectedSession,
  onSessionSelect,
  onDeleteSession,
  selectedDate,
}: AttendanceSessionListProps) => (
  <div className="mb-4">
    <h4 className="font-medium mb-3">
      Class sessions on {format(selectedDate, 'MMM dd, yyyy')}:
    </h4>
    <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
      {dateSessions.map((session, index) => (
        <div key={session.sessionId} className="flex items-center space-x-2">
          <Button
            variant={selectedSession?.sessionId === session.sessionId ? "default" : "outline"}
            className={cn(
              "justify-start h-auto p-3 flex-1",
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
                  {format(new Date(session.startTime), 'HH:mm')} - {
                    session.endTime ? format(new Date(session.endTime), 'HH:mm') : 'Ongoing'
                  }
                </div>
                <div className={cn(
                  "text-xs",
                  selectedSession?.sessionId === session.sessionId 
                    ? "text-white" 
                    : "text-muted-foreground"
                )}>
                  {session.attendanceRecords.length} records
                </div>
              </div>
            </div>
          </Button>
          <Button
            variant="destructive"
            size="sm"
            onClick={() => onDeleteSession(session.sessionId)}
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      ))}
    </div>
  </div>
);

export default AttendanceSessionList;
