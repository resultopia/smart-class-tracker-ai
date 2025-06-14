
import React from "react";
import { Calendar } from "lucide-react";

const LoginLogoHeader: React.FC = () => (
  <div className="text-center mb-8">
    <div className="flex items-center justify-center mb-4">
      <div className="p-3 bg-blue-600 rounded-full">
        <Calendar className="h-8 w-8 text-white" />
      </div>
    </div>
    <h1 className="text-2xl font-bold text-gray-900">Smart Attendance</h1>
  </div>
);

export default LoginLogoHeader;
