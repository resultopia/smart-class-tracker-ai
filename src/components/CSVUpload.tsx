import { useState, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/components/ui/use-toast";
import { Upload, FileText, AlertCircle } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";

interface CSVUploadProps {
  onStudentsUploaded: (studentIds: string[]) => void;
  existingStudents?: string[];
}

const CSVUpload = ({ onStudentsUploaded, existingStudents = [] }: CSVUploadProps) => {
  const [isDragging, setIsDragging] = useState(false);
  const [uploadedStudents, setUploadedStudents] = useState<string[]>([]);
  const [duplicates, setDuplicates] = useState<string[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();

  // Helper: checks if a string is a header-ish value
  const looksLikeHeader = (cell: string) => {
    // This function is no longer used, but keep it in case you want to display warnings in the future.
    const s = cell.trim().toLowerCase();
    return [
      "username", "user_id", "userid", "student", 
      "studentid", "student_id", "id", "name"
    ].some(header => s.includes(header));
  };

  const processCSV = (csvText: string) => {
    const lines = csvText.trim().split('\n');
    let studentIds: string[] = [];
    let foundDuplicates: string[] = [];

    // Handle empty file edge case
    if (lines.length === 0) {
      setUploadedStudents([]);
      setDuplicates([]);
      toast({
        title: "No Valid Students",
        description: "No rows found in the CSV file.",
        variant: "destructive"
      });
      return;
    }

    // Always process every row, do not skip based on header detection
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i].trim();
      if (!line) continue;

      const columns = line.split(',');
      const studentId = columns[0]?.trim().replace(/"/g, "");
      if (studentId) {
        if (existingStudents.includes(studentId)) {
          foundDuplicates.push(studentId);
        } else {
          studentIds.push(studentId);
        }
      }
    }

    setUploadedStudents(studentIds);
    setDuplicates(foundDuplicates);

    if (studentIds.length > 0) {
      onStudentsUploaded(studentIds);
      toast({
        title: "CSV Processed",
        description: `${studentIds.length} students ready to add${foundDuplicates.length > 0 ? `, ${foundDuplicates.length} duplicates found` : ''}.`
      });
    } else {
      toast({
        title: "No Valid Students",
        description: "No valid student IDs found in the CSV file.",
        variant: "destructive"
      });
    }
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
          <p className="text-sm font-medium">Upload CSV file with student IDs</p>
          <p className="text-xs text-gray-500">
            CSV should have one column with student usernames/IDs
          </p>
          <div className="flex justify-center">
            <Button
              variant="outline"
              size="sm"
              onClick={() => fileInputRef.current?.click()}
            >
              <Upload className="h-4 w-4 mr-2" />
              Choose File
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
      
      {uploadedStudents.length > 0 && (
        <Alert>
          <FileText className="h-4 w-4" />
          <AlertDescription>
            Ready to add {uploadedStudents.length} students: {uploadedStudents.slice(0, 5).join(', ')}
            {uploadedStudents.length > 5 && `... and ${uploadedStudents.length - 5} more`}
          </AlertDescription>
        </Alert>
      )}
      
      {duplicates.length > 0 && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            {duplicates.length} duplicate student(s) found and will be skipped: {duplicates.slice(0, 3).join(', ')}
            {duplicates.length > 3 && `... and ${duplicates.length - 3} more`}
          </AlertDescription>
        </Alert>
      )}
    </div>
  );
};

export default CSVUpload;
