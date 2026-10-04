import React from "react";

export function StatCard({
  label,
  value,
  subtitle,
  icon,
  accent = "brass",
}: {
  label: string;
  value: string;
  subtitle?: string;
  icon?: string;
  accent?: "ledger" | "brass" | "alert" | "blue";
}) {
  const accentColors = {
    brass: { border: "var(--brass)", bg: "var(--brass-soft)", text: "var(--brass)" },
    ledger: { border: "var(--ledger)", bg: "var(--ledger-soft)", text: "var(--ledger)" },
    alert: { border: "var(--alert)", bg: "var(--alert-soft)", text: "var(--alert)" },
    blue: { border: "var(--accent-blue)", bg: "var(--accent-blue-soft)", text: "var(--accent-blue)" },
  };

  const current = accentColors[accent] || accentColors.brass;

  return (
    <div
      style={{
        background: "var(--panel)",
        border: "1px solid var(--line)",
        borderRadius: "var(--radius-lg)",
        padding: "18px 20px",
        flex: "1 1 200px",
        minWidth: 160,
        position: "relative",
        overflow: "hidden",
        boxShadow: "0 2px 8px rgba(0, 0, 0, 0.2)",
      }}
    >
      {/* Accent left highlight */}
      <div
        style={{
          position: "absolute",
          top: 0,
          left: 0,
          bottom: 0,
          width: 4,
          background: current.border,
        }}
      />

      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
        <span style={{ color: "var(--text-muted)", fontSize: 12, fontWeight: 600 }}>{label}</span>
        {icon && <span style={{ fontSize: 18 }}>{icon}</span>}
      </div>

      <div className="mono" style={{ fontSize: 24, fontWeight: 700, color: "var(--text)", lineHeight: 1.2 }}>
        {value}
      </div>

      {subtitle && (
        <div style={{ fontSize: 11, color: "var(--text-dim)", marginTop: 6 }}>
          {subtitle}
        </div>
      )}
    </div>
  );
}
