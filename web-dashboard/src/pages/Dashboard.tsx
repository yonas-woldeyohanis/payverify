import React, { useMemo } from "react";
import { useLiveTransactions } from "@/hooks/useLiveTransactions";
import { StatCard } from "@/components/StatCard";
import { TransactionTable } from "@/components/TransactionTable";

export function Dashboard() {
  const { transactions, loading } = useLiveTransactions();

  const stats = useMemo(() => {
    const total = transactions.reduce((sum, t) => sum + Number(t.amount), 0);
    const flaggedCount = transactions.filter((t) => t.is_flagged || t.sync_status === "error").length;
    const byProvider: Record<string, { amount: number; count: number }> = {};

    for (const t of transactions) {
      if (!byProvider[t.payment_provider]) {
        byProvider[t.payment_provider] = { amount: 0, count: 0 };
      }
      byProvider[t.payment_provider].amount += Number(t.amount);
      byProvider[t.payment_provider].count += 1;
    }

    const sortedProviders = Object.entries(byProvider).sort((a, b) => b[1].amount - a[1].amount);
    const topProvider = sortedProviders[0];

    return { total, flaggedCount, byProvider, topProvider };
  }, [transactions]);

  return (
    <div style={{ maxWidth: 1100, margin: "0 auto" }}>
      {/* Header */}
      <header
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "flex-start",
          flexWrap: "wrap",
          gap: 12,
          marginBottom: 24,
        }}
      >
        <div>
          <h1
            style={{
              fontFamily: "var(--font-display)",
              fontSize: "clamp(22px, 4vw, 28px)",
              color: "var(--text)",
              fontWeight: 700,
              lineHeight: 1.2,
            }}
          >
            Today's Live Revenue Feed
          </h1>
          <p style={{ color: "var(--text-muted)", fontSize: 13, marginTop: 4 }}>
            Streams transactions in real time as waiters scan customer receipts.
          </p>
        </div>

        {/* Live Status indicator */}
        <div
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: 8,
            padding: "6px 14px",
            borderRadius: "var(--radius-full)",
            background: "var(--ledger-soft)",
            border: "1px solid var(--ledger-border)",
            fontSize: 12,
            fontWeight: 700,
            color: "var(--ledger)",
          }}
        >
          <span
            style={{
              width: 8,
              height: 8,
              borderRadius: "50%",
              background: "var(--ledger)",
              boxShadow: "0 0 8px var(--ledger)",
            }}
          />
          Live Sync Active
        </div>
      </header>

      {/* Primary KPI Row */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))",
          gap: 14,
          marginBottom: 24,
        }}
      >
        <StatCard
          label="Total Mobile Revenue"
          value={`${stats.total.toLocaleString(undefined, { minimumFractionDigits: 2 })} ETB`}
          subtitle={`${transactions.length} receipts verified`}
          accent="brass"
          icon="💰"
        />

        <StatCard
          label="Top Payment Provider"
          value={stats.topProvider ? stats.topProvider[0] : "—"}
          subtitle={
            stats.topProvider
              ? `${stats.topProvider[1].amount.toLocaleString(undefined, { minimumFractionDigits: 2 })} ETB (${stats.topProvider[1].count} txns)`
              : "No payments yet"
          }
          accent="ledger"
          icon="🏦"
        />

        <StatCard
          label="Flagged Anomaly Audit"
          value={String(stats.flaggedCount)}
          subtitle={stats.flaggedCount > 0 ? "Requires manager review" : "All clean & verified"}
          accent={stats.flaggedCount > 0 ? "alert" : "ledger"}
          icon="⚠️"
        />
      </div>

      {/* Provider Distribution Chips */}
      {Object.keys(stats.byProvider).length > 0 && (
        <div
          style={{
            background: "var(--panel)",
            border: "1px solid var(--line)",
            borderRadius: "var(--radius-lg)",
            padding: "16px 20px",
            marginBottom: 28,
          }}
        >
          <div style={{ fontSize: 12, fontWeight: 700, color: "var(--text-muted)", marginBottom: 12, textTransform: "uppercase", letterSpacing: "0.05em" }}>
            Provider Breakdown
          </div>
          <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
            {Object.entries(stats.byProvider).map(([provider, data]) => (
              <div
                key={provider}
                style={{
                  background: "var(--panel-raised)",
                  border: "1px solid var(--line)",
                  borderRadius: "var(--radius-md)",
                  padding: "8px 14px",
                  display: "flex",
                  alignItems: "center",
                  gap: 12,
                  flex: "1 1 180px",
                }}
              >
                <div>
                  <div style={{ fontSize: 12, fontWeight: 600, color: "var(--text)" }}>{provider}</div>
                  <div style={{ fontSize: 11, color: "var(--text-muted)" }}>{data.count} txns</div>
                </div>
                <div className="mono" style={{ marginLeft: "auto", fontSize: 14, fontWeight: 700, color: "var(--brass)" }}>
                  {data.amount.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Transaction Feed */}
      <section>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 14 }}>
          <h2 style={{ fontSize: 16, fontWeight: 700, color: "var(--text)" }}>
            Transactions Feed ({transactions.length})
          </h2>
          <span style={{ fontSize: 12, color: "var(--text-muted)" }}>
            Ordered by newest first
          </span>
        </div>

        {loading ? (
          <div style={{ color: "var(--text-muted)", padding: 32, textAlign: "center" }}>
            Loading live transactions...
          </div>
        ) : (
          <TransactionTable transactions={transactions} emptyLabel="No transactions recorded yet today." />
        )}
      </section>
    </div>
  );
}
