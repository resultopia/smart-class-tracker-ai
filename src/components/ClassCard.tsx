
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
  const { toast } = useToast();

  const handleToggleStatus = () => {
    const success = toggleClassStatus(classData.id, teacherId);
    
    if (success) {
      onStatusChange();
      toast({
        title: classData.isActive ? "Class Stopped" : "Class Started",
        description: classData.isActive ? "Students can no longer mark attendance." : "Students can now mark attendance.",
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
        <CardHeader className="pb-2">
          <CardTitle className="text-lg font-medium flex items-center justify-between">
            <span>{classData.name}</span>
            {classData.isOnlineMode && (
              <div className="flex items-center text-blue-600">
                <Wifi className="h-4 w-4 mr-1" />
                <span className="text-xs">Online</span>
              </div>
            )}
          </CardTitle>
          <div className="flex items-center text-sm text-muted-foreground">
            <Users className="h-4 w-4 mr-1" />
            <span>{studentCount} student{studentCount !== 1 && "s"}</span>
          </div>
        </CardHeader>
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
          
          {/* Online Mode Toggle */}
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

          {/* Online Mode Information */}
          {classData.isOnlineMode && (
            <Alert className="border-blue-200 bg-blue-50">
              <Info className="h-4 w-4 text-blue-600" />
              <AlertDescription className="text-sm">
                <div className="space-y-2">
                  <p className="font-medium text-blue-700">Online Mode Active</p>
                  <p className="text-blue-600">
                    Online attendance can be fetched from Google Meet through our extension.
                  </p>
                  <a 
                    href="#" 
                    className="inline-flex items-center text-blue-700 hover:text-blue-800 underline text-sm font-medium"
                    onClick={(e) => e.preventDefault()}
                  >
                    Get Extension
                    <ExternalLink className="h-3 w-3 ml-1" />
                  </a>
                </div>
              </AlertDescription>
            </Alert>
          )}
        </CardContent>
        <CardFooter className="pt-2 flex flex-wrap gap-2">
          <Button 
            variant={classData.isActive ? "outline" : "default"}
            size="sm"
            onClick={handleToggleStatus}
            className="flex-1 min-w-[100px] justify-start px-3"
          >
            {classData.isActive ? (
              <>
                <Pause className="h-4 w-4 mr-2" />
                Stop Class
              </>
            ) : (
              <>
                <Play className="h-4 w-4 mr-2" />
                Start Class
              </>
            )}
          </Button>
          
          {/* CSV Upload button - only show for online mode */}
          {classData.isOnlineMode && classData.isActive && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowCSVUploadDialog(true)}
              className="flex-1 min-w-[100px]"
            >
              <Upload className="h-4 w-4 mr-2" />
              Upload CSV
            </Button>
          )}
          
          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowAttendanceDialog(true)}
            className="flex-1 min-w-[100px]"
          >
            <ClipboardList className="h-4 w-4 mr-2" />
            Records
          </Button>
          
          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowAttendanceDashboard(true)}
            className="flex-1 min-w-[100px]"
          >
            <Users className="h-4 w-4 mr-2" />
            Dashboard
          </Button>

          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowAttendanceHistory(true)}
            className="flex-1 min-w-[100px]"
          >
            <History className="h-4 w-4 mr-2" />
            History
          </Button>

          <Button
            variant="destructive"
            size="sm"
            onClick={handleDelete}
            disabled={classData.isActive}
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        </CardFooter>
      </Card>

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

      {/* Attendance Records Dialog */}
      <Dialog open={showAttendanceDialog} onOpenChange={setShowAttendanceDialog}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Attendance Records - {classData.name}</DialogTitle>
          </DialogHeader>
          <AttendanceList attendanceRecords={classData.attendanceRecords} />
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
    </>
  );
};

export default ClassCard;
