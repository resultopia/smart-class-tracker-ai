
import { useState, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Camera, Upload } from "lucide-react";

interface ImageUploadProps {
  onImageSelected: (base64: string, file: File) => void;
}

const ImageUpload = ({ onImageSelected }: ImageUploadProps) => {
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [isDragOver, setIsDragOver] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      processFile(file);
    }
  };

  const processFile = (file: File) => {
    // Check if file is an image
    if (!file.type.startsWith("image/")) {
      alert("Please upload an image file");
      return;
    }

    // Create preview URL
    const fileUrl = URL.createObjectURL(file);
    setPreviewUrl(fileUrl);
    
    // Resize image and convert to base64
    resizeImage(file, 160, 160).then(base64 => {
      onImageSelected(base64, file);
    });
  };

  const resizeImage = (file: File, maxWidth: number, maxHeight: number): Promise<string> => {
    return new Promise((resolve) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = (event) => {
        const img = new Image();
        img.src = event.target?.result as string;
        
        img.onload = () => {
          const canvas = document.createElement('canvas');
          canvas.width = maxWidth;
          canvas.height = maxHeight;
          
          const ctx = canvas.getContext('2d');
          if (!ctx) return;
          
          // Draw image with proper scaling to fit within dimensions
          ctx.drawImage(img, 0, 0, maxWidth, maxHeight);
          
          // Convert to base64
          const base64 = canvas.toDataURL('image/jpeg', 0.9);
          resolve(base64);
        };
      };
    });
  };

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragOver(true);
  };

  const handleDragLeave = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragOver(false);
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragOver(false);

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      const file = e.dataTransfer.files[0];
      processFile(file);
    }
  };

  const triggerFileInput = () => {
    if (fileInputRef.current) {
      fileInputRef.current.click();
    }
  };

  return (
    <div className="w-full">
      <div
        className={`
          border-2 border-dashed rounded-lg p-4 text-center
          transition-all duration-200 cursor-pointer
          ${isDragOver ? "border-primary bg-primary/5" : "border-border"}
          ${previewUrl ? "bg-muted/30" : "hover:bg-muted/30"}
        `}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        onClick={triggerFileInput}
        style={{ minHeight: "200px" }}
      >
        <input
          type="file"
          ref={fileInputRef}
          onChange={handleFileChange}
          accept="image/*"
          className="hidden"
        />

        {previewUrl ? (
          <div className="flex flex-col items-center">
            <img
              src={previewUrl}
              alt="Preview"
              className="max-h-[200px] max-w-full my-2 rounded-lg"
            />
            <p className="text-sm text-muted-foreground mt-2">
              Click to change image
            </p>
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center h-full py-4">
            <Camera className="h-10 w-10 text-muted-foreground mb-2" />
            <p className="text-muted-foreground mb-2">
              Drag and drop your photo or click to select
            </p>
            <Button variant="secondary" size="sm" onClick={(e) => {
              e.stopPropagation();
              triggerFileInput();
            }}>
              <Upload className="h-4 w-4 mr-2" />
              Select Image
            </Button>
          </div>
        )}
      </div>
    </div>
  );
};

export default ImageUpload;
