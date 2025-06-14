
import { Button } from "@/components/ui/button";
import { Play, Pause, Upload, Users, History } from "lucide-react";
import { Class } from "@/lib/types";

interface ClassCardFooterProps {
  classData: Class;
  onToggleStatus: () => void;
  onShowDashboard: () => void;
  onShowHistory: () => void;
  onShowCSVUpload: () => void;
}

const ClassCardFooter = ({
  classData,
  onToggleStatus,
  onShowDashboard,
  onShowHistory,
  onShowCSVUpload,
}: ClassCardFooterProps) => (
  <div className="pt-2 flex flex-wrap gap-2">
    <Button 
      variant={classData.isActive ? "outline" : "default"}
      size="sm"
      className="flex-1 min-w-[120px] flex-nowrap overflow-hidden text-ellipsis whitespace-nowrap justify-start px-3"
      onClick={onToggleStatus}
    >
      {classData.isActive ? (
        <>
          <Pause className="h-4 w-4 mr-2" />
          Stop Class
        </>
      ) : (
        <>
          <Play className="h-4 w-4 mr-2" />
          Start Class
        </>
      )}
    </Button>

    {classData.isOnlineMode && classData.isActive && (
      <Button
        variant="outline"
        size="sm"
        onClick={onShowCSVUpload}
        className="flex-1 min-w-[100px]"
      >
        <Upload className="h-4 w-4 mr-2" />
        Upload CSV
      </Button>
    )}

    <Button
      variant="outline"
      size="sm"
      onClick={onShowDashboard}
      className="flex-1 min-w-[100px]"
    >
      <Users className="h-4 w-4 mr-2" />
      Dashboard
    </Button>

    <Button
      variant="outline"
      size="sm"
      onClick={onShowHistory}
      className="flex-1 min-w-[100px]"
    >
      <History className="h-4 w-4 mr-2" />
      History
    </Button>
  </div>
);

export default ClassCardFooter;
