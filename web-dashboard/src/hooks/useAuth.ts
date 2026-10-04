import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import type { WaiterProfile } from "@/types";

export function useAuth() {
  const [profile, setProfile] = useState<WaiterProfile | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;
    const fallbackTimer = setTimeout(() => {
      if (active) setLoading(false);
    }, 3000);

    async function load() {
      try {
        const { data } = await supabase.auth.getSession();
        if (!data.session) {
          if (active) setLoading(false);
          return;
        }
        const { data: profileRow } = await supabase
          .from("users")
          .select("id, full_name, role")
          .eq("id", data.session.user.id)
          .single();
        if (active) {
          setProfile(profileRow as WaiterProfile | null);
          setLoading(false);
        }
      } catch {
        if (active) setLoading(false);
      }
    }
    load();

    const { data: sub } = supabase.auth.onAuthStateChange(() => load());
    return () => {
      active = false;
      clearTimeout(fallbackTimer);
      sub.subscription.unsubscribe();
    };
  }, []);

  async function signIn(email: string, password: string) {
    // Real Supabase Auth
    const { error, data } = await supabase.auth.signInWithPassword({ email, password });
    if (error) throw error;
    
    // Attempt to load the profile so it's immediately available without waiting for the event
    if (data.session) {
        const { data: profileRow } = await supabase
          .from("users")
          .select("id, full_name, role")
          .eq("id", data.session.user.id)
          .single();
        setProfile(profileRow as WaiterProfile | null);
    }
  }

  async function signOut() {
    try {
      await supabase.auth.signOut().catch(() => {});
    } finally {
      setProfile(null);
    }
  }

  return { profile, loading, signIn, signOut, isManager: profile?.role === "manager" || profile?.role === "owner" };
}
