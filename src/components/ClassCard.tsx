
import { useState } from "react";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Class, toggleClassStatus } from "@/lib/data";
import { useToast } from "@/components/ui/use-toast";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import AttendanceList from "./AttendanceList";

interface ClassCardProps {
  classData: Class;
  teacherId: string;
  onStatusChange: () => void;
}

const ClassCard = ({ classData, teacherId, onStatusChange }: ClassCardProps) => {
  const { toast } = useToast();
  const [showAttendance, setShowAttendance] = useState(false);

  const handleToggleStatus = () => {
    const success = toggleClassStatus(classData.id, teacherId);
    
    if (success) {
      toast({
        title: classData.isActive ? "Class Stopped" : "Class Started",
        description: classData.isActive 
          ? "The class has been marked as inactive." 
          : "The class is now active and accepting attendance.",
      });
      onStatusChange();
    } else {
      toast({
        title: "Action Failed",
        description: "Could not change the class status.",
        variant: "destructive",
      });
    }
  };

  return (
    <>
      <Card>
        <CardHeader className="pb-2">
          <div className="flex justify-between items-center">
            <CardTitle className="text-lg">{classData.name}</CardTitle>
            <Badge variant={classData.isActive ? "default" : "secondary"}>
              {classData.isActive ? "Active" : "Inactive"}
            </Badge>
          </div>
        </CardHeader>
        <CardContent className="pb-2">
          <p className="text-sm text-muted-foreground mb-2">
            {classData.studentIds.length} students enrolled
          </p>
          <p className="text-sm text-muted-foreground">
            {classData.attendanceRecords.length} attendance records
          </p>
        </CardContent>
        <CardFooter className="flex justify-between">
          <Button 
            variant="outline" 
            onClick={() => setShowAttendance(true)}
            disabled={classData.attendanceRecords.length === 0}
          >
            View Attendance
          </Button>
          <Button 
            variant={classData.isActive ? "destructive" : "default"} 
            onClick={handleToggleStatus}
          >
            {classData.isActive ? "Stop Class" : "Start Class"}
          </Button>
        </CardFooter>
      </Card>

      <Dialog open={showAttendance} onOpenChange={setShowAttendance}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Attendance for {classData.name}</DialogTitle>
          </DialogHeader>
          <AttendanceList attendanceRecords={classData.attendanceRecords} />
        </DialogContent>
      </Dialog>
    </>
  );
};

export default ClassCard;
