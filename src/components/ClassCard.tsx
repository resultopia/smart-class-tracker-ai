
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
import ClassStatus from "./ClassStatus";
import StudentCount from "./StudentCount";
import OnlineModeToggle from "./OnlineModeToggle";
import { supabase } from "@/integrations/supabase/client";
import { updateClassParticipantsSupabase } from "@/lib/class/updateClassParticipantsSupabase";
import { calculateDistanceMeters } from "@/utils/geolocation";
import RadiusEditDialog from "./RadiusEditDialog";
import { Button } from "@/components/ui/button";

interface ClassCardProps {
  classData: Class;
  teacherId: string;
  onStatusChange: () => void;
  anyClassActive?: boolean;
}

const ClassCard = ({ classData, teacherId, onStatusChange, anyClassActive = false }: ClassCardProps) => {
  const [showAttendanceDialog, setShowAttendanceDialog] = useState(false);
  const [showAttendanceDashboard, setShowAttendanceDashboard] = useState(false);
  const [showAttendanceHistory, setShowAttendanceHistory] = useState(false);
  const [showCSVUploadDialog, setShowCSVUploadDialog] = useState(false);
  const [showEditParticipants, setShowEditParticipants] = useState(false);
  const [dashboardResetFlag, setDashboardResetFlag] = useState(false);
  const [locationLoading, setLocationLoading] = useState(false);
  const [showRadiusDialog, setShowRadiusDialog] = useState(false);
  const [editRadiusLoading, setEditRadiusLoading] = useState(false);
  const { toast } = useToast();

  // Handler to start/stop class and manage sessions
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
      // START: Get geolocation and prompt for radius, then insert session
      setLocationLoading(true);
      if (!("geolocation" in navigator)) {
        toast({
          title: "Geolocation Not Supported",
          description: "Your browser doesn't support location access.",
          variant: "destructive"
        });
        setLocationLoading(false);
        return;
      }

      navigator.geolocation.getCurrentPosition(
        async (pos) => {
          const teacher_latitude = pos.coords.latitude;
          const teacher_longitude = pos.coords.longitude;
          // Open radius edit dialog instead of prompt! (Improvement opportunity)

          const defaultRadius = 100;
          let radius = prompt("Enter allowed attendance radius in meters (default: 100):", `${defaultRadius}`);
          let location_radius = parseInt(radius || "") || defaultRadius;

          // Insert session with geocoords
          const { data: newSession, error: sessionError } = await supabase
            .from("class_sessions")
            .insert({
              class_id: classData.id,
              start_time: new Date().toISOString(),
              teacher_latitude,
              teacher_longitude,
              location_radius,
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
                description: `Session started. Location & radius set (${location_radius}m). Students can now check-in.`,
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
          setLocationLoading(false);
        },
        (err) => {
          setLocationLoading(false);
          toast({
            title: "Geolocation Error",
            description: err.message || "Could not get your location.",
            variant: "destructive"
          });
        }
      );
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

  // Handler to update the radius in DB for active session (class_sessions)
  const handleApplyRadius = async (newRadius: number) => {
    if (!classData.isActive) return;
    setEditRadiusLoading(true);
    const { error } = await supabase
      .from("class_sessions")
      .update({ location_radius: newRadius })
      .eq("id", classData.isActive);

    setEditRadiusLoading(false);
    if (!error) {
      toast({
        title: "Radius Updated",
        description: `Attendance radius set to ${newRadius} meters.`,
      });
      onStatusChange();
    } else {
      toast({
        title: "Failed to Update Radius",
        description: "Could not update location radius. Try again.",
        variant: "destructive"
      });
    }
  };

  const studentCount = classData.studentIds.length;

  // Active session radius not available in Class, so not used here.

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
            <ClassStatus isActive={!!classData.isActive} />
          </div>
          <OnlineModeToggle 
            classId={classData.id}
            checked={classData.isOnlineMode}
            onToggle={handleToggleOnlineMode}
          />
          {classData.isOnlineMode && (
            <ClassOnlineModeAlert />
          )}
          {/* Show attendance radius and edit button if active class */}
          {classData.isActive && (
            <div className="flex items-center gap-2 mt-2 bg-muted px-3 py-2 rounded-md shadow-sm border border-muted">
              <span className="text-xs text-muted-foreground font-semibold">
                Attendance Radius:
                {/* Can't show value unless you fetch the radius from active session elsewhere */}
                <span className="ml-1 text-primary font-bold">Session radius set</span>
              </span>
              <Button size="sm" variant="outline"
                className="ml-3"
                onClick={() => setShowRadiusDialog(true)}
                type="button"
              >
                Edit Radius
              </Button>
            </div>
          )}
        </CardContent>
        <CardFooter>
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

      {/* Dialogs */}
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

      <Dialog open={showAttendanceHistory} onOpenChange={setShowAttendanceHistory}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Attendance History - {classData.name}</DialogTitle>
          </DialogHeader>
          <AttendanceHistory classData={classData} />
        </DialogContent>
      </Dialog>

      <EditParticipantsDialog
        open={showEditParticipants}
        onOpenChange={setShowEditParticipants}
        classData={classData}
        onStudentsUpdated={async (ids) => {
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

      {/* --- Radius Edit Dialog: shown if active session --- */}
      {classData.isActive && (
        <RadiusEditDialog
          open={showRadiusDialog}
          onOpenChange={setShowRadiusDialog}
          defaultRadius={100}
          onApply={handleApplyRadius}
          loading={editRadiusLoading}
          min={10}
          max={100}
        />
      )}
    </>
  );
};

export default ClassCard;
