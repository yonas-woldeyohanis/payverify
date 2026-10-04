import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/lib/supabase";
import type { WaiterEmployee } from "@/types";

// ORG_ID is embedded in the JWT via the `users` table —
// we read it once from the signed-in manager's profile.
let cachedOrgId: string | null = null;

async function getOrgId(): Promise<string | null> {
  if (cachedOrgId) return cachedOrgId;
  const { data: session } = await supabase.auth.getSession();
  if (!session.session) return null;

  const { data: profile } = await supabase
    .from("users")
    .select("org_id")
    .eq("id", session.session.user.id)
    .single();

  cachedOrgId = profile?.org_id ?? null;
  return cachedOrgId;
}

async function fetchStaffFromSupabase(): Promise<WaiterEmployee[]> {
  const orgId = await getOrgId();
  if (!orgId) return [];

  // Fetch today's transaction totals per waiter in parallel
  const todayStart = new Date();
  todayStart.setHours(0, 0, 0, 0);

  const [{ data: users }, { data: todayTxns }] = await Promise.all([
    supabase
      .from("users")
      .select("id, org_id, full_name, login_alias, role, section, phone, is_active, on_duty, created_at, pin_code_hash")
      .eq("org_id", orgId)
      .eq("is_active", true)
      .in("role", ["waiter", "manager", "owner"])
      .order("full_name"),
    supabase
      .from("transactions")
      .select("waiter_id, amount")
      .eq("org_id", orgId)
      .eq("sync_status", "synced")
      .gte("created_at", todayStart.toISOString()),
  ]);

  if (!users) return [];

  // Aggregate today's stats per waiter
  const statsMap: Record<string, { amount: number; count: number }> = {};
  for (const tx of todayTxns ?? []) {
    if (!statsMap[tx.waiter_id]) statsMap[tx.waiter_id] = { amount: 0, count: 0 };
    statsMap[tx.waiter_id].amount += Number(tx.amount);
    statsMap[tx.waiter_id].count += 1;
  }

  return users
    .filter((u) => u.role !== "manager" && u.role !== "owner") // dashboard manages waiters only
    .map((u) => ({
      id: u.id,
      org_id: u.org_id,
      full_name: u.full_name,
      login_alias: u.login_alias ?? "",
      pin: u.pin_code_hash || "••••", // Fetched from DB for manager viewing
      role: (u.role === "waiter" ? "waiter" : "waiter") as "waiter" | "lead_waiter" | "cashier",
      section: u.section ?? "Main Dining",
      phone: u.phone ?? undefined,
      is_active: u.is_active,
      on_duty: u.on_duty ?? false,
      created_at: u.created_at,
      total_sales_today: statsMap[u.id]?.amount ?? 0,
      transaction_count_today: statsMap[u.id]?.count ?? 0,
    }));
}

export function useStaff() {
  const [staff, setStaff] = useState<WaiterEmployee[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const reload = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const rows = await fetchStaffFromSupabase();
      setStaff(rows);
    } catch (e: any) {
      setError(e?.message ?? "Failed to load staff");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    reload();
  }, [reload]);

  // --------------------------------------------------------------------------
  // addWaiter: creates a Supabase Auth account for the waiter (email =
  // loginAlias@waiter.com, password = PIN) then inserts the profile row.
  // Uses the signUp flow — no service-role key needed on the client.
  // --------------------------------------------------------------------------
  const addWaiter = async (
    data: Omit<WaiterEmployee, "id" | "created_at" | "total_sales_today" | "transaction_count_today" | "role"> & { password?: string }
  ) => {
    const orgId = await getOrgId();
    if (!orgId) throw new Error("Not signed in — cannot add staff.");

    const email = `${data.login_alias}@waiter.com`;

    // 1. Create a separate Supabase client just for sign-up so it doesn't log the manager out!
    const tempClient = supabase.auth.admin ? supabase : null;
    let authUserId = "";
    
    // We use the regular supabase instance but we must avoid logging the manager out.
    // The safest way on the client without a service key is to use a secondary client.
    const url = import.meta.env.VITE_SUPABASE_URL;
    const anonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;
    const { createClient } = await import("@supabase/supabase-js");
    const signUpClient = createClient(url, anonKey, { auth: { persistSession: false } });

    const { data: authData, error: signUpErr } = await signUpClient.auth.signUp({
      email,
      password: data.password || data.pin + "00",
      options: { data: { full_name: data.full_name } },
    });

    if (signUpErr || !authData.user) {
      throw new Error(signUpErr?.message ?? "Could not create auth account.");
    }
    
    authUserId = authData.user.id;

    // 2. Insert profile row
    const { error: insertErr } = await supabase.from("users").insert({
      id: authUserId,
      org_id: orgId,
      full_name: data.full_name,
      pin_code_hash: data.password || data.pin, 
      role: "waiter",
      is_active: data.is_active,
      login_alias: data.login_alias,
      section: data.section,
      phone: data.phone ?? null,
      on_duty: data.on_duty,
    });

    if (insertErr) throw new Error(insertErr.message);

    // 3. Refresh staff list
    await reload();
  };

  const toggleDuty = async (id: string) => {
    const member = staff.find((w) => w.id === id);
    if (!member) return;
    const { error } = await supabase
      .from("users")
      .update({ on_duty: !member.on_duty })
      .eq("id", id);
    if (!error) setStaff((prev) => prev.map((w) => (w.id === id ? { ...w, on_duty: !w.on_duty } : w)));
  };

  const toggleActive = async (id: string) => {
    const member = staff.find((w) => w.id === id);
    if (!member) return;
    const { error } = await supabase
      .from("users")
      .update({ is_active: !member.is_active })
      .eq("id", id);
    if (!error) setStaff((prev) => prev.map((w) => (w.id === id ? { ...w, is_active: !w.is_active } : w)));
  };

  const updatePin = async (id: string, newPin: string) => {
    // Update Supabase Auth password for this user requires admin API.
    // For now we store the new pin in a local display-only field and show
    // the manager a reminder to reset from the Supabase dashboard.
    setStaff((prev) => prev.map((w) => (w.id === id ? { ...w, pin: newPin } : w)));
    console.warn("PIN update requires Supabase Auth admin API — update via Dashboard > Auth > Users for now.");
  };

  const deleteWaiter = async (id: string) => {
    const { error } = await supabase.from("users").update({ is_active: false }).eq("id", id);
    if (!error) setStaff((prev) => prev.filter((w) => w.id !== id));
  };

  return {
    staff,
    loading,
    error,
    reload,
    addWaiter,
    toggleDuty,
    toggleActive,
    updatePin,
    deleteWaiter,
  };
}
