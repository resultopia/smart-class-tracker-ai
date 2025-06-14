import { useState, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/components/ui/use-toast";
import { Upload, FileText, AlertCircle, CheckCircle } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { addUser } from "@/lib/userService";

const CSVTeacherUpload = ({ onTeachersAdded }: { onTeachersAdded: () => void }) => {
  const [isDragging, setIsDragging] = useState(false);
  const [processedTeachers, setProcessedTeachers] = useState<string[]>([]);
  const [invalidEntries, setInvalidEntries] = useState<string[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();

  const processCSV = async (csvText: string) => {
    setIsProcessing(true);
    const lines = csvText.trim().split('\n');
    const validTeachers: string[] = [];
    const invalidEntries: string[] = [];
    
    for (const line of lines) {
      const trimmedLine = line.trim();
      if (trimmedLine) {
        const columns = trimmedLine.split(',');
        const username = columns[0]?.trim().replace(/"/g, ''); // Remove quotes
        const name = columns[1]?.trim().replace(/"/g, ''); // Remove quotes
        
        if (username && name) {
          const success = await addUser({
            userId: username,
            name: name,
            password: "lol",
            role: "teacher"
          });
          
          if (success) {
            validTeachers.push(`${name} (${username})`);
          } else {
            invalidEntries.push(`${name} (${username})`);
          }
        } else {
          invalidEntries.push(trimmedLine);
        }
      }
    }
    
    setProcessedTeachers(validTeachers);
    setInvalidEntries(invalidEntries);
    
    if (validTeachers.length > 0) {
      onTeachersAdded();
      toast({
        title: "Teachers Added",
        description: `${validTeachers.length} teacher(s) added successfully${invalidEntries.length > 0 ? `, ${invalidEntries.length} invalid entries` : ''}.`
      });
    } else {
      toast({
        title: "No Valid Entries",
        description: "No valid teacher entries found in the CSV file.",
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
          <p className="text-sm font-medium">Upload CSV file to add teachers</p>
          <p className="text-xs text-gray-500">
            CSV should have two columns: username, full name
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
      
      {processedTeachers.length > 0 && (
        <Alert>
          <CheckCircle className="h-4 w-4" />
          <AlertDescription>
            Successfully added {processedTeachers.length} teacher(s): {processedTeachers.slice(0, 3).join(', ')}
            {processedTeachers.length > 3 && `... and ${processedTeachers.length - 3} more`}
          </AlertDescription>
        </Alert>
      )}
      
      {invalidEntries.length > 0 && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            {invalidEntries.length} invalid entry(ies): {invalidEntries.slice(0, 3).join(', ')}
            {invalidEntries.length > 3 && `... and ${invalidEntries.length - 3} more`}
          </AlertDescription>
        </Alert>
      )}
    </div>
  );
};

export default CSVTeacherUpload;
