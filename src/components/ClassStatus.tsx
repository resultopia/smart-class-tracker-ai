
import React from "react";

interface ClassStatusProps {
  isActive: boolean;
}

const ClassStatus = ({ isActive }: ClassStatusProps) => (
  <div className={`text-sm ${isActive ? "text-primary" : "text-muted-foreground"}`}>
    Status: <span className="font-medium">{isActive ? "Active" : "Inactive"}</span>
  </div>
);

export default ClassStatus;
