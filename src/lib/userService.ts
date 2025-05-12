
import { toast } from "@/components/ui/use-toast";
import { User, UserRole } from './types';
import { initializeData, saveUsers } from './storage';

// Initialize state
let { users, classes } = initializeData();

// Get all users
export const getAllUsers = () => {
  // Refresh data from localStorage
  const refreshedData = initializeData();
  users = refreshedData.users;
  return [...users];
};

// Get users by role
export const getUsersByRole = (role: UserRole) => {
  // Refresh data from localStorage
  const refreshedData = initializeData();
  users = refreshedData.users;
  return users.filter((user) => user.role === role);
};

// Get user by ID
export const getUserById = (userId: string) => {
  // Refresh data from localStorage
  const refreshedData = initializeData();
  users = refreshedData.users;
  return users.find((user) => user.userId === userId);
};

// Authenticate user
export const authenticateUser = (userId: string, password: string) => {
  // Refresh data from localStorage before authentication
  const refreshedData = initializeData();
  users = refreshedData.users;
  
  const user = users.find((user) => user.userId === userId);
  
  if (!user) {
    return null;
  }
  
  if (user.password === password) {
    return user;
  }
  
  return null;
};

// Add new user
export const addUser = (newUser: Omit<User, "password"> & { password: string }) => {
  // Refresh data from localStorage before modification
  const refreshedData = initializeData();
  users = refreshedData.users;
  
  if (users.some((user) => user.userId === newUser.userId)) {
    toast({
      title: "Error",
      description: `User ID '${newUser.userId}' already exists.`,
      variant: "destructive",
    });
    return false;
  }
  
  users.push({
    userId: newUser.userId,
    name: newUser.name,
    password: newUser.password,
    role: newUser.role,
  });
  
  // Save to localStorage
  saveUsers(users);
  
  return true;
};

// Delete user
export const deleteUser = (userId: string) => {
  // Refresh data from localStorage before modification
  const refreshedData = initializeData();
  users = refreshedData.users;
  classes = refreshedData.classes;
  
  // First check if user exists
  const user = users.find((user) => user.userId === userId);
  if (!user) {
    toast({
      title: "Error",
      description: `User ID '${userId}' does not exist.`,
      variant: "destructive",
    });
    return false;
  }
  
  // If user is a teacher, check if they're associated with any classes
  if (user.role === "teacher" && classes.some((c) => c.teacherId === userId)) {
    toast({
      title: "Error",
      description: `Cannot delete teacher '${userId}' as they are associated with classes.`,
      variant: "destructive",
    });
    return false;
  }
  
  // If user is a student, remove them from any classes
  if (user.role === "student") {
    classes = classes.map((c) => ({
      ...c,
      studentIds: c.studentIds.filter((id) => id !== userId),
    }));
    // Save updated classes
    saveClasses(classes);
  }
  
  // Remove the user
  users = users.filter((user) => user.userId !== userId);
  
  // Save to localStorage
  saveUsers(users);
  
  return true;
};

// Update users reference for storage event listener
export const updateUsersReference = (newUsers: User[]) => {
  users = newUsers;
};
