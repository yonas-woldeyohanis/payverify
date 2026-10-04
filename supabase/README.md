# Supabase Backend Setup

## 1. Create the project
1. Go to https://supabase.com/dashboard → New Project.
2. Note the **Project URL** and **anon public key** (Settings → API) — you'll
   need these for both `mobile-app/.env` and `web-dashboard/.env`.

## 2. Run the migrations
In the Supabase Dashboard → SQL Editor, run the three files in
`supabase/migrations/` **in order**:

```
0001_init_schema.sql
0002_functions_cron.sql
0003_rls_policies.sql
```

Or via the Supabase CLI:

```bash
supabase link --project-ref <your-project-ref>
supabase db push
```

`0002_functions_cron.sql` enables `pg_cron`. If your project is on the free
tier and `pg_cron` isn't available, comment out the `select cron.schedule(...)`
call at the bottom and instead call `purge_old_receipt_images()` from an
Edge Function on a schedule (see step 4).

## 3. Create the Storage bucket
Dashboard → Storage → New bucket → name it exactly `receipts`, **private**
(not public). The RLS policies in `0003_rls_policies.sql` assume objects are
stored as `{org_id}/{waiter_id}/{filename}.jpg`.

## 4. Purge the actual image binaries (Storage cleanup)
`purge_old_receipt_images()` only nulls out the `image_path` column — it
can't delete Storage objects directly from SQL. Deploy a small Edge Function
that runs daily, lists objects older than 7 days, and deletes them:

```ts
// supabase/functions/purge-receipt-storage/index.ts (scaffold — flesh out
// the listing/filtering logic for your bucket size before relying on it)
import { createClient } from "npm:@supabase/supabase-js@2";

Deno.serve(async () => {
  const supabase = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
  );
  const cutoff = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
  const { data: rows } = await supabase
    .from("transactions")
    .select("id, image_path")
    .lt("created_at", cutoff.toISOString())
    .not("image_path", "is", null);

  for (const row of rows ?? []) {
    await supabase.storage.from("receipts").remove([row.image_path]);
    await supabase.from("transactions")
      .update({ image_path: null, image_purged_at: new Date().toISOString() })
      .eq("id", row.id);
  }
  return new Response("ok");
});
```

Deploy with `supabase functions deploy purge-receipt-storage`, then schedule
it with `pg_cron` + `pg_net`, or an external scheduler (GitHub Actions cron,
Supabase's own Scheduled Triggers UI).

## 5. Create your first organization + manager
```sql
insert into organizations (name, slug) values ('My Restaurant', 'my-restaurant')
returning id;

-- Create the manager in Authentication → Users (email/password or magic link),
-- then link the profile:
insert into users (id, org_id, full_name, pin_code_hash, role)
values ('<auth-user-uuid>', '<org-id-from-above>', 'Jane Manager', '<bcrypt-hash-of-pin>', 'owner');
```

## 6. Enable Realtime
Dashboard → Database → Replication → turn on Realtime for the `transactions`
table. This powers the manager dashboard's live feed.
