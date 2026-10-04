# PayVerify — Waiter App (React Native / Expo)

Offline-first receipt scanner and personal shift ledger for floor staff.

## Setup

```bash
npm install
cp .env.example .env       # fill in your Supabase URL + anon key
npx expo start
```

Scan the QR code with Expo Go, or press `a` / `i` for an emulator. **The
camera and on-device OCR require a physical device or a real
emulator/simulator with camera passthrough — they will not work in Expo Go's
web preview.**

## Creating staff logins

`authService.signInWithPin` signs in using a Supabase Auth email/password
account per staff member, aliased as `{login}@waiter.local`. To onboard a
waiter:

1. In Supabase Dashboard → Authentication → Users → Add user, with email
   `abebe@waiter.local` and password = their PIN.
2. Insert their profile row:
   ```sql
   insert into users (id, org_id, full_name, pin_code_hash, role)
   values ('<the-auth-user-uuid>', '<org-id>', 'Abebe Bekele',
           '<bcrypt-hash-of-pin>', 'waiter');
   ```
   (A future version should move this into the manager dashboard's staff
   management screen instead of doing it by hand in SQL.)

## Known gaps to close before a real production rollout

This is a complete, working architecture, but a few things are stubbed or
need hardening for a live deployment rather than a pilot:

- **`react-native-mlkit-text-recognition`** needs a custom dev client or EAS
  build (it's a native module — it will not run inside plain Expo Go).
  Run `npx expo prebuild` and `eas build` once you're past Expo Go testing.
- **Regex-based receipt parsing** (`ocrService.ts`) covers the common
  Telebirr/CBE Birr slip layouts described in the spec. Collect a batch of
  real receipt photos from your restaurant and tune `AMOUNT_PATTERN` /
  `REFERENCE_PATTERN` against them — OCR text layout varies by provider and
  phone camera.
  Every scan's raw OCR text is stored in `ocr_raw_text`, so you can retune
  the regexes later without re-scanning old receipts.
- **PIN auth via aliased email accounts** is simple and secure enough for a
  pilot, but doesn't support PIN rotation from the app itself yet — that's a
  manager-dashboard feature to add next.
- No automated test suite yet — the sync queue and duplicate-check logic
  are the highest-value places to add unit tests before scaling to many
  devices.
