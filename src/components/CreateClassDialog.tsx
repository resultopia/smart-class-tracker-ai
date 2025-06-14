
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from "@/components/ui/dialog";
import { CheckIcon, PlusIcon, Users } from "lucide-react";
import CSVUpload from "@/components/CSVUpload";
import { useToast } from "@/components/ui/use-toast";

interface CreateClassDialogProps {
  open: boolean;
  setOpen: (open: boolean) => void;
  students: any[];
  selectedStudents: string[];
  setSelectedStudents: (ids: string[]) => void;
  csvStudents: string[];
  setCsvStudents: (ids: string[]) => void;
  className: string;
  setClassName: (s: string) => void;
  onCreate: () => void;
  loading?: boolean;
}

const CreateClassDialog = ({
  open,
  setOpen,
  students,
  selectedStudents,
  setSelectedStudents,
  csvStudents,
  setCsvStudents,
  className,
  setClassName,
  onCreate,
  loading,
}: CreateClassDialogProps) => {
  const handleCSVStudentsUploaded = (ids: string[]) => setCsvStudents(ids);

  // For debugging: log students loaded in manual select tab
  if (open) {
    // Only log when dialog is open to reduce spam
    console.log("[CreateClassDialog] Students passed in:", students);
  }

  // Defensive: Map student objects to {id, name} with fallbacks
  const mappedStudents = Array.isArray(students)
    ? students
        .map((student) => {
          // Try all likely property keys, fallback to null if missing
          const studentId = student.user_id || student.userId || student.id || null;
          const studentName =
            student.name ||
            student.username ||
            (studentId ? String(studentId).slice(0, 8) : "Unnamed Student");
          // Don't render row unless studentId exists
          if (!studentId) return null;
          return { id: studentId, name: studentName };
        })
        .filter(Boolean)
    : [];

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button>
          <PlusIcon className="h-4 w-4 mr-2" />
          Create New Class
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Create New Class</DialogTitle>
        </DialogHeader>
        <div className="space-y-6 py-4">
          <div className="space-y-2">
            <Label htmlFor="className">Class Name</Label>
            <Input
              id="className"
              placeholder="e.g. CSE AI ML Batch A"
              value={className}
              onChange={(e) => setClassName(e.target.value)}
              disabled={loading}
            />
          </div>

          <Tabs defaultValue="manual" className="w-full">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="manual">Manual Selection</TabsTrigger>
              <TabsTrigger value="csv">Bulk Upload (CSV)</TabsTrigger>
            </TabsList>
            <TabsContent value="manual" className="space-y-4">
              <div className="space-y-2">
                <Label>Select Students Manually</Label>
                <div className="grid grid-cols-2 gap-2 max-h-60 overflow-y-auto p-1">
                  {mappedStudents.length === 0 && (
                    <span className="text-sm text-muted-foreground col-span-2">
                      No students available to select.
                    </span>
                  )}
                  {mappedStudents.map(({ id, name }) => (
                    <div
                      key={id}
                      className={`
                        flex items-center space-x-2 p-2 rounded
                        ${selectedStudents.includes(id)
                          ? "bg-primary/10 border border-primary"
                          : "border hover:bg-muted cursor-pointer"}
                      `}
                      onClick={() => {
                        if (selectedStudents.includes(id)) {
                          setSelectedStudents(selectedStudents.filter((sid) => sid !== id));
                        } else {
                          setSelectedStudents([...selectedStudents, id]);
                        }
                      }}
                    >
                      <div
                        className={`
                          h-5 w-5 flex items-center justify-center rounded-sm
                          ${selectedStudents.includes(id)
                            ? "bg-primary text-primary-foreground"
                            : "border"}
                        `}
                      >
                        {selectedStudents.includes(id) && <CheckIcon className="h-3 w-3" />}
                      </div>
                      <span className="text-sm">
                        {name} ({id})
                      </span>
                    </div>
                  ))}
                </div>
                {selectedStudents.length > 0 && (
                  <p className="text-sm text-muted-foreground">
                    {selectedStudents.length} students selected manually
                  </p>
                )}
              </div>
            </TabsContent>
            <TabsContent value="csv" className="space-y-4">
              <div className="space-y-2">
                <Label>Upload CSV File</Label>
                <CSVUpload 
                  onStudentsUploaded={handleCSVStudentsUploaded}
                  existingStudents={selectedStudents}
                />
              </div>
            </TabsContent>
          </Tabs>

          {(selectedStudents.length > 0 || csvStudents.length > 0) && (
            <div className="bg-blue-50 p-4 rounded-lg">
              <div className="flex items-center space-x-2 text-blue-800">
                <Users className="h-4 w-4" />
                <span className="font-medium">
                  Total: {selectedStudents.length + csvStudents.length} students will be added
                </span>
              </div>
              {selectedStudents.length > 0 && (
                <p className="text-sm text-blue-600 mt-1">
                  Manual selection: {selectedStudents.length}
                </p>
              )}
              {csvStudents.length > 0 && (
                <p className="text-sm text-blue-600 mt-1">
                  CSV upload: {csvStudents.length}
                </p>
              )}
            </div>
          )}
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => setOpen(false)} disabled={loading}>
            Cancel
          </Button>
          <Button onClick={onCreate} disabled={loading}>Create Class</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default CreateClassDialog;

