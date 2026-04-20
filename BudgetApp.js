import React, { useState, useMemo } from "react";
import {
  PieChart, Pie, Cell, Tooltip as RechartsTip, ResponsiveContainer,
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Legend,
  LineChart, Line, ReferenceLine, Area, AreaChart,
} from "recharts";

/* ─────────────────────────────────────────────────────────
   DESIGN TOKENS  (mirrors App.js exactly)
───────────────────────────────────────────────────────── */
const T = {
  night:    "#07111f",
  dark:     "#0d1b2a",
  navy:     "#112236",
  slate:    "#1b3050",
  teal:     "#00c9a7",
  tealDim:  "rgba(0,201,167,0.10)",
  tealGlow: "rgba(0,201,167,0.22)",
  amber:    "#f5a623",
  amberDim: "rgba(245,166,35,0.10)",
  green:    "#27ae60",
  greenDim: "rgba(39,174,96,0.10)",
  red:      "#e74c3c",
  redDim:   "rgba(231,76,60,0.10)",
  purple:   "#8e44ad",
  blue:     "#3498db",
  white:    "#ffffff",
  offWhite: "#dde8f4",
  muted:    "#6b8aaa",
  faint:    "#2e4a68",
  bg:       "#f0f5fb",
  surface:  "#ffffff",
  border:   "#dde6ef",
  text:     "#1a2b3c",
};

/* ─────────────────────────────────────────────────────────
   SHARED STYLE PRIMITIVES
───────────────────────────────────────────────────────── */
const F = {
  serif:  "'DM Serif Display', Georgia, serif",
  sans:   "'DM Sans', system-ui, sans-serif",
  mono:   "'Fira Code', 'Courier New', monospace",
};

const card = (extra = {}) => ({
  background: T.surface,
  borderRadius: 14,
  border: `1px solid ${T.border}`,
  boxShadow: "0 2px 12px rgba(0,0,0,0.05)",
  overflow: "hidden",
  ...extra,
});

const cardBody = (extra = {}) => ({
  padding: "1.5rem",
  ...extra,
});

const cardHead = (accent = T.teal) => ({
  background: T.dark,
  padding: "1rem 1.5rem",
  borderBottom: `2px solid ${accent}`,
  display: "flex",
  alignItems: "center",
  gap: "0.6rem",
});

const label = {
  display: "block",
  fontFamily: F.mono,
  fontSize: "0.67rem",
  fontWeight: 500,
  letterSpacing: "0.1em",
  textTransform: "uppercase",
  color: T.muted,
  marginBottom: "0.35rem",
};

const inp = (focus = T.teal) => ({
  width: "100%",
  padding: "0.62rem 0.9rem",
  border: `1.5px solid ${T.border}`,
  borderRadius: 8,
  fontSize: "0.93rem",
  fontFamily: F.sans,
  color: T.text,
  background: T.bg,
  outline: "none",
  boxSizing: "border-box",
  transition: "border-color 0.18s",
});

const btn = (bg = T.dark, small = false, outline = false) => ({
  padding: small ? "0.42rem 1rem" : "0.68rem 1.5rem",
  background: outline ? "transparent" : bg,
  color: outline ? bg : bg === T.bg ? T.text : T.white,
  border: outline ? `1.5px solid ${bg}` : "none",
  borderRadius: 8,
  cursor: "pointer",
  fontFamily: F.sans,
  fontWeight: 700,
  fontSize: small ? "0.79rem" : "0.87rem",
  transition: "opacity 0.18s, transform 0.12s",
  whiteSpace: "nowrap",
  letterSpacing: "0.01em",
});

/* ─────────────────────────────────────────────────────────
   SHARED SMALL COMPONENTS
───────────────────────────────────────────────────────── */

/** Metric tile used across all tools */
const Metric = ({ label: lbl, value, sub, color = T.teal, icon }) => (
  <div style={{
    background: T.surface,
    border: `1px solid ${T.border}`,
    borderTop: `3px solid ${color}`,
    borderRadius: 12,
    padding: "1.1rem 1.2rem",
    textAlign: "center",
  }}>
    {icon && <div style={{ fontSize: "1.3rem", marginBottom: "0.35rem" }}>{icon}</div>}
    <p style={{ fontFamily: F.mono, fontSize: "0.62rem", color: T.muted, letterSpacing: "0.1em", textTransform: "uppercase", margin: "0 0 0.3rem" }}>{lbl}</p>
    <p style={{ fontFamily: F.serif, fontSize: "1.5rem", color, margin: "0 0 0.2rem", letterSpacing: "-0.02em" }}>{value}</p>
    {sub && <p style={{ fontFamily: F.sans, fontSize: "0.72rem", color: T.muted, margin: 0 }}>{sub}</p>}
  </div>
);

/** Horizontal progress bar */
const Bar_ = ({ pct, color = T.teal, height = 8, animated = true }) => (
  <div style={{ background: `${color}22`, borderRadius: 99, height, overflow: "hidden" }}>
    <div style={{
      width: `${Math.min(Math.max(pct, 0), 100)}%`,
      height: "100%",
      background: color,
      borderRadius: 99,
      transition: animated ? "width 0.5s cubic-bezier(0.4,0,0.2,1)" : "none",
    }} />
  </div>
);

/** Section heading with serif font */
const SectionHead = ({ icon, title, sub, accent = T.teal }) => (
  <div style={{ marginBottom: "1.75rem" }}>
    <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", marginBottom: "0.3rem" }}>
      <span style={{ fontSize: "1.3rem" }}>{icon}</span>
      <h2 style={{ fontFamily: F.serif, fontSize: "1.65rem", color: T.dark, margin: 0, letterSpacing: "-0.02em", fontWeight: 400 }}>
        {title}
      </h2>
    </div>
    {sub && <p style={{ fontFamily: F.sans, fontSize: "0.87rem", color: T.muted, margin: "0 0 0 1.85rem", lineHeight: 1.6 }}>{sub}</p>}
    <div style={{ height: 2, width: 48, background: accent, borderRadius: 99, marginTop: "0.75rem", marginLeft: "1.85rem" }} />
  </div>
);

/** Tooltip for recharts */
const ChartTip = ({ active, payload, label: lb, prefix = "$", suffix = "" }) => {
  if (!active || !payload?.length) return null;
  return (
    <div style={{ background: T.dark, border: `1px solid ${T.faint}`, borderRadius: 8, padding: "0.6rem 0.9rem", fontFamily: F.sans, fontSize: "0.82rem" }}>
      {lb && <p style={{ color: T.muted, margin: "0 0 0.3rem", fontFamily: F.mono, fontSize: "0.68rem" }}>{lb}</p>}
      {payload.map((p, i) => (
        <p key={i} style={{ color: p.color || T.teal, margin: "0.1rem 0", fontWeight: 700 }}>
          {p.name}: {prefix}{typeof p.value === "number" ? p.value.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 }) : p.value}{suffix}
        </p>
      ))}
    </div>
  );
};

