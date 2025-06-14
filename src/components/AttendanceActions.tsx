
import { Button } from "@/components/ui/button";
import { RefreshCcw, FileDown } from "lucide-react";

interface AttendanceActionsProps {
  onResetAttendance: () => void;
  onExportCSV: () => void;
  loading: boolean;
  isClassActive: boolean;
}

const AttendanceActions = ({ onResetAttendance, onExportCSV, loading, isClassActive }: AttendanceActionsProps) => {
  return (
    <div className="space-x-2">
      <Button
        variant="outline"
        size="sm"
        onClick={onResetAttendance}
        disabled={loading || !isClassActive}
      >
        <RefreshCcw className="h-4 w-4 mr-2" />
        Reset All
      </Button>
      <Button
        variant="outline"
        size="sm"
        onClick={onExportCSV}
        disabled={loading}
      >
        <FileDown className="h-4 w-4 mr-2" />
        Export CSV
      </Button>
    </div>
  );
};

export default AttendanceActions;
