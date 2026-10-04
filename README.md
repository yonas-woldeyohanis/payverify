# PayVerify — Mobile Payment Verification & Shift Management System

Offline-first waiter app + real-time manager console for auditing mobile
bank-transfer receipts (Telebirr, CBE Birr, etc.) in restaurants and shops.

## What's in this repo

```
supabase/          PostgreSQL schema, RLS policies, duplicate-detection
                    and reconciliation functions, 7-day image purge cron
mobile-app/         React Native (Expo) app for waiters: camera capture,
                    on-device OCR, offline SQLite ledger, background sync
web-dashboard/       React (Vite) console for managers: live feed,
                    flagged transactions, end-of-day reconciliation
```

## Order of setup

1. **`supabase/`** — create the project, run the 3 migrations, create the
   `receipts` storage bucket, enable Realtime. Full steps in
   `supabase/README.md`.
2. **`mobile-app/`** — `npm install`, add your `.env`, `npx expo start`.
   Full steps in `mobile-app/README.md`, including why the OCR module
   needs a dev build rather than plain Expo Go.
3. **`web-dashboard/`** — `npm install`, add your `.env`, `npm run dev`.
   Full steps in `web-dashboard/README.md`.

## Architecture, in one paragraph

A waiter scans a receipt; ML Kit reads the text entirely on-device and the
app parses out amount/reference/provider with no network call. The
transaction is written to a local SQLite ledger immediately (so the running
shift total is always correct even mid-blackout), tagged `pending`. A
background listener watches connectivity and, the moment the device is
online, uploads the compressed image + row to Supabase via an idempotent
RPC that can't create duplicates even if a sync retries. Supabase Realtime
pushes every new row to the manager console's live feed over WebSockets.
A nightly `pg_cron` job nulls out image references older than 7 days while
keeping the transaction's financial metadata forever, per the spec's
storage-cost policy.

## What's genuinely done vs. what needs your attention before go-live

**Solid and complete:** database schema + RLS, duplicate-reference
enforcement (both local instant-feedback and server-side hard constraint),
the full offline-write → background-sync pipeline, image compression to the
80-100KB target, the EOD reconciliation RPC, the live manager dashboard.

**Needs real-world tuning before a production rollout** (also called out in
each sub-README): the OCR regex patterns should be tuned against actual
receipt photos from your venue; `react-native-mlkit-text-recognition` needs
an EAS/dev-client build, not plain Expo Go; and the Storage Edge Function
for physically deleting purged images past 7 days is scaffolded but should
be fleshed out and load-tested before you're relying on it for cost control
at scale. None of this is hidden — it's flagged inline in the code and
READMEs so nothing bites you after deployment.
