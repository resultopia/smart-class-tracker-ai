
import React, { useState, useEffect } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Button } from "@/components/ui/button";
import { User, Lock } from "lucide-react";
import LoginRoleSelector from "./LoginRoleSelector";
import LoadingSpinner from "./LoadingSpinner";
import { useAuth } from "@/lib/auth-context";
import { authenticateUser } from "@/lib/userService";

interface LoginFormProps {
  onSuccess: () => void;
  setShowForgotPassword: (open: boolean) => void;
}

const LoginForm: React.FC<LoginFormProps> = ({ onSuccess, setShowForgotPassword }) => {
  const [userId, setUserId] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState("student");
  const [rememberMe, setRememberMe] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const { login } = useAuth();

  useEffect(() => {
    const remembered = localStorage.getItem("rememberedUserId");
    const rememberedRole = localStorage.getItem("rememberedRole");
    if (remembered) setUserId(remembered);
    if (rememberedRole) setRole(rememberedRole);
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsLoading(true);

    const user = await authenticateUser(userId, password);

    if (user) {
      if (user.role !== role) {
        setError(`That user is a ${user.role}, not a ${role}.`);
        setIsLoading(false);
        return;
      }
      login(user);
      if (rememberMe) {
        localStorage.setItem("rememberedUserId", userId);
        localStorage.setItem("rememberedRole", role);
      } else {
        localStorage.removeItem("rememberedUserId");
        localStorage.removeItem("rememberedRole");
      }
      setIsLoading(false);
      onSuccess();
    } else {
      setError("Invalid username or password.");
      setIsLoading(false);
    }
  };

  return (
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

      {/* Sign in as (Role Selector) */}
      <LoginRoleSelector value={role} onChange={setRole} />

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
        {isLoading ? <LoadingSpinner /> : "Sign In"}
      </Button>
    </form>
  );
};

export default LoginForm;
