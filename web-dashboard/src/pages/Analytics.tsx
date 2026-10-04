import React, { useEffect, useState } from "react";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Radar
} from "recharts";
import { supabase } from "@/lib/supabase";
import type { Transaction } from "@/types";

export function Analytics() {
  const [loading, setLoading] = useState(true);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [waiters, setWaiters] = useState<any[]>([]);

  useEffect(() => {
    async function loadData() {
      // Last 7 days
      const weekAgo = new Date();
      weekAgo.setDate(weekAgo.getDate() - 7);

      const [{ data: txData }, { data: waiterData }] = await Promise.all([
        supabase
          .from("transactions")
          .select("*")
          .gte("created_at", weekAgo.toISOString()),
        supabase
          .from("users")
          .select("id, full_name, role")
          .in("role", ["waiter", "lead_waiter"])
      ]);

      if (txData) setTransactions(txData);
      if (waiterData) setWaiters(waiterData);
      setLoading(false);
    }
    loadData();
  }, []);

  if (loading) {
    return (
      <div style={{ display: "flex", justifyContent: "center", alignItems: "center", height: 300, color: "var(--text-muted)" }}>
        Generating Analytics...
      </div>
    );
  }

  // 1. Revenue over the last 7 days
  const dailyRevenue: Record<string, number> = {};
  for (let i = 6; i >= 0; i--) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    dailyRevenue[d.toLocaleDateString('en-US', { weekday: 'short' })] = 0;
  }
  
  let totalRevenue = 0;
  transactions.forEach(tx => {
    if (tx.sync_status === "synced") {
      const day = new Date(tx.created_at).toLocaleDateString('en-US', { weekday: 'short' });
      if (dailyRevenue[day] !== undefined) {
        dailyRevenue[day] += Number(tx.amount);
      }
      totalRevenue += Number(tx.amount);
    }
  });

  const revenueData = Object.keys(dailyRevenue).map(day => ({
    name: day,
    revenue: dailyRevenue[day]
  }));

  // 2. Waiter Performance (Radar)
  const waiterStats: Record<string, { count: number; volume: number }> = {};
  waiters.forEach(w => {
    waiterStats[w.id] = { count: 0, volume: 0 };
  });

  transactions.forEach(tx => {
    if (tx.sync_status === "synced" && waiterStats[tx.waiter_id]) {
      waiterStats[tx.waiter_id].count += 1;
      waiterStats[tx.waiter_id].volume += Number(tx.amount);
    }
  });

  // 2. Status Distribution (Pie)
  let verified = 0;
  let pending = 0;
  let flagged = 0;

  transactions.forEach(tx => {
    if (tx.is_flagged) flagged++;
    else if (tx.sync_status === "synced") verified++;
    else pending++;
  });

  const pieData = [
    { name: "Verified", value: verified, color: "#10B981" },
    { name: "Pending", value: pending, color: "#F59E0B" },
    { name: "Flagged", value: flagged, color: "#EF4444" },
  ].filter(d => d.value > 0);

  // 3. Average Transaction Size
  const avgTx = verified > 0 ? totalRevenue / verified : 0;

  // 3. Payment Provider Distribution (Pie/Bar)
  const providerStats: Record<string, number> = {};
  transactions.forEach(tx => {
    if (tx.sync_status === "synced") {
      const p = tx.payment_provider || "Unknown";
      providerStats[p] = (providerStats[p] || 0) + 1;
    }
  });

  const providerData = Object.keys(providerStats).map(key => ({
    name: key,
    value: providerStats[key]
  }));

  // 4. Hourly Traffic (Heatmap/Bar)
  const hourlyTraffic = Array.from({length: 24}, (_, i) => ({ hour: `${i}:00`, count: 0 }));
  transactions.forEach(tx => {
    const h = new Date(tx.created_at).getHours();
    hourlyTraffic[h].count += 1;
  });

  // Filter to just operating hours (e.g., 8am to 11pm) for cleaner view
  const activeHours = hourlyTraffic.filter(h => h.count > 0 || (parseInt(h.hour) >= 8 && parseInt(h.hour) <= 23));

  return (
    <div style={{ maxWidth: 1200, margin: "0 auto", padding: "0 16px", paddingBottom: 40 }}>
      <header style={{ marginBottom: 32 }}>
        <h1 style={{ fontFamily: "var(--font-display)", fontSize: 28, color: "var(--text)", fontWeight: 700 }}>
          Service Analytics
        </h1>
        <p style={{ color: "var(--text-muted)", fontSize: 14, marginTop: 4 }}>
          Deep dive into 7-day venue performance and transaction insights.
        </p>
      </header>

      {/* Top Level KPIs */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))", gap: 16, marginBottom: 32 }}>
        <div style={cardStyle}>
          <div style={kpiLabelStyle}>7-Day Total Revenue</div>
          <div style={kpiValueStyle}>{totalRevenue.toLocaleString(undefined, { minimumFractionDigits: 2 })} <span style={{fontSize: 14}}>ETB</span></div>
        </div>
        <div style={cardStyle}>
          <div style={kpiLabelStyle}>Avg. Ticket Size</div>
          <div style={kpiValueStyle}>{Math.round(avgTx).toLocaleString()} <span style={{fontSize: 14}}>ETB</span></div>
        </div>
        <div style={cardStyle}>
          <div style={kpiLabelStyle}>Total Transactions</div>
          <div style={kpiValueStyle}>{transactions.length}</div>
        </div>
        <div style={cardStyle}>
          <div style={kpiLabelStyle}>Verification Rate</div>
          <div style={kpiValueStyle}>
            {transactions.length > 0 ? Math.round((verified / transactions.length) * 100) : 0}%
          </div>
        </div>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(400px, 1fr))", gap: 24 }}>
        
        {/* Revenue Area Chart */}
        <div style={{...cardStyle, gridColumn: "1 / -1", height: 350 }}>
          <h3 style={chartTitleStyle}>Revenue Trends (Last 7 Days)</h3>
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={revenueData} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
              <defs>
                <linearGradient id="colorRev" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#10B981" stopOpacity={0.4}/>
                  <stop offset="95%" stopColor="#10B981" stopOpacity={0}/>
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" vertical={false} />
              <XAxis dataKey="name" stroke="var(--text-muted)" tick={{fontSize: 12}} />
              <YAxis stroke="var(--text-muted)" tick={{fontSize: 12}} />
              <Tooltip 
                contentStyle={{ backgroundColor: 'var(--panel)', border: '1px solid var(--line)', borderRadius: 8 }}
                itemStyle={{ color: '#10B981' }}
              />
              <Area type="monotone" dataKey="revenue" stroke="#10B981" strokeWidth={3} fillOpacity={1} fill="url(#colorRev)" />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        {/* Busiest Hours Bar Chart */}
        <div style={{...cardStyle, height: 350, gridColumn: "1 / -1" }}>
          <h3 style={chartTitleStyle}>Busiest Service Hours (Tx Volume)</h3>
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={activeHours} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" vertical={false} />
              <XAxis dataKey="hour" stroke="var(--text-muted)" tick={{fontSize: 12}} />
              <YAxis stroke="var(--text-muted)" tick={{fontSize: 12}} />
              <Tooltip 
                contentStyle={{ backgroundColor: 'var(--panel)', border: '1px solid var(--line)', borderRadius: 8 }}
                cursor={{fill: 'rgba(255,255,255,0.05)'}}
              />
              <Bar dataKey="count" fill="#3B82F6" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Payment Providers */}
        <div style={{...cardStyle, height: 350 }}>
          <h3 style={chartTitleStyle}>Popular Payment Methods</h3>
          {providerData.length > 0 ? (
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={providerData}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={100}
                  paddingAngle={5}
                  dataKey="value"
                  label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                >
                  {providerData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={["#F59E0B", "#10B981", "#3B82F6", "#8B5CF6", "#EF4444"][index % 5]} />
                  ))}
                </Pie>
                <Tooltip 
                  contentStyle={{ backgroundColor: 'var(--panel)', border: '1px solid var(--line)', borderRadius: 8 }}
                />
              </PieChart>
            </ResponsiveContainer>
          ) : (
            <div style={{ color: 'var(--text-muted)', textAlign: 'center', marginTop: 100 }}>No payment data yet</div>
          )}
        </div>

        {/* Status Pie Chart */}
        <div style={{...cardStyle, height: 350 }}>
          <h3 style={chartTitleStyle}>Transaction Status Distribution</h3>
          {pieData.length > 0 ? (
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={pieData}
                  cx="50%"
                  cy="50%"
                  innerRadius={80}
                  outerRadius={110}
                  paddingAngle={5}
                  dataKey="value"
                  stroke="none"
                >
                  {pieData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip 
                  contentStyle={{ backgroundColor: 'var(--panel)', border: '1px solid var(--line)', borderRadius: 8 }}
                />
              </PieChart>
            </ResponsiveContainer>
          ) : (
            <div style={{ color: 'var(--text-muted)', textAlign: 'center', marginTop: 100 }}>No transactions yet</div>
          )}
          
          <div style={{ display: "flex", justifyContent: "center", gap: 16, marginTop: -20 }}>
            {pieData.map(d => (
              <div key={d.name} style={{ display: "flex", alignItems: "center", gap: 6 }}>
                <div style={{ width: 10, height: 10, borderRadius: '50%', backgroundColor: d.color }} />
                <span style={{ fontSize: 13, color: "var(--text)" }}>{d.name}</span>
              </div>
            ))}
          </div>
        </div>

      </div>
    </div>
  );
}

const cardStyle: React.CSSProperties = {
  background: "var(--panel)",
  border: "1px solid var(--line)",
  borderRadius: "var(--radius-lg)",
  padding: 24,
  boxShadow: "0 8px 24px rgba(0, 0, 0, 0.15)",
};

const kpiLabelStyle: React.CSSProperties = {
  fontSize: 13,
  fontWeight: 600,
  color: "var(--text-muted)",
  marginBottom: 8,
};

const kpiValueStyle: React.CSSProperties = {
  fontSize: 28,
  fontWeight: 700,
  color: "var(--text)",
  fontFamily: "var(--font-mono)",
};

const chartTitleStyle: React.CSSProperties = {
  fontSize: 15,
  fontWeight: 600,
  color: "var(--text)",
  marginBottom: 20,
};
