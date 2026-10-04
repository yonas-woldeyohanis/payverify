-- ============================================================================
-- 0005_sms_verification.sql
-- Optimistic Offline Scanning + Background SMS Sync Engine
-- ============================================================================

-- 1. Create the bank SMS logs table to capture background SMS intercepts
create table if not exists bank_sms_logs (
  id                  uuid primary key default gen_random_uuid(),
  org_id              uuid not null references organizations(id) on delete cascade,
  provider            varchar(50) not null,
  reference_number    varchar(100) not null,
  amount              numeric(10,2) not null,
  sender_name         varchar(150),
  raw_sms             text,
  matched_txn_id      uuid references transactions(id) on delete set null,
  received_at         timestamptz not null default now(),
  created_at          timestamptz not null default now()
);

-- Index for fast matching
create index if not exists idx_bank_sms_logs_match
  on bank_sms_logs (org_id, reference_number, amount);

-- 2. Add verification_status to transactions
alter table transactions 
  add column if not exists verification_status varchar(20) not null default 'pending'
  check (verification_status in ('pending', 'verified', 'mismatched'));

create index if not exists idx_transactions_verification
  on transactions (org_id, verification_status);

-- 3. The Auto-Matcher: Trigger on NEW TRANSACTION
-- When a waiter scans a receipt, we check if the SMS already arrived.
create or replace function match_transaction_to_sms()
returns trigger as $$
declare
  v_sms_id uuid;
begin
  -- Try to find an un-matched SMS with the exact reference and amount
  select id into v_sms_id
  from bank_sms_logs
  where org_id = new.org_id
    and reference_number = new.reference_number
    and amount = new.amount
    and matched_txn_id is null
  order by received_at desc
  limit 1;

  if v_sms_id is not null then
    -- We found a match! Mark the transaction as verified
    new.verification_status := 'verified';
    new.is_flagged := false; -- unflag if it was flagged
    new.flag_reason := null;
    
    -- Update the SMS log to point to this transaction
    update bank_sms_logs
    set matched_txn_id = new.id
    where id = v_sms_id;
  end if;

  return new;
end;
$$ language plpgsql security definer;

drop trigger if exists trg_match_transaction_to_sms on transactions;
create trigger trg_match_transaction_to_sms
  before insert on transactions
  for each row execute function match_transaction_to_sms();

-- 4. The Auto-Matcher: Trigger on NEW SMS
-- When an SMS arrives late, check if a pending transaction is waiting for it.
create or replace function match_sms_to_transaction()
returns trigger as $$
declare
  v_txn_id uuid;
begin
  -- Try to find a pending transaction with the exact reference and amount
  select id into v_txn_id
  from transactions
  where org_id = new.org_id
    and reference_number = new.reference_number
    and amount = new.amount
    and verification_status = 'pending'
  order by created_at desc
  limit 1;

  if v_txn_id is not null then
    -- Found a pending transaction! Update it
    update transactions
    set verification_status = 'verified',
        is_flagged = false,
        flag_reason = null
    where id = v_txn_id;

    -- Link the SMS to the transaction
    new.matched_txn_id := v_txn_id;
  end if;

  return new;
end;
$$ language plpgsql security definer;

drop trigger if exists trg_match_sms_to_transaction on bank_sms_logs;
create trigger trg_match_sms_to_transaction
  before insert on bank_sms_logs
  for each row execute function match_sms_to_transaction();

-- 5. RLS for bank_sms_logs
alter table bank_sms_logs enable row level security;

create policy "Managers can view SMS logs"
  on bank_sms_logs for select
  using (
    org_id in (
      select org_id from users 
      where users.id = auth.uid() 
        and users.role in ('manager', 'owner')
    )
  );

create policy "Service roles / Edge functions can insert SMS"
  on bank_sms_logs for insert
  with check (true); -- Usually enforced by API key (service_role) or custom auth