/* ══════════════════════════════════════════════════════════
   1 — BASIC BUDGET
══════════════════════════════════════════════════════════ */
const EXPENSE_CATS = [
  { key: "housing",        label: "Housing",            icon: "🏠", color: "#3498db" },
  { key: "food",           label: "Food & Groceries",   icon: "🛒", color: "#27ae60" },
  { key: "transportation", label: "Transportation",      icon: "🚗", color: "#e67e22" },
  { key: "utilities",      label: "Utilities",           icon: "💡", color: "#9b59b6" },
  { key: "healthcare",     label: "Healthcare",          icon: "🏥", color: T.red },
  { key: "insurance",      label: "Insurance",           icon: "🛡️", color: "#1abc9c" },
  { key: "entertainment",  label: "Entertainment",       icon: "🎬", color: T.amber },
  { key: "clothing",       label: "Clothing",            icon: "👗", color: "#e91e63" },
  { key: "education",      label: "Education",           icon: "🎓", color: "#00bcd4" },
  { key: "savings",        label: "Savings",             icon: "🏦", color: T.teal },
  { key: "debt",           label: "Debt Payments",       icon: "💳", color: "#f44336" },
  { key: "personal",       label: "Personal Care",       icon: "✨", color: "#ff9800" },
  { key: "subscriptions",  label: "Subscriptions",       icon: "📱", color: "#673ab7" },
  { key: "childcare",      label: "Childcare / Pets",    icon: "👶", color: "#4caf50" },
  { key: "travel",         label: "Travel",              icon: "✈️", color: "#2196f3" },
  { key: "other",          label: "Other",               icon: "📦", color: "#78909c" },
];

