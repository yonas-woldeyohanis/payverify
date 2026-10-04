import React from "react";
import { NavLink } from "react-router-dom";

/* ─────────────────────────────────────────────────────────── *
 * MobileHeader — sticky top bar shown on small screens only   *
 * ─────────────────────────────────────────────────────────── */
export function MobileHeader({
  orgName,
  onSignOut,
}: {
  orgName?: string;
  onSignOut: () => void;
}) {
  return (
    <header className="mobile-only" style={headerStyle}>
      {/* Logo */}
      <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
        <div style={logoBox}>✓</div>
        <span style={{ fontWeight: 800, fontSize: 17, color: "var(--text)" }}>
          PayVerify
        </span>
      </div>

      {/* Org + Sign out */}
      <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
        {orgName && (
          <span style={{ fontSize: 12, color: "var(--text-muted)", maxWidth: 100, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
            {orgName}
          </span>
        )}
        <button
          onClick={onSignOut}
          style={signOutBtn}
          aria-label="Sign out"
        >
          ⇠
        </button>
      </div>
    </header>
  );
}

/* ─────────────────────────────────────────────────────────── *
 * MobileBottomNav — fixed tab bar at bottom (mobile only)     *
 * ─────────────────────────────────────────────────────────── */
export function MobileBottomNav({ flaggedCount }: { flaggedCount: number }) {
  return (
    <nav className="mobile-only" style={navStyle}>
      <MobileNavItem to="/" icon="📊" label="Dashboard" />
      <MobileNavItem to="/staff" icon="👥" label="Waiters" />
      <MobileNavItem
        to="/flagged"
        icon="⚠️"
        label="Flagged"
        badge={flaggedCount > 0 ? flaggedCount : undefined}
      />
      <MobileNavItem to="/reconciliation" icon="📑" label="Audit" />
      <MobileNavItem to="/analytics" icon="📈" label="Stats" />
    </nav>
  );
}

/* ─────────────────────────────────────────────────────────── *
 * MobileNavItem — individual bottom tab                       *
 * ─────────────────────────────────────────────────────────── */
function MobileNavItem({
  to,
  icon,
  label,
  badge,
}: {
  to: string;
  icon: string;
  label: string;
  badge?: number;
}) {
  return (
    <NavLink
      to={to}
      end={to === "/"}
      style={({ isActive }) => ({
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        flex: 1,
        padding: "6px 4px",
        borderRadius: "var(--radius-sm)",
        color: isActive ? "var(--brass)" : "var(--text-muted)",
        textDecoration: "none",
        position: "relative",
        transition: "color 0.15s ease",
      })}
    >
      <div style={{ position: "relative" }}>
        <span style={{ fontSize: 20 }}>{icon}</span>
        {badge !== undefined && (
          <span
            style={{
              position: "absolute",
              top: -4,
              right: -8,
              background: "var(--alert)",
              color: "#fff",
              fontSize: 10,
              fontWeight: 800,
              padding: "1px 5px",
              borderRadius: "var(--radius-full)",
            }}
          >
            {badge}
          </span>
        )}
      </div>
      <span style={{ fontSize: 11, fontWeight: 500, marginTop: 2 }}>
        {label}
      </span>
    </NavLink>
  );
}

/* ─────────────────────────────────────────────────────────── *
 * Styles                                                       *
 * ─────────────────────────────────────────────────────────── */
const headerStyle: React.CSSProperties = {
  position: "sticky",
  top: 0,
  zIndex: 50,
  display: "flex",
  alignItems: "center",
  justifyContent: "space-between",
  padding: "10px 16px",
  background: "var(--panel)",
  borderBottom: "1px solid var(--line)",
  backdropFilter: "blur(12px)",
};

const logoBox: React.CSSProperties = {
  width: 30,
  height: 30,
  borderRadius: 7,
  background: "linear-gradient(135deg, #F59E0B 0%, #D97706 100%)",
  display: "grid",
  placeItems: "center",
  fontSize: 16,
  fontWeight: 800,
  color: "#0A0E17",
};

const signOutBtn: React.CSSProperties = {
  background: "var(--panel-raised)",
  border: "1px solid var(--line)",
  borderRadius: 7,
  color: "var(--text-muted)",
  cursor: "pointer",
  padding: "4px 10px",
  fontSize: 16,
};

const navStyle: React.CSSProperties = {
  position: "fixed",
  bottom: 0,
  left: 0,
  right: 0,
  zIndex: 50,
  height: "var(--bottom-nav-height, 60px)",
  background: "var(--panel)",
  borderTop: "1px solid var(--line)",
  display: "flex",
  alignItems: "stretch",
  padding: "4px 8px",
  paddingBottom: "env(safe-area-inset-bottom)",
};
