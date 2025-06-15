import React, { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from "@/components/ui/dialog";
import { Slider } from "@/components/ui/slider";
import { Button } from "@/components/ui/button";

interface RadiusEditDialogProps {
  open: boolean;
  onOpenChange: (val: boolean) => void;
  defaultRadius: number;
  onApply: (radius: number) => Promise<void> | void;
  min?: number;
  max?: number;
  loading?: boolean;
}

const RadiusEditDialog: React.FC<RadiusEditDialogProps> = ({
  open,
  onOpenChange,
  defaultRadius,
  onApply,
  min = 10,
  max = 100,
  loading = false
}) => {
  const [radius, setRadius] = useState<number>(defaultRadius);

  // Keep slider in sync with defaultRadius
  React.useEffect(() => {
    setRadius(defaultRadius);
  }, [defaultRadius, open]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-sm">
        <DialogHeader>
          <DialogTitle>Edit Attendance Radius</DialogTitle>
          <DialogDescription>
            Adjust the allowed check-in radius for students (between {min}m and {max}m)
          </DialogDescription>
        </DialogHeader>
        <div className="flex flex-col items-center py-4">
          <span className="text-primary font-semibold text-xl mb-2">
            {radius} meters
          </span>
          <Slider
            min={min}
            max={max}
            step={1}
            value={[radius]}
            onValueChange={([value]) => setRadius(value)}
            className="w-full max-w-xs mb-2"
            aria-label="Radius"
          />
          <div className="flex justify-between w-full text-xs text-muted-foreground select-none">
            <span>{min}m</span>
            <span>{max}m</span>
          </div>
        </div>
        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={loading}
            type="button"
          >
            Cancel
          </Button>
          <Button
            onClick={async () => {
              await onApply(radius);
              onOpenChange(false);
            }}
            loading={loading ? "true" : undefined}
            type="button"
          >
            Save
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default RadiusEditDialog;
