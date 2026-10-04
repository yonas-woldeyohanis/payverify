-- ============================================================================
-- seed.sql  —  Run this ONCE in the Supabase SQL Editor after all migrations.
-- Creates:
--   • Your organization row
--   • A manager account  (login: manager@admin.local / password: admin1234)
-- ============================================================================

-- ---------------------------------------------------------------------------
-- STEP 1 – Organization
-- Change the name / slug to match your venue.
-- ---------------------------------------------------------------------------
insert into organizations (id, name, slug, timezone)
values (
  'a1b2c3d4-0000-0000-0000-000000000001',
  'My Restaurant',
  'my-restaurant',
  'Africa/Addis_Ababa'
)
on conflict (id) do nothing;

-- ---------------------------------------------------------------------------
-- STEP 2 – Auth users  (inserted directly so no email confirmation is needed)
-- ---------------------------------------------------------------------------

-- Manager (email: manager@admin.local, password: admin1234)
insert into auth.users (
  id, instance_id, aud, role, email,
  encrypted_password, email_confirmed_at,
  created_at, updated_at,
  raw_app_meta_data, raw_user_meta_data,
  is_super_admin, confirmation_token, recovery_token,
  email_change_token_new, email_change
) values (
  'a1b2c3d4-0001-0000-0000-000000000001',
  '00000000-0000-0000-0000-000000000000',
  'authenticated', 'authenticated',
  'manager@admin.local',
  crypt('admin1234', gen_salt('bf')),
  now(), now(), now(),
  '{"provider":"email","providers":["email"]}', '{}',
  false, '', '', '', ''
) on conflict (id) do nothing;

-- ---------------------------------------------------------------------------
-- STEP 3 – Auth identities (required by Supabase for email logins)
-- ---------------------------------------------------------------------------

insert into auth.identities (
  id, user_id, provider_id, provider, identity_data,
  last_sign_in_at, created_at, updated_at
) values
  (
    'a1b2c3d4-0001-0000-0000-000000000001',
    'a1b2c3d4-0001-0000-0000-000000000001',
    'manager@admin.local', 'email',
    '{"sub":"a1b2c3d4-0001-0000-0000-000000000001","email":"manager@admin.local"}',
    now(), now(), now()
  )
on conflict (provider, provider_id) do nothing;

-- Ensure migration 0004 has run so columns exist:
alter table users
  add column if not exists login_alias varchar(50),
  add column if not exists section varchar(100) not null default 'Main Dining',
  add column if not exists phone varchar(30),
  add column if not exists on_duty boolean not null default false;

create unique index if not exists idx_users_login_alias_org
  on users (org_id, login_alias)
  where login_alias is not null;

-- ---------------------------------------------------------------------------
-- STEP 4 – App-level user profiles
-- ---------------------------------------------------------------------------

-- Manager profile
insert into users (id, org_id, full_name, pin_code_hash, role, is_active, login_alias, section, on_duty)
values (
  'a1b2c3d4-0001-0000-0000-000000000001',
  'a1b2c3d4-0000-0000-0000-000000000001',
  'Manager Admin',
  crypt('admin1234', gen_salt('bf')),
  'manager',
  true,
  'manager',
  'Management',
  true
) on conflict (id) do nothing;

-- ---------------------------------------------------------------------------
-- Verification: confirm everything looks correct
-- ---------------------------------------------------------------------------
select u.full_name, u.login_alias, u.role, u.section, u.on_duty,
       o.name as org_name
from users u
join organizations o on o.id = u.org_id
order by u.role desc, u.full_name;

-- ---------------------------------------------------------------------------
-- Fix permissions and RLS issues
-- ---------------------------------------------------------------------------
grant usage on schema public to postgres, anon, authenticated, service_role;
grant all privileges on all tables in schema public to postgres, anon, authenticated, service_role;
grant all privileges on all sequences in schema public to postgres, anon, authenticated, service_role;

-- Ensure users can always read their own profile without relying on org_id
create policy users_select_self on users
  for select using (id = auth.uid());
