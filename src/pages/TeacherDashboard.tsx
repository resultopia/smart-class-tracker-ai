import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
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
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth-context";
import ClassCard from "@/components/ClassCard";
import CSVUpload from "@/components/CSVUpload";
import { useToast } from "@/components/ui/use-toast";
import { CheckIcon, PlusIcon, Users } from "lucide-react";
import UserInfo from "@/components/UserInfo";

export interface Class {
  id: string;
  name: string;
  teacherId: string;
  studentIds: string[];
  isActive: boolean;
  isOnlineMode: boolean;
}

const TeacherDashboard = () => {
  const { currentUser } = useAuth();
  const [classes, setClasses] = useState<Class[]>([]);
  const [className, setClassName] = useState("");
  const [selectedStudents, setSelectedStudents] = useState<string[]>([]);
  const [csvStudents, setCsvStudents] = useState<string[]>([]);
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const navigate = useNavigate();
  const { toast } = useToast();
  const [students, setStudents] = useState<any[]>([]);

  // Fetch profile (students and teachers)
  useEffect(() => {
    if (!currentUser) {
      navigate("/");
      return;
    }

    if (currentUser.role !== "teacher") {
      toast({
        title: "Access Denied",
        description: "Only teachers can access this page.",
        variant: "destructive",
      });
      navigate("/");
      return;
    }

    loadClasses();

    // Load students from Supabase
    const loadStudents = async () => {
      const { data: profiles, error } = await supabase
        .from("profiles")
        .select("*")
        .eq("role", "student");
      if (profiles) setStudents(profiles);
    };
    loadStudents();
  }, [currentUser, navigate]);

  // Load teacher's classes from Supabase
  const loadClasses = async () => {
    if (!currentUser) return;
    // Get all classes where teacher_id = auth user's (profiles) id
    const { data: classRows, error } = await supabase
      .from("classes")
      .select("*")
      .eq("teacher_id", currentUser.userId);
    if (classRows) {
      // For each class, get associated students
      const classList: Class[] = [];
      for (const cls of classRows) {
        // Get joined students for this class
        const { data: joined, error: studentError } = await supabase
          .from("classes_students")
          .select("student_id")
          .eq("class_id", cls.id);
        const studentIds = joined ? joined.map(j => j.student_id) : [];
        classList.push({
          id: cls.id,
          name: cls.name,
          teacherId: cls.teacher_id,
          studentIds,
          isActive: cls.is_active,
          isOnlineMode: cls.is_online_mode,
        });
      }
      setClasses(classList);
    }
  };

  // Create class: rows in classes and classes_students
  const handleCreateClass = async () => {
    if (!currentUser) return;

    if (!className.trim()) {
      toast({
        title: "Error",
        description: "Please enter a class name.",
        variant: "destructive",
      });
      return;
    }

    const allStudents = [...selectedStudents, ...csvStudents];
    if (allStudents.length === 0) {
      toast({
        title: "Error",
        description: "Please select at least one student or upload a CSV file.",
        variant: "destructive",
      });
      return;
    }

    // Insert into classes table
    const { data: classData, error } = await supabase
      .from("classes")
      .insert([
        {
          name: className,
          teacher_id: currentUser.id,
        },
      ])
      .select()
      .single();

    if (error || !classData) {
      toast({
        title: "Error",
        description: "Failed to create class in database.",
        variant: "destructive",
      });
      return;
    }

    // Insert into classes_students join table
    const studentJoins = allStudents.map(studentId => ({
      class_id: classData.id,
      student_id: studentId,
    }));

    await supabase.from("classes_students").insert(studentJoins);

    toast({
      title: "Success",
      description: `New class created successfully with ${allStudents.length} students.`,
    });

    setClassName("");
    setSelectedStudents([]);
    setCsvStudents([]);
    setCreateDialogOpen(false);
    loadClasses();
  };

  const handleCSVStudentsUploaded = (students: string[]) => {
    setCsvStudents(students);
  };

  return (
    <div className="min-h-screen bg-slate-50 py-8">
      <div className="container max-w-4xl mx-auto px-4">
        <div className="flex items-center justify-between mb-8">
          <h1 className="text-2xl font-bold">Teacher Dashboard</h1>
          <UserInfo />
        </div>

        <div className="bg-white rounded-lg p-6 mb-8 shadow">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-medium">Your Classes</h2>
            <Dialog open={createDialogOpen} onOpenChange={setCreateDialogOpen}>
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
                          {students.map((student) => (
                            <div 
                              key={student.userId}
                              className={`
                                flex items-center space-x-2 p-2 rounded
                                ${selectedStudents.includes(student.userId) 
                                  ? 'bg-primary/10 border border-primary' 
                                  : 'border hover:bg-muted cursor-pointer'}
                              `}
                              onClick={() => {
                                setSelectedStudents(prevSelected => 
                                  prevSelected.includes(student.userId)
                                    ? prevSelected.filter(id => id !== student.userId)
                                    : [...prevSelected, student.userId]
                                );
                              }}
                            >
                              <div className={`
                                h-5 w-5 flex items-center justify-center rounded-sm
                                ${selectedStudents.includes(student.userId)
                                  ? 'bg-primary text-primary-foreground'
                                  : 'border'}
                              `}>
                                {selectedStudents.includes(student.userId) && <CheckIcon className="h-3 w-3" />}
                              </div>
                              <span className="text-sm">{student.name} ({student.userId})</span>
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
                  <Button variant="outline" onClick={() => setCreateDialogOpen(false)}>
                    Cancel
                  </Button>
                  <Button onClick={handleCreateClass}>Create Class</Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </div>

          {classes.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              No classes created yet. Create your first class to get started.
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {classes.map((cls) => (
                <ClassCard 
                  key={cls.id} 
                  classData={cls} 
                  teacherId={currentUser?.userId || ""} 
                  onStatusChange={loadClasses}
                />
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default TeacherDashboard;
