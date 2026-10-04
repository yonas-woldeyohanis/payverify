#!/bin/bash
cat << 'SQL' >> supabase/seed.sql

-- ---------------------------------------------------------------------------
-- Fix permissions and RLS issues
-- ---------------------------------------------------------------------------
grant usage on schema public to postgres, anon, authenticated, service_role;
grant all privileges on all tables in schema public to postgres, anon, authenticated, service_role;
grant all privileges on all sequences in schema public to postgres, anon, authenticated, service_role;

-- Ensure users can always read their own profile without relying on org_id
create policy users_select_self on users
  for select using (id = auth.uid());
SQL
