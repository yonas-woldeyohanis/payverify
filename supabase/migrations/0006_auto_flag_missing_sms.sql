-- ============================================================================
-- 0006_auto_flag_missing_sms.sql
-- Flags transactions that have been pending for > 30 minutes without an SMS.
-- ============================================================================

create or replace function flag_missing_sms_transactions()
returns void as $$
begin
  update transactions
  set is_flagged = true,
      flag_reason = 'No SMS confirmation received'
  where verification_status = 'pending'
    and created_at < now() - interval '30 minutes'
    and is_flagged = false;
end;
$$ language plpgsql security definer;

-- Schedule it to run every 5 minutes
select cron.schedule(
  'flag-missing-sms',
  '*/5 * * * *',
  $$select flag_missing_sms_transactions();$$
);
