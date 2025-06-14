import { useState, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { 
  getStudentsAttendanceStatus,
  markAttendance,
  resetTodayAttendance
} from "@/lib/data";
import { RefreshCcw, FileDown } from "lucide-react";
import { Class } from "@/lib/types";
import { supabase } from "@/integrations/supabase/client";
import AttendanceTable from "./AttendanceTable";
import type { StudentAttendanceStatus } from "./StudentAttendanceRow";

// Helper to always create a brand new session, regardless of today's sessions.
async function createNewClassSession(classId: string) {
  const { data, error } = await supabase
    .from("class_sessions")
    .insert({
      class_id: classId,
      start_time: new Date().toISOString(),
    })
    .select()
    .single();
  if (error) {
    console.error("Error creating new session:", error.message);
    return null;
  }
  return data;
}

interface AttendanceDashboardProps {
  classData: Class;
  resetFlag?: boolean; // ← New: for parent to force reset after stopping
  onResetDone?: () => void; // ← New: callback to unset resetFlag
}

const AttendanceDashboard = ({ classData, resetFlag, onResetDone }: AttendanceDashboardProps) => {
  const [studentsStatus, setStudentsStatus] = useState<StudentAttendanceStatus[]>([]);
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();
  const lastSessionIdRef = useRef<string | null>(null);

  // Loads attendance status for the LATEST session (not reused, always newly created per start)
  const loadAttendanceData = async () => {
    setLoading(true);

    if (classData.isActive) {
      // Always use or create latest session for this running class instance
      let sessionId: string | null = null;

      // If we've previously created a session for this start, use it
      if (lastSessionIdRef.current) {
        sessionId = lastSessionIdRef.current;
      } else {
        // Otherwise, create a brand new session for this run
        const session = await createNewClassSession(classData.id);
        if (session?.id) {
          sessionId = session.id;
          lastSessionIdRef.current = sessionId;
        }
      }

      if (sessionId) {
        // Fetch all attendance_records for this class/session
        const { data: records, error } = await supabase
          .from("attendance_records")
          .select("student_id, status, timestamp")
          .eq("class_id", classData.id)
          .eq("session_id", sessionId);

        if (error) {
          console.error("[Dashboard] Error loading attendance:", error.message);
          setStudentsStatus([]);
        } else {
          // Fetch enrolled students
          const { data: rels, error: relError } = await supabase
            .from("classes_students")
            .select("student_id")
            .eq("class_id", classData.id);
          if (relError) {
            setStudentsStatus([]);
          } else {
            const studentIds = (rels ?? []).map((r) => r.student_id);
            // Fetch profile info for each student in class
            let profileData: Record<string, { user_id: string; name: string }> = {};
            if (studentIds.length > 0) {
              const { data: profiles } = await supabase
                .from("profiles")
                .select("id, user_id, name")
                .in("id", studentIds);
              if (profiles && Array.isArray(profiles)) {
                profiles.forEach((row) => {
                  profileData[row.id] = { user_id: row.user_id, name: row.name };
                });
              }
            }
            const statusMap: Record<string, "present" | "absent"> = {};
            (records ?? []).forEach((rec) => {
              statusMap[rec.student_id] = rec.status === "present" ? "present" : "absent";
            });
            const results = studentIds.map((studentUuid) => ({
              userId: profileData[studentUuid]?.user_id || studentUuid,
              uuid: studentUuid,
              name: profileData[studentUuid]?.name || "",
              status: statusMap[studentUuid] || "absent",
            }));
            setStudentsStatus(results);
          }
        }
      } else {
        setStudentsStatus([]);
      }
    } else {
      // Not active, so reset everyone to absent (preparing for new session); clear session ref!
      lastSessionIdRef.current = null;
      // Fetch student info (userId, name) for each student in class
      const studentIds = classData.studentIds || [];
      let profileData: Record<string, { user_id: string; name: string }> = {};
      if (studentIds.length > 0) {
        const { data: profiles } = await supabase
          .from("profiles")
          .select("id, user_id, name")
          .in("id", studentIds);
        if (profiles && Array.isArray(profiles)) {
          profiles.forEach((row) => {
            profileData[row.id] = { user_id: row.user_id, name: row.name };
          });
        }
      }
      setStudentsStatus(
        studentIds.map((id) => ({
          uuid: id,
          userId: profileData[id]?.user_id || "",
          name: profileData[id]?.name || "",
          status: null as any, // status is null when stopped
        }))
      );
    }

    setLoading(false);
  };

  // On classData (and on reset), reload - if the class just became active, always create a new session
  useEffect(() => {
    loadAttendanceData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [classData.isActive]);

  // On resetFlag set by parent after stop, force reset and clear session ref
  useEffect(() => {
    if (resetFlag) {
      lastSessionIdRef.current = null;
      loadAttendanceData();
      if (onResetDone) onResetDone();
    }
    // eslint-disable-next-line
  }, [resetFlag]);

  // Toggle in dashboard, only updates today's latest session attendance (never past sessions)
  const toggleAttendance = async (uuid: string, currentStatus: "present" | "absent") => {
    if (!classData.isActive) return;
    setLoading(true);

    // Use the current sessionId for toggling
    let sessionId = lastSessionIdRef.current;
    if (!sessionId) {
      // Defensive: create anew if not set
      const session = await createNewClassSession(classData.id);
      if (session?.id) {
        sessionId = session.id;
        lastSessionIdRef.current = sessionId;
      }
    }

    if (sessionId) {
      const newStatus = currentStatus === "present" ? "absent" : "present";
      // Find if record for this student/session exists
      const { data: existing, error: selectError } = await supabase
        .from("attendance_records")
        .select("id")
        .eq("class_id", classData.id)
        .eq("student_id", uuid)
        .eq("session_id", sessionId);

      if (selectError) {
        toast({ title: "Error", description: "Failed to update attendance.", variant: "destructive" });
      } else if (existing && existing.length > 0) {
        const { error: updateError } = await supabase
          .from("attendance_records")
          .update({ status: newStatus, timestamp: new Date().toISOString() })
          .eq("id", existing[0].id);
        if (updateError) {
          toast({
            title: "Error",
            description: "Failed to update attendance.",
            variant: "destructive"
          });
        } else {
          await loadAttendanceData();
          toast({
            title: "Attendance Updated",
            description: `Student marked as ${newStatus}.`
          });
        }
      } else {
        const { error: insertError } = await supabase.from("attendance_records").insert([
          {
            class_id: classData.id,
            student_id: uuid,
            status: newStatus,
            timestamp: new Date().toISOString(),
            session_id: sessionId,
          },
        ]);
        if (insertError) {
          toast({
            title: "Error",
            description: "Failed to update attendance.",
            variant: "destructive"
          });
        } else {
          await loadAttendanceData();
          toast({
            title: "Attendance Updated",
            description: `Student marked as ${newStatus}.`
          });
        }
      }
    }
    setLoading(false);
  };

  const handleResetAttendance = async () => {
    setLoading(true);
    // Defensive: use current sessionId for reset
    let sessionId = lastSessionIdRef.current;
    if (!sessionId) {
      const session = await createNewClassSession(classData.id);
      if (session?.id) {
        sessionId = session.id;
        lastSessionIdRef.current = sessionId;
      }
    }
    if (sessionId) {
      const { error } = await supabase
        .from("attendance_records")
        .delete()
        .eq("class_id", classData.id)
        .eq("session_id", sessionId);
      if (!error) {
        await loadAttendanceData();
        toast({
          title: "Attendance Reset",
          description: "All attendance records for this session have been cleared."
        });
      } else {
        toast({
          title: "Error",
          description: "Failed to reset attendance.",
          variant: "destructive"
        });
      }
    }
    setLoading(false);
  };

  const exportToCSV = () => {
    const headers = ['student_uuid', 'username', 'student_name', 'attendance_status'];
    const csvData = studentsStatus.map(student => [
      student.uuid,
      student.userId,
      student.name,
      student.status
    ]);
    const csvContent = [
      headers.join(','),
      ...csvData.map(row => row.join(','))
    ].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `attendance_${timestamp}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    toast({
      title: "Export Successful",
      description: "Attendance data has been exported to CSV."
    });
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-medium">Today's Attendance</h3>
        <div className="space-x-2">
          <Button 
            variant="outline" 
            size="sm" 
            onClick={handleResetAttendance}
            disabled={loading || !classData.isActive}
          >
            <RefreshCcw className="h-4 w-4 mr-2" />
            Reset All
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={exportToCSV}
            disabled={loading}
          >
            <FileDown className="h-4 w-4 mr-2" />
            Export CSV
          </Button>
        </div>
      </div>
      {loading && (
        <div className="text-center py-4 text-muted-foreground text-sm">
          Loading attendance...
        </div>
      )}
      <AttendanceTable 
        studentsStatus={studentsStatus} 
        onToggleAttendance={toggleAttendance} 
        isClassActive={classData.isActive}
      />
    </div>
  );
};
export default AttendanceDashboard;
