-- ============================================================================
-- 0003_rls_policies.sql
-- Row Level Security: every table is scoped to the caller's organization.
-- Waiters see/write only their own transactions; managers/owners see the
-- whole org and can update flags, close shifts, etc.
-- ============================================================================

alter table organizations enable row level security;
alter table users          enable row level security;
alter table shifts         enable row level security;
alter table transactions   enable row level security;

-- Helper: org_id of the calling user
create or replace function current_org_id()
returns uuid as $$
  select org_id from users where id = auth.uid();
$$ language sql stable security definer;

create or replace function current_role_is_manager()
returns boolean as $$
  select role in ('manager', 'owner') from users where id = auth.uid();
$$ language sql stable security definer;

-- ---------------------------------------------------------------------------
-- organizations: members can read their own org; nobody writes via the API.
-- ---------------------------------------------------------------------------
create policy org_select_own on organizations
  for select using (id = current_org_id());

-- ---------------------------------------------------------------------------
-- users: members can see co-workers in the same org; managers can manage
-- profiles; a user can update their own row (e.g. PIN change).
-- ---------------------------------------------------------------------------
create policy users_select_same_org on users
  for select using (org_id = current_org_id());

create policy users_update_self on users
  for update using (id = auth.uid());

create policy users_manager_write on users
  for all using (org_id = current_org_id() and current_role_is_manager());

-- ---------------------------------------------------------------------------
-- shifts: waiters manage their own shifts; managers see/manage every shift
-- in the org (needed for EOD reconciliation).
-- ---------------------------------------------------------------------------
create policy shifts_select_own_org on shifts
  for select using (org_id = current_org_id());

create policy shifts_waiter_insert_own on shifts
  for insert with check (org_id = current_org_id() and waiter_id = auth.uid());

create policy shifts_waiter_update_own on shifts
  for update using (org_id = current_org_id() and waiter_id = auth.uid());

create policy shifts_manager_update_any on shifts
  for update using (org_id = current_org_id() and current_role_is_manager());

-- ---------------------------------------------------------------------------
-- transactions: waiters insert/select their own; managers read/update all
-- (needed to flag fraud and to view the live org-wide feed).
-- ---------------------------------------------------------------------------
create policy tx_select_own on transactions
  for select using (org_id = current_org_id() and waiter_id = auth.uid());

create policy tx_select_manager on transactions
  for select using (org_id = current_org_id() and current_role_is_manager());

create policy tx_insert_own on transactions
  for insert with check (org_id = current_org_id() and waiter_id = auth.uid());

create policy tx_update_manager on transactions
  for update using (org_id = current_org_id() and current_role_is_manager());

-- ---------------------------------------------------------------------------
-- Storage: receipt images live in a bucket named 'receipts', keyed as
-- '{org_id}/{waiter_id}/{transaction_local_id}.jpg'. Policies mirror the
-- table RLS: waiters can upload/read their own, managers read all.
-- Run once after creating the 'receipts' bucket in the dashboard.
-- ---------------------------------------------------------------------------
create policy receipts_insert_own on storage.objects
  for insert with check (
    bucket_id = 'receipts'
    and (storage.foldername(name))[1] = current_org_id()::text
    and (storage.foldername(name))[2] = auth.uid()::text
  );

create policy receipts_select_own_or_manager on storage.objects
  for select using (
    bucket_id = 'receipts'
    and (
      (storage.foldername(name))[2] = auth.uid()::text
      or current_role_is_manager()
    )
    and (storage.foldername(name))[1] = current_org_id()::text
  );
