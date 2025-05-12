import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from "@/components/ui/dialog";
import { getUsersByRole, createClass, getTeacherClasses, Class } from "@/lib/data";
import { useAuth } from "@/lib/auth-context";
import ClassCard from "@/components/ClassCard";
import { useToast } from "@/components/ui/use-toast";
import { CheckIcon, PlusIcon } from "lucide-react";
import UserInfo from "@/components/UserInfo";

const TeacherDashboard = () => {
  const { currentUser } = useAuth();
  const [classes, setClasses] = useState<Class[]>([]);
  const [className, setClassName] = useState("");
  const [selectedStudents, setSelectedStudents] = useState<string[]>([]);
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const navigate = useNavigate();
  const { toast } = useToast();

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

    // Load teacher's classes
    loadClasses();
  }, [currentUser, navigate]);

  const loadClasses = () => {
    if (!currentUser) return;
    const teacherClasses = getTeacherClasses(currentUser.userId);
    setClasses(teacherClasses);
  };

  const handleCreateClass = () => {
    if (!currentUser) return;
    
    if (!className.trim()) {
      toast({
        title: "Error",
        description: "Please enter a class name.",
        variant: "destructive",
      });
      return;
    }
    
    if (selectedStudents.length === 0) {
      toast({
        title: "Error",
        description: "Please select at least one student.",
        variant: "destructive",
      });
      return;
    }
    
    createClass({
      name: className,
      teacherId: currentUser.userId,
      studentIds: selectedStudents,
    });
    
    toast({
      title: "Success",
      description: "New class created successfully.",
    });
    
    setClassName("");
    setSelectedStudents([]);
    setCreateDialogOpen(false);
    loadClasses();
  };

  const students = getUsersByRole("student");

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
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Create New Class</DialogTitle>
                </DialogHeader>
                <div className="space-y-4 py-4">
                  <div className="space-y-2">
                    <Label htmlFor="className">Class Name</Label>
                    <Input
                      id="className"
                      placeholder="e.g. CSE AI ML Batch A"
                      value={className}
                      onChange={(e) => setClassName(e.target.value)}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label>Select Students</Label>
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
                  </div>
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
