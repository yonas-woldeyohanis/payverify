# PayVerify — Manager Console (React + Vite)

Live revenue feed, fraud-flag review, and end-of-day reconciliation for
managers and owners.

## Setup

```bash
npm install
cp .env.example .env     # fill in your Supabase URL + anon key
npm run dev
```

## Creating a manager login

Managers sign in with normal email + password (unlike the waiter app's PIN
flow — this console is used on a personal device/browser, not a shared
till).

1. Supabase Dashboard → Authentication → Users → Add user.
2. Link the profile:
   ```sql
   insert into users (id, org_id, full_name, pin_code_hash, role)
   values ('<auth-user-uuid>', '<org-id>', 'Jane Manager', '-', 'owner');
   ```
   (`pin_code_hash` is required by the schema but unused for manager
   logins — any placeholder value is fine, or migrate it to a nullable
   column if you'd rather.)

## Notes

- The live feed relies on Supabase Realtime being enabled on the
  `transactions` table (see `supabase/README.md`, step 6).
- `is_flagged` is currently set manually / by future fraud-detection logic
  you add server-side — the schema and dashboard both support it, but no
  automatic flagging rule ships yet beyond the duplicate-reference unique
  constraint (which rejects duplicates outright rather than flagging them
  for review). If you want "allow but flag" behavior instead of "hard
  reject" for duplicates, that's a small change to `upsert_transaction` in
  `supabase/migrations/0002_functions_cron.sql`.
