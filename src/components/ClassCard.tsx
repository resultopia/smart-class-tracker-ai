
import { useState } from "react";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Class, toggleClassStatus, deleteClass } from "@/lib/data";
import { useToast } from "@/components/ui/use-toast";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog";
import { Trash2 } from "lucide-react";
import AttendanceList from "./AttendanceList";

interface ClassCardProps {
  classData: Class;
  teacherId: string;
  onStatusChange: () => void;
}

const ClassCard = ({ classData, teacherId, onStatusChange }: ClassCardProps) => {
  const { toast } = useToast();
  const [showAttendance, setShowAttendance] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

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

  const handleDeleteClass = () => {
    const success = deleteClass(classData.id, teacherId);
    
    if (success) {
      setShowDeleteConfirm(false);
      onStatusChange();
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
          <div className="flex gap-2">
            <Button 
              variant="outline" 
              onClick={() => setShowAttendance(true)}
              disabled={classData.attendanceRecords.length === 0}
            >
              View Attendance
            </Button>
            
            {!classData.isActive && (
              <Button 
                variant="destructive" 
                size="icon"
                onClick={() => setShowDeleteConfirm(true)}
              >
                <Trash2 size={16} />
              </Button>
            )}
          </div>
          <Button 
            variant={classData.isActive ? "destructive" : "default"} 
            onClick={handleToggleStatus}
          >
            {classData.isActive ? "Stop Class" : "Start Class"}
          </Button>
        </CardFooter>
      </Card>

      {/* Attendance Dialog */}
      <Dialog open={showAttendance} onOpenChange={setShowAttendance}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Attendance for {classData.name}</DialogTitle>
          </DialogHeader>
          <AttendanceList attendanceRecords={classData.attendanceRecords} />
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog open={showDeleteConfirm} onOpenChange={setShowDeleteConfirm}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Class</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete "{classData.name}"? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowDeleteConfirm(false)}>Cancel</Button>
            <Button variant="destructive" onClick={handleDeleteClass}>Delete</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
};

export default ClassCard;
