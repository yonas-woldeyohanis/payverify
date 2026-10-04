console.log("Supabase URL:", import.meta.env.VITE_SUPABASE_URL);
import React from "react";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { Toaster } from "react-hot-toast";
import { useAuth } from "@/hooks/useAuth";
import { useLiveTransactions } from "@/hooks/useLiveTransactions";
import { Sidebar } from "@/components/Sidebar";
import { MobileHeader, MobileBottomNav } from "@/components/MobileNav";
import { Login } from "@/pages/Login";
import { Dashboard } from "@/pages/Dashboard";
import { Staff } from "@/pages/Staff";
import { Flagged } from "@/pages/Flagged";
import { Reconciliation } from "@/pages/Reconciliation";
import { Analytics } from "@/pages/Analytics";

export default function App() {
  const { profile, loading, signOut, isManager } = useAuth();
  const { transactions } = useLiveTransactions();

  const flaggedCount = transactions.filter((t) => t.is_flagged || t.sync_status === "error").length;

  if (loading) {
    return (
      <div
        style={{
          minHeight: "100vh",
          display: "grid",
          placeItems: "center",
          background: "var(--ink)",
          color: "var(--text-muted)",
        }}
      >
        <div style={{ textAlign: "center" }}>
          <div style={{ fontSize: 28, marginBottom: 8 }}>⚡</div>
          <div>Loading PayVerify Manager Console...</div>
        </div>
      </div>
    );
  }

  if (!profile) {
    return <Login />;
  }

  if (!isManager) {
    return (
      <div
        style={{
          minHeight: "100vh",
          display: "grid",
          placeItems: "center",
          background: "var(--ink)",
          color: "var(--text)",
          textAlign: "center",
          padding: 24,
        }}
      >
        <div style={{ maxWidth: 360, background: "var(--panel)", padding: 32, borderRadius: 14, border: "1px solid var(--line)" }}>
          <div style={{ fontSize: 32, marginBottom: 12 }}>🔒</div>
          <h2 style={{ fontSize: 18, marginBottom: 8 }}>Restricted Access</h2>
          <p style={{ color: "var(--text-muted)", fontSize: 13, marginBottom: 20 }}>
            This console is configured for managers and restaurant owners only.
          </p>
          <button
            onClick={signOut}
            style={{
              background: "var(--brass)",
              color: "var(--ink)",
              fontWeight: 700,
              borderRadius: 8,
              padding: "10px 20px",
              fontSize: 13,
            }}
          >
            Sign out
          </button>
        </div>
      </div>
    );
  }

  return (
    <BrowserRouter>
      <Toaster position="top-center" toastOptions={{ style: { background: 'var(--panel)', color: 'var(--text)', border: '1px solid var(--line)' } }} />
      <div style={{ display: "flex", minHeight: "100vh", background: "var(--ink)" }}>
        {/* Desktop Sidebar (Hidden on mobile) */}
        <Sidebar
          orgName={profile.full_name}
          flaggedCount={flaggedCount}
          onSignOut={signOut}
        />

        {/* Main Content Area */}
        <div style={{ flex: 1, display: "flex", flexDirection: "column", minWidth: 0 }}>
          {/* Mobile Top Header (Hidden on desktop) */}
          <MobileHeader orgName={profile.full_name} onSignOut={signOut} />

          <main
            style={{
              flex: 1,
              padding: "clamp(16px, 3vw, 36px)",
              paddingBottom: "calc(var(--bottom-nav-height) + 32px)",
              maxWidth: 1200,
              width: "100%",
              margin: "0 auto",
            }}
          >
            <Routes>
              <Route path="/" element={<Dashboard />} />
              <Route path="/staff" element={<Staff />} />
              <Route path="/flagged" element={<Flagged />} />
              <Route path="/reconciliation" element={<Reconciliation />} />
              <Route path="/analytics" element={<Analytics />} />
            </Routes>
          </main>

          {/* Mobile Bottom Navigation (Hidden on desktop) */}
          <MobileBottomNav flaggedCount={flaggedCount} />
        </div>
      </div>
    </BrowserRouter>
  );
}
