import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { useToast } from "@/components/ui/use-toast";
import { addUser, deleteUser, UserRole, getAllUsers, User } from "@/lib/data";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from "@/components/ui/table";
import { Trash2, Plus, Camera, X } from "lucide-react";
import { useAuth } from "@/lib/auth-context";
import UserInfo from "@/components/UserInfo";

const Register = () => {
  const [role, setRole] = useState<UserRole>("student");
  const [users, setUsers] = useState<User[]>([]);
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [newUserId, setNewUserId] = useState("");
  const [newName, setNewName] = useState("");
  const [enablePhotoUpload, setEnablePhotoUpload] = useState(false);
  const [uploadedPhotos, setUploadedPhotos] = useState<string[]>([]);
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

  const handlePhotoUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (!files) return;

    if (uploadedPhotos.length + files.length > 10) {
      toast({
        title: "Too Many Photos",
        description: "Maximum 10 photos allowed per student.",
        variant: "destructive",
      });
      return;
    }

    Array.from(files).forEach(file => {
      if (file.type.startsWith('image/')) {
        const reader = new FileReader();
        reader.onload = (e) => {
          const base64 = e.target?.result as string;
          setUploadedPhotos(prev => [...prev, base64]);
        };
        reader.readAsDataURL(file);
      }
    });
  };

  const removePhoto = (index: number) => {
    setUploadedPhotos(prev => prev.filter((_, i) => i !== index));
  };

  const handleAddUser = () => {
    if (!newUserId.trim() || !newName.trim()) {
      toast({
        title: "Error",
        description: "User ID and Name are required",
        variant: "destructive",
      });
      return;
    }

    const userData: any = {
      userId: newUserId,
      name: newName,
      password: "lol", // Hardcoded password as specified
      role,
    };

    // Add photos only for students if photo upload is enabled
    if (role === "student" && enablePhotoUpload && uploadedPhotos.length > 0) {
      userData.photos = uploadedPhotos;
    }

    const success = addUser(userData);
    
    if (success) {
      toast({
        title: "Registration Successful",
        description: `New ${role} "${newName}" has been added${uploadedPhotos.length > 0 ? ` with ${uploadedPhotos.length} photos` : ''}.`,
      });
      
      // Refresh users list
      setUsers(getAllUsers());
      
      // Reset form and close dialog
      setNewUserId("");
      setNewName("");
      setEnablePhotoUpload(false);
      setUploadedPhotos([]);
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

  const resetForm = () => {
    setNewUserId("");
    setNewName("");
    setEnablePhotoUpload(false);
    setUploadedPhotos([]);
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
              <Button onClick={() => {resetForm(); setIsAddDialogOpen(true);}} size="sm" className="ml-auto">
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
                      {role === "student" && <TableHead>Photos</TableHead>}
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredUsers.map((user) => (
                      <TableRow key={user.userId}>
                        <TableCell>{user.userId}</TableCell>
                        <TableCell>{user.name}</TableCell>
                        {role === "student" && (
                          <TableCell>
                            {user.photos ? `${user.photos.length} photos` : "No photos"}
                          </TableCell>
                        )}
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
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Add New {role === "student" ? "Student" : "Teacher"}</DialogTitle>
          </DialogHeader>
          <div className="space-y-6 py-4">
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

            {/* Photo Upload Section (Students Only) */}
            {role === "student" && (
              <>
                <div className="flex items-center justify-between p-4 border rounded-lg">
                  <div className="space-y-1">
                    <Label htmlFor="enablePhotos" className="font-medium">Enable Photo Upload</Label>
                    <p className="text-sm text-muted-foreground">
                      Allow uploading 1-10 photos for this student (optional)
                    </p>
                  </div>
                  <Switch
                    id="enablePhotos"
                    checked={enablePhotoUpload}
                    onCheckedChange={setEnablePhotoUpload}
                  />
                </div>

                {enablePhotoUpload && (
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <Label>Upload Photos (Max 10)</Label>
                      <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center">
                        <Camera className="h-12 w-12 mx-auto text-gray-400 mb-4" />
                        <div className="space-y-2">
                          <p className="text-sm font-medium">Select photos for this student</p>
                          <p className="text-xs text-gray-500">
                            Supported formats: JPG, PNG, GIF (Max 10 photos)
                          </p>
                          <input
                            type="file"
                            accept="image/*"
                            multiple
                            onChange={handlePhotoUpload}
                            className="hidden"
                            id="photo-upload"
                          />
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => document.getElementById('photo-upload')?.click()}
                            disabled={uploadedPhotos.length >= 10}
                          >
                            <Camera className="h-4 w-4 mr-2" />
                            Choose Photos
                          </Button>
                        </div>
                      </div>
                    </div>

                    {uploadedPhotos.length > 0 && (
                      <div className="space-y-2">
                        <Label>Uploaded Photos ({uploadedPhotos.length}/10)</Label>
                        <div className="grid grid-cols-3 gap-2">
                          {uploadedPhotos.map((photo, index) => (
                            <div key={index} className="relative group">
                              <img
                                src={photo}
                                alt={`Upload ${index + 1}`}
                                className="w-full h-24 object-cover rounded-lg border"
                              />
                              <button
                                onClick={() => removePhoto(index)}
                                className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity"
                              >
                                <X className="h-3 w-3" />
                              </button>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </>
            )}
            
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
