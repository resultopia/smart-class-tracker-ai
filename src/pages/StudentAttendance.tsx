
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { getStudentActiveClass, markAttendance, verifyFaceIdentity } from "@/lib/data";
import { useAuth } from "@/lib/auth-context";
import { useToast } from "@/components/ui/use-toast";
import ImageUpload from "@/components/ImageUpload";
import { LogOutIcon, RefreshCw, CheckCircle, XCircle } from "lucide-react";

const StudentAttendance = () => {
  const { currentUser, logout } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [activeClass, setActiveClass] = useState<any>(null);
  const [selectedImage, setSelectedImage] = useState<File | null>(null);
  const [imageBase64, setImageBase64] = useState<string | null>(null);
  const [processingStatus, setProcessingStatus] = useState<'idle' | 'processing' | 'success' | 'error'>('idle');
  
  useEffect(() => {
    if (!currentUser) {
      navigate("/");
      return;
    }

    if (currentUser.role !== "student") {
      toast({
        title: "Access Denied",
        description: "Only students can access this page.",
        variant: "destructive",
      });
      navigate("/");
      return;
    }

    checkActiveClass();
  }, [currentUser, navigate]);

  const checkActiveClass = () => {
    if (!currentUser) return;
    
    const studentClass = getStudentActiveClass(currentUser.userId);
    setActiveClass(studentClass);
    setProcessingStatus('idle');
    setSelectedImage(null);
    setImageBase64(null);
  };

  const handleLogout = () => {
    logout();
    navigate("/");
  };

  const handleImageSelected = (base64: string, file: File) => {
    setSelectedImage(file);
    setImageBase64(base64);
    setProcessingStatus('idle');
  };

  const submitAttendance = async () => {
    if (!currentUser || !activeClass || !imageBase64) return;
    
    setProcessingStatus('processing');
    
    try {
      // Extract the base64 data (remove the "data:image/jpeg;base64," prefix)
      const base64Data = imageBase64.split(',')[1];
      
      // Call the facial verification API
      const verified = await verifyFaceIdentity(base64Data, currentUser.userId);
      
      if (verified) {
        const attendanceMarked = markAttendance(activeClass.id, currentUser.userId, "present");
        
        if (attendanceMarked) {
          setProcessingStatus('success');
          toast({
            title: "Attendance Successful",
            description: "Your attendance has been recorded.",
          });
        } else {
          setProcessingStatus('error');
          toast({
            title: "Attendance Failed",
            description: "There was an error recording your attendance.",
            variant: "destructive",
          });
        }
      } else {
        setProcessingStatus('error');
        toast({
          title: "Verification Failed",
          description: "Face verification failed. Please try again.",
          variant: "destructive",
        });
      }
    } catch (error) {
      setProcessingStatus('error');
      toast({
        title: "Error",
        description: "An error occurred. Please try again.",
        variant: "destructive",
      });
    }
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-slate-50 p-4">
      <div className="w-full max-w-md">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-2xl font-bold">Student Attendance</h1>
          <Button variant="outline" onClick={handleLogout}>
            <LogOutIcon className="h-4 w-4 mr-2" />
            Logout
          </Button>
        </div>

        <Card className="shadow-lg">
          <CardHeader>
            <CardTitle className="text-center">
              {activeClass ? activeClass.name : "No Active Classes"}
            </CardTitle>
          </CardHeader>
          <CardContent>
            {activeClass ? (
              <>
                {processingStatus === 'success' ? (
                  <div className="text-center py-8 space-y-4">
                    <CheckCircle className="w-16 h-16 text-success mx-auto" />
                    <p className="text-lg font-medium text-success">Attendance Successful</p>
                    <p className="text-muted-foreground">
                      Your attendance has been recorded for {activeClass.name}.
                    </p>
                  </div>
                ) : processingStatus === 'error' ? (
                  <div className="text-center py-8 space-y-4">
                    <XCircle className="w-16 h-16 text-destructive mx-auto" />
                    <p className="text-lg font-medium text-destructive">Attendance Failed</p>
                    <p className="text-muted-foreground mb-4">
                      Face verification was unsuccessful. Please try again.
                    </p>
                    <Button onClick={() => setProcessingStatus('idle')}>Try Again</Button>
                  </div>
                ) : (
                  <div className="space-y-4">
                    <p className="text-center text-muted-foreground mb-4">
                      Upload your photo to mark attendance
                    </p>
                    <ImageUpload onImageSelected={handleImageSelected} />
                    <Button 
                      className="w-full mt-4" 
                      disabled={!imageBase64 || processingStatus === 'processing'}
                      onClick={submitAttendance}
                    >
                      {processingStatus === 'processing' ? (
                        <>
                          <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                          Verifying...
                        </>
                      ) : (
                        'Submit Attendance'
                      )}
                    </Button>
                  </div>
                )}
              </>
            ) : (
              <div className="text-center py-12">
                <p className="text-muted-foreground">
                  There are no active classes for you right now.
                </p>
                <p className="text-muted-foreground mt-2">
                  Please check back later or contact your teacher.
                </p>
                <Button 
                  variant="outline" 
                  className="mt-6"
                  onClick={checkActiveClass}
                >
                  <RefreshCw className="mr-2 h-4 w-4" />
                  Refresh
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default StudentAttendance;
