
-- Remove RLS from profiles table to allow authentication queries to work
ALTER TABLE public.profiles DISABLE ROW LEVEL SECURITY;
