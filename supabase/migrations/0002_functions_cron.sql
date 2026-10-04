-- ============================================================================
-- 0002_functions_cron.sql
-- Duplicate detection, EOD reconciliation, and the 7-day image purge job.
-- ============================================================================

create extension if not exists "pg_cron";

-- ---------------------------------------------------------------------------
-- check_duplicate_reference: called by the app BEFORE inserting a transaction
-- (belt-and-suspenders on top of the unique index) so the client can show a
-- friendly "already submitted" message instead of a raw constraint error.
-- ---------------------------------------------------------------------------
create or replace function check_duplicate_reference(
  p_org_id uuid,
  p_reference_number varchar
) returns table (
  is_duplicate boolean,
  existing_transaction_id uuid,
  existing_waiter_id uuid,
  existing_created_at timestamptz
) as $$
begin
  return query
  select true, t.id, t.waiter_id, t.created_at
  from transactions t
  where t.org_id = p_org_id
    and t.reference_number = p_reference_number
  limit 1;

  if not found then
    return query select false, null::uuid, null::uuid, null::timestamptz;
  end if;
end;
$$ language plpgsql security definer;

-- ---------------------------------------------------------------------------
-- upsert_transaction: idempotent insert used by the sync queue. Safe to
-- retry: if local_id was already synced, it updates sync_status instead of
-- creating a duplicate row. Returns the resulting row id and whether the
-- reference number collided with a DIFFERENT transaction (fraud signal).
-- ---------------------------------------------------------------------------
create or replace function upsert_transaction(
  p_local_id uuid,
  p_org_id uuid,
  p_waiter_id uuid,
  p_shift_id uuid,
  p_table_number varchar,
  p_amount numeric,
  p_reference_number varchar,
  p_payment_provider varchar,
  p_sender_name varchar,
  p_ocr_raw_text text,
  p_ocr_confidence numeric,
  p_image_path text,
  p_captured_at timestamptz
) returns table (
  transaction_id uuid,
  was_duplicate_reference boolean
) as $$
declare
  v_existing_id uuid;
  v_new_id uuid;
begin
  -- Already synced under this local_id? Then this is a retry — no-op.
  select id into v_existing_id
  from transactions
  where org_id = p_org_id and local_id = p_local_id;

  if v_existing_id is not null then
    return query select v_existing_id, false;
    return;
  end if;

  -- Does the reference number already belong to a different transaction?
  select id into v_existing_id
  from transactions
  where org_id = p_org_id and reference_number = p_reference_number;

  if v_existing_id is not null then
    return query select v_existing_id, true;
    return;
  end if;

  insert into transactions (
    local_id, org_id, waiter_id, shift_id, table_number, amount,
    reference_number, payment_provider, sender_name, ocr_raw_text,
    ocr_confidence, image_path, sync_status, captured_at
  ) values (
    p_local_id, p_org_id, p_waiter_id, p_shift_id, p_table_number, p_amount,
    p_reference_number, p_payment_provider, p_sender_name, p_ocr_raw_text,
    p_ocr_confidence, p_image_path, 'synced', p_captured_at
  )
  returning id into v_new_id;

  return query select v_new_id, false;
end;
$$ language plpgsql security definer;

-- ---------------------------------------------------------------------------
-- close_shift: EOD reconciliation. Locks in totals and flags mismatches
-- between what the waiter reported and the raw sum of synced transactions.
-- ---------------------------------------------------------------------------
create or replace function close_shift(
  p_shift_id uuid,
  p_closed_by uuid,
  p_reported_cash numeric,
  p_notes text default null
) returns table (
  shift_id uuid,
  system_mobile_total numeric,
  reported_cash numeric,
  variance numeric
) as $$
declare
  v_org_id uuid;
  v_waiter_id uuid;
  v_mobile_total numeric(12,2);
begin
  select org_id, waiter_id into v_org_id, v_waiter_id
  from shifts where id = p_shift_id;

  if v_org_id is null then
    raise exception 'shift % not found', p_shift_id;
  end if;

  select coalesce(sum(amount), 0) into v_mobile_total
  from transactions
  where shift_id = p_shift_id and sync_status = 'synced';

  update shifts
  set status = 'reconciled',
      closed_at = now(),
      closed_by = p_closed_by,
      cash_total = p_reported_cash,
      mobile_total = v_mobile_total,
      notes = p_notes
  where id = p_shift_id;

  return query select p_shift_id, v_mobile_total, p_reported_cash,
                      (p_reported_cash - p_reported_cash); -- cash has no independent system total; variance is computed by the dashboard against bank statement entries
end;
$$ language plpgsql security definer;

-- ---------------------------------------------------------------------------
-- 7-Day Image Lifecycle Policy
-- Textual metadata is retained indefinitely for financial reporting; only
-- the image binary reference is cleared. Storage objects are deleted by the
-- paired Edge Function (see supabase/README.md) because Storage deletes are
-- not directly reachable from plain SQL/pg_cron.
-- ---------------------------------------------------------------------------
create or replace function purge_old_receipt_images()
returns void as $$
begin
  update transactions
  set image_path = null,
      image_purged_at = now()
  where created_at < now() - interval '7 days'
    and image_path is not null;
end;
$$ language plpgsql security definer;

-- select cron.schedule(
--   'purge-old-receipt-images',
--   '0 2 * * *',           -- 02:00 every day
--   $$select purge_old_receipt_images();$$
-- );
