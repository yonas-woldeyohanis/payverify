import React from "react";
import type { Transaction } from "@/types";

export function TransactionTable({
  transactions,
  emptyLabel = "No transactions recorded yet.",
}: {
  transactions: Transaction[];
  emptyLabel?: string;
}) {
  if (transactions.length === 0) {
    return (
      <div
        style={{
          color: "var(--text-muted)",
          padding: "48px 16px",
          textAlign: "center",
          background: "var(--panel)",
          borderRadius: "var(--radius-lg)",
          border: "1px dashed var(--line)",
        }}
      >
        <div style={{ fontSize: 32, marginBottom: 8 }}>🧾</div>
        <div style={{ fontSize: 16, fontWeight: 600, color: "var(--text)" }}>{emptyLabel}</div>
      </div>
    );
  }

  return (
    <>
      {/* Mobile Card Layout (Visible on Phone/Small Screens) */}
      <div className="mobile-only" style={{ flexDirection: "column", gap: 12 }}>
        {transactions.map((t) => (
          <div
            key={t.id}
            style={{
              background: t.is_flagged ? "rgba(239, 68, 68, 0.08)" : "var(--panel)",
              border: `1px solid ${t.is_flagged ? "var(--alert-border)" : "var(--line)"}`,
              borderRadius: "var(--radius-lg)",
              padding: 16,
              boxShadow: "0 2px 8px rgba(0, 0, 0, 0.2)",
            }}
          >
            {/* Header: Provider & Status */}
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 10 }}>
              <ProviderBadge provider={t.payment_provider} />
              <StatusPill flagged={t.is_flagged} syncStatus={t.sync_status} verificationStatus={t.verification_status} />
            </div>

            {/* Main Amount & Table */}
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", marginBottom: 12 }}>
              <div className="mono" style={{ fontSize: 24, fontWeight: 800, color: "var(--text)" }}>
                {t.amount.toLocaleString(undefined, { minimumFractionDigits: 2 })}{" "}
                <span style={{ fontSize: 14, color: "var(--brass)", fontWeight: 600 }}>{t.currency}</span>
              </div>
              <div
                style={{
                  fontSize: 12,
                  fontWeight: 600,
                  color: "var(--text-secondary)",
                  background: "var(--panel-raised)",
                  padding: "4px 8px",
                  borderRadius: 6,
                  border: "1px solid var(--line)",
                }}
              >
                Table {t.table_number ?? "—"}
              </div>
            </div>

            {/* Metadata Grid */}
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "1fr 1fr",
                gap: 8,
                fontSize: 12,
                borderTop: "1px solid var(--line)",
                paddingTop: 10,
              }}
            >
              <div>
                <span style={{ color: "var(--text-dim)" }}>Ref: </span>
                <span className="mono" style={{ color: "var(--text-secondary)", fontWeight: 600 }}>
                  {t.reference_number}
                </span>
              </div>
              <div style={{ textAlign: "right" }}>
                <span style={{ color: "var(--text-dim)" }}>Time: </span>
                <span className="mono" style={{ color: "var(--text-secondary)" }}>
                  {new Date(t.created_at).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                </span>
              </div>
              <div>
                <span style={{ color: "var(--text-dim)" }}>Waiter: </span>
                <span style={{ color: "var(--text)", fontWeight: 600 }}>
                  {t.waiter_name ?? "Staff"}
                </span>
              </div>
              {t.sender_name && (
                <div style={{ textAlign: "right" }}>
                  <span style={{ color: "var(--text-dim)" }}>Sender: </span>
                  <span style={{ color: "var(--text-secondary)" }}>{t.sender_name}</span>
                </div>
              )}
            </div>

            {/* Flagged Alert Banner */}
            {t.is_flagged && t.flag_reason && (
              <div
                style={{
                  marginTop: 10,
                  padding: "8px 10px",
                  background: "var(--alert-soft)",
                  border: "1px solid var(--alert-border)",
                  borderRadius: 6,
                  fontSize: 11,
                  color: "var(--alert)",
                  fontWeight: 600,
                }}
              >
                ⚠️ {t.flag_reason}
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Desktop / Tablet Table Layout (Hidden on Mobile) */}
      <div
        className="desktop-only"
        style={{
          overflowX: "auto",
          border: "1px solid var(--line)",
          borderRadius: "var(--radius-lg)",
          background: "var(--panel)",
          flexDirection: "column",
        }}
      >
        <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
          <thead>
            <tr style={{ background: "var(--panel-raised)", borderBottom: "1px solid var(--line)", textAlign: "left" }}>
              <Th>Time</Th>
              <Th>Provider</Th>
              <Th>Waiter</Th>
              <Th align="right">Amount</Th>
              <Th>Reference</Th>
              <Th>Table</Th>
              <Th>Status</Th>
            </tr>
          </thead>
          <tbody>
            {transactions.map((t) => (
              <tr
                key={t.id}
                style={{
                  borderTop: "1px solid var(--line)",
                  background: t.is_flagged ? "rgba(239, 68, 68, 0.08)" : "transparent",
                  transition: "background 0.15s ease",
                }}
              >
                <Td className="mono" style={{ color: "var(--text-muted)" }}>
                  {new Date(t.created_at).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                </Td>
                <Td>
                  <ProviderBadge provider={t.payment_provider} />
                </Td>
                <Td style={{ fontWeight: 600, color: "var(--text)" }}>
                  {t.waiter_name ?? "Floor Staff"}
                </Td>
                <Td align="right" className="mono" style={{ fontWeight: 700, fontSize: 14 }}>
                  {t.amount.toLocaleString(undefined, { minimumFractionDigits: 2 })}{" "}
                  <span style={{ fontSize: 11, color: "var(--brass)", fontWeight: 600 }}>{t.currency}</span>
                </Td>
                <Td className="mono" style={{ color: "var(--text-secondary)" }}>
                  {t.reference_number}
                </Td>
                <Td>
                  <span
                    style={{
                      background: "var(--panel-raised)",
                      padding: "2px 8px",
                      borderRadius: 4,
                      fontSize: 12,
                      fontWeight: 600,
                      color: "var(--text-secondary)",
                    }}
                  >
                    {t.table_number ?? "—"}
                  </span>
                </Td>
                <Td>
                  <StatusPill flagged={t.is_flagged} syncStatus={t.sync_status} verificationStatus={t.verification_status} />
                </Td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </>
  );
}

function Th({ children, align = "left" }: { children: React.ReactNode; align?: "left" | "right" }) {
  return (
    <th style={{ padding: "12px 16px", color: "var(--text-muted)", fontWeight: 600, textAlign: align, fontSize: 12 }}>
      {children}
    </th>
  );
}

function Td({
  children,
  align = "left",
  className,
  style,
}: {
  children: React.ReactNode;
  align?: "left" | "right";
  className?: string;
  style?: React.CSSProperties;
}) {
  return (
    <td className={className} style={{ padding: "12px 16px", textAlign: align, color: "var(--text)", ...style }}>
      {children}
    </td>
  );
}

function ProviderBadge({ provider }: { provider: string }) {
  const styles: Record<string, { bg: string; color: string; border: string }> = {
    Telebirr: { bg: "rgba(6, 182, 212, 0.15)", color: "#22D3EE", border: "rgba(6, 182, 212, 0.3)" },
    "CBE Birr": { bg: "rgba(168, 85, 247, 0.15)", color: "#C084FC", border: "rgba(168, 85, 247, 0.3)" },
    Dashen: { bg: "rgba(245, 158, 11, 0.15)", color: "#FBBF24", border: "rgba(245, 158, 11, 0.3)" },
    Awash: { bg: "rgba(59, 130, 246, 0.15)", color: "#60A5FA", border: "rgba(59, 130, 246, 0.3)" },
    "M-Pesa": { bg: "rgba(16, 185, 129, 0.15)", color: "#34D399", border: "rgba(16, 185, 129, 0.3)" },
  };

  const current = styles[provider] || {
    bg: "rgba(148, 163, 184, 0.15)",
    color: "#CBD5E1",
    border: "rgba(148, 163, 184, 0.3)",
  };

  return (
    <span
      style={{
        display: "inline-flex",
        alignItems: "center",
        padding: "3px 8px",
        borderRadius: 6,
        fontSize: 11,
        fontWeight: 700,
        background: current.bg,
        color: current.color,
        border: `1px solid ${current.border}`,
      }}
    >
      {provider}
    </span>
  );
}

function StatusPill({ flagged, syncStatus, verificationStatus }: { flagged: boolean; syncStatus: string; verificationStatus: string }) {
  if (flagged) {
    return (
      <span
        style={{
          display: "inline-flex",
          alignItems: "center",
          gap: 4,
          padding: "3px 10px",
          borderRadius: "var(--radius-full)",
          fontSize: 11,
          fontWeight: 700,
          background: "var(--alert-soft)",
          color: "var(--alert)",
          border: "1px solid var(--alert-border)",
        }}
      >
        ⚠️ Flagged
      </span>
    );
  }
  
  if (verificationStatus === "pending") {
    return (
      <span
        style={{
          display: "inline-flex",
          alignItems: "center",
          gap: 4,
          padding: "3px 10px",
          borderRadius: "var(--radius-full)",
          fontSize: 11,
          fontWeight: 700,
          background: "rgba(245, 158, 11, 0.15)",
          color: "#FBBF24",
          border: "1px solid rgba(245, 158, 11, 0.3)",
        }}
      >
        ⏳ Wait SMS
      </span>
    );
  }
  
  if (syncStatus === "error") {
    return (
      <span
        style={{
          display: "inline-flex",
          alignItems: "center",
          padding: "3px 10px",
          borderRadius: "var(--radius-full)",
          fontSize: 11,
          fontWeight: 700,
          background: "var(--alert-soft)",
          color: "var(--alert)",
          border: "1px solid var(--alert-border)",
        }}
      >
        Error
      </span>
    );
  }
  
  return (
    <span
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: 4,
        padding: "3px 10px",
        borderRadius: "var(--radius-full)",
        fontSize: 11,
        fontWeight: 700,
        background: "var(--ledger-soft)",
        color: "var(--ledger)",
        border: "1px solid var(--ledger-border)",
      }}
    >
      ✓ Verified
    </span>
  );
}