function BasicBudget() {
  const [income, setIncome] = useState("");
  const [exp, setExp] = useState(Object.fromEntries(EXPENSE_CATS.map(c => [c.key, ""])));

  const inc   = parseFloat(income) || 0;
  const total = EXPENSE_CATS.reduce((s, c) => s + (parseFloat(exp[c.key]) || 0), 0);
  const left  = inc - total;
  const pct   = inc > 0 ? Math.min((total / inc) * 100, 100) : 0;
  const savingsRate = inc > 0 ? Math.max((left / inc) * 100, 0) : 0;

  const healthScore = useMemo(() => {
    if (!inc) return null;
    let score = 100;
    if (total > inc)        score -= 40;
    if (savingsRate < 10)   score -= 20;
    if (savingsRate < 5)    score -= 15;
    const housingPct = ((parseFloat(exp.housing) || 0) / inc) * 100;
    if (housingPct > 40)    score -= 15;
    if (housingPct > 50)    score -= 10;
    return Math.max(score, 0);
  }, [inc, total, savingsRate, exp]);

  const healthLabel = healthScore === null ? null
    : healthScore >= 80 ? { label: "Excellent", color: T.green }
    : healthScore >= 60 ? { label: "Good",      color: T.teal }
    : healthScore >= 40 ? { label: "Fair",      color: T.amber }
    :                     { label: "Needs Work", color: T.red };

  const pieData = EXPENSE_CATS
    .filter(c => parseFloat(exp[c.key]) > 0)
    .map(c => ({ name: c.label, value: parseFloat(exp[c.key]), color: c.color }));

  const CustomPieTip = ({ active, payload }) => {
    if (!active || !payload?.length) return null;
    const d = payload[0];
    return (
      <div style={{ background: T.dark, border: `1px solid ${T.faint}`, borderRadius: 8, padding: "0.6rem 0.9rem", fontFamily: F.sans, fontSize: "0.82rem" }}>
        <p style={{ color: d.payload.color, fontWeight: 700, margin: 0 }}>{d.name}</p>
        <p style={{ color: T.offWhite, margin: "0.2rem 0 0" }}>${d.value.toFixed(2)} · {inc > 0 ? ((d.value / inc) * 100).toFixed(1) : 0}% of income</p>
      </div>
    );
  };

  return (
    <div>
      <SectionHead icon="📋" title="Detailed Monthly Budget" accent={T.teal}
        sub="Track all 16 spending categories against your income to see exactly where every dollar goes." />

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1.5fr", gap: "1.5rem", marginBottom: "1.5rem" }}>

        {/* ── Income + summary ── */}
        <div style={{ display: "flex", flexDirection: "column", gap: "1.25rem" }}>

          <div style={card()}>
            <div style={cardHead(T.teal)}>
              <span style={{ fontFamily: F.mono, fontSize: "0.65rem", color: T.teal, letterSpacing: "0.12em" }}>MONTHLY INCOME</span>
            </div>
            <div style={cardBody()}>
              <label style={label}>Take-Home Pay (after tax)</label>
              <input style={inp()} type="number" placeholder="e.g. 5,000"
                value={income} onChange={e => setIncome(e.target.value)} />
              {inc > 0 && (
                <p style={{ fontFamily: F.mono, fontSize: "0.68rem", color: T.muted, marginTop: "0.5rem" }}>
                  ${(inc / 12).toFixed(0)}/mo avg → ${(inc * 12).toLocaleString()}/yr
                </p>
              )}
            </div>
          </div>

          {inc > 0 && (
            <div style={card()}>
              <div style={cardHead(healthLabel?.color || T.teal)}>
                <span style={{ fontFamily: F.mono, fontSize: "0.65rem", color: healthLabel?.color || T.teal, letterSpacing: "0.12em" }}>BUDGET HEALTH</span>
              </div>
              <div style={cardBody()}>
                {healthScore !== null && (
                  <div style={{ textAlign: "center", marginBottom: "1.25rem" }}>
                    <p style={{ fontFamily: F.serif, fontSize: "3rem", color: healthLabel.color, margin: "0 0 0.1rem", letterSpacing: "-0.03em" }}>{healthScore}</p>
                    <p style={{ fontFamily: F.mono, fontSize: "0.7rem", color: healthLabel.color, letterSpacing: "0.1em" }}>{healthLabel.label.toUpperCase()}</p>
                    <Bar_ pct={healthScore} color={healthLabel.color} height={6} />
                  </div>
                )}
                {[
                  { l: "Total Income",   v: `$${inc.toLocaleString()}`,        c: T.text  },
                  { l: "Total Expenses", v: `$${total.toFixed(2)}`,            c: total > inc ? T.red : T.text },
                  { l: "Remaining",      v: `${left >= 0 ? "+" : ""}$${left.toFixed(2)}`, c: left >= 0 ? T.teal : T.red },
                  { l: "Savings Rate",   v: `${savingsRate.toFixed(1)}%`,      c: savingsRate >= 20 ? T.green : savingsRate >= 10 ? T.amber : T.red },
                ].map((r, i) => (
                  <div key={i} style={{ display: "flex", justifyContent: "space-between", padding: "0.55rem 0", borderBottom: i < 3 ? `1px solid ${T.border}` : "none" }}>
                    <span style={{ fontFamily: F.sans, fontSize: "0.83rem", color: T.muted }}>{r.l}</span>
                    <span style={{ fontFamily: F.mono, fontSize: "0.83rem", fontWeight: 700, color: r.c }}>{r.v}</span>
                  </div>
                ))}
                <div style={{ marginTop: "1rem" }}>
                  <Bar_ pct={pct} color={total > inc ? T.red : T.teal} height={10} />
                  <p style={{ fontFamily: F.mono, fontSize: "0.65rem", color: T.muted, marginTop: "0.4rem" }}>
                    {pct.toFixed(1)}% of income allocated
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Donut chart */}
          {pieData.length > 0 && (
            <div style={card()}>
              <div style={cardHead(T.amber)}>
                <span style={{ fontFamily: F.mono, fontSize: "0.65rem", color: T.amber, letterSpacing: "0.12em" }}>SPENDING BREAKDOWN</span>
              </div>
              <div style={cardBody({ paddingTop: "1rem" })}>
                <ResponsiveContainer width="100%" height={200}>
                  <PieChart>
                    <Pie data={pieData} cx="50%" cy="50%" innerRadius={55} outerRadius={85} paddingAngle={2} dataKey="value">
                      {pieData.map((d, i) => <Cell key={i} fill={d.color} stroke="none" />)}
                    </Pie>
                    <RechartsTip content={<CustomPieTip />} />
                  </PieChart>
                </ResponsiveContainer>
                <div style={{ display: "flex", flexWrap: "wrap", gap: "0.4rem", marginTop: "0.5rem" }}>
                  {pieData.map((d, i) => (
                    <span key={i} style={{ display: "flex", alignItems: "center", gap: "0.3rem", fontSize: "0.72rem", fontFamily: F.sans }}>
                      <span style={{ width: 8, height: 8, borderRadius: 2, background: d.color, display: "inline-block" }} />
                      <span style={{ color: T.muted }}>{d.name.split(" ")[0]}</span>
                    </span>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* ── Expense inputs ── */}
        <div style={card()}>
          <div style={cardHead(T.teal)}>
            <span style={{ fontFamily: F.mono, fontSize: "0.65rem", color: T.teal, letterSpacing: "0.12em" }}>MONTHLY EXPENSES</span>
          </div>
          <div style={cardBody()}>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem" }}>
              {EXPENSE_CATS.map(c => {
                const val = parseFloat(exp[c.key]) || 0;
                const incPct = inc > 0 && val > 0 ? ((val / inc) * 100).toFixed(1) : null;
                return (
                  <div key={c.key}>
                    <label style={{ ...label, color: val > 0 ? c.color : T.muted }}>
                      {c.icon} {c.label}
                      {incPct && <span style={{ marginLeft: "0.4rem", color: T.muted, fontWeight: 400 }}>{incPct}%</span>}
                    </label>
                    <input
                      style={{ ...inp(), borderColor: val > 0 ? `${c.color}55` : T.border }}
                      type="number" placeholder="0.00"
                      value={exp[c.key]}
                      onChange={e => setExp(p => ({ ...p, [c.key]: e.target.value }))}
                    />
                    {val > 0 && <Bar_ pct={incPct} color={c.color} height={3} />}
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ══════════════════════════════════════════════════════════
   2 — 50/30/20
══════════════════════════════════════════════════════════ */
function FiftyThirtyTwenty() {
  const [income, setIncome] = useState("");
  const [needs,  setNeeds]  = useState("");
  const [wants,  setWants]  = useState("");
  const [saves,  setSaves]  = useState("");

  const inc = parseFloat(income) || 0;
  const targets = { needs: inc * 0.5, wants: inc * 0.3, saves: inc * 0.2 };
  const actuals  = {
    needs: parseFloat(needs) || 0,
    wants: parseFloat(wants) || 0,
    saves: parseFloat(saves) || 0,
  };
  const totalSpent = actuals.needs + actuals.wants + actuals.saves;
  const unassigned = inc - totalSpent;

  const CATS = [
    { key: "needs", label: "Needs",           pct: "50%", color: T.blue,   setter: setNeeds, val: needs, icon: "🏡",
      desc: "Housing, food, utilities, transport, minimum debt payments — essentials you can't skip." },
    { key: "wants", label: "Wants",           pct: "30%", color: T.amber,  setter: setWants, val: wants, icon: "🎯",
      desc: "Dining out, hobbies, travel, entertainment — lifestyle spending that enriches life." },
    { key: "saves", label: "Savings & Debt",  pct: "20%", color: T.teal,   setter: setSaves, val: saves, icon: "🚀",
      desc: "Emergency fund, investments, retirement contributions, and extra debt payoff." },
  ];

  const barData = CATS.map(c => ({
    name: c.label,
    Target:  parseFloat(targets[c.key].toFixed(2)),
    Actual:  parseFloat(actuals[c.key].toFixed(2)),
    color:   c.color,
  }));

  return (
    <div>
      <SectionHead icon="⚖️" title="The 50 / 30 / 20 Rule" accent={T.amber}
        sub="50% of take-home → Needs. 30% → Wants. 20% → Savings & debt repayment. The simplest path to financial balance." />

      <div style={{ ...card(), maxWidth: 420, marginBottom: "1.75rem" }}>
        <div style={cardHead(T.amber)}>
          <span style={{ fontFamily: F.mono, fontSize: "0.65rem", color: T.amber, letterSpacing: "0.12em" }}>MONTHLY INCOME</span>
        </div>
        <div style={cardBody()}>
          <label style={label}>Take-Home Pay</label>
          <input style={inp(T.amber)} type="number" placeholder="e.g. 5,000"
            value={income} onChange={e => setIncome(e.target.value)} />
        </div>
      </div>

      {inc > 0 && (
        <>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", gap: "1.25rem", marginBottom: "1.75rem" }}>
            {CATS.map(c => {
              const target  = targets[c.key];
              const actual  = actuals[c.key];
              const over    = actual > 0 && actual > target;
              const under   = actual > 0 && actual <= target;
              const fillPct = target > 0 ? Math.min((actual / target) * 100, 110) : 0;

              return (
                <div key={c.key} style={card()}>
                  <div style={{ ...cardHead(c.color), justifyContent: "space-between" }}>
                    <span style={{ fontFamily: F.mono, fontSize: "0.65rem", color: c.color, letterSpacing: "0.12em" }}>
                      {c.icon} {c.label.toUpperCase()}
                    </span>
                    <span style={{ fontFamily: F.serif, fontSize: "1rem", color: c.color }}>{c.pct}</span>
                  </div>
                  <div style={cardBody()}>
                    <p style={{ fontFamily: F.serif, fontSize: "1.9rem", color: c.color, margin: "0 0 0.15rem", letterSpacing: "-0.03em" }}>
                      ${target.toFixed(0)}
                    </p>
                    <p style={{ fontFamily: F.sans, fontSize: "0.78rem", color: T.muted, margin: "0 0 1.1rem", lineHeight: 1.55 }}>{c.desc}</p>

                    <label style={label}>Your actual spending</label>
                    <input style={{ ...inp(c.color), marginBottom: "0.75rem" }}
                      type="number" placeholder={`Max $${target.toFixed(0)}`}
                      value={c.val} onChange={e => c.setter(e.target.value)} />

                    {actual > 0 && (
                      <>
                        <Bar_ pct={fillPct} color={over ? T.red : c.color} height={10} />
                        <div style={{ display: "flex", justifyContent: "space-between", marginTop: "0.45rem" }}>
                          <span style={{ fontFamily: F.mono, fontSize: "0.68rem", color: over ? T.red : T.green, fontWeight: 700 }}>
                            {over
                              ? `▲ $${(actual - target).toFixed(0)} over`
                              : `▼ $${(target - actual).toFixed(0)} remaining`}
                          </span>
                          <span style={{ fontFamily: F.mono, fontSize: "0.68rem", color: T.muted }}>
                            {fillPct.toFixed(0)}% used
                          </span>
                        </div>
                      </>
                    )}
                  </div>
                </div>
              );
            })}
          </div>

          {/* Bar chart: target vs actual */}
          {totalSpent > 0 && (
            <div style={{ ...card(), marginBottom: "1.75rem" }}>
              <div style={cardHead(T.amber)}>
                <span style={{ fontFamily: F.mono, fontSize: "0.65rem", color: T.amber, letterSpacing: "0.12em" }}>TARGET VS ACTUAL</span>
              </div>
              <div style={cardBody()}>
                <ResponsiveContainer width="100%" height={220}>
                  <BarChart data={barData} barGap={6} barCategoryGap="35%">
                    <CartesianGrid strokeDasharray="3 3" stroke={T.border} vertical={false} />
                    <XAxis dataKey="name" tick={{ fontFamily: F.sans, fontSize: 12, fill: T.muted }} axisLine={false} tickLine={false} />
                    <YAxis tickFormatter={v => `$${v >= 1000 ? (v/1000).toFixed(1)+"k" : v}`} tick={{ fontFamily: F.mono, fontSize: 10, fill: T.muted }} axisLine={false} tickLine={false} width={60} />
                    <RechartsTip content={<ChartTip />} />
                    <Legend wrapperStyle={{ fontFamily: F.sans, fontSize: "0.8rem", color: T.muted }} />
                    <Bar dataKey="Target" fill={T.faint}     radius={[4,4,0,0]} />
                    <Bar dataKey="Actual" fill={T.amber} radius={[4,4,0,0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          )}

          {/* Summary totals */}
          {totalSpent > 0 && (
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(160px, 1fr))", gap: "1rem" }}>
              <Metric label="Income"      value={`$${inc.toFixed(0)}`}           color={T.text}  />
              <Metric label="Allocated"   value={`$${totalSpent.toFixed(0)}`}    color={T.blue}  />
              <Metric label="Unassigned"  value={`$${Math.max(unassigned,0).toFixed(0)}`}  color={unassigned >= 0 ? T.teal : T.red} />
              <Metric label="Over Budget" value={unassigned < 0 ? `$${Math.abs(unassigned).toFixed(0)}` : "—"} color={T.red} />
            </div>
          )}
        </>
      )}
    </div>
  );
}

/* ══════════════════════════════════════════════════════════
   3 — DEBT PAYOFF
══════════════════════════════════════════════════════════ */
function DebtPayoff() {
  const [debts, setDebts] = useState([
    { id: 1, name: "Credit Card A", balance: "", rate: "", min: "" },
  ]);
  const [extra,    setExtra]   = useState("");
  const [strategy, setStrat]   = useState("avalanche");
  const [results,  setResults] = useState(null);

  const addDebt    = () => setDebts(d => [...d, { id: Date.now(), name: "", balance: "", rate: "", min: "" }]);
  const removeDebt = id => setDebts(d => d.filter(x => x.id !== id));
  const update     = (id, f, v) => setDebts(d => d.map(x => x.id === id ? { ...x, [f]: v } : x));

  const simulate = () => {
    const valid = debts
      .filter(d => parseFloat(d.balance) > 0 && parseFloat(d.rate) >= 0)
      .map(d => ({
        name:    d.name || "Debt",
        balance: parseFloat(d.balance),
        rate:    parseFloat(d.rate) / 100 / 12,
        min:     parseFloat(d.min) || Math.max(parseFloat(d.balance) * 0.02, 25),
      }));
    if (!valid.length) return;

    const extraAmt = parseFloat(extra) || 0;

    /* Run simulation and capture monthly balances for chart */
    const runSim = (dList, withExtra) => {
      let bals    = dList.map(d => d.balance);
      let months  = 0;
      let totalInt = 0;
      const CAP   = 600;
      const chartData = [{ month: 0, balance: bals.reduce((s, b) => s + b, 0) }];

      while (bals.some(b => b > 0.01) && months < CAP) {
        months++;
        // accrue interest
        bals = bals.map((b, i) => {
          const interest = b > 0 ? b * dList[i].rate : 0;
          totalInt += interest;
          return b > 0 ? b + interest : 0;
        });

        let avail = dList.reduce((s, d) => s + d.min, 0) + (withExtra ? extraAmt : 0);

        // pay minimums
        bals = bals.map((b, i) => {
          if (b <= 0) return 0;
          const p = Math.min(dList[i].min, b);
          avail -= p;
          return b - p;
        });

        // apply extra to target
        for (let i = 0; i < bals.length && avail > 0.01; i++) {
          if (bals[i] > 0) {
            const p = Math.min(avail, bals[i]);
            bals[i] -= p;
            avail    -= p;
          }
        }

        bals = bals.map(b => Math.max(b, 0));
        if (months % 3 === 0 || months <= 12)
          chartData.push({ month: months, balance: parseFloat(bals.reduce((s, b) => s + b, 0).toFixed(2)) });
      }

      if (chartData[chartData.length - 1].month !== months)
        chartData.push({ month: months, balance: 0 });

      return { months, totalInt, chartData };
    };

    let ordered = [...valid];
    if (strategy === "avalanche") ordered.sort((a, b) => b.rate - a.rate);
    else                          ordered.sort((a, b) => a.balance - b.balance);

    const withEx   = runSim(ordered, true);
    const withoutEx = runSim(ordered, false);

    setResults({
      months:      withEx.months,
      totalInt:    withEx.totalInt,
      baseMonths:  withoutEx.months,
      baseTotalInt: withoutEx.totalInt,
      totalDebt:   valid.reduce((s, d) => s + d.balance, 0),
      order:       ordered.map(d => d.name),
      chartWith:   withEx.chartData,
      chartBase:   withoutEx.chartData,
    });
  };

  return (
    <div>
      <SectionHead icon="💳" title="Debt Payoff Planner" accent={T.red}
        sub="Choose your strategy, simulate your payoff timeline, and see exactly how much you save with extra payments." />

      {/* Strategy selector */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem", marginBottom: "1.75rem", maxWidth: 640 }}>
        {[
          { k: "avalanche", icon: "⚡", label: "Avalanche",  sub: "Highest interest rate first — saves the most money overall" },
          { k: "snowball",  icon: "❄️", label: "Snowball",   sub: "Smallest balance first — builds momentum and motivation" },
        ].map(s => (
          <div key={s.k} onClick={() => setStrat(s.k)} style={{
            ...card(),
            cursor: "pointer",
            border: `1.5px solid ${strategy === s.k ? T.red : T.border}`,
            background: strategy === s.k ? T.redDim : T.surface,
            transition: "all 0.2s",
          }}>
            <div style={cardBody({ padding: "1.1rem 1.25rem" })}>
              <p style={{ fontFamily: F.mono, fontSize: "0.75rem", color: strategy === s.k ? T.red : T.muted, fontWeight: 700, margin: "0 0 0.25rem" }}>
                {s.icon} {s.label.toUpperCase()}
              </p>
              <p style={{ fontFamily: F.sans, fontSize: "0.8rem", color: T.muted, margin: 0, lineHeight: 1.5 }}>{s.sub}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Debts table */}
      <div style={{ ...card(), marginBottom: "1.5rem" }}>
        <div style={{ ...cardHead(T.red), justifyContent: "space-between" }}>
          <span style={{ fontFamily: F.mono, fontSize: "0.65rem", color: T.red, letterSpacing: "0.12em" }}>YOUR DEBTS</span>
          <button onClick={addDebt} style={{ ...btn(T.red, true), display: "flex", alignItems: "center", gap: "0.3rem" }}>+ Add Debt</button>
        </div>
        <div style={cardBody()}>
          <div style={{ overflowX: "auto" }}>
            <div style={{ display: "grid", gridTemplateColumns: "2fr 1.4fr 1.4fr 1.4fr 36px", gap: "0.6rem", minWidth: 520 }}>
              {["Debt Name", "Balance ($)", "Rate (%/yr)", "Min. Payment ($)", ""].map((h, i) => (
                <p key={i} style={{ fontFamily: F.mono, fontSize: "0.62rem", color: T.muted, letterSpacing: "0.08em", margin: "0 0 0.4rem" }}>{h}</p>
              ))}
              {debts.map(d => (
                <React.Fragment key={d.id}>
                  <input style={inp(T.red)} placeholder="e.g. Visa Card"   value={d.name}    onChange={e => update(d.id, "name",    e.target.value)} />
                  <input style={inp(T.red)} type="number" placeholder="5000" value={d.balance} onChange={e => update(d.id, "balance", e.target.value)} />
                  <input style={inp(T.red)} type="number" placeholder="19.9" value={d.rate}    onChange={e => update(d.id, "rate",    e.target.value)} />
                  <input style={inp(T.red)} type="number" placeholder="100"  value={d.min}     onChange={e => update(d.id, "min",     e.target.value)} />
                  <button onClick={() => removeDebt(d.id)} style={{ background: "none", border: "none", cursor: "pointer", color: T.red, fontSize: "1.3rem", padding: 0, alignSelf: "center" }}>×</button>
                </React.Fragment>
              ))}
            </div>
          </div>

          <div style={{ marginTop: "1.25rem", display: "flex", gap: "1rem", alignItems: "flex-end", flexWrap: "wrap" }}>
            <div style={{ flex: 1, minWidth: 200 }}>
              <label style={label}>Extra Monthly Payment ($)</label>
              <input style={inp(T.teal)} type="number" placeholder="e.g. 200" value={extra} onChange={e => setExtra(e.target.value)} />
            </div>
            <button onClick={simulate} style={btn(T.dark)}>Calculate Payoff →</button>
          </div>
        </div>
      </div>

      {results && (
        <>
          {/* Metrics */}
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(155px, 1fr))", gap: "1rem", marginBottom: "1.5rem" }}>
            <Metric icon="🏁" label="Debt-Free In"    value={`${results.months} mo`}  sub={`${(results.months/12).toFixed(1)} years`}   color={T.teal} />
            <Metric icon="💸" label="Interest Paid"   value={`$${results.totalInt.toFixed(0)}`} sub="with extra payments"              color={T.amber} />
            <Metric icon="⏱️" label="Months Saved"    value={`${Math.max(results.baseMonths - results.months, 0)}`} sub="vs. minimums only" color={T.blue} />
            <Metric icon="💰" label="Interest Saved"  value={`$${Math.max(results.baseTotalInt - results.totalInt, 0).toFixed(0)}`} sub="vs. minimums only" color={T.green} />
          </div>

          {/* Payoff order */}
          <div style={{ ...card(), marginBottom: "1.5rem" }}>
            <div style={cardHead(T.red)}>
              <span style={{ fontFamily: F.mono, fontSize: "0.65rem", color: T.red, letterSpacing: "0.12em" }}>
                PAYOFF ORDER — {strategy === "avalanche" ? "AVALANCHE" : "SNOWBALL"}
              </span>
            </div>
            <div style={cardBody()}>
              <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", flexWrap: "wrap" }}>
                {results.order.map((name, i) => (
                  <React.Fragment key={i}>
                    <span style={{
                      padding: "0.35rem 0.85rem",
                      background: T.redDim,
                      border: `1px solid ${T.red}44`,
                      borderRadius: 20,
                      fontFamily: F.sans,
                      fontSize: "0.83rem",
                      fontWeight: 700,
                      color: T.red,
                    }}>
                      {i + 1}. {name}
                    </span>
                    {i < results.order.length - 1 && (
                      <span style={{ color: T.muted, fontFamily: F.mono }}>→</span>
                    )}
                  </React.Fragment>
                ))}
              </div>

              {/* Insight box */}
              <div style={{ marginTop: "1rem", padding: "0.85rem 1rem", background: T.tealDim, borderRadius: 8, border: `1px solid ${T.teal}33` }}>
                <p style={{ fontFamily: F.sans, fontSize: "0.84rem", color: T.text, margin: 0 }}>
                  💡 Adding <strong style={{ color: T.teal }}>${parseFloat(extra) || 0}/month</strong> saves{" "}
                  <strong style={{ color: T.teal }}>${Math.max(results.baseTotalInt - results.totalInt, 0).toFixed(0)} in interest</strong>{" "}
                  and eliminates your debt{" "}
                  <strong style={{ color: T.teal }}>{Math.max(results.baseMonths - results.months, 0)} months sooner</strong>.
                </p>
              </div>
            </div>
          </div>

          {/* Payoff timeline chart */}
          <div style={card()}>
            <div style={cardHead(T.red)}>
              <span style={{ fontFamily: F.mono, fontSize: "0.65rem", color: T.red, letterSpacing: "0.12em" }}>PAYOFF TIMELINE</span>
            </div>
            <div style={cardBody()}>
              <ResponsiveContainer width="100%" height={280}>
                <AreaChart margin={{ top: 5, right: 10, left: 5, bottom: 5 }}>
                  <defs>
                    <linearGradient id="baseGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%"  stopColor={T.muted} stopOpacity={0.25} />
                      <stop offset="95%" stopColor={T.muted} stopOpacity={0} />
                    </linearGradient>
                    <linearGradient id="withGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%"  stopColor={T.teal} stopOpacity={0.3} />
                      <stop offset="95%" stopColor={T.teal} stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke={T.border} vertical={false} />
                  <XAxis dataKey="month" type="number"
                    tickFormatter={v => `M${v}`}
                    tick={{ fontFamily: F.mono, fontSize: 10, fill: T.muted }}
                    axisLine={false} tickLine={false}
                    allowDuplicatedCategory={false}
                  />
                  <YAxis tickFormatter={v => `$${v >= 1000 ? (v/1000).toFixed(0)+"k" : v}`}
                    tick={{ fontFamily: F.mono, fontSize: 10, fill: T.muted }}
                    axisLine={false} tickLine={false} width={58} />
                  <RechartsTip content={<ChartTip prefix="$" />} />
                  <Legend wrapperStyle={{ fontFamily: F.sans, fontSize: "0.8rem" }} />
                  <Area
                    data={results.chartBase}
                    type="monotone" dataKey="balance" name="Min Payments Only"
                    stroke={T.muted} strokeWidth={2} fill="url(#baseGrad)" dot={false} />
                  <Area
                    data={results.chartWith}
                    type="monotone" dataKey="balance" name="With Extra Payment"
                    stroke={T.teal} strokeWidth={2.5} fill="url(#withGrad)" dot={false} />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>
        </>
      )}
    </div>
  );
}

/* ══════════════════════════════════════════════════════════
   4 — SAVINGS GOAL
══════════════════════════════════════════════════════════ */
function SavingsGoal() {
  const [goal,    setGoal]    = useState("");
  const [current, setCurrent] = useState("");
  const [monthly, setMonthly] = useState("");
  const [rate,    setRate]    = useState("5");

  const g = parseFloat(goal)    || 0;
  const c = parseFloat(current) || 0;
  const m = parseFloat(monthly) || 0;
  const r = (parseFloat(rate)   || 0) / 100 / 12;

  /* Simulate month-by-month */
  const { months, chartData, milestones } = useMemo(() => {
    if (!g || !m || g <= c) return { months: 0, chartData: [], milestones: [] };

    let bal = c, mo = 0;
    const data = [{ month: 0, balance: parseFloat(c.toFixed(2)), interest: 0, contributions: 0 }];
    let totalInt = 0;

    while (bal < g && mo < 600) {
      mo++;
      const interest = bal * r;
      totalInt += interest;
      bal = bal + interest + m;
      if (mo % 3 === 0 || mo <= 12 || bal >= g) {
        data.push({
          month: mo,
          balance:       parseFloat(Math.min(bal, g).toFixed(2)),
          interest:      parseFloat(totalInt.toFixed(2)),
          contributions: parseFloat((m * mo).toFixed(2)),
        });
      }
    }

    const ms = [0.25, 0.5, 0.75, 1.0].map(pct => {
      const tgt = g * pct;
      if (tgt <= c) return { pct, mo: 0, reached: true };
      let b = c, mo_ = 0;
      while (b < tgt && mo_ < 600) { mo_++; b = b * (1 + r) + m; }
      return { pct, mo: mo_, reached: false };
    });

    return { months: mo, chartData: data, milestones: ms };
  }, [g, c, m, r]);

  const totalContrib = m * months;
  const totalInt     = Math.max(g - c - totalContrib, 0);

  return (
    <div>
      <SectionHead icon="🎯" title="Savings Goal Calculator" accent={T.teal}
        sub="See exactly how compound interest accelerates your path to any financial milestone." />

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(210px, 1fr))", gap: "1rem", marginBottom: "1.75rem" }}>
        {[
          { l: "Savings Goal ($)",          v: goal,    s: setGoal,    p: "e.g. 20,000", h: "The total amount you want to reach" },
          { l: "Current Savings ($)",        v: current, s: setCurrent, p: "e.g. 2,000",  h: "What you have saved already" },
          { l: "Monthly Contribution ($)",   v: monthly, s: setMonthly, p: "e.g. 500",    h: "How much you'll add each month" },
          { l: "Annual Interest Rate (%)",   v: rate,    s: setRate,    p: "5",            h: "HYSA ~4–5% · Index funds ~7–10%" },
        ].map((f, i) => (
          <div key={i} style={card()}>
            <div style={cardBody({ padding: "1.15rem" })}>
              <label style={label}>{f.l}</label>
              <input style={inp(T.teal)} type="number" placeholder={f.p}
                value={f.v} onChange={e => f.s(e.target.value)} />
              <p style={{ fontFamily: F.sans, fontSize: "0.72rem", color: T.muted, margin: "0.4rem 0 0", lineHeight: 1.5 }}>{f.h}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Already reached */}
      {g > 0 && c >= g && (
        <div style={{ ...card(), borderTop: `3px solid ${T.teal}`, textAlign: "center", padding: "2.5rem" }}>
          <p style={{ fontSize: "2.5rem", margin: "0 0 0.5rem" }}>🎉</p>
          <p style={{ fontFamily: F.serif, fontSize: "1.4rem", color: T.teal, margin: "0 0 0.4rem" }}>Goal Already Reached!</p>
          <p style={{ fontFamily: F.sans, fontSize: "0.88rem", color: T.muted }}>
            Your current savings of <strong>${c.toLocaleString()}</strong> already meets or exceeds your target of <strong>${g.toLocaleString()}</strong>.
          </p>
        </div>
      )}

      {months > 0 && (
        <>
          {/* Metrics */}
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(160px, 1fr))", gap: "1rem", marginBottom: "1.75rem" }}>
            <Metric icon="⏳" label="Time to Goal"     value={`${months} mo`}          sub={`${(months/12).toFixed(1)} years`}           color={T.teal}  />
            <Metric icon="💵" label="You Contribute"   value={`$${totalContrib.toLocaleString()}`} sub={`$${m}/mo × ${months} months`}  color={T.blue}  />
            <Metric icon="✨" label="Interest Earned"  value={`$${totalInt.toFixed(0)}`}           sub="free money from compounding"      color={T.amber} />
            <Metric icon="🏆" label="Goal"             value={`$${g.toLocaleString()}`}             sub="your target"                     color={T.green} />
          </div>

          {/* Growth chart */}
          <div style={{ ...card(), marginBottom: "1.75rem" }}>
            <div style={cardHead(T.teal)}>
              <span style={{ fontFamily: F.mono, fontSize: "0.65rem", color: T.teal, letterSpacing: "0.12em" }}>COMPOUND GROWTH CURVE</span>
            </div>
            <div style={cardBody()}>
              <ResponsiveContainer width="100%" height={280}>
                <AreaChart data={chartData} margin={{ top: 5, right: 10, left: 5, bottom: 5 }}>
                  <defs>
                    <linearGradient id="balGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%"  stopColor={T.teal} stopOpacity={0.3} />
                      <stop offset="95%" stopColor={T.teal} stopOpacity={0} />
                    </linearGradient>
                    <linearGradient id="contGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%"  stopColor={T.blue} stopOpacity={0.2} />
                      <stop offset="95%" stopColor={T.blue} stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke={T.border} vertical={false} />
                  <XAxis dataKey="month" tickFormatter={v => `M${v}`}
                    tick={{ fontFamily: F.mono, fontSize: 10, fill: T.muted }} axisLine={false} tickLine={false} />
                  <YAxis tickFormatter={v => `$${v >= 1000 ? (v/1000).toFixed(0)+"k" : v}`}
                    tick={{ fontFamily: F.mono, fontSize: 10, fill: T.muted }} axisLine={false} tickLine={false} width={60} />
                  <RechartsTip content={<ChartTip prefix="$" />} />
                  <Legend wrapperStyle={{ fontFamily: F.sans, fontSize: "0.8rem" }} />
                  <ReferenceLine y={g} stroke={T.green} strokeDasharray="5 4"
                    label={{ value: `Goal $${g.toLocaleString()}`, fill: T.green, fontSize: 11, fontFamily: F.mono, position: "insideTopRight" }} />
                  <Area type="monotone" dataKey="contributions" name="Contributions" stroke={T.blue}  strokeWidth={1.5} fill="url(#contGrad)" dot={false} />
                  <Area type="monotone" dataKey="balance"       name="Total Balance"  stroke={T.teal} strokeWidth={2.5} fill="url(#balGrad)"  dot={false} />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Milestone roadmap */}
          <div style={card()}>
            <div style={cardHead(T.teal)}>
              <span style={{ fontFamily: F.mono, fontSize: "0.65rem", color: T.teal, letterSpacing: "0.12em" }}>MILESTONE ROADMAP</span>
            </div>
            <div style={cardBody()}>
              {milestones.map((ms, i) => {
                const colors = [T.blue, T.teal, T.amber, T.green];
                const clr    = colors[i];
                return (
                  <div key={i} style={{ display: "flex", alignItems: "center", gap: "1rem", marginBottom: i < 3 ? "1rem" : 0 }}>
                    <div style={{
                      width: 48, height: 48, borderRadius: "50%", flexShrink: 0,
                      background: ms.reached ? clr : `${clr}22`,
                      border: `2px solid ${clr}`,
                      display: "flex", alignItems: "center", justifyContent: "center",
                    }}>
                      <span style={{ fontFamily: F.mono, fontSize: "0.72rem", fontWeight: 700, color: ms.reached ? T.white : clr }}>
                        {ms.pct * 100}%
                      </span>
                    </div>
                    <div style={{ flex: 1 }}>
                      <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "0.3rem" }}>
                        <span style={{ fontFamily: F.sans, fontSize: "0.82rem", fontWeight: 700, color: T.dark }}>
                          ${(g * ms.pct).toLocaleString()} saved
                        </span>
                        <span style={{ fontFamily: F.mono, fontSize: "0.72rem", color: ms.reached ? T.green : T.muted }}>
                          {ms.reached ? "✓ Already reached" : `Month ${ms.mo}`}
                        </span>
                      </div>
                      <Bar_ pct={ms.pct * 100} color={clr} height={8} />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </>
      )}
    </div>
  );
}

/* ══════════════════════════════════════════════════════════
   5 — NET WORTH
══════════════════════════════════════════════════════════ */
const ASSETS = [
  { key: "checking",    label: "Checking Account",       icon: "🏦", color: "#3498db" },
  { key: "savings",     label: "Savings / HYSA",         icon: "💵", color: "#27ae60" },
  { key: "investments", label: "Investments & Stocks",   icon: "📈", color: T.teal   },
  { key: "retirement",  label: "401(k) / IRA / Pension", icon: "🌅", color: "#00bcd4" },
  { key: "home",        label: "Home / Real Estate",     icon: "🏠", color: "#9b59b6" },
  { key: "car",         label: "Vehicle(s)",             icon: "🚗", color: "#e67e22" },
  { key: "crypto",      label: "Crypto / Digital",       icon: "₿",  color: T.amber  },
  { key: "business",    label: "Business Equity",        icon: "💼", color: "#1abc9c" },
  { key: "other_a",     label: "Other Assets",           icon: "📦", color: "#78909c" },
];

const LIABILITIES = [
  { key: "mortgage",  label: "Mortgage Balance",  icon: "🏠", color: T.red    },
  { key: "car_loan",  label: "Auto Loan",          icon: "🚗", color: "#e74c3c" },
  { key: "student",   label: "Student Loans",      icon: "🎓", color: "#c0392b" },
  { key: "cards",     label: "Credit Card Debt",   icon: "💳", color: "#e74c3c" },
  { key: "personal",  label: "Personal Loans",     icon: "🤝", color: "#c0392b" },
  { key: "medical",   label: "Medical Debt",       icon: "🏥", color: T.red    },
  { key: "other_l",   label: "Other Debts",        icon: "📋", color: "#e74c3c" },
];

function NetWorth() {
  const [assets, setAssets] = useState(Object.fromEntries(ASSETS.map(a => [a.key, ""])));
  const [liabs,  setLiabs]  = useState(Object.fromEntries(LIABILITIES.map(l => [l.key, ""])));

  const totalA = ASSETS.reduce((s, a) => s + (parseFloat(assets[a.key]) || 0), 0);
  const totalL = LIABILITIES.reduce((s, l) => s + (parseFloat(liabs[l.key]) || 0), 0);
  const nw     = totalA - totalL;
  const ratio  = totalA + totalL > 0 ? (totalA / (totalA + totalL)) * 100 : 0;

  /* Chart data */
  const assetPie = ASSETS
    .filter(a => parseFloat(assets[a.key]) > 0)
    .map(a => ({ name: a.label, value: parseFloat(assets[a.key]), color: a.color }));

  const liabPie = LIABILITIES
    .filter(l => parseFloat(liabs[l.key]) > 0)
    .map(l => ({ name: l.label, value: parseFloat(liabs[l.key]), color: l.color }));

  const barData = [
    ...ASSETS.filter(a => parseFloat(assets[a.key]) > 0).map(a => ({
      name: a.label.split(" ")[0], value: parseFloat(assets[a.key]), type: "Asset", color: a.color,
    })),
    ...LIABILITIES.filter(l => parseFloat(liabs[l.key]) > 0).map(l => ({
      name: l.label.split(" ")[0], value: -parseFloat(liabs[l.key]), type: "Liability", color: l.color,
    })),
  ].sort((a, b) => Math.abs(b.value) - Math.abs(a.value));

  const CustomBarTip = ({ active, payload, label: lb }) => {
    if (!active || !payload?.length) return null;
    const v = payload[0].value;
    return (
      <div style={{ background: T.dark, border: `1px solid ${T.faint}`, borderRadius: 8, padding: "0.6rem 0.9rem", fontFamily: F.sans, fontSize: "0.82rem" }}>
        <p style={{ color: v >= 0 ? T.teal : T.red, fontWeight: 700, margin: 0 }}>
          {lb}: {v >= 0 ? "+" : ""}${Math.abs(v).toLocaleString()}
        </p>
      </div>
    );
  };

  return (
    <div>
      <SectionHead icon="📊" title="Net Worth Tracker" accent={T.purple}
        sub="Net Worth = Everything You Own − Everything You Owe. The single most complete snapshot of your financial health." />

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1.5rem", marginBottom: "1.75rem" }}>

        {/* Assets */}
        <div style={card()}>
          <div style={cardHead(T.green)}>
            <span style={{ fontFamily: F.mono, fontSize: "0.65rem", color: T.green, letterSpacing: "0.12em" }}>🏦 ASSETS — WHAT YOU OWN</span>
          </div>
          <div style={cardBody()}>
            {ASSETS.map(a => {
              const v = parseFloat(assets[a.key]) || 0;
              return (
                <div key={a.key} style={{ marginBottom: "0.9rem" }}>
                  <label style={{ ...label, color: v > 0 ? a.color : T.muted }}>
                    {a.icon} {a.label}
                    {v > 0 && totalA > 0 && (
                      <span style={{ marginLeft: "0.4rem", fontWeight: 400 }}>
                        {((v / totalA) * 100).toFixed(1)}%
                      </span>
                    )}
                  </label>
                  <input style={{ ...inp(), borderColor: v > 0 ? `${a.color}55` : T.border }}
                    type="number" placeholder="0"
                    value={assets[a.key]}
                    onChange={e => setAssets(p => ({ ...p, [a.key]: e.target.value }))} />
                  {v > 0 && totalA > 0 && <Bar_ pct={(v / totalA) * 100} color={a.color} height={3} />}
                </div>
              );
            })}
            {totalA > 0 && (
              <p style={{ fontFamily: F.serif, fontSize: "1.25rem", color: T.green, marginTop: "0.5rem", letterSpacing: "-0.02em" }}>
                Total: ${totalA.toLocaleString()}
              </p>
            )}
          </div>
        </div>

        {/* Liabilities */}
        <div style={card()}>
          <div style={cardHead(T.red)}>
            <span style={{ fontFamily: F.mono, fontSize: "0.65rem", color: T.red, letterSpacing: "0.12em" }}>💳 LIABILITIES — WHAT YOU OWE</span>
          </div>
          <div style={cardBody()}>
            {LIABILITIES.map(l => {
              const v = parseFloat(liabs[l.key]) || 0;
              return (
                <div key={l.key} style={{ marginBottom: "0.9rem" }}>
                  <label style={{ ...label, color: v > 0 ? l.color : T.muted }}>
                    {l.icon} {l.label}
                    {v > 0 && totalL > 0 && (
                      <span style={{ marginLeft: "0.4rem", fontWeight: 400 }}>
                        {((v / totalL) * 100).toFixed(1)}%
                      </span>
                    )}
                  </label>
                  <input style={{ ...inp(), borderColor: v > 0 ? `${T.red}55` : T.border }}
                    type="number" placeholder="0"
                    value={liabs[l.key]}
                    onChange={e => setLiabs(p => ({ ...p, [l.key]: e.target.value }))} />
                  {v > 0 && totalL > 0 && <Bar_ pct={(v / totalL) * 100} color={T.red} height={3} />}
                </div>
              );
            })}
            {totalL > 0 && (
              <p style={{ fontFamily: F.serif, fontSize: "1.25rem", color: T.red, marginTop: "0.5rem", letterSpacing: "-0.02em" }}>
                Total: ${totalL.toLocaleString()}
              </p>
            )}
          </div>
        </div>
      </div>

      {(totalA > 0 || totalL > 0) && (
        <>
          {/* Net Worth result */}
          <div style={{ ...card(), marginBottom: "1.75rem", borderTop: `4px solid ${nw >= 0 ? T.teal : T.red}` }}>
            <div style={cardBody({ textAlign: "center", padding: "2rem" })}>
              <p style={{ fontFamily: F.mono, fontSize: "0.7rem", color: T.muted, letterSpacing: "0.14em", marginBottom: "0.4rem" }}>YOUR NET WORTH</p>
              <p style={{ fontFamily: F.serif, fontSize: "clamp(2.5rem, 6vw, 4rem)", color: nw >= 0 ? T.teal : T.red, margin: "0 0 0.4rem", letterSpacing: "-0.04em" }}>
                {nw < 0 ? "−" : "+"}${Math.abs(nw).toLocaleString()}
              </p>
              <p style={{ fontFamily: F.sans, fontSize: "0.88rem", color: T.muted, marginBottom: "1.5rem", maxWidth: 440, margin: "0 auto 1.5rem" }}>
                {nw >= 0
                  ? `Your assets exceed your liabilities by $${nw.toLocaleString()}. Keep building.`
                  : `You owe $${Math.abs(nw).toLocaleString()} more than you own. Focus on reducing high-interest debt first.`}
              </p>

              {totalA > 0 && totalL > 0 && (
                <>
                  <div style={{ display: "flex", height: 28, overflow: "hidden", borderRadius: 8, maxWidth: 480, margin: "0 auto 0.5rem" }}>
                    <div style={{ width: `${ratio}%`, background: T.green, transition: "width 0.5s" }} />
                    <div style={{ flex: 1, background: T.red }} />
                  </div>
                  <div style={{ display: "flex", justifyContent: "center", gap: "2rem", fontSize: "0.78rem", fontFamily: F.mono }}>
                    <span style={{ color: T.green }}>Assets {ratio.toFixed(0)}%</span>
                    <span style={{ color: T.red }}>Liabilities {(100 - ratio).toFixed(0)}%</span>
                  </div>
                </>
              )}
            </div>
          </div>

          {/* Summary metrics */}
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(160px, 1fr))", gap: "1rem", marginBottom: "1.75rem" }}>
            <Metric icon="🏦" label="Total Assets"      value={`$${totalA.toLocaleString()}`}           color={T.green}  />
            <Metric icon="💳" label="Total Liabilities" value={`$${totalL.toLocaleString()}`}           color={T.red}    />
            <Metric icon="📊" label="Net Worth"         value={`${nw >= 0 ? "+" : ""}$${Math.abs(nw).toLocaleString()}`} color={nw >= 0 ? T.teal : T.red} />
            <Metric icon="⚖️" label="Asset Ratio"       value={`${ratio.toFixed(0)}%`}                  color={T.purple} sub="assets as % of total" />
          </div>

          {/* Breakdown chart */}
          {barData.length > 0 && (
            <div style={card()}>
              <div style={cardHead(T.purple)}>
                <span style={{ fontFamily: F.mono, fontSize: "0.65rem", color: T.purple, letterSpacing: "0.12em" }}>ASSETS & LIABILITIES BREAKDOWN</span>
              </div>
              <div style={cardBody()}>
                <ResponsiveContainer width="100%" height={Math.max(barData.length * 38, 200)}>
                  <BarChart data={barData} layout="vertical" margin={{ top: 0, right: 20, left: 10, bottom: 0 }} barSize={18}>
                    <CartesianGrid strokeDasharray="3 3" stroke={T.border} horizontal={false} />
                    <XAxis type="number"
                      tickFormatter={v => `$${Math.abs(v) >= 1000 ? (Math.abs(v)/1000).toFixed(0)+"k" : Math.abs(v)}`}
                      tick={{ fontFamily: F.mono, fontSize: 10, fill: T.muted }}
                      axisLine={false} tickLine={false}
                    />
                    <YAxis type="category" dataKey="name" width={80}
                      tick={{ fontFamily: F.sans, fontSize: 11, fill: T.muted }}
                      axisLine={false} tickLine={false}
                    />
                    <RechartsTip content={<CustomBarTip />} />
                    <ReferenceLine x={0} stroke={T.faint} />
                    <Bar dataKey="value" radius={[0, 4, 4, 0]}>
                      {barData.map((d, i) => (
                        <Cell key={i} fill={d.value >= 0 ? T.teal : T.red} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}

/* ══════════════════════════════════════════════════════════
   ROOT — TAB SHELL
══════════════════════════════════════════════════════════ */
const TOOLS = [
  { key: "budget",   label: "Detailed Budget",  icon: "📋", accent: T.teal   },
  { key: "5030",     label: "50 / 30 / 20",     icon: "⚖️", accent: T.amber  },
  { key: "debt",     label: "Debt Payoff",       icon: "💳", accent: T.red    },
  { key: "savings",  label: "Savings Goal",      icon: "🎯", accent: T.teal   },
  { key: "networth", label: "Net Worth",         icon: "📊", accent: T.purple },
];

export default function BudgetApp() {
  const [active, setActive] = useState("budget");
  const tool = TOOLS.find(t => t.key === active);

  return (
    <div style={{ fontFamily: F.sans }}>

      {/* Tool selector */}
      <div style={{
        display: "flex",
        gap: "0.5rem",
        flexWrap: "wrap",
        marginBottom: "2rem",
        padding: "0.6rem",
        background: T.dark,
        borderRadius: 14,
        border: `1px solid ${T.faint}`,
      }}>
        {TOOLS.map(t => {
          const isActive = active === t.key;
          return (
            <button key={t.key} onClick={() => setActive(t.key)} style={{
              flex: "1 1 auto",
              minWidth: 120,
              padding: "0.7rem 1rem",
              border: isActive ? `1.5px solid ${t.accent}` : "1.5px solid transparent",
              borderRadius: 10,
              background: isActive ? `${t.accent}18` : "transparent",
              cursor: "pointer",
              fontFamily: F.sans,
              fontWeight: isActive ? 700 : 400,
              fontSize: "0.85rem",
              color: isActive ? t.accent : T.muted,
              transition: "all 0.2s",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: "0.4rem",
              whiteSpace: "nowrap",
            }}>
              <span>{t.icon}</span>
              {t.label}
            </button>
          );
        })}
      </div>

      {/* Content */}
      <div>
        {active === "budget"   && <BasicBudget />}
        {active === "5030"     && <FiftyThirtyTwenty />}
        {active === "debt"     && <DebtPayoff />}
        {active === "savings"  && <SavingsGoal />}
        {active === "networth" && <NetWorth />}
      </div>
    </div>
  );
}