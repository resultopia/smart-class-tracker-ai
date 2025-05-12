
import { useState } from "react";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { deleteClass, toggleClassStatus, getUserById } from "@/lib/data";
import { useToast } from "@/components/ui/use-toast";
import { Play, Pause, Trash2, Users, ClipboardList } from "lucide-react";
import AttendanceList from "./AttendanceList";
import AttendanceDashboard from "./AttendanceDashboard";
import { Class } from "@/lib/types";

interface ClassCardProps {
  classData: Class;
  teacherId: string;
  onStatusChange: () => void;
}

const ClassCard = ({ classData, teacherId, onStatusChange }: ClassCardProps) => {
  const [showAttendanceDialog, setShowAttendanceDialog] = useState(false);
  const [showAttendanceDashboard, setShowAttendanceDashboard] = useState(false);
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

  const handleDelete = () => {
    const success = deleteClass(classData.id, teacherId);
    
    if (success) {
      onStatusChange();
    }
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
          <CardTitle className="text-lg font-medium">{classData.name}</CardTitle>
          <div className="flex items-center text-sm text-muted-foreground">
            <Users className="h-4 w-4 mr-1" />
            <span>{studentCount} student{studentCount !== 1 && "s"}</span>
          </div>
        </CardHeader>
        <CardContent className="pb-2">
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
            variant="destructive"
            size="sm"
            onClick={handleDelete}
            disabled={classData.isActive}
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        </CardFooter>
      </Card>

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
    </>
  );
};

export default ClassCard;
