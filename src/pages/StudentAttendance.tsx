import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { markAttendance, verifyFaceIdentity } from "@/lib/data";
import { useAuth } from "@/lib/auth-context";
import { useToast } from "@/components/ui/use-toast";
import ImageUpload from "@/components/ImageUpload";
import { RefreshCw, CheckCircle, XCircle, AlertCircle } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import UserInfo from "@/components/UserInfo";
import { getStudentActiveClassSupabase } from "@/lib/class/getStudentActiveClassSupabase";
import { supabase } from "@/integrations/supabase/client";
import { calculateDistanceMeters } from "@/utils/geolocation";
import StudentLocationVerifier from "@/components/StudentLocationVerifier";

const StudentAttendance = () => {
  const { currentUser, logout } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [activeClass, setActiveClass] = useState<any>(null);
  const [selectedImage, setSelectedImage] = useState<File | null>(null);
  const [imageBase64, setImageBase64] = useState<string | null>(null);
  const [processingStatus, setProcessingStatus] = useState<'idle' | 'processing' | 'success' | 'error'>('idle');
  const [loading, setLoading] = useState(true);
  const [studentUuid, setStudentUuid] = useState<string | null>(null);
  const [sessionLocation, setSessionLocation] = useState<{lat: number, lng: number, radius: number} | null>(null);
  const [studentCoords, setStudentCoords] = useState<{lat: number, lng: number} | null>(null);
  const [distanceStatus, setDistanceStatus] = useState<'pending' | 'valid' | 'out' | 'location-error'>('pending');
  const [checkingDistance, setCheckingDistance] = useState(false);

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
    // eslint-disable-next-line
  }, [currentUser, navigate]);

  const checkActiveClass = async () => {
    if (!currentUser) return;
    setLoading(true);

    // Get student's UUID by userId
    const { data: profile, error } = await supabase
      .from("profiles")
      .select("id")
      .eq("user_id", currentUser.userId)
      .maybeSingle();

    if (!profile || error) {
      setActiveClass(null);
      setStudentUuid(null);
      setLoading(false);
      toast({
        title: "Student Not Found",
        description: "Unable to find your profile information.",
        variant: "destructive",
      });
      return;
    }
    setStudentUuid(profile.id);

    // Fetch from Supabase
    const studentClass = await getStudentActiveClassSupabase(currentUser.userId);
    setActiveClass(studentClass);
    setProcessingStatus('idle');
    setSelectedImage(null);
    setImageBase64(null);
    setLoading(false);

    // After getting class/session, fetch teacher location/radius for the session
    if (studentClass?.isActive) {
      const { data: session, error } = await supabase
        .from("class_sessions")
        .select("teacher_latitude, teacher_longitude, location_radius")
        .eq("id", studentClass.isActive)
        .maybeSingle();
      if (!error && session?.teacher_latitude != null && session?.teacher_longitude != null && session?.location_radius != null) {
        setSessionLocation({
          lat: Number(session.teacher_latitude),
          lng: Number(session.teacher_longitude),
          radius: Number(session.location_radius),
        });
      } else {
        setSessionLocation(null);
      }
    } else {
      setSessionLocation(null);
    }
    setDistanceStatus('pending');
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
    if (!currentUser || !activeClass || !imageBase64 || !studentUuid) return;

    // NEW: block if geolocation is required and student is outside radius
    if (
      !activeClass.isOnlineMode &&
      sessionLocation &&
      distanceStatus !== 'valid'
    ) {
      toast({
        title: "Not In Range",
        description: "You are not within the attendance radius to check in.",
        variant: "destructive"
      });
      return;
    }
    setProcessingStatus('processing');
    
    try {
      // Extract the base64 data (remove the "data:image/jpeg;base64," prefix)
      const base64Data = imageBase64.split(',')[1];
      
      // Call the facial verification API
      const verified = await verifyFaceIdentity(base64Data, currentUser.userId);
      
      if (verified) {
        // Always use the UUID for markAttendance
        const attendanceMarked = await markAttendance(activeClass.id, studentUuid, "present");
        
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
          <UserInfo />
        </div>

        <Card className="shadow-lg">
          <CardHeader>
            <CardTitle className="text-center">
              {loading
                ? "Loading..."
                : activeClass
                ? activeClass.name
                : "No Active Classes"}
            </CardTitle>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="text-center py-12">
                <p className="text-muted-foreground">Checking for active class...</p>
              </div>
            ) : activeClass ? (
              <>
                {/* Online Mode Restriction */}
                {activeClass.isOnlineMode ? (
                  <div className="text-center py-8 space-y-4">
                    <AlertCircle className="w-16 h-16 text-blue-600 mx-auto" />
                    <div className="space-y-2">
                      <p className="text-lg font-medium text-blue-600">Online Class in Progress</p>
                      <p className="text-muted-foreground">
                        Online class "{activeClass.name}" is going on. Teacher will mark your attendance.
                      </p>
                    </div>
                    <Alert className="border-blue-200 bg-blue-50">
                      <AlertCircle className="h-4 w-4 text-blue-600" />
                      <AlertDescription className="text-sm text-blue-700">
                        Please wait for your teacher to mark attendance or join the class if required.
                      </AlertDescription>
                    </Alert>
                  </div>
                ) : processingStatus === 'success' ? (
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
                    {/* Only require geo/radius if NOT online mode and session location is set */}
                    {sessionLocation ? (
                      distanceStatus !== "valid" ? (
                        <StudentLocationVerifier
                          sessionLocation={sessionLocation}
                          onResult={(result, coords) => {
                            setDistanceStatus(result);
                            if (coords) setStudentCoords(coords);
                          }}
                        />
                      ) : (
                        <>
                          <div className="bg-green-50 border border-green-200 rounded-xl py-5 px-4 mb-2 flex flex-col items-center justify-center shadow-sm">
                            <span className="text-green-700 font-extrabold text-lg sm:text-2xl mb-1 tracking-wide flex items-center gap-2">
                              Attendance Allowed!
                            </span>
                            <span className="text-base font-medium text-green-800">
                              You are within <span className="font-bold">{sessionLocation.radius} meters</span> of teacher's location.
                            </span>
                            <span className="block text-green-700 font-semibold mt-1 text-sm sm:text-base">
                              Your distance:{" "}
                              <span className="font-bold">
                                {studentCoords
                                  ? (() => {
                                      // Distance between studentCoords and sessionLocation
                                      const y = Math.round(
                                        10 *
                                          calculateDistanceMeters(
                                            studentCoords.lat,
                                            studentCoords.lng,
                                            sessionLocation.lat,
                                            sessionLocation.lng
                                          )
                                      ) / 10;
                                      // Show min(y, sessionLocation.radius) if attendance allowed (distanceStatus === 'valid')
                                      // (It is definitely 'valid' if we are rendering here)
                                      return Math.min(y, sessionLocation.radius).toFixed(1);
                                    })()
                                  : "--"
                                } meters
                              </span>
                            </span>
                            <span className="inline-block mt-3 px-3 py-1 rounded-lg bg-green-100 font-semibold text-green-700 text-base shadow">
                              ✔ You are within range!
                            </span>
                          </div>
                          <p className="text-center text-muted-foreground mb-4">
                            Upload your photo to mark attendance
                          </p>
                          <ImageUpload onImageSelected={handleImageSelected} />
                          <Button 
                            className="w-full mt-4" 
                            disabled={
                              !imageBase64 || processingStatus === 'processing'
                            }
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
                        </>
                      )
                    ) : (
                      <>
                        <p className="text-center text-muted-foreground mb-4">
                          Upload your photo to mark attendance
                        </p>
                        <ImageUpload onImageSelected={handleImageSelected} />
                        <Button 
                          className="w-full mt-4" 
                          disabled={
                            !imageBase64 || processingStatus === 'processing'
                          }
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
                      </>
                    )}
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
