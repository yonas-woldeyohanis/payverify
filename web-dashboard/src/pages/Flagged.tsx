import React from "react";
import { useLiveTransactions } from "@/hooks/useLiveTransactions";
import { TransactionTable } from "@/components/TransactionTable";

export function Flagged() {
  const { transactions, loading, resolveFlag } = useLiveTransactions();
  const flagged = transactions.filter((t) => t.is_flagged || t.sync_status === "error");

  return (
    <div style={{ maxWidth: 1100, margin: "0 auto" }}>
      <header style={{ marginBottom: 24 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <span style={{ fontSize: 24 }}>⚠️</span>
          <h1
            style={{
              fontFamily: "var(--font-display)",
              fontSize: "clamp(22px, 4vw, 28px)",
              color: "var(--text)",
              fontWeight: 700,
              margin: 0,
            }}
          >
            Flagged Transactions ({flagged.length})
          </h1>
        </div>
        <p style={{ color: "var(--text-muted)", fontSize: 13, marginTop: 6 }}>
          Potential duplicate receipts, repeated reference codes, or synchronization errors needing manager intervention.
        </p>
      </header>

      {flagged.length > 0 && (
        <div
          style={{
            background: "var(--alert-soft)",
            border: "1px solid var(--alert-border)",
            borderRadius: "var(--radius-md)",
            padding: "14px 18px",
            marginBottom: 20,
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            flexWrap: "wrap",
            gap: 12,
          }}
        >
          <div style={{ fontSize: 13, color: "var(--alert)", fontWeight: 600 }}>
            🚨 {flagged.length} transaction{flagged.length > 1 ? "s" : ""} require your audit review.
          </div>
          <div style={{ fontSize: 12, color: "var(--text-muted)" }}>
            Duplicate receipts can indicate fraudulent customer re-scans.
          </div>
        </div>
      )}

      {loading ? (
        <p style={{ color: "var(--text-muted)" }}>Loading flagged entries...</p>
      ) : (
        <TransactionTable
          transactions={flagged}
          emptyLabel="Clean ledger — no duplicate references or flagged receipts today!"
        />
      )}
    </div>
  );
}
