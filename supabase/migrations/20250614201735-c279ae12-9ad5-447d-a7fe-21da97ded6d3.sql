
-- 1. Remove the "is_active" column if it exists as boolean
ALTER TABLE public.classes DROP COLUMN IF EXISTS is_active;

-- 2. Add a new "is_active" column as a uuid, nullable (stores session_id)
ALTER TABLE public.classes ADD COLUMN is_active uuid NULL;

-- 3. (Optional but recommended) Add a foreign key constraint to ensure is_active points to a valid session_id
ALTER TABLE public.classes
  ADD CONSTRAINT classes_is_active_fkey
  FOREIGN KEY (is_active)
  REFERENCES public.class_sessions(id)
  ON DELETE SET NULL;
