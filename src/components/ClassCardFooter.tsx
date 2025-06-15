
import { Button } from "@/components/ui/button";
import { Play, Pause, Upload, Users, History } from "lucide-react";
import { Class } from "@/lib/types";

interface ClassCardFooterProps {
  classData: Class;
  onToggleStatus: () => void;
  onShowDashboard: () => void;
  onShowHistory: () => void;
  onShowCSVUpload: () => void;
  anyClassActive?: boolean; // <-- new prop
}

const ClassCardFooter = ({
  classData,
  onToggleStatus,
  onShowDashboard,
  onShowHistory,
  onShowCSVUpload,
  anyClassActive = false,
}: ClassCardFooterProps) => {
  const isActive = !!classData.isActive;
  // Only show disable if *not* active and other class is running
  const disableStartButton = !isActive && anyClassActive;

  return (
    <div className="pt-2 flex flex-wrap gap-2">
      {/* Main Start/Stop button */}
      <Button
        variant={
          isActive
            ? "outline"
            : disableStartButton
            ? "secondary"
            : "default"
        }
        size="sm"
        className={`flex-1 min-w-[120px] flex items-center px-3 font-semibold transition-all duration-150 
          ${disableStartButton ? "opacity-60 cursor-not-allowed border border-dashed" : ""} 
          justify-start max-w-full overflow-hidden`}
        onClick={onToggleStatus}
        disabled={disableStartButton}
        aria-disabled={disableStartButton}
        title={
          isActive
            ? "Click to stop this class"
            : disableStartButton
            ? "You can only start one class at a time"
            : "Click to start this class"
        }
      >
        {isActive ? (
          <>
            <Pause className="h-4 w-4 mr-2 shrink-0" />
            <span className="truncate block">
              <span className="hidden sm:inline">Stop Class</span>
              <span className="sm:hidden">Stop</span>
            </span>
          </>
        ) : (
          <>
            <Play className="h-4 w-4 mr-2 shrink-0" />
            <span className="truncate block">
              <span className="hidden sm:inline">Start Class</span>
              <span className="sm:hidden">Start</span>
            </span>
          </>
        )}
      </Button>

      {classData.isOnlineMode && isActive && (
        <Button
          variant="outline"
          size="sm"
          onClick={onShowCSVUpload}
          className="flex-1 min-w-[100px] font-semibold flex items-center justify-start max-w-full px-3 overflow-hidden"
        >
          <Upload className="h-4 w-4 mr-2 shrink-0" />
          <span className="truncate block">
            <span className="hidden sm:inline">Upload CSV</span>
            <span className="sm:hidden">CSV</span>
          </span>
        </Button>
      )}

      <Button
        variant="outline"
        size="sm"
        onClick={onShowDashboard}
        className="flex-1 min-w-[100px] font-semibold flex items-center justify-start max-w-full px-3 overflow-hidden"
      >
        <Users className="h-4 w-4 mr-2 shrink-0" />
        <span className="truncate block">
          <span className="hidden sm:inline">Dashboard</span>
          <span className="sm:hidden">Dash</span>
        </span>
      </Button>

      <Button
        variant="outline"
        size="sm"
        onClick={onShowHistory}
        className="flex-1 min-w-[100px] font-semibold flex items-center justify-start max-w-full px-3 overflow-hidden"
      >
        <History className="h-4 w-4 mr-2 shrink-0" />
        <span className="truncate block">
          <span className="hidden sm:inline">History</span>
          <span className="sm:hidden">Hist</span>
        </span>
      </Button>
    </div>
  );
};

export default ClassCardFooter;

