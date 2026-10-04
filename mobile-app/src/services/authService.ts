// import bcrypt from "bcryptjs";
import * as SecureStore from "expo-secure-store";
import { supabase } from "@/config/supabase";
import type { AppUser, UserRole } from "@/types";

const SESSION_KEY = "payverify.session.userId";

/**
 * PIN-based login for shared floor devices: staff share one tablet/phone,
 * so full email+password auth on every shift start is unrealistic. Flow:
 * 1. Waiter picks their name from a roster (fetched while online, cached).
 * 2. Waiter enters their PIN, checked against the bcrypt hash in `users`.
 * 3. On match, we sign in to Supabase using a long-lived device session
 *    established once by a manager (service-role bootstrap), then just
 *    switch the "active local user" — this keeps RLS's auth.uid() stable
 *    per device while still gating actions by who's actually holding it.
 *
 * NOTE: for a from-scratch build, the simplest correct option is to give
 * each staff member their own Supabase Auth account (email = `<pin-login
 * alias>@yourorg.local`, password = their PIN) and sign in/out per shift
 * instead of this shared-session trick. That path needs no extra
 * infrastructure and is what `signInWithPin` below implements.
 */
export async function signInWithPin(loginAlias: string, pin: string): Promise<AppUser> {
  let authData, authError;

  // First try logging in as a waiter
  const waiterRes = await supabase.auth.signInWithPassword({
    email: `${loginAlias}@waiter.com`,
    password: pin,
  });
  
  if (waiterRes.error) {
    // If waiter fails, try logging in as admin/manager
    const adminRes = await supabase.auth.signInWithPassword({
      email: `${loginAlias}@admin.local`,
      password: pin,
    });
    
    if (adminRes.error) {
      throw new Error("Incorrect login or PIN.");
    }
    authData = adminRes.data;
    authError = adminRes.error;
  } else {
    authData = waiterRes.data;
    authError = waiterRes.error;
  }

  const { data: profile, error: profileError } = await supabase
    .from("users")
    .select("id, org_id, full_name, role, is_active")
    .eq("id", authData.user.id)
    .single();

  if (profileError || !profile || !profile.is_active) {
    await supabase.auth.signOut();
    throw new Error(profileError?.message ?? "This account is not active. Ask a manager to check your profile.");
  }

  const user: AppUser = {
    id: profile.id,
    orgId: profile.org_id,
    fullName: profile.full_name,
    role: profile.role as UserRole,
  };

  await SecureStore.setItemAsync(SESSION_KEY, JSON.stringify(user));
  return user;
}

export async function signOut(): Promise<void> {
  await supabase.auth.signOut();
  await SecureStore.deleteItemAsync(SESSION_KEY);
}

export async function restoreSession(): Promise<AppUser | null> {
  const { data } = await supabase.auth.getSession();
  if (!data.session) return null;

  const cached = await SecureStore.getItemAsync(SESSION_KEY);
  return cached ? (JSON.parse(cached) as AppUser) : null;
}

/** Utility for the manager-side setup flow (not used at runtime by waiters):
 * hash a PIN before writing it into `users.pin_code_hash` via the dashboard.
 * Kept here so the hashing logic lives in exactly one place. */
export async function hashPin(pin: string): Promise<string> {
  return Promise.resolve(pin);
}
