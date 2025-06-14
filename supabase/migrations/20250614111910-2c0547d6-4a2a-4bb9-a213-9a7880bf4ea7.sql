
-- 1. User profiles table
create table public.profiles (
  id uuid primary key references auth.users on delete cascade,
  user_id text not null,
  name text not null,
  role text not null,
  phone_number text,
  constraint unique_user_id unique (user_id)
);

-- 2. Classes table
create table public.classes (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  teacher_id uuid references profiles(id) on delete set null,
  is_active boolean not null default false,
  is_online_mode boolean not null default false
);

-- 3. Class sessions (historical)
create table public.class_sessions (
  id uuid primary key default gen_random_uuid(),
  class_id uuid not null references classes(id) on delete cascade,
  start_time timestamptz not null,
  end_time timestamptz,
  created_at timestamptz not null default now()
);

-- 4. Attendance records
create table public.attendance_records (
  id uuid primary key default gen_random_uuid(),
  class_id uuid not null references classes(id) on delete cascade,
  student_id uuid not null references profiles(id) on delete cascade,
  timestamp timestamptz not null default now(),
  status text default 'present',
  session_id uuid references class_sessions(id) on delete set null
);

-- 5. Classes_students join table
create table public.classes_students (
  class_id uuid references classes(id) on delete cascade,
  student_id uuid references profiles(id) on delete cascade,
  unique (class_id, student_id)
);

-- Enable RLS
alter table public.profiles enable row level security;
alter table public.classes enable row level security;
alter table public.class_sessions enable row level security;
alter table public.attendance_records enable row level security;
alter table public.classes_students enable row level security;

-- RLS: Users can see and edit only their own profile
create policy "Users can read their profiles"
  on public.profiles for select
  using (auth.uid() = id);

create policy "Users can update their profiles"
  on public.profiles for update
  using (auth.uid() = id);

-- Teachers can access their classes, students can view their enrolled classes
create policy "Teachers and students can view their classes"
  on public.classes for select
  using (
    teacher_id = auth.uid() or
    exists (
      select 1 from public.classes_students cs
      where cs.class_id = id and cs.student_id = auth.uid()
    )
  );

-- Teachers can update their own classes
create policy "Teacher can update their classes"
  on public.classes for update
  using (teacher_id = auth.uid());

-- Students can view class sessions of their classes
create policy "Students can view their class sessions"
  on public.class_sessions for select
  using (
    exists (
      select 1 from public.classes_students cs
      where cs.class_id = class_id and cs.student_id = auth.uid()
    )
    or
    exists (
      select 1 from public.classes c
      where c.id = class_id and c.teacher_id = auth.uid()
    )
  );

-- Teachers and students can read attendance records of their class
create policy "Attendance records viewable by teachers/students"
  on public.attendance_records for select
  using (
    exists (
      select 1 from public.classes c
      where c.id = class_id and (c.teacher_id = auth.uid())
    )
    or
    student_id = auth.uid()
  );

-- Teachers can insert attendance records for their own class, students can insert their own attendance
create policy "Teachers and students can insert attendance"
  on public.attendance_records for insert
  with check (
    (
      exists (
        select 1 from public.classes c
        where c.id = class_id and c.teacher_id = auth.uid()
      )
    )
    or
    (student_id = auth.uid())
  );

-- Students can enroll in classes via join table
create policy "Students add themselves to classes"
  on public.classes_students for insert
  with check (student_id = auth.uid());

-- Allow reading join table where user is involved
create policy "Read classes_students for user"
  on public.classes_students for select
  using (student_id = auth.uid());

