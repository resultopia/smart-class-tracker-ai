
-- Add teacher geolocation and allowed radius to class_sessions table
ALTER TABLE public.class_sessions
  ADD COLUMN teacher_latitude DECIMAL(10, 8),
  ADD COLUMN teacher_longitude DECIMAL(11, 8),
  ADD COLUMN location_radius INTEGER DEFAULT 100;

-- Optionally, update comments to describe the usage
COMMENT ON COLUMN public.class_sessions.teacher_latitude IS 'Latitude coordinate of teacher location when session starts.';
COMMENT ON COLUMN public.class_sessions.teacher_longitude IS 'Longitude coordinate of teacher location when session starts.';
COMMENT ON COLUMN public.class_sessions.location_radius IS 'Allowed distance (in meters) for student attendance marking. Default: 100.';

