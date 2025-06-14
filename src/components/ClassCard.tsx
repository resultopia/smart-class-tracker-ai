import { useState } from "react";
import { Card, CardContent, CardFooter } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useToast } from "@/components/ui/use-toast";
import AttendanceDashboard from "./AttendanceDashboard";
import AttendanceHistory from "./AttendanceHistory";
import CSVAttendanceUpload from "./CSVAttendanceUpload";
import { Class } from "@/lib/types";
import EditParticipantsDialog from "./EditParticipantsDialog";
import DeleteClassButton from "./DeleteClassButton";
import ClassCardHeader from "./ClassCardHeader";
import ClassCardFooter from "./ClassCardFooter";
import ClassOnlineModeAlert from "./ClassOnlineModeAlert";
import ClassTodayAttendanceSummary from "./ClassTodayAttendanceSummary";
import ClassStatus from "./ClassStatus";
import StudentCount from "./StudentCount";
import OnlineModeToggle from "./OnlineModeToggle";
import { supabase } from "@/integrations/supabase/client";
import { updateClassParticipantsSupabase } from "@/lib/class/updateClassParticipantsSupabase";

interface ClassCardProps {
  classData: Class;
  teacherId: string;
  onStatusChange: () => void;
  anyClassActive?: boolean; // <-- new, optional
}

