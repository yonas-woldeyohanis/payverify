import React, { createContext, useContext, useMemo, useState, useCallback } from "react";
import uuid from "react-native-uuid";
import { supabase } from "@/config/supabase";
import { useAuth } from "./AuthContext";

interface ShiftContextValue {
  activeShiftId: string | null;
  startShift: () => Promise<string>;
  endShiftLocally: () => void;
}

const ShiftContext = createContext<ShiftContextValue | undefined>(undefined);

export function ShiftProvider({ children }: { children: React.ReactNode }) {
  const { user } = useAuth();
  const [activeShiftId, setActiveShiftId] = useState<string | null>(null);

  const startShift = useCallback(async (): Promise<string> => {
    if (!user) throw new Error("Must be signed in to start a shift");
    const shiftId = uuid.v4() as string;

    // Best-effort server insert now; if offline, the shift row is created
    // implicitly server-side the first time a transaction in it syncs
    // (shift_id is a plain nullable FK, so this never blocks scanning).
    await supabase
      .from("shifts")
      .insert({ id: shiftId, org_id: user.orgId, waiter_id: user.id })
      .then(
        () => undefined,
        () => undefined // swallow — offline start is fine
      );

    setActiveShiftId(shiftId);
    return shiftId;
  }, [user]);

  const endShiftLocally = useCallback(() => setActiveShiftId(null), []);

  const value = useMemo(
    () => ({ activeShiftId, startShift, endShiftLocally }),
    [activeShiftId, startShift, endShiftLocally]
  );

  return <ShiftContext.Provider value={value}>{children}</ShiftContext.Provider>;
}

export function useShift(): ShiftContextValue {
  const ctx = useContext(ShiftContext);
  if (!ctx) throw new Error("useShift must be used within a ShiftProvider");
  return ctx;
}
