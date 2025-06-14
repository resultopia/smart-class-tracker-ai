import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Calendar, Lock, User } from "lucide-react";
import ForgotPasswordDialog from "@/components/ForgotPasswordDialog";
import { useAuth } from "@/lib/auth-context";
import { authenticateUser } from "@/lib/userService";
import LoginRoleSelector from "@/components/LoginRoleSelector";
import LoadingSpinner from "@/components/LoadingSpinner";
import LoginLogoHeader from "@/components/LoginLogoHeader";
import LoginForm from "@/components/LoginForm";
import SecurityBadge from "@/components/SecurityBadge";
import ForgotPasswordLink from "@/components/ForgotPasswordLink";

const Login = () => {
  const [showForgotPassword, setShowForgotPassword] = useState(false);

  const navigate = useNavigate();
  const { currentUser } = useAuth();

  useEffect(() => {
    if (currentUser) {
      if (currentUser.role === "teacher") {
        navigate("/teacher-dashboard");
      } else if (currentUser.role === "student") {
        navigate("/student-attendance");
      } else if (currentUser.role === "admin") {
        navigate("/register");
      }
    }
  }, [currentUser, navigate]);

  // Handler used for resetting error state & dialog after login
  const handleSuccess = () => {};

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
      <div className="w-full max-w-md">
        {/* Logo */}
        <LoginLogoHeader />

        <Card className="shadow-2xl border-0 bg-white/80 backdrop-blur-sm">
          <CardHeader className="text-center pb-4">
            <CardTitle className="text-2xl font-bold text-gray-900">
              Welcome Back
            </CardTitle>
            <p className="text-gray-600 text-sm mt-2">
              Please sign in to your account
            </p>
          </CardHeader>

          <CardContent className="space-y-6">
            <LoginForm
              onSuccess={handleSuccess}
              setShowForgotPassword={setShowForgotPassword}
            />
            <ForgotPasswordLink onClick={() => setShowForgotPassword(true)} />
          </CardContent>
          <CardFooter className="flex flex-col space-y-4 pt-4">
            <SecurityBadge />
          </CardFooter>
        </Card>
      </div>

      <ForgotPasswordDialog
        open={showForgotPassword}
        onOpenChange={setShowForgotPassword}
      />
    </div>
  );
};

export default Login;
