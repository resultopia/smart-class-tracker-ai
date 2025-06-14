import { useState } from "react";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { deleteClass, toggleClassStatus, toggleOnlineMode, getUserById } from "@/lib/data";
import { useToast } from "@/components/ui/use-toast";
import { Play, Pause, Trash2, Users, ClipboardList, History, Wifi, WifiOff, Upload, ExternalLink, Info } from "lucide-react";
import AttendanceList from "./AttendanceList";
import AttendanceDashboard from "./AttendanceDashboard";
import AttendanceHistory from "./AttendanceHistory";
import CSVAttendanceUpload from "./CSVAttendanceUpload";
import { Class } from "@/lib/types";
import EditParticipantsDialog from "./EditParticipantsDialog";
import DeleteClassButton from "./DeleteClassButton";
import ClassCardHeader from "./ClassCardHeader";
import ClassCardFooter from "./ClassCardFooter";

interface ClassCardProps {
  classData: Class;
  teacherId: string;
  onStatusChange: () => void;
}

const ClassCard = ({ classData, teacherId, onStatusChange }: ClassCardProps) => {
  const [showAttendanceDialog, setShowAttendanceDialog] = useState(false);
  const [showAttendanceDashboard, setShowAttendanceDashboard] = useState(false);
  const [showAttendanceHistory, setShowAttendanceHistory] = useState(false);
  const [showCSVUploadDialog, setShowCSVUploadDialog] = useState(false);
  const [showEditParticipants, setShowEditParticipants] = useState(false);
  const { toast } = useToast();

  const handleToggleStatus = () => {
    const success = toggleClassStatus(classData.id, teacherId);
    
    if (success) {
      onStatusChange();
      toast({
        title: classData.isActive ? "Class Stopped" : "Class Started",
        description: classData.isActive 
          ? "Current session ended and saved to history. Attendance dashboard reset." 
          : "New session started. Students can now mark attendance.",
      });
    } else {
      toast({
        title: "Error",
        description: "Failed to change class status.",
        variant: "destructive",
      });
    }
  };

  const handleToggleOnlineMode = () => {
    const success = toggleOnlineMode(classData.id, teacherId);
    
    if (success) {
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
    const success = deleteClass(classData.id, teacherId);
    
    if (success) {
      onStatusChange();
    }
  };

  const handleCSVUploadComplete = () => {
    onStatusChange(); // Refresh the data
    setShowCSVUploadDialog(false);
  };

  const handleExtensionClick = () => {
    window.open("https://google.co.in", "_blank");
  };

  // Get student count
  const studentCount = classData.studentIds.length;

  // Get attendance count for today
  const today = new Date();
  const todayStart = new Date(today.getFullYear(), today.getMonth(), today.getDate());
  const todayAttendanceCount = classData.attendanceRecords.filter(
    (record) => new Date(record.timestamp) >= todayStart && record.status === "present"
  ).length;

  return (
    <>
      <Card className={classData.isActive ? "border-primary" : ""}>
        <ClassCardHeader
          classData={classData}
          onDelete={handleDelete}
          onEditParticipants={() => setShowEditParticipants(true)}
        />
        <CardContent className="pb-2 space-y-3">
          <div className="flex items-center justify-between">
            <div className={`text-sm ${classData.isActive ? "text-primary" : "text-muted-foreground"}`}>
              Status: <span className="font-medium">{classData.isActive ? "Active" : "Inactive"}</span>
            </div>
            {classData.isActive && (
              <div className="text-sm">
                <span className="font-medium text-green-600">{todayAttendanceCount}</span> present today
              </div>
            )}
          </div>
          
          {/* Online Mode Toggle & Info */}
          <div className="flex items-center justify-between p-2 bg-gray-50 rounded-lg">
            <div className="flex items-center space-x-2">
              {classData.isOnlineMode ? <Wifi className="h-4 w-4 text-blue-600" /> : <WifiOff className="h-4 w-4 text-gray-500" />}
              <Label htmlFor={`online-mode-${classData.id}`} className="text-sm font-medium">
                Online Mode
              </Label>
            </div>
            <Switch
              id={`online-mode-${classData.id}`}
              checked={classData.isOnlineMode}
              onCheckedChange={handleToggleOnlineMode}
            />
          </div>
          {classData.isOnlineMode && (
            <Alert className="border-blue-200 bg-blue-50">
              <Info className="h-4 w-4 text-blue-600" />
              <AlertDescription className="text-sm">
                <div className="space-y-2">
                  <p className="font-medium text-blue-700">Online Mode Active</p>
                  <p className="text-blue-600">
                    Online attendance can be fetched from Google Meet through our extension.
                  </p>
                  <button 
                    onClick={handleExtensionClick}
                    className="inline-flex items-center text-blue-700 hover:text-blue-800 underline text-sm font-medium transition-colors"
                  >
                    Get Extension
                    <ExternalLink className="h-3 w-3 ml-1" />
                  </button>
                </div>
              </AlertDescription>
            </Alert>
          )}
        </CardContent>
        <CardFooter>
          <ClassCardFooter
            classData={classData}
            onToggleStatus={handleToggleStatus}
            onShowDashboard={() => setShowAttendanceDashboard(true)}
            onShowHistory={() => setShowAttendanceHistory(true)}
            onShowCSVUpload={() => setShowCSVUploadDialog(true)}
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
          <AttendanceDashboard classData={classData} />
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
        onStudentsUpdated={ids => {
          import("@/lib/classService").then(mod => {
            mod.updateClassParticipants(classData.id, teacherId, ids);
            onStatusChange();
          });
        }}
      />
    </>
  );
};

export default ClassCard;
