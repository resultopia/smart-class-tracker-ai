
import React, { useEffect, useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Users, UserMinus, UserPlus } from "lucide-react";
import { getUsersByRole } from "@/lib/data";
import { useToast } from "@/components/ui/use-toast";
import { Class } from "@/lib/types";

// Props:
// - open: boolean (dialog state)
// - onOpenChange: function
// - classData: Class (the class object)
// - onStudentsUpdated: function (callback after update)
interface EditParticipantsDialogProps {
  open: boolean;
  onOpenChange: (b: boolean) => void;
  classData: Class;
  onStudentsUpdated: (newIds: string[]) => void;
}

const EditParticipantsDialog = ({ open, onOpenChange, classData, onStudentsUpdated }: EditParticipantsDialogProps) => {
  const { toast } = useToast();
  // All students in the system
  const allStudents = getUsersByRole("student");
  const [search, setSearch] = useState("");
  // Locally editable list of IDs
  const [studentIds, setStudentIds] = useState<string[]>(classData.studentIds);

  useEffect(() => { setStudentIds(classData.studentIds); }, [classData.studentIds]);
  
  // Filtering helpers
  const filteredAllStudents = allStudents.filter(st =>
    st.name.toLowerCase().includes(search.toLowerCase()) ||
    st.userId.toLowerCase().includes(search.toLowerCase())
  );
  const selectedSet = new Set(studentIds);

  // Add student
  const addStudent = (id: string) => {
    if (!selectedSet.has(id)) setStudentIds([...studentIds, id]);
  };
  // Remove student
  const removeStudent = (id: string) => {
    setStudentIds(studentIds.filter(sid => sid !== id));
  };

  // Save: propagate changes upward
  const handleSave = async () => {
    // To update: pass back the new ID list
    onStudentsUpdated(studentIds);
    toast({ title: "Participants Updated", description: "Student list updated." });
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            <div className="flex items-center gap-2">
              <Users className="h-5 w-5" />
              Edit Participants - {classData.name}
            </div>
          </DialogTitle>
        </DialogHeader>
        <div className="flex flex-col md:flex-row gap-6 py-2">
          {/* Left: Current participants */}
          <div className="w-full md:w-1/2">
            <h4 className="font-medium mb-1">Current Participants</h4>
            <div className="rounded border bg-slate-50 p-2 h-60 overflow-y-auto space-y-1">
              {studentIds.length === 0 && (
                <div className="text-sm text-muted-foreground">No students in this class.</div>
              )}
              {studentIds.map(studentId => {
                const stu = allStudents.find(u => u.userId === studentId);
                return (
                  <div key={studentId} className="flex items-center justify-between px-2 py-1 rounded hover:bg-red-50">
                    <span className="text-sm">{stu?.name || studentId} 
                      {stu && <span className="ml-1 text-xs text-muted-foreground">({stu.userId})</span>}
                    </span>
                    <Button
                      size="icon"
                      variant="destructive"
                      onClick={() => removeStudent(studentId)}
                      className="ml-2"
                      title="Remove"
                    >
                      <UserMinus className="h-4 w-4" />
                    </Button>
                  </div>
                );
              })}
            </div>
          </div>
          {/* Right: Add from all students */}
          <div className="w-full md:w-1/2">
            <h4 className="font-medium mb-1">Add Students</h4>
            <Input
              placeholder="Filter by name or ID"
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="mb-2"
            />
            <div className="rounded border bg-slate-50 p-2 h-60 overflow-y-auto space-y-1">
              {filteredAllStudents.length === 0 && (
                <div className="text-sm text-muted-foreground">No students found.</div>
              )}
              {filteredAllStudents.map(stu => (
                <div key={stu.userId} className="flex items-center justify-between px-2 py-1 rounded hover:bg-green-50">
                  <span className="text-sm">{stu.name} <span className="ml-1 text-xs text-muted-foreground">({stu.userId})</span></span>
                  <Button
                    size="icon"
                    variant="outline"
                    onClick={() => addStudent(stu.userId)}
                    className="ml-2"
                    disabled={selectedSet.has(stu.userId)}
                    title="Add"
                  >
                    <UserPlus className="h-4 w-4" />
                  </Button>
                </div>
              ))}
            </div>
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button onClick={handleSave}>Save Changes</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default EditParticipantsDialog;
