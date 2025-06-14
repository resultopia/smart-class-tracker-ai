
import { toast } from "@/components/ui/use-toast";
import { supabase } from "@/integrations/supabase/client";

// Local types (exported)
export type UserRole = "student" | "teacher" | "admin";
export interface User {
  userId: string;
  name: string;
  password: string;
  role: UserRole;
  phoneNumber?: string;
  photos?: string[];
}

// Get all users from Supabase profiles table
export const getAllUsers = async (): Promise<User[]> => {
  const { data, error } = await supabase.from("profiles").select("*");
  if (error) {
    toast({
      title: "Error Loading Users",
      description: error.message,
      variant: "destructive",
    });
    return [];
  }
  return (data || []).map((row: any) => ({
    userId: row.user_id,
    name: row.name,
    password: "lol", // Default/fixed password
    role: row.role as UserRole,
    phoneNumber: row.phone_number,
  }));
};

// Get users by role
export const getUsersByRole = async (role: UserRole) => {
  const { data, error } = await supabase.from("profiles").select("*").eq("role", role);
  if (error) {
    toast({
      title: "Error Loading Users",
      description: error.message,
      variant: "destructive",
    });
    return [];
  }
  return (data || []).map((row: any) => ({
    userId: row.user_id,
    name: row.name,
    password: "lol",
    role: row.role as UserRole,
    phoneNumber: row.phone_number,
  }));
};

// Get user by ID
export const getUserById = async (userId: string) => {
  const { data, error } = await supabase.from("profiles").select("*").eq("user_id", userId).maybeSingle();
  if (error) {
    toast({
      title: "Error Finding User",
      description: error.message,
      variant: "destructive",
    });
    return null;
  }
  if (!data) return null;
  return {
    userId: data.user_id,
    name: data.name,
    password: "lol",
    role: data.role as UserRole,
    phoneNumber: data.phone_number,
  };
};

// Authenticate user against Supabase-profiles username and fixed password "lol"
export const authenticateUser = async (userId: string, password: string): Promise<User | null> => {
  if (password !== "lol") return null;
  const user = await getUserById(userId);
  return user;
};

// Add new user to Supabase
export const addUser = async (newUser: Omit<User, "password"> & { password: string }) => {
  // Check for duplicates
  const existing = await getUserById(newUser.userId);
  if (existing) {
    toast({
      title: "Error",
      description: `User ID '${newUser.userId}' already exists.`,
      variant: "destructive",
    });
    return false;
  }
  // Generate a random UUID for `id` field
  const id = crypto.randomUUID ? crypto.randomUUID() : Math.random().toString(36).substring(2, 15);
  const { error } = await supabase.from("profiles").insert({
    id,
    user_id: newUser.userId,
    name: newUser.name,
    role: newUser.role,
    phone_number: (newUser as any).phoneNumber || null,
  });
  if (error) {
    toast({
      title: "Error Adding User",
      description: error.message,
      variant: "destructive",
    });
    return false;
  }
  return true;
};

// Delete user
export const deleteUser = async (userId: string) => {
  const { error } = await supabase.from("profiles").delete().eq("user_id", userId);
  if (error) {
    toast({
      title: "Error Deleting User",
      description: error.message,
      variant: "destructive",
    });
    return false;
  }
  return true;
};

// Dummy update users reference
export const updateUsersReference = (_newUsers: User[]) => {};
