
import React from "react";
import RadiusEditDialog from "./RadiusEditDialog";

interface SessionRadiusDialogProps {
  open: boolean;
  defaultRadius: number;
  loading: boolean;
  min?: number;
  max?: number;
  onApply: (radius: number) => Promise<void>;
  onOpenChange: (open: boolean) => void;
}

const SessionRadiusDialog: React.FC<SessionRadiusDialogProps> = ({
  open,
  defaultRadius,
  loading,
  min = 0,
  max = 300,
  onApply,
  onOpenChange,
}) => {
  return (
    <RadiusEditDialog
      open={open}
      onOpenChange={onOpenChange}
      defaultRadius={defaultRadius}
      onApply={onApply}
      loading={loading}
      min={min}
      max={max}
    />
  );
};

export default SessionRadiusDialog;
