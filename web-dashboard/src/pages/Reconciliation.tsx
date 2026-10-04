import React, { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { StatCard } from "@/components/StatCard";
import type { Shift } from "@/types";

interface ShiftRow extends Shift {
  waiter_name: string;
}

export function Reconciliation() {
  const [shifts, setShifts] = useState<ShiftRow[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      setLoading(true);
      try {
        const { data, error } = await supabase
          .from("shifts")
          .select("id, waiter_id, opened_at, closed_at, status, cash_total, mobile_total, users(full_name)")
          .order("opened_at", { ascending: false })
          .limit(50);

        if (!error && data) {
          const rows: ShiftRow[] = data.map((row: any) => ({
            id: row.id,
            waiter_id: row.waiter_id,
            opened_at: row.opened_at,
            closed_at: row.closed_at,
            status: row.status,
            cash_total: row.cash_total,
            mobile_total: row.mobile_total,
            waiter_name: row.users?.full_name ?? "Floor Waiter",
          }));
          setShifts(rows);
        }
      } catch (e) {
        console.warn("[Reconciliation] Failed to load shifts:", e);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  const openCount = shifts.filter((s) => s.status === "open").length;
  const totalCashReported = shifts.reduce((sum, s) => sum + Number(s.cash_total), 0);
  const totalMobileReported = shifts.reduce((sum, s) => sum + Number(s.mobile_total), 0);
  const totalCombined = totalCashReported + totalMobileReported;

  return (
    <div style={{ maxWidth: 1100, margin: "0 auto" }}>
      <header style={{ marginBottom: 24 }}>
        <h1
          style={{
            fontFamily: "var(--font-display)",
            fontSize: "clamp(22px, 4vw, 28px)",
            color: "var(--text)",
            fontWeight: 700,
            margin: 0,
          }}
        >
          End-of-Day Shift Reconciliation
        </h1>
        <p style={{ color: "var(--text-muted)", fontSize: 13, marginTop: 4 }}>
          Compare each waiter's reported cash drawer against verified mobile transfer statements.
        </p>
      </header>

      {/* Stats KPI Row */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))",
          gap: 14,
          marginBottom: 28,
        }}
      >
        <StatCard
          label="Active Open Shifts"
          value={String(openCount)}
          subtitle="Currently working floor"
          accent="brass"
          icon="⏳"
        />

        <StatCard
          label="Cash Counted"
          value={`${totalCashReported.toLocaleString(undefined, { minimumFractionDigits: 2 })} ETB`}
          subtitle="Reported drawer cash"
          accent="blue"
          icon="💵"
        />

        <StatCard
          label="Verified Mobile Sum"
          value={`${totalMobileReported.toLocaleString(undefined, { minimumFractionDigits: 2 })} ETB`}
          subtitle="Direct bank transfers"
          accent="ledger"
          icon="📱"
        />

        <StatCard
          label="Combined Total"
          value={`${totalCombined.toLocaleString(undefined, { minimumFractionDigits: 2 })} ETB`}
          subtitle="Cash + Mobile receipts"
          accent="brass"
          icon="📊"
        />
      </div>

      {loading ? (
        <p style={{ color: "var(--text-muted)" }}>Loading shift data...</p>
      ) : (
        <>
          {/* Mobile Shift Cards View (< 768px) */}
          <div className="mobile-only" style={{ flexDirection: "column", gap: 12 }}>
            {shifts.map((s) => (
              <div
                key={s.id}
                style={{
                  background: "var(--panel)",
                  border: "1px solid var(--line)",
                  borderRadius: "var(--radius-lg)",
                  padding: 16,
                  boxShadow: "0 2px 8px rgba(0, 0, 0, 0.2)",
                }}
              >
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
                  <div style={{ fontWeight: 700, fontSize: 16, color: "var(--text)" }}>
                    👤 {s.waiter_name}
                  </div>
                  <span
                    style={{
                      padding: "3px 10px",
                      borderRadius: "var(--radius-full)",
                      fontSize: 11,
                      fontWeight: 700,
                      background: s.status === "open" ? "var(--brass-soft)" : "var(--ledger-soft)",
                      color: s.status === "open" ? "var(--brass)" : "var(--ledger)",
                      border: `1px solid ${s.status === "open" ? "var(--brass-border)" : "var(--ledger-border)"}`,
                    }}
                  >
                    {s.status === "open" ? "● Shift Open" : "✓ Reconciled"}
                  </span>
                </div>

                <div style={{ fontSize: 12, color: "var(--text-muted)", marginBottom: 12 }}>
                  Opened: <span className="mono" style={{ color: "var(--text-secondary)" }}>{new Date(s.opened_at).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}</span>
                  {s.closed_at && (
                    <span> • Closed: <span className="mono" style={{ color: "var(--text-secondary)" }}>{new Date(s.closed_at).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}</span></span>
                  )}
                </div>

                <div
                  style={{
                    display: "grid",
                    gridTemplateColumns: "1fr 1fr",
                    gap: 10,
                    background: "var(--panel-raised)",
                    padding: 12,
                    borderRadius: "var(--radius-md)",
                    marginBottom: 10,
                  }}
                >
                  <div>
                    <div style={{ fontSize: 11, color: "var(--text-muted)" }}>Cash Drawer</div>
                    <div className="mono" style={{ fontSize: 14, fontWeight: 700, color: "var(--text)" }}>
                      {Number(s.cash_total).toLocaleString(undefined, { minimumFractionDigits: 2 })} ETB
                    </div>
                  </div>
                  <div style={{ textAlign: "right" }}>
                    <div style={{ fontSize: 11, color: "var(--text-muted)" }}>Mobile Transfers</div>
                    <div className="mono" style={{ fontSize: 14, fontWeight: 700, color: "var(--ledger)" }}>
                      {Number(s.mobile_total).toLocaleString(undefined, { minimumFractionDigits: 2 })} ETB
                    </div>
                  </div>
                </div>

                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", borderTop: "1px solid var(--line)", paddingTop: 8 }}>
                  <span style={{ fontSize: 12, color: "var(--text-muted)", fontWeight: 600 }}>Shift Combined Total:</span>
                  <span className="mono" style={{ fontSize: 16, fontWeight: 800, color: "var(--brass)" }}>
                    {(Number(s.cash_total) + Number(s.mobile_total)).toLocaleString(undefined, { minimumFractionDigits: 2 })} ETB
                  </span>
                </div>
              </div>
            ))}
          </div>

          {/* Desktop Shift Table View (>= 768px) */}
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
                  <th style={thStyle}>Staff Member</th>
                  <th style={thStyle}>Shift Opened</th>
                  <th style={thStyle}>Status</th>
                  <th style={{ ...thStyle, textAlign: "right" }}>Cash Counted</th>
                  <th style={{ ...thStyle, textAlign: "right" }}>Mobile System Total</th>
                  <th style={{ ...thStyle, textAlign: "right" }}>Combined Total</th>
                </tr>
              </thead>
              <tbody>
                {shifts.map((s) => (
                  <tr key={s.id} style={{ borderTop: "1px solid var(--line)" }}>
                    <td style={{ ...tdStyle, fontWeight: 600, color: "var(--text)" }}>{s.waiter_name}</td>
                    <td className="mono" style={{ ...tdStyle, color: "var(--text-muted)" }}>
                      {new Date(s.opened_at).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                    </td>
                    <td style={tdStyle}>
                      <span
                        style={{
                          padding: "3px 8px",
                          borderRadius: "var(--radius-full)",
                          fontSize: 11,
                          fontWeight: 700,
                          background: s.status === "open" ? "var(--brass-soft)" : "var(--ledger-soft)",
                          color: s.status === "open" ? "var(--brass)" : "var(--ledger)",
                          border: `1px solid ${s.status === "open" ? "var(--brass-border)" : "var(--ledger-border)"}`,
                        }}
                      >
                        {s.status === "open" ? "Open" : "Reconciled"}
                      </span>
                    </td>
                    <td className="mono" style={{ ...tdStyle, textAlign: "right", color: "var(--text)" }}>
                      {Number(s.cash_total).toLocaleString(undefined, { minimumFractionDigits: 2 })} ETB
                    </td>
                    <td className="mono" style={{ ...tdStyle, textAlign: "right", color: "var(--ledger)", fontWeight: 600 }}>
                      {Number(s.mobile_total).toLocaleString(undefined, { minimumFractionDigits: 2 })} ETB
                    </td>
                    <td className="mono" style={{ ...tdStyle, textAlign: "right", fontWeight: 800, color: "var(--brass)", fontSize: 14 }}>
                      {(Number(s.cash_total) + Number(s.mobile_total)).toLocaleString(undefined, { minimumFractionDigits: 2 })} ETB
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}
    </div>
  );
}

const thStyle: React.CSSProperties = { padding: "12px 16px", color: "var(--text-muted)", fontWeight: 600, fontSize: 12 };
const tdStyle: React.CSSProperties = { padding: "12px 16px", color: "var(--text)" };
