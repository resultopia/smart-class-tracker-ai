
import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/components/ui/use-toast";
import { addUser, deleteUser, UserRole, getAllUsers, User } from "@/lib/data";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from "@/components/ui/table";
import { Trash2, Plus } from "lucide-react";
import { useAuth } from "@/lib/auth-context";
import UserInfo from "@/components/UserInfo";

const Register = () => {
  const [role, setRole] = useState<UserRole>("student");
  const [users, setUsers] = useState<User[]>([]);
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [newUserId, setNewUserId] = useState("");
  const [newName, setNewName] = useState("");
  const navigate = useNavigate();
  const { toast } = useToast();
  const { currentUser } = useAuth();

  useEffect(() => {
    // Check if user is logged in and is an admin
    if (!currentUser) {
      navigate("/admin-login");
      return;
    }
    
    if (currentUser.role !== "admin") {
      toast({
        title: "Access Denied",
        description: "Only administrators can access this page.",
        variant: "destructive",
      });
      navigate("/admin-login");
      return;
    }
    
    // Load users when component mounts and admin is verified
    setUsers(getAllUsers());
  }, [currentUser, navigate, toast]);

  // Filter users by selected role
  const filteredUsers = users.filter(user => user.role === role);

  const handleAddUser = () => {
    if (!newUserId.trim() || !newName.trim()) {
      toast({
        title: "Error",
        description: "User ID and Name are required",
        variant: "destructive",
      });
      return;
    }

    const success = addUser({
      userId: newUserId,
      name: newName,
      password: "lol", // Hardcoded password as specified
      role,
    });
    
    if (success) {
      toast({
        title: "Registration Successful",
        description: `New ${role} "${newName}" has been added.`,
      });
      
      // Refresh users list
      setUsers(getAllUsers());
      
      // Reset form and close dialog
      setNewUserId("");
      setNewName("");
      setIsAddDialogOpen(false);
    }
  };

  const handleDeleteUser = (userId: string, userName: string) => {
    const success = deleteUser(userId);
    
    if (success) {
      toast({
        title: "User Deleted",
        description: `${userName} (${userId}) has been removed.`,
      });
      
      // Refresh users list
      setUsers(getAllUsers());
    }
  };

  return (
    <div className="min-h-screen flex flex-col items-center bg-slate-50 p-4">
      <div className="absolute top-4 right-4">
        <UserInfo />
      </div>
      <Card className="w-full max-w-4xl shadow-lg">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl">User Management</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Role Toggle */}
          <div className="flex justify-center mb-6">
            <ToggleGroup type="single" value={role} onValueChange={(value) => value && setRole(value as UserRole)}>
              <ToggleGroupItem value="student" aria-label="Toggle students">
                Students
              </ToggleGroupItem>
              <ToggleGroupItem value="teacher" aria-label="Toggle teachers">
                Teachers
              </ToggleGroupItem>
            </ToggleGroup>
          </div>
          
          {/* User List */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between py-4">
              <CardTitle className="text-xl">{role === "student" ? "Students" : "Teachers"}</CardTitle>
              <Button onClick={() => setIsAddDialogOpen(true)} size="sm" className="ml-auto">
                <Plus className="mr-2" size={16} />
                Add {role === "student" ? "Student" : "Teacher"}
              </Button>
            </CardHeader>
            <CardContent>
              {filteredUsers.length > 0 ? (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>User ID</TableHead>
                      <TableHead>Name</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredUsers.map((user) => (
                      <TableRow key={user.userId}>
                        <TableCell>{user.userId}</TableCell>
                        <TableCell>{user.name}</TableCell>
                        <TableCell className="text-right">
                          <Button 
                            variant="destructive" 
                            size="sm"
                            onClick={() => handleDeleteUser(user.userId, user.name)}
                          >
                            <Trash2 size={16} />
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              ) : (
                <div className="text-center py-4 text-muted-foreground">
                  No {role}s found. Add some using the button above.
                </div>
              )}
            </CardContent>
          </Card>
        </CardContent>
        <CardFooter className="flex justify-center">
          <Button variant="link" onClick={() => navigate("/")}>
            Back to Login
          </Button>
        </CardFooter>
      </Card>
      
      {/* Add User Dialog */}
      <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add New {role === "student" ? "Student" : "Teacher"}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="userId">User ID</Label>
              <Input 
                id="userId" 
                value={newUserId} 
                onChange={(e) => setNewUserId(e.target.value)} 
                placeholder="Enter user ID" 
                required 
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="name">Full Name</Label>
              <Input 
                id="name" 
                value={newName} 
                onChange={(e) => setNewName(e.target.value)} 
                placeholder="Enter full name" 
                required 
              />
            </div>
            
            <div className="text-sm text-muted-foreground">
              Note: All passwords are set to "lol" by default.
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsAddDialogOpen(false)}>Cancel</Button>
            <Button onClick={handleAddUser}>Add {role === "student" ? "Student" : "Teacher"}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Register;
