import React, { useState } from "react";
import { useAuth } from "@/hooks/useAuth";

export function Login() {
  const { signIn } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setSubmitting(true);
    try {
      await signIn(email.trim(), password);
    } catch (err: any) {
      setError(err?.message ?? "Could not sign in.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div
      style={{
        minHeight: "100vh",
        display: "grid",
        placeItems: "center",
        background: "var(--ink)",
        padding: 16,
      }}
    >
      <form
        onSubmit={handleSubmit}
        style={{
          width: "100%",
          maxWidth: 380,
          background: "var(--panel)",
          border: "1px solid var(--line)",
          borderRadius: "var(--radius-lg)",
          padding: "clamp(20px, 5vw, 36px)",
          boxShadow: "0 10px 30px rgba(0, 0, 0, 0.4)",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 8 }}>
          <div
            style={{
              width: 36,
              height: 36,
              borderRadius: 8,
              background: "linear-gradient(135deg, #F59E0B 0%, #D97706 100%)",
              display: "grid",
              placeItems: "center",
              fontSize: 20,
              fontWeight: 800,
              color: "#0A0E17",
            }}
          >
            ✓
          </div>
          <div style={{ fontFamily: "var(--font-display)", fontSize: 26, fontWeight: 700, color: "var(--text)" }}>
            PayVerify
          </div>
        </div>

        <p style={{ color: "var(--text-muted)", fontSize: 13, marginBottom: 24 }}>
          Auditing & Shift Management Console
        </p>

        <label style={labelStyle}>Email Address</label>
        <input
          style={inputStyle}
          type="email"
          placeholder="admin@payverify.com"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
        />

        <label style={labelStyle}>Password</label>
        <input
          style={inputStyle}
          type="password"
          placeholder="••••••••"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
        />

        {error && (
          <p style={{ color: "var(--alert)", fontSize: 13, marginTop: 8, fontWeight: 600 }}>
            ⚠️ {error}
          </p>
        )}

        <button type="submit" disabled={submitting} style={buttonStyle}>
          {submitting ? "Authenticating..." : "Sign in to Dashboard"}
        </button>
      </form>
    </div>
  );
}

const labelStyle: React.CSSProperties = {
  display: "block",
  fontSize: 12,
  fontWeight: 600,
  color: "var(--text-secondary)",
  marginBottom: 6,
  marginTop: 14,
};

const inputStyle: React.CSSProperties = {
  width: "100%",
  background: "var(--panel-raised)",
  border: "1px solid var(--line)",
  borderRadius: "var(--radius-sm)",
  padding: "12px 14px",
  color: "var(--text)",
  fontSize: 14,
  outline: "none",
};

const buttonStyle: React.CSSProperties = {
  width: "100%",
  marginTop: 20,
  background: "linear-gradient(135deg, #F59E0B 0%, #D97706 100%)",
  border: "none",
  borderRadius: "var(--radius-md)",
  padding: "13px",
  fontWeight: 700,
  fontSize: 14,
  color: "#0A0E17",
  cursor: "pointer",
  boxShadow: "0 4px 14px rgba(245, 158, 11, 0.3)",
};
