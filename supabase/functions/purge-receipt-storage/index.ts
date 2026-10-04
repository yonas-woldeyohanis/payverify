import { createClient } from "npm:@supabase/supabase-js@2";

Deno.serve(async () => {
  const supabaseUrl = Deno.env.get("SUPABASE_URL");
  const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");

  if (!supabaseUrl || !supabaseKey) {
    return new Response("Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY", { status: 500 });
  }

  const supabase = createClient(supabaseUrl, supabaseKey);
  
  // 7 days ago
  const cutoff = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
  
  // We query items older than 7 days that STILL have an image_path
  const { data: rows, error: fetchError } = await supabase
    .from("transactions")
    .select("id, image_path")
    .lt("created_at", cutoff.toISOString())
    .not("image_path", "is", null);

  if (fetchError) {
    console.error("Error fetching transactions:", fetchError);
    return new Response(JSON.stringify({ error: fetchError.message }), { status: 500 });
  }

  let deletedCount = 0;

  for (const row of rows ?? []) {
    if (!row.image_path) continue;

    // 1. Delete from Storage
    const { error: storageError } = await supabase.storage
      .from("receipts")
      .remove([row.image_path]);

    if (storageError) {
      console.error(`Failed to delete storage for transaction ${row.id}:`, storageError);
      continue; // Skip DB update if storage deletion failed
    }

    // 2. Null out the reference in the DB
    const { error: dbError } = await supabase.from("transactions")
      .update({ 
        image_path: null, 
        image_purged_at: new Date().toISOString() 
      })
      .eq("id", row.id);
      
    if (dbError) {
      console.error(`Failed to update DB for transaction ${row.id}:`, dbError);
    } else {
      deletedCount++;
    }
  }

  return new Response(JSON.stringify({ 
    status: "ok", 
    processed: rows?.length || 0,
    deleted: deletedCount 
  }), { 
    headers: { "Content-Type": "application/json" }
  });
});