const ClassCard = ({ classData, teacherId, onStatusChange, anyClassActive = false }: ClassCardProps) => {
  const [showAttendanceDialog, setShowAttendanceDialog] = useState(false);
  const [showAttendanceDashboard, setShowAttendanceDashboard] = useState(false);
  const [showAttendanceHistory, setShowAttendanceHistory] = useState(false);
  const [showCSVUploadDialog, setShowCSVUploadDialog] = useState(false);
  const [showEditParticipants, setShowEditParticipants] = useState(false);
  const [dashboardResetFlag, setDashboardResetFlag] = useState(false);
  const { toast } = useToast();

  // Handler to start/stop class and manage sessions (now with session_id logic)
  const handleToggleStatus = async () => {
    if (classData.isActive) {
      // Stop class: set is_active NULL, end current session
      const sessionId = classData.isActive;
      // Update classes.is_active to NULL
      const { error: updateClassError } = await supabase
        .from("classes")
        .update({ is_active: null })
        .eq("id", classData.id);

      // Update class_sessions.end_time to now
      if (sessionId) {
        await supabase
          .from("class_sessions")
          .update({ end_time: new Date().toISOString() })
          .eq("id", sessionId);
      }

      if (!updateClassError) {
        onStatusChange();
        setDashboardResetFlag(true); // trigger dashboard reset
        toast({
          title: "Class Stopped",
          description: "Session ended and saved. Attendance reset.",
        });
      } else {
        toast({
          title: "Error",
          description: "Failed to stop class.",
          variant: "destructive",
        });
      }
    } else {
      // Start new session: create class_sessions + set is_active to new session_id
      const { data: newSession, error: sessionError } = await supabase
        .from("class_sessions")
        .insert({
          class_id: classData.id,
          start_time: new Date().toISOString(),
        })
        .select()
        .single();

      if (!sessionError && newSession?.id) {
        // Update classes.is_active with the new session_id
        const { error: updateClassError } = await supabase
          .from("classes")
          .update({ is_active: newSession.id })
          .eq("id", classData.id);

        if (!updateClassError) {
          onStatusChange();
          setDashboardResetFlag(false);
          toast({
            title: "Class Started",
            description: "Session started. Students can mark attendance.",
          });
        } else {
          toast({
            title: "Error",
            description: "Failed to start class.",
            variant: "destructive",
          });
        }
      } else {
        toast({
          title: "Error",
          description: "Failed to create session.",
          variant: "destructive",
        });
      }
    }
  };

  const handleToggleOnlineMode = async () => {
    const { error } = await supabase
      .from("classes")
      .update({ is_online_mode: !classData.isOnlineMode })
      .eq("id", classData.id);

    if (!error) {
      onStatusChange();
      toast({
        title: `Online Mode ${classData.isOnlineMode ? "Disabled" : "Enabled"}`,
        description: classData.isOnlineMode
          ? "Students can now mark their own attendance."
          : "Only teachers can mark attendance in online mode.",
      });
    } else {
      toast({
        title: "Error",
        description: "Failed to change online mode.",
        variant: "destructive",
      });
    }
  };

  const handleDelete = () => {
    onStatusChange();
  };

  const handleCSVUploadComplete = () => {
    onStatusChange(); // Refresh the data
    setShowCSVUploadDialog(false);
  };

  // All student IDs come from classData
  const studentCount = classData.studentIds.length;

  return (
    <>
      <Card className={classData.isActive ? "border-primary" : ""}>
        <ClassCardHeader
          classData={classData}
          onDelete={handleDelete}
          onEditParticipants={() => setShowEditParticipants(true)}
          teacherId={teacherId}
        />
        <CardContent className="pb-2 space-y-3">
          <div className="flex items-center justify-between">
            {/* Pass isActive as boolean for display only */}
            <ClassStatus isActive={!!classData.isActive} />
            {!!classData.isActive && (
              <ClassTodayAttendanceSummary classData={classData} />
            )}
          </div>
          <OnlineModeToggle 
            classId={classData.id}
            checked={classData.isOnlineMode}
            onToggle={handleToggleOnlineMode}
          />
          {classData.isOnlineMode && (
            <ClassOnlineModeAlert />
          )}
        </CardContent>
        <CardFooter>
          {/* Pass anyClassActive to ClassCardFooter */}
          <ClassCardFooter
            classData={{
              ...classData,
              isActive: !!classData.isActive as unknown as string | null,
            }}
            onToggleStatus={handleToggleStatus}
            onShowDashboard={() => setShowAttendanceDashboard(true)}
            onShowHistory={() => setShowAttendanceHistory(true)}
            onShowCSVUpload={() => setShowCSVUploadDialog(true)}
            anyClassActive={anyClassActive}
          />
        </CardFooter>
      </Card>

      {/* Dialogs remain the same */}
      {/* CSV Attendance Upload Dialog */}
      <Dialog open={showCSVUploadDialog} onOpenChange={setShowCSVUploadDialog}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Upload Attendance CSV - {classData.name}</DialogTitle>
          </DialogHeader>
          <CSVAttendanceUpload 
            classId={classData.id} 
            onAttendanceMarked={handleCSVUploadComplete}
          />
        </DialogContent>
      </Dialog>

      {/* Attendance Dashboard Dialog */}
      <Dialog open={showAttendanceDashboard} onOpenChange={setShowAttendanceDashboard}>
        <DialogContent className="max-w-3xl">
          <DialogHeader>
            <DialogTitle>Attendance Dashboard - {classData.name}</DialogTitle>
          </DialogHeader>
          <AttendanceDashboard 
            classData={classData}
            resetFlag={dashboardResetFlag}
            onResetDone={() => setDashboardResetFlag(false)}
          />
        </DialogContent>
      </Dialog>

      {/* Attendance History Dialog */}
      <Dialog open={showAttendanceHistory} onOpenChange={setShowAttendanceHistory}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Attendance History - {classData.name}</DialogTitle>
          </DialogHeader>
          <AttendanceHistory classData={classData} />
        </DialogContent>
      </Dialog>

      {/* Edit Participants Dialog */}
      <EditParticipantsDialog
        open={showEditParticipants}
        onOpenChange={setShowEditParticipants}
        classData={classData}
        onStudentsUpdated={async (ids) => {
          // Update on Supabase, then refresh class list
          const ok = await updateClassParticipantsSupabase(classData.id, ids);
          if (ok) {
            toast({
              title: "Participants Updated",
              description: "Student list updated for class.",
            });
            onStatusChange();
          } else {
            toast({
              title: "Error updating participants",
              description: "Failed to update the class participants.",
              variant: "destructive"
            });
          }
        }}
      />
    </>
  );
};

export default ClassCard;
