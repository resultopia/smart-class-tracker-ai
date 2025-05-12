
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/components/ui/use-toast";
import { authenticateUser } from "@/lib/data";

const AdminLogin = () => {
  const [userId, setUserId] = useState("");
  const [password, setPassword] = useState("");
  const navigate = useNavigate();
  const { toast } = useToast();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    const user = authenticateUser(userId, password);
    
    if (!user) {
      toast({
        title: "Authentication Failed",
        description: "Invalid user ID or password.",
        variant: "destructive",
      });
      return;
    }
    
    if (user.role !== "admin") {
      toast({
        title: "Access Denied",
        description: "Only administrators can access user registration.",
        variant: "destructive",
      });
      return;
    }
    
    // If authenticated as admin, proceed to register page
    navigate("/register");
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50">
      <Card className="w-[350px] shadow-lg">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl">Admin Access Required</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="userId">Admin ID</Label>
              <Input 
                id="userId" 
                value={userId} 
                onChange={(e) => setUserId(e.target.value)} 
                placeholder="Enter admin ID" 
                required 
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <Input 
                id="password" 
                type="password" 
                value={password} 
                onChange={(e) => setPassword(e.target.value)} 
                placeholder="Enter password" 
                required 
              />
            </div>
            
            <Button type="submit" className="w-full">Login</Button>
          </form>
        </CardContent>
        <CardFooter className="flex justify-center">
          <Button variant="link" onClick={() => navigate("/")}>
            Back to Login
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
};

export default AdminLogin;
