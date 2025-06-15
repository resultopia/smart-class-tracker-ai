
import React, { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { RefreshCw, AlertCircle, MapPin } from "lucide-react";
import { calculateDistanceMeters } from "@/utils/geolocation";

interface StudentLocationVerifierProps {
  sessionLocation: { lat: number; lng: number; radius: number };
  onResult: (result: "valid" | "out" | "location-error", coords?: { lat: number; lng: number }) => void;
}

const StudentLocationVerifier: React.FC<StudentLocationVerifierProps> = ({ sessionLocation, onResult }) => {
  const [status, setStatus] = useState<'pending' | 'checking' | 'valid' | 'out' | 'location-error'>('pending');
  const [distance, setDistance] = useState<number | null>(null);

  useEffect(() => {
    if (status !== "checking") return;

    if (!("geolocation" in navigator)) {
      setStatus("location-error");
      onResult("location-error");
      return;
    }
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const { latitude, longitude } = pos.coords;
        const dist = calculateDistanceMeters(latitude, longitude, sessionLocation.lat, sessionLocation.lng);
        setDistance(dist);

        // Allow attendance if within (radius + 30m) to accommodate error
        if (dist <= sessionLocation.radius + 30) {
          setStatus("valid");
          onResult("valid", { lat: latitude, lng: longitude });
        } else {
          setStatus("out");
          onResult("out", { lat: latitude, lng: longitude });
        }
      },
      () => {
        setStatus("location-error");
        onResult("location-error");
      }
    );
    // eslint-disable-next-line
  }, [status, sessionLocation.lat, sessionLocation.lng, sessionLocation.radius]);

  const handleCheck = () => setStatus("checking");

  let content: React.ReactNode = null;

  switch (status) {
    case "pending":
    case "out":
    case "location-error":
      content = (
        <div className="flex flex-col items-center space-y-4 py-6 px-2 text-center">
          <MapPin className="w-10 h-10 text-primary mx-auto" />
          <p className="text-md font-medium">
            To mark your attendance, please allow access to your current location.
          </p>
          <p className="text-sm text-muted-foreground">
            Attendance is only allowed within <b>{sessionLocation.radius} meters</b> of the teacher's set location.
          </p>
          {(status === "out" || status === "location-error") && (
            <Alert variant="destructive" className="my-2">
              <AlertCircle className="w-4 h-4 text-destructive" />
              <AlertDescription>
                {status === "location-error" && "Could not determine your location. Please allow permission and ensure your device's location is enabled."}
                {status === "out" && (
                  <>
                    You're currently <b>outside</b> the attendance range.<br />
                    {typeof distance === 'number'
                      ? `Distance from allowed location: ${distance.toFixed(1)} meters.`
                      : ""}
                  </>
                )}
              </AlertDescription>
            </Alert>
          )}
          <Button onClick={handleCheck}>
            <RefreshCw className="mr-2 h-4 w-4" />
            Check Location
          </Button>
        </div>
      );
      break;
    case "checking":
      content = (
        <div className="flex flex-col items-center py-8">
          <RefreshCw className="w-10 h-10 animate-spin text-blue-600 mx-auto" />
          <p className="mt-2 text-primary">Checking your current location…</p>
        </div>
      );
      break;
    case "valid":
      content = (
        <div className="flex flex-col items-center py-6">
          <MapPin className="w-10 h-10 text-green-600" />
          <p className="font-medium text-green-700">You are within the attendance area!</p>
          <p className="text-sm text-muted-foreground mt-1">
            Proceed to upload your photo and mark attendance.
          </p>
        </div>
      );
      break;
    default:
      content = null;
  }

  return content;
};

export default StudentLocationVerifier;
