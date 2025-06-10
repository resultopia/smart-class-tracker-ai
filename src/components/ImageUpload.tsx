
import { useState, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Camera, RotateCcw } from "lucide-react";

interface ImageUploadProps {
  onImageSelected: (base64: string, file: File) => void;
}

const ImageUpload = ({ onImageSelected }: ImageUploadProps) => {
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [isCapturing, setIsCapturing] = useState(false);
  const [stream, setStream] = useState<MediaStream | null>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const startCamera = async () => {
    try {
      const mediaStream = await navigator.mediaDevices.getUserMedia({
        video: { 
          width: { ideal: 640 },
          height: { ideal: 480 },
          facingMode: "user" // Front-facing camera
        }
      });
      
      setStream(mediaStream);
      setIsCapturing(true);
      
      if (videoRef.current) {
        videoRef.current.srcObject = mediaStream;
      }
    } catch (error) {
      console.error('Error accessing camera:', error);
      alert('Unable to access camera. Please ensure camera permissions are granted.');
    }
  };

  const stopCamera = () => {
    if (stream) {
      stream.getTracks().forEach(track => track.stop());
      setStream(null);
    }
    setIsCapturing(false);
  };

  const capturePhoto = () => {
    if (!videoRef.current || !canvasRef.current) return;

    const video = videoRef.current;
    const canvas = canvasRef.current;
    const context = canvas.getContext('2d');

    if (!context) return;

    // Set canvas dimensions to match video
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;

    // Draw video frame to canvas
    context.drawImage(video, 0, 0);

    // Convert to base64
    const base64 = canvas.toDataURL('image/jpeg', 0.9);
    
    // Create preview URL
    setPreviewUrl(base64);
    
    // Stop camera
    stopCamera();

    // Create a File object from the base64 data
    const byteString = atob(base64.split(',')[1]);
    const arrayBuffer = new ArrayBuffer(byteString.length);
    const uint8Array = new Uint8Array(arrayBuffer);
    
    for (let i = 0; i < byteString.length; i++) {
      uint8Array[i] = byteString.charCodeAt(i);
    }
    
    const blob = new Blob([arrayBuffer], { type: 'image/jpeg' });
    const file = new File([blob], 'captured-photo.jpg', { type: 'image/jpeg' });
    
    // Call the callback with base64 and file
    onImageSelected(base64, file);
  };

  const retakePhoto = () => {
    setPreviewUrl(null);
    startCamera();
  };

  return (
    <div className="w-full">
      <div className="border-2 border-dashed rounded-lg p-4 text-center transition-all duration-200 border-border bg-muted/30 min-h-[300px] flex flex-col items-center justify-center">
        
        {/* Hidden canvas for photo capture */}
        <canvas ref={canvasRef} className="hidden" />

        {previewUrl ? (
          // Show captured photo
          <div className="flex flex-col items-center w-full">
            <img
              src={previewUrl}
              alt="Captured photo"
              className="max-h-[250px] max-w-full mb-4 rounded-lg border"
            />
            <Button onClick={retakePhoto} variant="outline" size="sm">
              <RotateCcw className="h-4 w-4 mr-2" />
              Retake Photo
            </Button>
          </div>
        ) : isCapturing ? (
          // Show live camera feed
          <div className="flex flex-col items-center w-full">
            <video
              ref={videoRef}
              autoPlay
              playsInline
              muted
              className="max-h-[250px] max-w-full mb-4 rounded-lg border"
            />
            <div className="flex gap-2">
              <Button onClick={capturePhoto} size="sm">
                <Camera className="h-4 w-4 mr-2" />
                Capture Photo
              </Button>
              <Button onClick={stopCamera} variant="outline" size="sm">
                Cancel
              </Button>
            </div>
          </div>
        ) : (
          // Show start camera button
          <div className="flex flex-col items-center justify-center h-full py-4">
            <Camera className="h-10 w-10 text-muted-foreground mb-2" />
            <p className="text-muted-foreground mb-4">
              Take a live photo for attendance verification
            </p>
            <Button onClick={startCamera} size="sm">
              <Camera className="h-4 w-4 mr-2" />
              Start Camera
            </Button>
          </div>
        )}
      </div>
    </div>
  );
};

export default ImageUpload;
