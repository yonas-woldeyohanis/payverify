-- ============================================================================
-- 0004_waiter_profile_extras.sql
-- Adds waiter-specific UI fields to the users table:
--   login_alias  – short username used in the mobile app login screen
--   section      – floor area they're assigned to (e.g. "Main Dining")
--   phone        – optional contact number
--   on_duty      – live duty status toggled by manager from the dashboard
-- ============================================================================

alter table users
  add column if not exists login_alias varchar(50),
  add column if not exists section     varchar(100) not null default 'Main Dining',
  add column if not exists phone       varchar(30),
  add column if not exists on_duty     boolean not null default false;

-- login_alias must be unique per org (it forms the Supabase Auth email prefix)
create unique index if not exists idx_users_login_alias_org
  on users (org_id, login_alias)
  where login_alias is not null;
