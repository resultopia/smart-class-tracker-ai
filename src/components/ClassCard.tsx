import { useState, useEffect } from "react";
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
import AttendanceDialogs from "./AttendanceDialogs";
import SessionRadiusDialog from "./SessionRadiusDialog";

interface ClassCardProps {
  classData: Class;
  teacherId: string;
  onStatusChange: () => void;
  anyClassActive?: boolean;
}

const ClassCard = ({
  classData,
  teacherId,
  onStatusChange,
  anyClassActive = false,
}: ClassCardProps) => {
  const [showAttendanceDialog, setShowAttendanceDialog] = useState(false);
  const [showAttendanceDashboard, setShowAttendanceDashboard] = useState(false);
  const [showAttendanceHistory, setShowAttendanceHistory] = useState(false);
  const [showCSVUploadDialog, setShowCSVUploadDialog] = useState(false);
  const [showEditParticipants, setShowEditParticipants] = useState(false);
  const [dashboardResetFlag, setDashboardResetFlag] = useState(false);
  const [locationLoading, setLocationLoading] = useState(false);
  const [showRadiusDialog, setShowRadiusDialog] = useState(false);
  const [editRadiusLoading, setEditRadiusLoading] = useState(false);
  const [showStartSessionRadiusDialog, setShowStartSessionRadiusDialog] = useState(false);
  const [startSessionRadius, setStartSessionRadius] = useState<number>(100);
  const [activeSessionRadius, setActiveSessionRadius] = useState<number | null>(null);
  const [pendingOnlineModeSwitch, setPendingOnlineModeSwitch] = useState<null | "off">(null);
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
      // If online mode is on, just start the class session with no location/radius prompt
      if (classData.isOnlineMode) {
        setLocationLoading(true);
        // Insert a session WITHOUT teacher location and radius
        const { data: newSession, error: sessionError } = await supabase
          .from("class_sessions")
          .insert({
            class_id: classData.id,
            start_time: new Date().toISOString(),
            // No teacher_latitude, teacher_longitude, location_radius
          })
          .select()
          .single();

        if (!sessionError && newSession?.id) {
          const { error: updateClassError } = await supabase
            .from("classes")
            .update({ is_active: newSession.id })
            .eq("id", classData.id);

          if (!updateClassError) {
            onStatusChange();
            setDashboardResetFlag(false);
            toast({
              title: "Class Started (Online Mode)",
              description: `Session started in online mode. Students will wait for you to mark attendance.`,
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
      } else {
        // ASK for radius only when NOT in online mode
        setShowStartSessionRadiusDialog(true);
      }
    }
  };

  // Logic for toggling online mode, handling current session and geodata
  const handleToggleOnlineMode = async () => {
    // If class is being toggled OFF from online mode (=> going to offline mode)
    if (classData.isOnlineMode && classData.isActive) {
      // Fetch current session location data
      const { data: session, error } = await supabase
        .from("class_sessions")
        .select("teacher_latitude, teacher_longitude, location_radius")
        .eq("id", classData.isActive)
        .maybeSingle();

      // If any geolocation data is missing, popup dialog
      if (
        error ||
        !session ||
        session.teacher_latitude === null ||
        session.teacher_longitude === null ||
        session.location_radius === null
      ) {
        toast({
          title: "Teacher location required",
          description: "To switch off online mode, please set your current location and attendance radius.",
          variant: "destructive",
        });
        // Show dialog for radius, on success toggle online mode off
        setPendingOnlineModeSwitch("off");
        setShowRadiusDialog(true);
        return;
      }
    }

    // Otherwise, simply toggle the online mode flag
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

  // Overwrite handleApplyRadius to handle pending 'switch offline' case
  const handleApplyRadius = async (newRadius: number) => {
    if (!classData.isActive) return;
    setEditRadiusLoading(true);
    // (Re)fetch teacher location
    if (!("geolocation" in navigator)) {
      setEditRadiusLoading(false);
      toast({
        title: "Geolocation Not Supported",
        description: "Your browser doesn't support location access.",
        variant: "destructive",
      });
      return;
    }
    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        const teacher_latitude = pos.coords.latitude;
        const teacher_longitude = pos.coords.longitude;

        const { error } = await supabase
          .from("class_sessions")
          .update({
            teacher_latitude,
            teacher_longitude,
            location_radius: newRadius,
          })
          .eq("id", classData.isActive);

        setEditRadiusLoading(false);
        if (!error) {
          toast({
            title: "Radius & Location Updated",
            description: `Attendance radius set to ${newRadius} meters. Location saved.`,
          });
          onStatusChange();

          // Fetch latest location_radius and update activeSessionRadius immediately
          const { data, error: fetchError } = await supabase
            .from("class_sessions")
            .select("location_radius")
            .eq("id", classData.isActive)
            .single();
          if (!fetchError && data && data.location_radius) {
            setActiveSessionRadius(data.location_radius);
          }

          // If radius dialog was opened for toggling online mode OFF, do that now
          if (pendingOnlineModeSwitch === "off") {
            setPendingOnlineModeSwitch(null);
            await supabase
              .from("classes")
              .update({ is_online_mode: false })
              .eq("id", classData.id);
            onStatusChange();
            toast({
              title: "Online Mode Disabled",
              description: "You can now mark attendance with location-based check-in.",
            });
          }
        } else {
          toast({
            title: "Failed to Update Location",
            description: "Could not update teacher's location/radius. Try again.",
            variant: "destructive"
          });
        }
      },
      (err) => {
        setEditRadiusLoading(false);
        toast({
          title: "Geolocation Error",
          description: err.message || "Could not get your location.",
          variant: "destructive",
        });
      }
    );
  };

  const handleDelete = () => {
    onStatusChange();
  };

  const handleCSVUploadComplete = () => {
    onStatusChange(); // Refresh the data
    setShowCSVUploadDialog(false);
  };

  // Function to handle actual session start with selected radius
  const startClassSession = async (location_radius: number) => {
    setLocationLoading(true);
    if (!("geolocation" in navigator)) {
      toast({
        title: "Geolocation Not Supported",
        description: "Your browser doesn't support location access.",
        variant: "destructive",
      });
      setLocationLoading(false);
      return;
    }

    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        const teacher_latitude = pos.coords.latitude;
        const teacher_longitude = pos.coords.longitude;

        // Insert session with geocoords and selected radius
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
          variant: "destructive",
        });
      }
    );
  };

  const studentCount = classData.studentIds.length;

  // When a session is active, fetch its current radius from Supabase on mount or when classData.isActive changes
  useEffect(() => {
    const fetchRadius = async () => {
      if (classData.isActive) {
        const { data, error } = await supabase
          .from("class_sessions")
          .select("location_radius")
          .eq("id", classData.isActive)
          .single();
        if (!error && data && data.location_radius) {
          setActiveSessionRadius(data.location_radius);
        } else {
          setActiveSessionRadius(100); // fallback default
        }
      } else {
        setActiveSessionRadius(null);
      }
    };
    fetchRadius();
  }, [classData.isActive]);

  return (
    <>
      {/* Main Card and content unchanged */}
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
          {classData.isActive && (
            <div className="flex items-center gap-2 mt-2 bg-muted px-3 py-2 rounded-md shadow-sm border border-muted">
              <span className="text-xs text-muted-foreground font-semibold">
                Attendance Radius:
                <span className="ml-1 text-primary font-bold">
                  {activeSessionRadius ? `${activeSessionRadius} meters` : "—"}
                </span>
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

      {/* Attendance Dialogs grouped */}
      <AttendanceDialogs
        classData={classData}
        dashboardOpen={showAttendanceDashboard}
        setDashboardOpen={setShowAttendanceDashboard}
        historyOpen={showAttendanceHistory}
        setHistoryOpen={setShowAttendanceHistory}
        csvDialogOpen={showCSVUploadDialog}
        setCSVDialogOpen={setShowCSVUploadDialog}
        dashboardResetFlag={dashboardResetFlag}
        onDashboardResetDone={() => setDashboardResetFlag(false)}
        onCSVUploadComplete={handleCSVUploadComplete}
      />

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

      {/* Edit radius of active session */}
      {classData.isActive && (
        <RadiusEditDialog
          open={showRadiusDialog}
          onOpenChange={(open) => {
            setShowRadiusDialog(open);
            if (!open) setPendingOnlineModeSwitch(null); // clear pending on close
          }}
          defaultRadius={activeSessionRadius ?? 100}
          onApply={handleApplyRadius}
          loading={editRadiusLoading}
          min={10}
          max={100}
        />
      )}

      {/* SessionRadiusDialog for start class flow, only shown when NOT online mode */}
      {!classData.isOnlineMode && (
        <SessionRadiusDialog
          open={showStartSessionRadiusDialog}
          defaultRadius={100}
          onOpenChange={setShowStartSessionRadiusDialog}
          loading={locationLoading}
          onApply={async (radius) => {
            setShowStartSessionRadiusDialog(false);
            setStartSessionRadius(radius);
            await startClassSession(radius);
          }}
          min={10}
          max={100}
        />
      )}
    </>
  );
};

export default ClassCard;
