import React, { createContext, useContext, useEffect, useMemo, useState } from "react";
import { restoreSession, signInWithPin, signOut as doSignOut } from "@/services/authService";
import { startSyncQueueListener, stopSyncQueueListener } from "@/services/syncQueue";
import type { AppUser } from "@/types";

interface AuthContextValue {
  user: AppUser | null;
  isLoading: boolean;
  signIn: (loginAlias: string, pin: string) => Promise<void>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<AppUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    restoreSession()
      .then(setUser)
      .finally(() => setIsLoading(false));
  }, []);

  useEffect(() => {
    if (user) {
      startSyncQueueListener();
    } else {
      stopSyncQueueListener();
    }
  }, [user]);

  const value = useMemo<AuthContextValue>(
    () => ({
      user,
      isLoading,
      signIn: async (loginAlias, pin) => {
        const signedIn = await signInWithPin(loginAlias, pin);
        setUser(signedIn);
      },
      signOut: async () => {
        await doSignOut();
        setUser(null);
      },
    }),
    [user, isLoading]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within an AuthProvider");
  return ctx;
}
