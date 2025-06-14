
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Info, ExternalLink } from "lucide-react";

interface ClassOnlineModeAlertProps {
  className?: string;
}

const handleExtensionClick = () => {
  window.open("https://google.co.in", "_blank");
};

const ClassOnlineModeAlert = ({ className }: ClassOnlineModeAlertProps) => (
  <Alert className={`border-blue-200 bg-blue-50 ${className ? className : ""}`}>
    <Info className="h-4 w-4 text-blue-600" />
    <AlertDescription className="text-sm">
      <div className="space-y-2">
        <p className="font-medium text-blue-700">Online Mode Active</p>
        <p className="text-blue-600">
          Online attendance can be fetched from Google Meet through our extension.
        </p>
        <button 
          onClick={handleExtensionClick}
          className="inline-flex items-center text-blue-700 hover:text-blue-800 underline text-sm font-medium transition-colors"
        >
          Get Extension
          <ExternalLink className="h-3 w-3 ml-1" />
        </button>
      </div>
    </AlertDescription>
  </Alert>
);

export default ClassOnlineModeAlert;
