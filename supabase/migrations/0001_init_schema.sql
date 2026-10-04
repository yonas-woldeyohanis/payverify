-- ============================================================================
-- 0001_init_schema.sql
-- Auto-Auditing Mobile Payment Verification & Shift Management System
-- Core schema: organizations, users, transactions, shifts
-- ============================================================================

create extension if not exists "pgcrypto";

-- ---------------------------------------------------------------------------
-- Organizations (a restaurant / hotel / shop tenant)
-- ---------------------------------------------------------------------------
create table if not exists organizations (
  id           uuid primary key default gen_random_uuid(),
  name         varchar(255) not null,
  slug         varchar(100) not null unique,
  timezone     varchar(60) not null default 'Africa/Addis_Ababa',
  is_active    boolean not null default true,
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now()
);

-- ---------------------------------------------------------------------------
-- Users (waiters, managers, owners). Auth identity lives in Supabase Auth
-- (auth.users); this table stores app-level profile + role + org membership.
-- id == auth.users.id so RLS can key off auth.uid() directly.
-- ---------------------------------------------------------------------------
create table if not exists users (
  id             uuid primary key references auth.users(id) on delete cascade,
  org_id         uuid not null references organizations(id) on delete cascade,
  full_name      varchar(100) not null,
  pin_code_hash  varchar(255) not null,        -- bcrypt hash, used for fast in-app PIN re-auth on shared devices
  role           varchar(20) not null default 'waiter'
                   check (role in ('waiter', 'manager', 'owner')),
  is_active      boolean not null default true,
  created_at     timestamptz not null default now(),
  updated_at     timestamptz not null default now()
);

create index if not exists idx_users_org on users (org_id);

-- ---------------------------------------------------------------------------
-- Shifts. A shift groups a waiter's transactions for EOD reconciliation.
-- ---------------------------------------------------------------------------
create table if not exists shifts (
  id            uuid primary key default gen_random_uuid(),
  org_id        uuid not null references organizations(id) on delete cascade,
  waiter_id     uuid not null references users(id) on delete cascade,
  opened_at     timestamptz not null default now(),
  closed_at     timestamptz,
  status        varchar(20) not null default 'open'
                  check (status in ('open', 'closed', 'reconciled')),
  cash_total    numeric(12,2) not null default 0,
  mobile_total  numeric(12,2) not null default 0,
  closed_by     uuid references users(id),
  notes         text,
  created_at    timestamptz not null default now()
);

create index if not exists idx_shifts_org_status on shifts (org_id, status);
create index if not exists idx_shifts_waiter on shifts (waiter_id, opened_at desc);

-- ---------------------------------------------------------------------------
-- Payment Transactions
-- local_id: client-generated UUID, used to reconcile offline inserts and
-- prevent duplicate uploads if a sync retries after a partial failure.
-- ---------------------------------------------------------------------------
create table if not exists transactions (
  id                uuid primary key default gen_random_uuid(),
  local_id          uuid,
  org_id            uuid not null references organizations(id) on delete cascade,
  waiter_id         uuid not null references users(id),
  shift_id          uuid references shifts(id),
  table_number      varchar(20),
  amount            numeric(10,2) not null check (amount > 0),
  currency          varchar(8) not null default 'ETB',
  reference_number  varchar(100) not null,
  payment_provider  varchar(50) not null default 'unknown',
  sender_name       varchar(150),
  ocr_raw_text      text,
  ocr_confidence    numeric(4,3),
  image_path        text,             -- Supabase Storage object path, or NULL once purged
  image_purged_at   timestamptz,
  sync_status       varchar(20) not null default 'synced'
                       check (sync_status in ('pending', 'synced', 'error')),
  is_flagged        boolean not null default false,
  flag_reason       varchar(120),
  captured_at       timestamptz not null default now(),  -- device capture time (may predate sync)
  created_at        timestamptz not null default now()
);

-- One reference number can only be booked once per organization. This is the
-- primary anti-fraud / duplicate-receipt control described in the spec.
create unique index if not exists idx_unique_ref_per_org
  on transactions (org_id, reference_number);

-- A client that goes offline and retries a sync must not double-insert.
create unique index if not exists idx_unique_local_id
  on transactions (org_id, local_id) where local_id is not null;

create index if not exists idx_transactions_waiter_daily
  on transactions (waiter_id, created_at desc);

create index if not exists idx_transactions_org_created
  on transactions (org_id, created_at desc);

create index if not exists idx_transactions_flagged
  on transactions (org_id) where is_flagged = true;

create index if not exists idx_transactions_purge_window
  on transactions (created_at) where image_path is not null;

-- ---------------------------------------------------------------------------
-- updated_at helper trigger
-- ---------------------------------------------------------------------------
create or replace function set_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

drop trigger if exists trg_organizations_updated_at on organizations;
create trigger trg_organizations_updated_at
  before update on organizations
  for each row execute function set_updated_at();

drop trigger if exists trg_users_updated_at on users;
create trigger trg_users_updated_at
  before update on users
  for each row execute function set_updated_at();
