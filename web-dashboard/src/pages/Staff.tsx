import React, { useState } from "react";
import { useStaff } from "@/hooks/useStaff";
import type { WaiterEmployee, StaffRole } from "@/types";
import toast from "react-hot-toast";

export function Staff() {
  const { staff, loading, error, addWaiter, toggleDuty, toggleActive, updatePin, deleteWaiter } = useStaff();
  
  const [showAddModal, setShowAddModal] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [filterTab, setFilterTab] = useState<"all" | "on_duty" | "off_duty">("all");
  const [creating, setCreating] = useState(false);
  const [createError, setCreateError] = useState<string | null>(null);
  
  // New Waiter Form State
  const [fullName, setFullName] = useState("");
  const [loginAlias, setLoginAlias] = useState("");
  const [pin, setPin] = useState("");
  const [role, setRole] = useState<"waiter" | "lead_waiter" | "cashier">("waiter");
  const [section, setSection] = useState("Main Dining");
  const [phone, setPhone] = useState("");
  const [startOnDuty, setStartOnDuty] = useState(true);
  const [revealedPins, setRevealedPins] = useState<Record<string, boolean>>({});
  const [showPasswordInModal, setShowPasswordInModal] = useState(false);

  // Editing PIN State
  const [editingPinId, setEditingPinId] = useState<string | null>(null);
  const [newPinValue, setNewPinValue] = useState("");

  const handleNameChange = (val: string) => {
    setFullName(val);
    if (!loginAlias || loginAlias === fullName.toLowerCase().replace(/\s+/g, "")) {
      const suggested = val.trim().split(" ")[0]?.toLowerCase().replace(/[^a-z0-9]/g, "") || "";
      setLoginAlias(suggested);
    }
  };

  const generateRandomPin = () => {
    const random = Math.floor(1000 + Math.random() * 9000).toString();
    setPin(random);
  };

  const handleCreateWaiter = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!fullName.trim() || !loginAlias.trim() || !pin.trim()) {
      toast.error("Please fill in the full name, login alias, and password.");
      return;
    }
    if (pin.length < 6) {
      toast.error("Password must be at least 6 characters.");
      return;
    }

    setCreating(true);
    setCreateError(null);
    try {
      await addWaiter({
        org_id: "", 
        full_name: fullName.trim(),
        login_alias: loginAlias.trim().toLowerCase(),
        pin: pin.trim(),
        password: pin.trim(),
        section,
        phone: phone.trim() || undefined,
        is_active: true,
        on_duty: startOnDuty,
      } as any);

      // Reset form
      setFullName("");
      setLoginAlias("");
      setPin("");
      setPhone("");
      setRole("waiter");
      setSection("Main Dining");
      setShowAddModal(false);
      toast.success("Waiter added successfully!");
    } catch (err: any) {
      setCreateError(err?.message ?? "Failed to create waiter. Try again.");
    } finally {
      setCreating(false);
    }
  };

  const togglePinReveal = (id: string) => {
    setRevealedPins((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  const handleSavePin = (id: string) => {
    if (newPinValue.length >= 4) {
      updatePin(id, newPinValue);
      setEditingPinId(null);
      setNewPinValue("");
      toast.success("Password updated locally (Requires backend sync)");
    } else {
      toast.error("PIN must be at least 4 digits");
    }
  };

  // Filtered employees
  const filteredStaff = staff.filter((emp) => {
    const matchesQuery =
      emp.full_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      emp.login_alias.toLowerCase().includes(searchQuery.toLowerCase()) ||
      emp.section.toLowerCase().includes(searchQuery.toLowerCase());

    if (!matchesQuery) return false;
    if (filterTab === "on_duty") return emp.on_duty;
    if (filterTab === "off_duty") return !emp.on_duty;
    return true;
  });

  const onDutyCount = staff.filter((s) => s.on_duty).length;
  const totalSalesToday = staff.reduce((sum, s) => sum + (s.total_sales_today || 0), 0);

  if (loading) {
    return (
      <div style={{ display: "flex", justifyContent: "center", alignItems: "center", height: 300, color: "var(--text-muted)" }}>
        Loading staff roster...
      </div>
    );
  }

  return (
    <div style={{ maxWidth: 1100, margin: "0 auto" }}>
      {error && (
        <div style={{ background: "var(--alert-soft)", border: "1px solid var(--alert-border)", borderRadius: "var(--radius-md)", padding: "10px 16px", marginBottom: 16, color: "var(--alert)", fontSize: 13 }}>
          ⚠️ {error}
        </div>
      )}
      {/* Top Header */}
      <header
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "flex-start",
          flexWrap: "wrap",
          gap: 16,
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
            Floor Staff & Waiters
          </h1>
          <p style={{ color: "var(--text-muted)", fontSize: 13, marginTop: 4 }}>
            Register new floor staff, assign POS device PINs, and track active shifts.
          </p>
        </div>

        <button
          onClick={() => {
            generateRandomPin();
            setShowAddModal(true);
          }}
          style={{
            background: "linear-gradient(135deg, #F59E0B 0%, #D97706 100%)",
            color: "#0A0E17",
            fontWeight: 700,
            fontSize: 14,
            padding: "12px 20px",
            borderRadius: "var(--radius-md)",
            display: "inline-flex",
            alignItems: "center",
            gap: 8,
            boxShadow: "0 4px 14px rgba(245, 158, 11, 0.35)",
            cursor: "pointer",
            width: "auto",
          }}
        >
          <span style={{ fontSize: 18, lineHeight: 1 }}>+</span> Add New Waiter
        </button>
      </header>

      {/* Metrics Row */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(160px, 1fr))",
          gap: 14,
          marginBottom: 28,
        }}
      >
        <div style={statBoxStyle}>
          <div style={statLabelStyle}>Total Staff</div>
          <div className="mono" style={statValueStyle}>{staff.length}</div>
          <div style={statSubStyle}>Registered profiles</div>
        </div>

        <div style={statBoxStyle}>
          <div style={statLabelStyle}>Currently on Duty</div>
          <div className="mono" style={{ ...statValueStyle, color: "var(--ledger)" }}>
            {onDutyCount}
          </div>
          <div style={statSubStyle}>Active right now</div>
        </div>

        <div style={statBoxStyle}>
          <div style={statLabelStyle}>Shift Total Today</div>
          <div className="mono" style={{ ...statValueStyle, color: "var(--brass)" }}>
            {totalSalesToday.toLocaleString(undefined, { minimumFractionDigits: 2 })} <span style={{ fontSize: 13 }}>ETB</span>
          </div>
          <div style={statSubStyle}>Combined mobile total</div>
        </div>

        <div style={statBoxStyle}>
          <div style={statLabelStyle}>Active Sections</div>
          <div className="mono" style={statValueStyle}>
            {Array.from(new Set(staff.filter(s => s.on_duty).map(s => s.section))).length}
          </div>
          <div style={statSubStyle}>Floor areas covered</div>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          flexWrap: "wrap",
          gap: 12,
          marginBottom: 20,
          background: "var(--panel)",
          padding: 12,
          borderRadius: "var(--radius-md)",
          border: "1px solid var(--line)",
        }}
      >
        <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
          <button
            onClick={() => setFilterTab("all")}
            style={filterTabStyle(filterTab === "all")}
          >
            All Staff ({staff.length})
          </button>
          <button
            onClick={() => setFilterTab("on_duty")}
            style={filterTabStyle(filterTab === "on_duty")}
          >
            ● On Duty ({onDutyCount})
          </button>
          <button
            onClick={() => setFilterTab("off_duty")}
            style={filterTabStyle(filterTab === "off_duty")}
          >
            Off Duty ({staff.length - onDutyCount})
          </button>
        </div>

        <input
          type="text"
          placeholder="Search waiter or section..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          style={{
            background: "var(--panel-raised)",
            border: "1px solid var(--line)",
            color: "var(--text)",
            borderRadius: "var(--radius-sm)",
            padding: "8px 14px",
            fontSize: 13,
            minWidth: 200,
            flex: "1 1 auto",
          }}
        />
      </div>

      {/* Staff Roster Cards */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fill, minmax(320px, 1fr))",
          gap: 16,
          marginBottom: 32,
        }}
      >
        {filteredStaff.map((emp) => {
          const isRevealed = revealedPins[emp.id];
          return (
            <div
              key={emp.id}
              style={{
                background: "var(--panel)",
                border: "1px solid var(--line)",
                borderRadius: "var(--radius-lg)",
                padding: 20,
                position: "relative",
                display: "flex",
                flexDirection: "column",
                justifyContent: "space-between",
                gap: 16,
                boxShadow: "0 4px 12px rgba(0, 0, 0, 0.25)",
              }}
            >
              {/* Card Header */}
              <div>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 12 }}>
                  <div style={{ display: "flex", gap: 12, alignItems: "center" }}>
                    <div
                      style={{
                        width: 44,
                        height: 44,
                        borderRadius: "50%",
                        background: emp.on_duty
                          ? "linear-gradient(135deg, #10B981, #059669)"
                          : "linear-gradient(135deg, #374151, #1F2937)",
                        color: "#fff",
                        display: "grid",
                        placeItems: "center",
                        fontSize: 16,
                        fontWeight: 700,
                        border: emp.on_duty ? "2px solid #34D399" : "2px solid #4B5563",
                        boxShadow: emp.on_duty ? "0 0 12px rgba(16, 185, 129, 0.4)" : "none",
                      }}
                    >
                      {emp.full_name.slice(0, 2).toUpperCase()}
                    </div>

                    <div>
                      <div style={{ fontWeight: 700, fontSize: 16, color: "var(--text)" }}>
                        {emp.full_name}
                      </div>
                      <div style={{ fontSize: 12, color: "var(--text-muted)", marginTop: 2 }}>
                        Username: <code style={{ color: "var(--brass)", fontWeight: 600 }}>@{emp.login_alias}</code>
                      </div>
                    </div>
                  </div>

                  <span
                    style={{
                      padding: "4px 10px",
                      borderRadius: "var(--radius-full)",
                      fontSize: 11,
                      fontWeight: 700,
                      background: emp.on_duty ? "var(--ledger-soft)" : "rgba(100, 116, 139, 0.15)",
                      color: emp.on_duty ? "var(--ledger)" : "var(--text-muted)",
                      border: `1px solid ${emp.on_duty ? "var(--ledger-border)" : "var(--line)"}`,
                      whiteSpace: "nowrap",
                    }}
                  >
                    {emp.on_duty ? "● On Duty" : "○ Off Duty"}
                  </span>
                </div>

                {/* Badges / Section */}
                <div style={{ display: "flex", gap: 8, marginTop: 14, flexWrap: "wrap" }}>
                  <span style={pillStyle}>
                    📍 {emp.section}
                  </span>
                  <span style={{ ...pillStyle, color: emp.role === "lead_waiter" ? "var(--brass)" : "var(--text-secondary)" }}>
                    🏷️ {emp.role === "lead_waiter" ? "Lead Waiter" : emp.role === "cashier" ? "Cashier" : "Floor Waiter"}
                  </span>
                </div>

                {/* Sales & Shift Today */}
                <div
                  style={{
                    background: "var(--panel-raised)",
                    borderRadius: "var(--radius-md)",
                    padding: "10px 14px",
                    marginTop: 14,
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                  }}
                >
                  <div>
                    <div style={{ fontSize: 11, color: "var(--text-muted)" }}>Sales Today</div>
                    <div className="mono" style={{ fontSize: 15, fontWeight: 700, color: "var(--text)" }}>
                      {emp.total_sales_today.toLocaleString(undefined, { minimumFractionDigits: 2 })} ETB
                    </div>
                  </div>
                  <div style={{ textAlign: "right" }}>
                    <div style={{ fontSize: 11, color: "var(--text-muted)" }}>Receipts</div>
                    <div className="mono" style={{ fontSize: 15, fontWeight: 700, color: "var(--brass)" }}>
                      {emp.transaction_count_today} verified
                    </div>
                  </div>
                </div>

                {/* PIN Management row */}
                <div
                  style={{
                    marginTop: 14,
                    fontSize: 12,
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    borderTop: "1px dashed var(--line)",
                    paddingTop: 10,
                  }}
                >
                  <span style={{ color: "var(--text-muted)" }}>Login Password:</span>

                  {editingPinId === emp.id ? (
                    <div style={{ display: "flex", gap: 6, alignItems: "center" }}>
                      <input
                        type="text"
                        maxLength={6}
                        value={newPinValue}
                        onChange={(e) => setNewPinValue(e.target.value)}
                        placeholder="PIN"
                        style={{
                          width: 60,
                          padding: "3px 6px",
                          borderRadius: 4,
                          background: "var(--ink)",
                          border: "1px solid var(--brass)",
                          color: "var(--text)",
                          fontSize: 12,
                          textAlign: "center",
                        }}
                      />
                      <button
                        onClick={() => handleSavePin(emp.id)}
                        style={{ color: "var(--ledger)", fontWeight: 700, fontSize: 11 }}
                      >
                        Save
                      </button>
                      <button
                        onClick={() => setEditingPinId(null)}
                        style={{ color: "var(--text-muted)", fontSize: 11 }}
                      >
                        Cancel
                      </button>
                    </div>
                  ) : (
                    <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
                      <code className="mono" style={{ color: "var(--text)", fontWeight: 700, letterSpacing: 2 }}>
                        {isRevealed ? emp.pin : "••••"}
                      </code>
                      <button
                        onClick={() => togglePinReveal(emp.id)}
                        style={{ color: "var(--text-muted)", fontSize: 11, textDecoration: "underline" }}
                      >
                        {isRevealed ? "Hide" : "Reveal"}
                      </button>
                      <button
                        onClick={() => { setEditingPinId(emp.id); setNewPinValue(emp.pin); }}
                        style={{ color: "var(--brass)", fontSize: 11 }}
                      >
                        Edit
                      </button>
                    </div>
                  )}
                </div>
              </div>

              {/* Action Buttons */}
              <div style={{ display: "flex", gap: 8, borderTop: "1px solid var(--line)", paddingTop: 14 }}>
                <button
                  onClick={() => toggleDuty(emp.id)}
                  style={{
                    flex: 1,
                    padding: "9px 12px",
                    borderRadius: "var(--radius-md)",
                    fontSize: 12,
                    fontWeight: 700,
                    background: emp.on_duty ? "rgba(239, 68, 68, 0.12)" : "rgba(16, 185, 129, 0.15)",
                    color: emp.on_duty ? "var(--alert)" : "var(--ledger)",
                    border: `1px solid ${emp.on_duty ? "var(--alert-border)" : "var(--ledger-border)"}`,
                    cursor: "pointer",
                  }}
                >
                  {emp.on_duty ? "Take Off Duty" : "Assign to Duty"}
                </button>

                <button
                  onClick={() => {
                    deleteWaiter(emp.id);
                    toast.success(`${emp.full_name} removed.`);
                  }}
                  style={{
                    padding: "9px 12px",
                    borderRadius: "var(--radius-md)",
                    fontSize: 12,
                    color: "var(--text-muted)",
                    border: "1px solid var(--line)",
                    cursor: "pointer",
                  }}
                  title="Remove employee"
                >
                  Delete
                </button>
              </div>
            </div>
          );
        })}

        {filteredStaff.length === 0 && (
          <div
            style={{
              gridColumn: "1 / -1",
              textAlign: "center",
              padding: "48px 16px",
              background: "var(--panel)",
              borderRadius: "var(--radius-lg)",
              border: "1px dashed var(--line)",
              color: "var(--text-muted)",
            }}
          >
            <div style={{ fontSize: 32, marginBottom: 8 }}>👥</div>
            <div style={{ fontSize: 16, fontWeight: 600, color: "var(--text)" }}>No staff found</div>
            <div style={{ fontSize: 13, marginTop: 4 }}>Try adjusting your search query or add a new waiter.</div>
          </div>
        )}
      </div>

      {/* Add Waiter Modal Overlay */}
      {showAddModal && (
        <div
          style={{
            position: "fixed",
            inset: 0,
            background: "rgba(10, 14, 23, 0.8)",
            backdropFilter: "blur(8px)",
            display: "grid",
            placeItems: "center",
            zIndex: 1000,
            padding: 16,
            overflowY: "auto",
          }}
        >
          <div
            style={{
              background: "var(--panel)",
              border: "1px solid var(--line-light)",
              borderRadius: "var(--radius-lg)",
              width: "100%",
              maxWidth: 480,
              padding: "24px 28px",
              boxShadow: "0 20px 40px rgba(0, 0, 0, 0.5)",
            }}
          >
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 18 }}>
              <div>
                <h2 style={{ fontFamily: "var(--font-display)", fontSize: 22, color: "var(--text)", margin: 0 }}>
                  Add Floor Waiter
                </h2>
                <p style={{ color: "var(--text-muted)", fontSize: 12, marginTop: 4 }}>
                  Creates their mobile device login & PIN for the PayVerify waiter app.
                </p>
              </div>
              <button
                onClick={() => setShowAddModal(false)}
                style={{
                  color: "var(--text-muted)",
                  fontSize: 20,
                  width: 32,
                  height: 32,
                  borderRadius: "50%",
                  display: "grid",
                  placeItems: "center",
                }}
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleCreateWaiter}>
              <div style={{ marginBottom: 14 }}>
                <label style={modalLabelStyle}>Full Name *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Kenenisa Bekele"
                  value={fullName}
                  onChange={(e) => handleNameChange(e.target.value)}
                  style={modalInputStyle}
                />
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 14 }}>
                <div>
                  <label style={modalLabelStyle}>App Username *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. kenenisa"
                    value={loginAlias}
                    onChange={(e) => setLoginAlias(e.target.value.toLowerCase().replace(/[^a-z0-9]/g, ""))}
                    style={modalInputStyle}
                  />
                </div>

                <div>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 6 }}>
                    <label style={{...modalLabelStyle, marginBottom: 0}}>Password *</label>
                    <button
                      type="button"
                      onClick={() => setShowPasswordInModal(!showPasswordInModal)}
                      style={{ fontSize: 11, color: "var(--text-muted)", textDecoration: "underline", background: "none", border: "none", cursor: "pointer" }}
                    >
                      {showPasswordInModal ? "Hide" : "Show"}
                    </button>
                  </div>
                  <input
                    type={showPasswordInModal ? "text" : "password"}
                    required
                    placeholder="e.g. securePass123"
                    value={pin}
                    onChange={(e) => setPin(e.target.value)}
                    style={modalInputStyle}
                  />
                </div>
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "1fr", gap: 12, marginBottom: 14 }}>
                <div>
                  <label style={modalLabelStyle}>Assigned Section</label>
                  <select
                    value={section}
                    onChange={(e) => setSection(e.target.value)}
                    style={modalInputStyle}
                  >
                    <option value="Main Dining">Main Dining</option>
                    <option value="Terrace & Garden">Terrace & Garden</option>
                    <option value="Cocktail Bar">Cocktail Bar</option>
                    <option value="VIP Lounge">VIP Lounge</option>
                    <option value="Banquet Hall">Banquet Hall</option>
                  </select>
                </div>
              </div>

              <div style={{ marginBottom: 16 }}>
                <label style={modalLabelStyle}>Phone Number (Optional)</label>
                <input
                  type="tel"
                  placeholder="+251 9..."
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  style={modalInputStyle}
                />
              </div>

              <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 24 }}>
                <input
                  type="checkbox"
                  id="dutyCheck"
                  checked={startOnDuty}
                  onChange={(e) => setStartOnDuty(e.target.checked)}
                  style={{ width: 16, height: 16, accentColor: "var(--brass)" }}
                />
                <label htmlFor="dutyCheck" style={{ fontSize: 13, color: "var(--text-secondary)", cursor: "pointer" }}>
                  Activate and place on duty immediately
                </label>
              </div>

              {createError && (
                <div style={{ color: "var(--alert)", fontSize: 13, marginBottom: 12, padding: "8px 12px", background: "var(--alert-soft)", borderRadius: "var(--radius-sm)", border: "1px solid var(--alert-border)" }}>
                  ⚠️ {createError}
                </div>
              )}

              <div style={{ display: "flex", gap: 12 }}>
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  disabled={creating}
                  style={{
                    flex: 1,
                    padding: "12px",
                    borderRadius: "var(--radius-md)",
                    border: "1px solid var(--line)",
                    color: "var(--text-muted)",
                    fontSize: 14,
                    fontWeight: 600,
                    opacity: creating ? 0.5 : 1,
                  }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={creating}
                  style={{
                    flex: 1,
                    padding: "12px",
                    borderRadius: "var(--radius-md)",
                    background: "var(--brass)",
                    color: "var(--ink)",
                    fontSize: 14,
                    fontWeight: 700,
                    opacity: creating ? 0.7 : 1,
                    cursor: creating ? "not-allowed" : "pointer",
                  }}
                >
                  {creating ? "Creating..." : "Save Waiter Profile"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

// Inline styling helpers
const statBoxStyle: React.CSSProperties = {
  background: "var(--panel)",
  border: "1px solid var(--line)",
  borderRadius: "var(--radius-md)",
  padding: "16px 18px",
};

const statLabelStyle: React.CSSProperties = {
  fontSize: 12,
  fontWeight: 600,
  color: "var(--text-muted)",
  marginBottom: 6,
};

const statValueStyle: React.CSSProperties = {
  fontSize: 24,
  fontWeight: 700,
  color: "var(--text)",
};

const statSubStyle: React.CSSProperties = {
  fontSize: 11,
  color: "var(--text-dim)",
  marginTop: 4,
};

const pillStyle: React.CSSProperties = {
  fontSize: 12,
  padding: "3px 8px",
  borderRadius: 6,
  background: "var(--panel-raised)",
  color: "var(--text-secondary)",
  border: "1px solid var(--line)",
};

function filterTabStyle(isActive: boolean): React.CSSProperties {
  return {
    padding: "8px 14px",
    borderRadius: "var(--radius-sm)",
    fontSize: 12,
    fontWeight: 600,
    background: isActive ? "var(--brass-soft)" : "transparent",
    color: isActive ? "var(--brass)" : "var(--text-muted)",
    border: isActive ? "1px solid var(--brass-border)" : "1px solid transparent",
    cursor: "pointer",
    transition: "all 0.2s ease",
  };
}

const modalLabelStyle: React.CSSProperties = {
  display: "block",
  fontSize: 12,
  fontWeight: 600,
  color: "var(--text-secondary)",
  marginBottom: 6,
};

const modalInputStyle: React.CSSProperties = {
  width: "100%",
  padding: "10px 14px",
  borderRadius: "var(--radius-sm)",
  background: "var(--panel-raised)",
  border: "1px solid var(--line)",
  color: "var(--text)",
  fontSize: 14,
  outline: "none",
};
