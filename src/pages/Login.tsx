import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Calendar, Lock, User } from "lucide-react";
import ForgotPasswordDialog from "@/components/ForgotPasswordDialog";
import { useAuth } from "@/lib/auth-context";
import { authenticateUser } from "@/lib/userService";

const Login = () => {
  const [userId, setUserId] = useState("");
  const [password, setPassword] = useState("");
  const [rememberMe, setRememberMe] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [showForgotPassword, setShowForgotPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const navigate = useNavigate();
  const { currentUser, login } = useAuth();

  // Authenticated users are redirected
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsLoading(true);

    const user = await authenticateUser(userId, password);

    if (user) {
      login(user);
      if (rememberMe) {
        localStorage.setItem("rememberedUserId", userId);
      } else {
        localStorage.removeItem("rememberedUserId");
      }
      setIsLoading(false);
      // Redirect handled by useEffect above
    } else {
      setError("Invalid username or password.");
      setIsLoading(false);
    }
  };

  useEffect(() => {
    const remembered = localStorage.getItem("rememberedUserId");
    if (remembered) setUserId(remembered);
  }, []);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
      <div className="w-full max-w-md">
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="flex items-center justify-center mb-4">
            <div className="p-3 bg-blue-600 rounded-full">
              <Calendar className="h-8 w-8 text-white" />
            </div>
          </div>
          <h1 className="text-2xl font-bold text-gray-900">Smart Attendance</h1>
        </div>

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
            <form onSubmit={handleSubmit} className="space-y-5">
              {/* Username Input */}
              <div className="space-y-2">
                <Label htmlFor="userId" className="text-sm font-semibold text-gray-700">Username</Label>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <Input
                    id="userId"
                    type="text"
                    value={userId}
                    onChange={(e) => setUserId(e.target.value)}
                    placeholder="Enter your username"
                    className="pl-10 h-12 border-gray-300 focus:border-blue-500 focus:ring-blue-500 transition-colors"
                    required
                  />
                </div>
              </div>

              {/* Password Input */}
              <div className="space-y-2">
                <Label htmlFor="password" className="text-sm font-semibold text-gray-700">Password</Label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <Input
                    id="password"
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Enter your password"
                    className="pl-10 h-12 border-gray-300 focus:border-blue-500 focus:ring-blue-500 transition-colors"
                    required
                  />
                </div>
              </div>

              {/* Remember Me */}
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="remember"
                  checked={rememberMe}
                  onCheckedChange={(checked) => setRememberMe(checked === true)}
                />
                <Label htmlFor="remember" className="text-sm text-gray-600 cursor-pointer">
                  Remember me
                </Label>
              </div>

              {/* Error Message */}
              {error && (
                <div className="text-red-600 text-sm">{error}</div>
              )}

              {/* Login Button */}
              <Button
                type="submit"
                className="w-full h-12 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white font-semibold rounded-lg transition-all duration-200 transform hover:scale-[1.02] active:scale-[0.98]"
                disabled={isLoading}
              >
                {isLoading ? (
                  <div className="flex items-center space-x-2">
                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                    <span>Signing in...</span>
                  </div>
                ) : (
                  "Sign In"
                )}
              </Button>
            </form>
            {/* Forgot Password Link */}
            <div className="text-center">
              <button
                onClick={() => setShowForgotPassword(true)}
                className="text-sm text-blue-600 hover:text-blue-700 transition-colors font-medium"
              >
                Forgot your password?
              </button>
            </div>
          </CardContent>
          <CardFooter className="flex flex-col space-y-4 pt-4">
            {/* Security Badge */}
            <div className="text-center text-xs text-gray-500">
              🔒 Your data is protected with enterprise-grade security
            </div>
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
