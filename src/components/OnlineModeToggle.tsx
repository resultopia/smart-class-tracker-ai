
import React from "react";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Wifi, WifiOff } from "lucide-react";

interface OnlineModeToggleProps {
  classId: string;
  checked: boolean;
  onToggle: () => void;
}

const OnlineModeToggle = ({ classId, checked, onToggle }: OnlineModeToggleProps) => (
  <div className="flex items-center justify-between p-2 bg-gray-50 rounded-lg">
    <div className="flex items-center space-x-2">
      {checked 
        ? <Wifi className="h-4 w-4 text-blue-600" /> 
        : <WifiOff className="h-4 w-4 text-gray-500" />}
      <Label htmlFor={`online-mode-${classId}`} className="text-sm font-medium">
        Online Mode
      </Label>
    </div>
    <Switch
      id={`online-mode-${classId}`}
      checked={checked}
      onCheckedChange={onToggle}
    />
  </div>
);

export default OnlineModeToggle;
