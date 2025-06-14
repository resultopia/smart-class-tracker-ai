
import React, { useEffect, useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Users, UserMinus, UserPlus, Upload } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/components/ui/use-toast";
import { Class } from "@/lib/types";
import CSVUpload from "./CSVUpload";

interface EditParticipantsDialogProps {
  open: boolean;
  onOpenChange: (b: boolean) => void;
  classData: Class;
  onStudentsUpdated: (newIds: string[]) => void;
}

// Updated student type for clarity
interface StudentProfile {
  id: string;        // uuid
  user_id: string;   // username
  name: string;
}

const EditParticipantsDialog = ({ open, onOpenChange, classData, onStudentsUpdated }: EditParticipantsDialogProps) => {
  const { toast } = useToast();
  // All students in the system, each with uuid + username
  const [allStudents, setAllStudents] = useState<StudentProfile[]>([]);
  const [search, setSearch] = useState("");
  // Locally editable list of UUIDs
  const [studentIds, setStudentIds] = useState<string[]>(classData.studentIds);

  useEffect(() => { setStudentIds(classData.studentIds); }, [classData.studentIds]);
  useEffect(() => {
    const fetchStudents = async () => {
      // Fetch uuid + username + name for all students
      const { data, error } = await supabase
        .from("profiles")
        .select("id, user_id, name")
        .eq("role", "student");
      if (error || !data) {
        setAllStudents([]);
        return;
      }
      setAllStudents(data as StudentProfile[]);
    };
    fetchStudents();
  }, []);
  
  // Filtering helpers -- filter by username or name
  const filteredAllStudents = allStudents.filter(st =>
    st.name.toLowerCase().includes(search.toLowerCase()) ||
    st.user_id.toLowerCase().includes(search.toLowerCase())
  );
  const selectedSet = new Set(studentIds);

  // Add student by UUID
  const addStudent = (uuid: string) => {
    if (!selectedSet.has(uuid)) setStudentIds([...studentIds, uuid]);
  };
  // Remove student by UUID
  const removeStudent = (uuid: string) => {
    setStudentIds(studentIds.filter(sid => sid !== uuid));
  };

  // Save: propagate UUID changes upward
  const handleSave = async () => {
    onStudentsUpdated(studentIds);
    toast({ title: "Participants Updated", description: "Student list updated." });
    onOpenChange(false);
  };

  // Handle CSV upload: uploadedIds are usernames, need to resolve to UUIDs
  const handleBulkUpload = async (uploadedUsernames: string[]) => {
    // Find those not already present and valid
    const notAlreadyPresentUsernames = uploadedUsernames.filter(un =>
      !allStudents
        .filter(s => studentIds.includes(s.id))
        .some(s => s.user_id === un)
    );
    if (notAlreadyPresentUsernames.length === 0) {
      toast({
        title: "No new valid students",
        description: "No new valid student usernames found in CSV.",
        variant: "destructive"
      });
      return;
    }
    // Resolve usernames to UUIDs
    const uuidsToAdd = allStudents
      .filter(s => notAlreadyPresentUsernames.includes(s.user_id))
      .map(s => s.id)
      .filter(uuid => !selectedSet.has(uuid));
    if (uuidsToAdd.length === 0) {
      toast({
        title: "No new UUIDs found",
        description: "No new students could be resolved from the CSV upload.",
        variant: "destructive"
      });
      return;
    }
    setStudentIds(prev => Array.from(new Set([...prev, ...uuidsToAdd])));
    toast({
      title: "Students Added",
      description: `${uuidsToAdd.length} students added from CSV.`
    });
  };

  // Fast lookup: uuid (id) to student (username & name)
  const uuidToStudent = Object.fromEntries(allStudents.map(stu => [stu.id, stu]));

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
              {studentIds.map(uuid => {
                const stu = uuidToStudent[uuid];
                return (
                  <div key={uuid} className="flex items-center justify-between px-2 py-1 rounded hover:bg-red-50">
                    <span className="text-sm">
                      {stu?.name || "Unknown"} 
                      {stu ? <span className="ml-1 text-xs text-muted-foreground">({stu.user_id})</span> : null}
                    </span>
                    <Button
                      size="icon"
                      variant="destructive"
                      onClick={() => removeStudent(uuid)}
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
          <div className="w-full md:w-1/2 flex flex-col gap-4">
            <div>
              <h4 className="font-medium mb-1">Add Students</h4>
              <Input
                placeholder="Filter by name or username"
                value={search}
                onChange={e => setSearch(e.target.value)}
                className="mb-2"
                data-testid="participant-search-input"
              />
              <div className="rounded border bg-slate-50 p-2 h-32 overflow-y-auto space-y-1">
                {filteredAllStudents.length === 0 && (
                  <div className="text-sm text-muted-foreground">No students found.</div>
                )}
                {filteredAllStudents.map(stu => (
                  <div key={stu.id} className="flex items-center justify-between px-2 py-1 rounded hover:bg-green-50">
                    <span className="text-sm">
                      {stu.name}
                      <span className="ml-1 text-xs text-muted-foreground">({stu.user_id})</span>
                    </span>
                    <Button
                      size="icon"
                      variant="outline"
                      onClick={() => addStudent(stu.id)}
                      className="ml-2"
                      disabled={selectedSet.has(stu.id)}
                      title="Add"
                    >
                      <UserPlus className="h-4 w-4" />
                    </Button>
                  </div>
                ))}
              </div>
            </div>
            {/* Bulk CSV Upload */}
            <div>
              <div className="flex items-center gap-2 mb-2">
                <Upload className="h-4 w-4 text-blue-700" />
                <span className="font-medium text-sm">Bulk Add From CSV</span>
              </div>
              <CSVUpload
                existingStudents={studentIds.map(uuid => {
                  const stu = uuidToStudent[uuid];
                  return stu?.user_id || "";
                }).filter(Boolean)}
                onStudentsUploaded={handleBulkUpload}
              />
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

