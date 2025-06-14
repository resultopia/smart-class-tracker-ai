
import React from "react";

const LoadingSpinner: React.FC = () => (
  <div className="flex items-center space-x-2">
    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
    <span>Signing in...</span>
  </div>
);

export default LoadingSpinner;
