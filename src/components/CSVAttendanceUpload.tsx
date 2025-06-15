
import { useState, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/components/ui/use-toast";
import { Upload, FileText, AlertCircle, CheckCircle } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { markAttendance } from "@/lib/data";
import { supabase } from "@/integrations/supabase/client";

interface CSVAttendanceUploadProps {
  classId: string;
  onAttendanceMarked: () => void;
}

const CSVAttendanceUpload = ({ classId, onAttendanceMarked }: CSVAttendanceUploadProps) => {
  const [isDragging, setIsDragging] = useState(false);
  const [processedStudents, setProcessedStudents] = useState<string[]>([]);
  const [invalidStudents, setInvalidStudents] = useState<string[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();

  // Helper to get profile by username (user_id) and return the uuid
  const getUuidByUsername = async (username: string) => {
    const { data, error } = await supabase
      .from("profiles")
      .select("id")
      .eq("user_id", username)
      .limit(1)
      .maybeSingle();
    if (error || !data) return null;
    return data.id;
  };

  const processCSV = async (csvText: string) => {
    setIsProcessing(true);
    const lines = csvText.trim().split('\n');
    const validStudents: string[] = [];
    const invalidStudentsArr: string[] = [];
    
    for (const line of lines) {
      const trimmedLine = line.trim();
      if (trimmedLine) {
        const columns = trimmedLine.split(',');
        const username = columns[0].trim().replace(/"/g, ''); // Remove quotes
        if (username) {
          // 1. Look up UUID by username
          const uuid = await getUuidByUsername(username);
          if (uuid) {
            // 2. Mark attendance using UUID in Supabase
            const success = await markAttendance(classId, uuid, "present");
            if (success) {
              validStudents.push(username);
            } else {
              invalidStudentsArr.push(username);
            }
          } else {
            invalidStudentsArr.push(username);
          }
        }
      }
    }
    
    setProcessedStudents(validStudents);
    setInvalidStudents(invalidStudentsArr);
    
    if (validStudents.length > 0) {
      onAttendanceMarked();
      toast({
        title: "Attendance Marked",
        description: `${validStudents.length} student(s) marked present${invalidStudentsArr.length > 0 ? `, ${invalidStudentsArr.length} invalid entries` : ''}.`
      });
    } else {
      toast({
        title: "No Valid Students",
        description: "No valid student usernames found in the CSV file.",
        variant: "destructive"
      });
    }
    setIsProcessing(false);
  };

  const handleFileUpload = (file: File) => {
    if (file.type !== 'text/csv' && !file.name.endsWith('.csv')) {
      toast({
        title: "Invalid File Type",
        description: "Please upload a CSV file.",
        variant: "destructive"
      });
      return;
    }
    
    const reader = new FileReader();
    reader.onload = (e) => {
      const csvText = e.target?.result as string;
      processCSV(csvText);
    };
    reader.readAsText(file);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const files = Array.from(e.dataTransfer.files);
    if (files.length > 0) {
      handleFileUpload(files[0]);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      handleFileUpload(files[0]);
    }
  };

  return (
    <div className="space-y-4">
      <div
        className={`border-2 border-dashed rounded-lg p-6 text-center transition-colors ${
          isDragging 
            ? 'border-blue-500 bg-blue-50' 
            : 'border-gray-300 hover:border-gray-400'
        }`}
        onDrop={handleDrop}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
      >
        <FileText className="h-12 w-12 mx-auto text-gray-400 mb-4" />
        <div className="space-y-2">
          <p className="text-sm font-medium">Upload CSV file to mark attendance</p>
          <p className="text-xs text-gray-500">
            CSV should have one column with student usernames
          </p>
          <div className="flex justify-center">
            <Button
              variant="outline"
              size="sm"
              onClick={() => fileInputRef.current?.click()}
              disabled={isProcessing}
            >
              <Upload className="h-4 w-4 mr-2" />
              {isProcessing ? "Processing..." : "Choose File"}
            </Button>
          </div>
        </div>
        <Input
          ref={fileInputRef}
          type="file"
          accept=".csv"
          onChange={handleFileInputChange}
          className="hidden"
        />
      </div>
      
      {processedStudents.length > 0 && (
        <Alert>
          <CheckCircle className="h-4 w-4" />
          <AlertDescription>
            Successfully marked {processedStudents.length} student(s) present: {processedStudents.slice(0, 5).join(', ')}
            {processedStudents.length > 5 && `... and ${processedStudents.length - 5} more`}
          </AlertDescription>
        </Alert>
      )}
      
      {invalidStudents.length > 0 && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            {invalidStudents.length} invalid username(s): {invalidStudents.slice(0, 3).join(', ')}
            {invalidStudents.length > 3 && `... and ${invalidStudents.length - 3} more`}
          </AlertDescription>
        </Alert>
      )}
    </div>
  );
};

export default CSVAttendanceUpload;
