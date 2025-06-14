
import { Button } from "@/components/ui/button";
import { Trash2 } from "lucide-react";

interface DeleteClassButtonProps {
  onDelete: () => void;
  disabled?: boolean;
}

const DeleteClassButton = ({ onDelete, disabled }: DeleteClassButtonProps) => (
  <Button
    variant="destructive"
    size="icon"
    onClick={onDelete}
    disabled={disabled}
    className="ml-2 w-8 h-8"
    title="Delete Class"
  >
    <Trash2 className="h-4 w-4" />
  </Button>
);

export default DeleteClassButton;
