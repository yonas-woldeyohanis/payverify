import React from "react";
import { NavLink } from "react-router-dom";

export function Sidebar({
  orgName,
  flaggedCount = 0,
  onSignOut,
}: {
  orgName: string;
  flaggedCount?: number;
  onSignOut: () => void;
}) {
  return (
    <aside
      className="desktop-only"
      style={{
        width: "var(--sidebar-width)",
        flexShrink: 0,
        background: "var(--panel)",
        borderRight: "1px solid var(--line)",
        padding: "24px 18px",
        flexDirection: "column",
        justifyContent: "space-between",
        height: "100vh",
        position: "sticky",
        top: 0,
      }}
    >
      <div>
        {/* Brand / Logo */}
        <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 6 }}>
          <div
            style={{
              width: 34,
              height: 34,
              borderRadius: 8,
              background: "linear-gradient(135deg, #F59E0B 0%, #D97706 100%)",
              display: "grid",
              placeItems: "center",
              fontSize: 18,
              fontWeight: 800,
              color: "#0A0E17",
            }}
          >
            ✓
          </div>
          <span style={{ fontFamily: "var(--font-display)", fontSize: 22, fontWeight: 700, color: "var(--text)" }}>
            PayVerify
          </span>
        </div>

        <div style={{ color: "var(--text-muted)", fontSize: 12, marginBottom: 28, paddingLeft: 4 }}>
          {orgName}
        </div>

        {/* Navigation Links */}
        <nav style={{ display: "flex", flexDirection: "column", gap: 4 }}>
          <NavItem to="/" icon="📊" label="Live Feed" />
          <NavItem to="/staff" icon="👥" label="Floor Staff & Waiters" />
          <NavItem
            to="/flagged"
            icon="⚠️"
            label="Flagged Transactions"
            badge={flaggedCount > 0 ? flaggedCount : undefined}
          />
          <NavItem to="/reconciliation" icon="📑" label="Shift Reconciliation" />
          <NavItem to="/analytics" icon="📈" label="Analytics & Insights" />
        </nav>
      </div>

      {/* User profile & Sign out */}
      <div style={{ borderTop: "1px solid var(--line)", paddingTop: 16 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 12 }}>
          <div
            style={{
              width: 32,
              height: 32,
              borderRadius: "50%",
              background: "var(--panel-raised)",
              color: "var(--brass)",
              display: "grid",
              placeItems: "center",
              fontWeight: 700,
              fontSize: 13,
              border: "1px solid var(--brass-border)",
            }}
          >
            {orgName.slice(0, 2).toUpperCase()}
          </div>
          <div style={{ overflow: "hidden" }}>
            <div style={{ fontSize: 13, fontWeight: 600, color: "var(--text)", textOverflow: "ellipsis", overflow: "hidden", whiteSpace: "nowrap" }}>
              {orgName}
            </div>
            <div style={{ fontSize: 11, color: "var(--ledger)", fontWeight: 600 }}>● Manager Console</div>
          </div>
        </div>

        <button
          onClick={onSignOut}
          style={{
            width: "100%",
            background: "var(--panel-raised)",
            border: "1px solid var(--line)",
            color: "var(--text-secondary)",
            borderRadius: "var(--radius-sm)",
            padding: "9px 12px",
            fontSize: 12,
            fontWeight: 600,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            gap: 6,
            transition: "all 0.15s ease",
          }}
          onMouseEnter={(e) => (e.currentTarget.style.color = "var(--alert)")}
          onMouseLeave={(e) => (e.currentTarget.style.color = "var(--text-secondary)")}
        >
          <span>🚪</span> Sign out
        </button>
      </div>
    </aside>
  );
}

function NavItem({
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
        alignItems: "center",
        justifyContent: "space-between",
        padding: "10px 14px",
        borderRadius: "var(--radius-md)",
        color: isActive ? "var(--text)" : "var(--text-secondary)",
        background: isActive ? "var(--brass-soft)" : "transparent",
        border: isActive ? "1px solid var(--brass-border)" : "1px solid transparent",
        fontSize: 13,
        fontWeight: isActive ? 700 : 500,
        textDecoration: "none",
        transition: "all 0.15s ease",
      })}
    >
      <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
        <span style={{ fontSize: 16 }}>{icon}</span>
        <span>{label}</span>
      </div>
      {badge !== undefined && (
        <span
          style={{
            background: "var(--alert)",
            color: "#fff",
            fontSize: 10,
            fontWeight: 800,
            padding: "2px 7px",
            borderRadius: "var(--radius-full)",
          }}
        >
          {badge}
        </span>
      )}
    </NavLink>
  );
}
