import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import type { Transaction } from "@/types";
import toast from "react-hot-toast";

function playNotificationSound() {
  try {
    const audio = new Audio("/sounds/notification1.mp3");
    audio.play().catch(e => console.log("Audio play blocked by browser:", e));
  } catch (err) {}
}

export function useLiveTransactions() {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;

    async function loadInitial() {
      setLoading(true);
      try {
        const startOfDay = new Date();
        startOfDay.setHours(0, 0, 0, 0);

        const { data, error } = await supabase
          .from("transactions")
          .select("*, users(full_name)")
          .gte("created_at", startOfDay.toISOString())
          .order("created_at", { ascending: false });

        if (!error && data && active) {
          const mapped: Transaction[] = data.map((t: any) => ({
            ...t,
            waiter_name: t.users?.full_name ?? "Waiter",
          }));
          setTransactions(mapped);
        }
      } catch (e) {
        console.warn("[useLiveTransactions] Failed to load from Supabase:", e);
      } finally {
        if (active) setLoading(false);
      }
    }

    loadInitial();

    // Real-time subscription: new inserts and flag updates stream in instantly
    const channel = supabase
      .channel(`transactions-live-${Math.random().toString(36).slice(2)}`)
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "transactions" },
        async (payload) => {
          // Fetch the waiter name for the new row
          const { data: userRow } = await supabase
            .from("users")
            .select("full_name")
            .eq("id", (payload.new as any).waiter_id)
            .single();

          const newTx: Transaction = {
            ...(payload.new as any),
            waiter_name: userRow?.full_name ?? "Waiter",
          };
          setTransactions((prev) => [newTx, ...prev]);
          
          playNotificationSound();
          toast(`New payment received: ${newTx.amount} ETB`, { icon: "🔔" });
        }
      )
      .on(
        "postgres_changes",
        { event: "UPDATE", schema: "public", table: "transactions" },
        (payload) => {
          const newTx = payload.new as Transaction;
          setTransactions((prev) =>
            prev.map((t) =>
              t.id === newTx.id ? { ...t, ...newTx } : t
            )
          );
          
          if (newTx.sync_status === "synced" && newTx.verification_status === "verified") {
            playNotificationSound();
            toast.success(`Payment verified: ${newTx.amount} ETB`);
          } else if (newTx.is_flagged) {
            playNotificationSound();
            toast.error(`Transaction flagged for review!`);
          }
        }
      )
      .subscribe();

    return () => {
      active = false;
      supabase.removeChannel(channel).catch(() => {});
    };
  }, []);

  const resolveFlag = async (id: string) => {
    const { error } = await supabase
      .from("transactions")
      .update({ is_flagged: false, flag_reason: null })
      .eq("id", id);

    if (!error) {
      setTransactions((prev) =>
        prev.map((t) => (t.id === id ? { ...t, is_flagged: false, flag_reason: null } : t))
      );
      toast.success("Flag resolved");
    } else {
      toast.error("Failed to resolve flag");
    }
  };

  return { transactions, loading, resolveFlag };
}
