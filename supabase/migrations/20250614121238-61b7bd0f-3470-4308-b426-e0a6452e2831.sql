
-- 1. Remove the foreign key constraint from profiles.id
ALTER TABLE profiles DROP CONSTRAINT IF EXISTS profiles_id_fkey;

-- 2. Set a default value for id to be generated automatically if not provided
ALTER TABLE profiles ALTER COLUMN id SET DEFAULT gen_random_uuid();

-- 3. Insert default users only if they do not already exist in profiles
insert into profiles (id, user_id, name, role, phone_number)
select
  gen_random_uuid(),
  'admin',
  'Administrator',
  'admin',
  null
where not exists (select 1 from profiles where user_id = 'admin');

insert into profiles (id, user_id, name, role, phone_number)
select
  gen_random_uuid(),
  'teacher1',
  'John Doe',
  'teacher',
  null
where not exists (select 1 from profiles where user_id = 'teacher1');

insert into profiles (id, user_id, name, role, phone_number)
select
  gen_random_uuid(),
  'student1',
  'Alice Smith',
  'student',
  null
where not exists (select 1 from profiles where user_id = 'student1');

insert into profiles (id, user_id, name, role, phone_number)
select
  gen_random_uuid(),
  'student2',
  'Bob Johnson',
  'student',
  null
where not exists (select 1 from profiles where user_id = 'student2');
