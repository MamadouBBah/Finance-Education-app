import React, { useState, useEffect, useCallback } from "react";
import {
  LineChart, Line, XAxis, YAxis, Tooltip,
  ResponsiveContainer, CartesianGrid, ReferenceLine,
} from "recharts";
import * as XLSX from "xlsx"; // npm install xlsx

/* ─────────────────────────────────────────────────────────────
   API KEYS — loaded from .env
   .env file should contain:
     REACT_APP_POLYGON_KEY=your_key_here
     REACT_APP_FINNHUB_KEY=your_key_here

   NOTE: Both keys are on the free tier.
   Polygon free tier returns the PREVIOUS DAY'S closing price,
   not a live real-time price. This is clearly communicated
   to users in the UI. Historical chart data works normally.
───────────────────────────────────────────────────────────── */
const POLYGON_KEY = "mzTwSr_WzoG2aL5ODqeBX5kWsO2YcTuu";
const FINNHUB_KEY = "cvq9rchr01qi0ef7mgu0cvq9rchr01qi0ef7mgug";

/* ─── design tokens ─────────────────────────────────────── */
const T = {
  teal:   "#00c9a7",
  amber:  "#f5a623",
  red:    "#e74c3c",
  blue:   "#3498db",
  green:  "#27ae60",
  dark:   "#0d1b2a",
  text:   "#1a2b3c",
  muted:  "#7f99b5",
  border: "#dde6ef",
  bg:     "#f4f8fc",
  card:   "#ffffff",
};

/* ─── shared style helpers ───────────────────────────────── */
const S = {
  card: {
    background: T.card,
    borderRadius: 12,
    padding: "1.5rem",
    boxShadow: "0 2px 10px rgba(0,0,0,0.06)",
    border: `1px solid ${T.border}`,
  },
  label: {
    display: "block",
    fontSize: "0.78rem",
    fontWeight: 700,
    color: T.muted,
    marginBottom: "0.3rem",
    letterSpacing: "0.04em",
    textTransform: "uppercase",
  },
  input: {
    width: "100%",
    padding: "0.6rem 0.85rem",
    border: `1px solid ${T.border}`,
    borderRadius: 8,
    fontSize: "0.95rem",
    color: T.text,
    outline: "none",
    background: T.bg,
    boxSizing: "border-box",
    transition: "border-color 0.18s",
    fontFamily: "inherit",
  },
  btn: (bg = T.dark, small = false) => ({
    padding: small ? "0.42rem 0.9rem" : "0.65rem 1.4rem",
    background: bg,
    color: bg === T.bg ? T.text : "#fff",
    border: "none",
    borderRadius: 8,
    cursor: "pointer",
    fontWeight: 700,
    fontSize: small ? "0.8rem" : "0.88rem",
    transition: "opacity 0.18s, transform 0.1s",
    fontFamily: "inherit",
    whiteSpace: "nowrap",
  }),
};

/* ─── small reusable pieces ─────────────────────────────── */
const StatCard = ({ label, value, sub, color = T.teal }) => (
  <div style={{ ...S.card, padding: "1rem 1.1rem", borderTop: `3px solid ${color}`, textAlign: "center" }}>
    <p style={{ fontSize: "0.7rem", color: T.muted, margin: "0 0 0.25rem", textTransform: "uppercase", letterSpacing: "0.06em" }}>{label}</p>
    <p style={{ fontSize: "1.3rem", fontWeight: 900, color, margin: "0 0 0.15rem", letterSpacing: "-0.02em" }}>{value}</p>
    {sub && <p style={{ fontSize: "0.72rem", color: T.muted, margin: 0 }}>{sub}</p>}
  </div>
);

const ErrorBanner = ({ msg }) => !msg ? null : (
  <div style={{
    padding: "0.85rem 1.1rem",
    background: "#fff5f5",
    border: `1px solid ${T.red}44`,
    borderRadius: 8,
    color: T.red,
    fontSize: "0.88rem",
    marginBottom: "1rem",
  }}>
    ⚠ {msg}
  </div>
);

const TabBar = ({ tabs, active, onChange }) => (
  <div style={{ display: "flex", borderBottom: `2px solid ${T.border}`, marginBottom: "2rem", overflowX: "auto" }}>
    {tabs.map(t => (
      <button key={t.key} onClick={() => onChange(t.key)} style={{
        padding: "0.8rem 1.6rem",
        border: "none",
        background: "none",
        cursor: "pointer",
        fontWeight: active === t.key ? 800 : 400,
        color: active === t.key ? T.teal : T.muted,
        borderBottom: active === t.key ? `2px solid ${T.teal}` : "2px solid transparent",
        marginBottom: "-2px",
        fontSize: "0.9rem",
        transition: "all 0.2s",
        fontFamily: "inherit",
        whiteSpace: "nowrap",
      }}>
        {t.icon} {t.label}
        {t.badge && (
          <span style={{
            marginLeft: "0.45rem",
            background: T.teal,
            color: "#fff",
            fontSize: "0.65rem",
            fontWeight: 800,
            padding: "0.15rem 0.45rem",
            borderRadius: 10,
            verticalAlign: "middle",
          }}>
            {t.badge}
          </span>
        )}
      </button>
    ))}
  </div>
);

/* ══════════════════════════════════════════════════════════
   ADD-TO-PORTFOLIO PROMPT BANNER
   Appears on the chart tab after a successful lookup.
══════════════════════════════════════════════════════════ */
const AddToPortfolioPrompt = ({ lastLookup, onAdd, onDismiss }) => {
  if (!lastLookup) return null;
  const { symbol, price, name, isLive } = lastLookup;

  return (
    <div style={{
      display: "flex",
      alignItems: "center",
      justifyContent: "space-between",
      gap: "1rem",
      padding: "1rem 1.25rem",
      background: "rgba(0,201,167,0.07)",
      border: `1px solid ${T.teal}44`,
      borderRadius: 10,
      marginBottom: "1.5rem",
      flexWrap: "wrap",
    }}>
      <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
        <span style={{ fontSize: "1.4rem" }}>💼</span>
        <div>
          <p style={{ margin: 0, fontWeight: 700, color: T.dark, fontSize: "0.92rem" }}>
            Add <strong style={{ color: T.teal }}>{symbol}</strong> to your practice portfolio?
          </p>
          <p style={{ margin: 0, fontSize: "0.78rem", color: T.muted }}>
            {name && `${name} · `}
            Reference price: <strong style={{ color: T.text }}>${price?.toFixed(2)}</strong>
            {" · "}
            {isLive ? "Live quote via Finnhub" : "Previous close via Polygon (free tier)"}
          </p>
        </div>
      </div>
      <div style={{ display: "flex", gap: "0.5rem" }}>
        <button onClick={onAdd} style={S.btn(T.teal, true)}>Add to Portfolio →</button>
        <button onClick={onDismiss} style={{
          ...S.btn(T.bg, true),
          color: T.muted,
          border: `1px solid ${T.border}`,
        }}>Dismiss</button>
      </div>
    </div>
  );
};

/* ══════════════════════════════════════════════════════════
   TAB 1 — STOCK CHART
══════════════════════════════════════════════════════════ */
const RANGES = [
  { label: "1M", days: 30  },
  { label: "3M", days: 90  },
  { label: "6M", days: 180 },
  { label: "1Y", days: 365 },
];

function StockChart({ onStockLoaded, lastLookup, onAddToPortfolio, onDismissPrompt }) {
  const [inputVal, setInputVal]   = useState("");
  const [symbol, setSymbol]       = useState("");
  const [data, setData]           = useState([]);
  const [quote, setQuote]         = useState(null);
  const [blurb, setBlurb]         = useState("");
  const [topStocks, setTopStocks] = useState([]);
  const [loading, setLoading]     = useState(false);
  const [error, setError]         = useState("");
  const [rangeIdx, setRangeIdx]   = useState(3);

  const fetchStock = useCallback(async (sym, days) => {
    if (!sym) return;
    setLoading(true);
    setError("");
    setData([]);
    setQuote(null);
    setBlurb("");

    if (!POLYGON_KEY) {
      setError("REACT_APP_POLYGON_KEY is missing from your .env file. Add it and restart the dev server.");
      setLoading(false);
      return;
    }

    try {
      const today    = new Date();
      const fromDate = new Date();
      fromDate.setDate(today.getDate() - days);
      const from = fromDate.toISOString().split("T")[0];
      const to   = today.toISOString().split("T")[0];

      /* Polygon: historical bars + company reference — one call each */
      const [histRes, refRes] = await Promise.all([
        fetch(`https://api.polygon.io/v2/aggs/ticker/${sym}/range/1/day/${from}/${to}?adjusted=true&sort=asc&limit=500&apiKey=${POLYGON_KEY}`),
        fetch(`https://api.polygon.io/v3/reference/tickers/${sym}?apiKey=${POLYGON_KEY}`),
      ]);
      const [hist, ref] = await Promise.all([histRes.json(), refRes.json()]);

      if (!hist.results || hist.results.length === 0) {
        const hint = hist.error
          ? `API error: ${hist.error}`
          : `No price history found for "${sym}". Double-check the ticker (e.g. AAPL, TSLA, MSFT).`;
        setError(hint);
        setLoading(false);
        return;
      }

      const cleanData = hist.results
        .filter(r => r.c != null)
        .map(r => ({ t: r.t, c: r.c, h: r.h, l: r.l, v: r.v }));

      setData(cleanData);

      const companyName = ref.results?.name || sym;
      setBlurb(ref.results?.description || "");

      /* Most recent closing price from Polygon — always available free */
      const lastClose = cleanData[cleanData.length - 1]?.c ?? null;

      /* Attempt Finnhub live quote — best effort, graceful fallback */
      let liveQuote = null;
      if (FINNHUB_KEY) {
        try {
          const qRes  = await fetch(`https://finnhub.io/api/v1/quote?symbol=${sym}&token=${FINNHUB_KEY}`);
          const qJson = await qRes.json();
          if (qJson.c && qJson.c > 0) liveQuote = qJson;
        } catch { /* silent fallback */ }
      }

      setQuote(liveQuote);

      /* Lift resolved data to parent */
      onStockLoaded({
        symbol:  sym,
        name:    companyName,
        price:   liveQuote?.c ?? lastClose,
        isLive:  liveQuote !== null,
      });

    } catch {
      setError("Network request failed. Check your connection and API keys in .env.");
    } finally {
      setLoading(false);
    }
  }, [onStockLoaded]);

  const search = () => {
    const s = inputVal.trim().toUpperCase();
    if (!s) return;
    setSymbol(s);
    fetchStock(s, RANGES[rangeIdx].days);
  };

  /* Re-fetch on range change */
  useEffect(() => {
    if (symbol) fetchStock(symbol, RANGES[rangeIdx].days);
  }, [rangeIdx]); // eslint-disable-line

  /* Top gainers — auto-refresh */
  useEffect(() => {
    if (!POLYGON_KEY) return;
    const load = async () => {
      try {
        const r = await fetch(`https://api.polygon.io/v2/snapshot/locale/us/markets/stocks/gainers?apiKey=${POLYGON_KEY}`);
        const j = await r.json();
        if (j.tickers) setTopStocks(j.tickers.slice(0, 10).map(t => ({ ticker: t.ticker, pct: t.todaysChangePerc })));
      } catch {}
    };
    load();
    const id = setInterval(load, 70_000);
    return () => clearInterval(id);
  }, []);

  const minVal  = data.length ? Math.min(...data.map(d => d.c)) : null;
  const maxVal  = data.length ? Math.max(...data.map(d => d.c)) : null;
  const startPx = data.length ? data[0].c : null;
  const endPx   = data.length ? data[data.length - 1].c : null;
  const gainPct = startPx && endPx ? ((endPx - startPx) / startPx) * 100 : null;
  const lineClr = gainPct == null ? T.teal : gainPct >= 0 ? T.green : T.red;

  const searchTicker = (ticker) => {
    setInputVal(ticker);
    setSymbol(ticker);
    fetchStock(ticker, RANGES[rangeIdx].days);
  };

  return (
    <div>
      {/* Search bar */}
      <div style={{ ...S.card, display: "flex", gap: "0.75rem", alignItems: "flex-end", flexWrap: "wrap", marginBottom: "1.5rem" }}>
        <div style={{ flex: 1, minWidth: 200 }}>
          <label style={S.label}>Stock Symbol</label>
          <input
            style={S.input}
            placeholder="e.g.  AAPL  ·  TSLA  ·  MSFT"
            value={inputVal}
            onChange={e => setInputVal(e.target.value.toUpperCase())}
            onKeyDown={e => e.key === "Enter" && search()}
          />
        </div>
        <div>
          <label style={S.label}>Time Range</label>
          <div style={{ display: "flex", gap: "0.4rem" }}>
            {RANGES.map((r, i) => (
              <button key={i} onClick={() => setRangeIdx(i)} style={{
                ...S.btn(rangeIdx === i ? T.teal : T.bg, true),
                border: `1px solid ${rangeIdx === i ? T.teal : T.border}`,
                color:  rangeIdx === i ? "#fff" : T.muted,
              }}>{r.label}</button>
            ))}
          </div>
        </div>
        <button onClick={search} disabled={loading} style={S.btn(T.dark)}>
          {loading ? "Loading…" : "Search →"}
        </button>
      </div>

      <ErrorBanner msg={error} />

      {/* Add-to-portfolio prompt */}
      <AddToPortfolioPrompt
        lastLookup={lastLookup}
        onAdd={onAddToPortfolio}
        onDismiss={onDismissPrompt}
      />

      {/* Quote strip */}
      {(quote || data.length > 0) && (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(110px, 1fr))", gap: "0.75rem", marginBottom: "1.25rem" }}>
          {[
            { l: quote ? "Current (Live)" : "Last Close",  v: `$${(quote?.c ?? endPx)?.toFixed(2) ?? "—"}`,             c: T.teal  },
            { l: "Open",                                    v: quote ? `$${quote.o?.toFixed(2)}` : "—",                   c: T.text  },
            { l: "Day High",                                v: quote ? `$${quote.h?.toFixed(2)}` : `$${maxVal?.toFixed(2)}`, c: T.green },
            { l: "Day Low",                                 v: quote ? `$${quote.l?.toFixed(2)}` : `$${minVal?.toFixed(2)}`, c: T.red   },
            { l: "Prev Close",                              v: quote ? `$${quote.pc?.toFixed(2)}` : `$${startPx?.toFixed(2)}`, c: T.muted },
            { l: `${RANGES[rangeIdx].label} Return`,        v: gainPct != null ? `${gainPct >= 0 ? "+" : ""}${gainPct.toFixed(2)}%` : "—", c: gainPct != null ? (gainPct >= 0 ? T.green : T.red) : T.muted },
          ].map((s, i) => (
            <div key={i} style={{ ...S.card, padding: "0.9rem", textAlign: "center" }}>
              <p style={{ fontSize: "0.7rem", color: T.muted, margin: "0 0 0.25rem", textTransform: "uppercase", letterSpacing: "0.06em" }}>{s.l}</p>
              <p style={{ fontSize: "1.05rem", fontWeight: 900, color: s.c, margin: 0 }}>{s.v}</p>
            </div>
          ))}
        </div>
      )}

      {/* Free-tier notice */}
      {data.length > 0 && !quote && (
        <p style={{ fontSize: "0.75rem", color: T.muted, marginBottom: "1rem", padding: "0.5rem 0.85rem", background: T.bg, borderRadius: 6, border: `1px solid ${T.border}` }}>
          ℹ️ <strong>Free-tier notice:</strong> Prices shown reflect the <strong>previous trading day's closing price</strong> from Polygon.io. Real-time intraday quotes require a paid plan.
        </p>
      )}

      {/* Chart */}
      {data.length > 0 && (
        <div style={{ ...S.card, marginBottom: "1.5rem" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1.25rem", flexWrap: "wrap", gap: "0.5rem" }}>
            <h3 style={{ margin: 0, color: T.dark }}>{symbol} — {RANGES[rangeIdx].label} Price History</h3>
            {gainPct != null && (
              <span style={{ fontWeight: 900, fontSize: "1.15rem", color: gainPct >= 0 ? T.green : T.red }}>
                {gainPct >= 0 ? "▲" : "▼"} {Math.abs(gainPct).toFixed(2)}%
              </span>
            )}
          </div>

          <ResponsiveContainer width="100%" height={380}>
            <LineChart data={data} margin={{ top: 5, right: 10, left: 5, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e8edf3" />
              <XAxis
                dataKey="t" type="number" domain={["dataMin", "dataMax"]}
                tickFormatter={t => new Date(t).toLocaleDateString("en-US", { month: "short", day: "numeric" })}
                tick={{ fontSize: 10, fill: T.muted }}
              />
              <YAxis
                domain={["auto", "auto"]}
                tickFormatter={v => `$${v >= 1000 ? (v / 1000).toFixed(1) + "k" : v.toFixed(0)}`}
                tick={{ fontSize: 11, fill: T.muted }}
                width={62}
              />
              {startPx && (
                <ReferenceLine y={startPx} stroke={T.muted} strokeDasharray="4 4"
                  label={{ value: "Period Start", fill: T.muted, fontSize: 10, position: "insideTopRight" }} />
              )}
              <Tooltip
                contentStyle={{ borderRadius: 8, border: `1px solid ${T.border}`, fontSize: "0.85rem", fontFamily: "inherit" }}
                formatter={(v) => {
                  let note = `$${v.toFixed(2)}`;
                  if (v === minVal) note += "  📉 Period Low";
                  if (v === maxVal) note += "  📈 Period High";
                  return [note, "Closing Price"];
                }}
                labelFormatter={l => new Date(l).toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" })}
              />
              <Line type="monotone" dataKey="c" stroke={lineClr} strokeWidth={2}
                dot={false} activeDot={{ r: 5, fill: lineClr }} animationDuration={500} />
            </LineChart>
          </ResponsiveContainer>

          <div style={{ display: "flex", gap: "0.75rem", marginTop: "1rem", flexWrap: "wrap" }}>
            {[
              { l: `${RANGES[rangeIdx].label} Low`,  v: `$${minVal?.toFixed(2)}`, c: T.red   },
              { l: `${RANGES[rangeIdx].label} High`, v: `$${maxVal?.toFixed(2)}`, c: T.green },
              { l: "Data Points",                    v: data.length,              c: T.muted },
            ].map((s, i) => (
              <div key={i} style={{ padding: "0.45rem 0.9rem", background: T.bg, borderRadius: 6, fontSize: "0.82rem" }}>
                <span style={{ color: T.muted }}>{s.l}: </span>
                <strong style={{ color: s.c }}>{s.v}</strong>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Company blurb */}
      {blurb && (
        <div style={{ ...S.card, marginBottom: "1.5rem" }}>
          <h4 style={{ color: T.dark, margin: "0 0 0.65rem" }}>📘 About {symbol}</h4>
          <p style={{ color: T.muted, fontSize: "0.88rem", lineHeight: 1.75, margin: 0 }}>{blurb}</p>
        </div>
      )}

      {/* Top gainers */}
      {topStocks.length > 0 && (
        <div style={S.card}>
          <h4 style={{ color: T.dark, margin: "0 0 0.75rem" }}>
            🔥 Today's Top 10 Gainers
            <span style={{ fontSize: "0.72rem", color: T.muted, fontWeight: 400, marginLeft: "0.6rem" }}>click to search</span>
          </h4>
          <div style={{ display: "flex", flexWrap: "wrap", gap: "0.5rem" }}>
            {topStocks.map(({ ticker, pct }) => (
              <button key={ticker} onClick={() => searchTicker(ticker)} style={{
                padding: "0.4rem 0.85rem",
                background: "rgba(0,201,167,0.07)",
                border: `1px solid ${T.teal}44`,
                borderRadius: 6, cursor: "pointer",
                fontSize: "0.83rem", fontFamily: "inherit",
              }}>
                <strong style={{ color: T.dark }}>{ticker}</strong>
                {pct !== undefined && <span style={{ color: T.green, marginLeft: "0.35rem" }}>+{pct?.toFixed(1)}%</span>}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

/* ══════════════════════════════════════════════════════════
   TAB 2 — PORTFOLIO BUILDER
══════════════════════════════════════════════════════════ */
const PORTFOLIO_KEY = "finedge_portfolio_v2";
const WHEEL = ["#00c9a7","#3498db","#f5a623","#e74c3c","#9b59b6","#27ae60","#e67e22","#1abc9c","#e91e63","#00bcd4","#ff5722","#607d8b"];

const loadSaved = () => { try { return JSON.parse(localStorage.getItem(PORTFOLIO_KEY)) || []; } catch { return []; } };
const persist   = (p)  => { try { localStorage.setItem(PORTFOLIO_KEY, JSON.stringify(p)); } catch {} };

function PortfolioBuilder({ prefill, onPrefillConsumed }) {
  const [holdings, setHoldings]   = useState(loadSaved);
  const [symInput, setSymInput]   = useState("");
  const [sharesIn, setSharesIn]   = useState("");
  const [priceIn,  setPriceIn]    = useState("");
  const [noteIn,   setNoteIn]     = useState("");
  const [addErr,   setAddErr]     = useState("");
  const [refreshing, setRefresh]  = useState(false);
  const [sortKey, setSortKey]     = useState("value");
  const [exportMsg, setExportMsg] = useState("");
  const [justAdded, setJustAdded] = useState("");

  /* Apply prefill from chart lookup */
  useEffect(() => {
    if (prefill) {
      setSymInput(prefill.symbol || "");
      setPriceIn(prefill.price   ? prefill.price.toFixed(2) : "");
      setNoteIn(`Via chart lookup${prefill.name ? ` · ${prefill.name}` : ""}`);
      setAddErr("");
      setTimeout(() => document.getElementById("portfolio-form")?.scrollIntoView({ behavior: "smooth", block: "center" }), 100);
    }
  }, [prefill]);

  useEffect(() => { persist(holdings); }, [holdings]);

  /* Add holding — no extra API call; uses price from chart or manual entry */
  const addHolding = () => {
    setAddErr("");
    const s  = symInput.trim().toUpperCase();
    const sh = parseFloat(sharesIn);
    const pp = parseFloat(priceIn);

    if (!s)            return setAddErr("Enter a stock symbol.");
    if (!sh || sh <= 0) return setAddErr("Shares must be greater than 0.");
    if (!pp || pp <= 0) return setAddErr("Purchase price must be greater than 0.");
    if (holdings.find(h => h.symbol === s))
      return setAddErr(`${s} is already in your portfolio. Remove it first to add a new position.`);

    const newHolding = {
      symbol:        s,
      shares:        sh,
      purchasePrice: pp,
      currentPrice:  pp, // starts equal; updated on Refresh
      note:          noteIn.trim(),
      addedAt:       new Date().toISOString(),
      lastUpdated:   new Date().toISOString(),
      source:        prefill ? "chart-lookup" : "manual",
    };

    setHoldings(prev => [...prev, newHolding]);
    setJustAdded(s);
    setTimeout(() => setJustAdded(""), 2500);
    setSymInput(""); setSharesIn(""); setPriceIn(""); setNoteIn("");
    if (onPrefillConsumed) onPrefillConsumed();
  };

  const remove = (sym) => setHoldings(prev => prev.filter(h => h.symbol !== sym));

  /* Refresh prices via Polygon daily bars — free-tier safe */
  const refreshAll = async () => {
    if (!POLYGON_KEY) return;
    setRefresh(true);
    const updated = await Promise.all(
      holdings.map(async h => {
        try {
          const tryDate = async (dateStr) => {
            const r = await fetch(`https://api.polygon.io/v2/aggs/ticker/${h.symbol}/range/1/day/${dateStr}/${dateStr}?adjusted=true&sort=desc&limit=1&apiKey=${POLYGON_KEY}`);
            const j = await r.json();
            return j.results?.[0]?.c ?? null;
          };
          const today = new Date().toISOString().split("T")[0];
          let price   = await tryDate(today);
          if (!price || price <= 0) {
            const yday = new Date(Date.now() - 86_400_000).toISOString().split("T")[0];
            price = await tryDate(yday);
          }
          return price && price > 0
            ? { ...h, currentPrice: price, lastUpdated: new Date().toISOString() }
            : h;
        } catch { return h; }
      })
    );
    setHoldings(updated);
    setRefresh(false);
  };

  /* Computed rows */
  const rows = holdings.map(h => {
    const costBasis  = h.shares * h.purchasePrice;
    const currentVal = h.shares * h.currentPrice;
    const gainLoss   = currentVal - costBasis;
    const gainPct    = costBasis > 0 ? (gainLoss / costBasis) * 100 : 0;
    return { ...h, costBasis, currentVal, gainLoss, gainPct };
  });

  const sorted = [...rows].sort((a, b) => {
    if (sortKey === "symbol") return a.symbol.localeCompare(b.symbol);
    if (sortKey === "value")  return b.currentVal  - a.currentVal;
    if (sortKey === "gain$")  return b.gainLoss    - a.gainLoss;
    if (sortKey === "gain%")  return b.gainPct     - a.gainPct;
    if (sortKey === "cost")   return b.costBasis   - a.costBasis;
    return 0;
  });

  const totalCost  = rows.reduce((s, r) => s + r.costBasis,  0);
  const totalVal   = rows.reduce((s, r) => s + r.currentVal, 0);
  const totalGain  = totalVal - totalCost;
  const totalGainP = totalCost > 0 ? (totalGain / totalCost) * 100 : 0;

  /* Export CSV */
  const exportCSV = () => {
    if (!rows.length) return;
    const hdrs = ["Symbol","Shares","Purchase Price","Current Price","Cost Basis","Current Value","Gain/Loss ($)","Return (%)","Note","Source","Last Updated"];
    const body = rows.map(r => [
      r.symbol, r.shares,
      r.purchasePrice.toFixed(2), r.currentPrice.toFixed(2),
      r.costBasis.toFixed(2),     r.currentVal.toFixed(2),
      r.gainLoss.toFixed(2),      r.gainPct.toFixed(2),
      `"${r.note || ""}"`, r.source || "manual",
      new Date(r.lastUpdated).toLocaleString(),
    ]);
    body.push([], [`Portfolio Summary — ${new Date().toLocaleString()}`]);
    body.push(["Total Invested", `$${totalCost.toFixed(2)}`]);
    body.push(["Current Value",  `$${totalVal.toFixed(2)}`]);
    body.push(["Gain / Loss",    `${totalGain >= 0 ? "+" : ""}$${totalGain.toFixed(2)}`]);
    body.push(["Overall Return", `${totalGainP.toFixed(2)}%`]);
    const csv  = [hdrs, ...body].map(r => r.join(",")).join("\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url  = URL.createObjectURL(blob);
    Object.assign(document.createElement("a"), { href: url, download: `portfolio_${new Date().toISOString().split("T")[0]}.csv` }).click();
    URL.revokeObjectURL(url);
    flash("CSV downloaded ✓");
  };

  /* Export Excel */
  const exportXLSX = () => {
    if (!rows.length) return;
    const wb = XLSX.utils.book_new();

    const ws1 = XLSX.utils.aoa_to_sheet([
      ["Symbol","Shares","Purchase Price ($)","Current Price ($)","Cost Basis ($)","Current Value ($)","Gain / Loss ($)","Return (%)","Note","Source","Last Updated"],
      ...rows.map(r => [r.symbol, r.shares, +r.purchasePrice.toFixed(2), +r.currentPrice.toFixed(2), +r.costBasis.toFixed(2), +r.currentVal.toFixed(2), +r.gainLoss.toFixed(2), +r.gainPct.toFixed(2), r.note||"", r.source||"manual", new Date(r.lastUpdated).toLocaleString()]),
    ]);
    ws1["!cols"] = [10,10,20,18,16,18,18,12,28,14,22].map(w => ({ wch: w }));
    XLSX.utils.book_append_sheet(wb, ws1, "Holdings");

    const ws2 = XLSX.utils.aoa_to_sheet([
      ["FinEdge Practice Portfolio"],
      ["Exported", new Date().toLocaleString()],
      [],
      ["Metric","Value"],
      ["Total Invested", `$${totalCost.toFixed(2)}`],
      ["Current Value",  `$${totalVal.toFixed(2)}`],
      ["Gain / Loss",    `${totalGain >= 0 ? "+" : ""}$${totalGain.toFixed(2)}`],
      ["Overall Return", `${totalGainP.toFixed(2)}%`],
      [],
      ["Allocation","Weight","Value ($)"],
      ...sorted.map(r => [r.symbol, `${((r.currentVal/totalVal)*100).toFixed(1)}%`, +r.currentVal.toFixed(2)]),
    ]);
    ws2["!cols"] = [{ wch: 24 }, { wch: 14 }, { wch: 16 }];
    XLSX.utils.book_append_sheet(wb, ws2, "Summary");

    const ws3 = XLSX.utils.aoa_to_sheet([
      ["Symbol","Purchase Price ($)","Current Price ($)","$ Change / Share","% Change / Share"],
      ...rows.map(r => { const d = r.currentPrice - r.purchasePrice; return [r.symbol, +r.purchasePrice.toFixed(2), +r.currentPrice.toFixed(2), +d.toFixed(2), +((d/r.purchasePrice)*100).toFixed(2)]; }),
    ]);
    ws3["!cols"] = [10,18,18,18,20].map(w => ({ wch: w }));
    XLSX.utils.book_append_sheet(wb, ws3, "Price Comparison");

    XLSX.writeFile(wb, `portfolio_${new Date().toISOString().split("T")[0]}.xlsx`);
    flash("Excel file downloaded ✓");
  };

  const flash = (msg) => { setExportMsg(msg); setTimeout(() => setExportMsg(""), 3500); };
  const SortBtn = ({ k, label }) => (
    <button onClick={() => setSortKey(k)} style={{ background: "none", border: "none", cursor: "pointer", fontFamily: "inherit", color: sortKey === k ? T.teal : T.muted, fontWeight: sortKey === k ? 800 : 400, fontSize: "0.78rem", padding: "0.2rem 0.4rem" }}>
      {label}{sortKey === k ? " ↓" : ""}
    </button>
  );

  return (
    <div>
      {/* Add form */}
      <div id="portfolio-form" style={{ ...S.card, marginBottom: "1.5rem", border: prefill ? `1px solid ${T.teal}` : `1px solid ${T.border}`, transition: "border-color 0.3s" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "0.85rem" }}>
          <h4 style={{ color: T.dark, margin: 0 }}>
            {prefill ? `➕ Adding ${prefill.symbol} from chart` : "➕ Add a Holding"}
          </h4>
          {prefill && (
            <span style={{ fontSize: "0.78rem", color: T.teal, fontWeight: 700 }}>
              Price pre-filled ·{" "}
              <button onClick={onPrefillConsumed} style={{ background: "none", border: "none", cursor: "pointer", color: T.muted, fontSize: "0.78rem", fontFamily: "inherit" }}>clear</button>
            </span>
          )}
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "2fr 1fr 1fr 2fr auto", gap: "0.75rem", alignItems: "flex-end" }}>
          <div>
            <label style={S.label}>Symbol</label>
            <input style={{ ...S.input, background: prefill ? "rgba(0,201,167,0.06)" : T.bg }}
              placeholder="e.g. AAPL" value={symInput}
              onChange={e => setSymInput(e.target.value.toUpperCase())}
              onKeyDown={e => e.key === "Enter" && addHolding()} />
          </div>
          <div>
            <label style={S.label}>Shares</label>
            <input style={S.input} type="number" placeholder="10" value={sharesIn} onChange={e => setSharesIn(e.target.value)} />
          </div>
          <div>
            <label style={S.label}>
              Purchase Price ($)
              {prefill && <span style={{ color: T.teal, marginLeft: "0.35rem" }}>← from chart</span>}
            </label>
            <input style={{ ...S.input, background: prefill ? "rgba(0,201,167,0.06)" : T.bg }}
              type="number" placeholder="150.00" value={priceIn} onChange={e => setPriceIn(e.target.value)} />
          </div>
          <div>
            <label style={S.label}>Note (optional)</label>
            <input style={S.input} placeholder="e.g. Long-term hold" value={noteIn} onChange={e => setNoteIn(e.target.value)} />
          </div>
          <button onClick={addHolding} style={S.btn(T.teal)}>Add</button>
        </div>

        <ErrorBanner msg={addErr} />

        <p style={{ fontSize: "0.75rem", color: T.muted, margin: "0.6rem 0 0" }}>
          💡 <strong>Practice portfolio</strong> — no real money involved.
          Prices use Polygon's previous-day close (free tier).
          Hit <strong>Refresh Prices</strong> anytime to pull the latest available close for all holdings.
          Your data is saved in your browser's local storage.
        </p>
      </div>

      {holdings.length === 0 ? (
        <div style={{ ...S.card, textAlign: "center", padding: "4rem 2rem" }}>
          <p style={{ fontSize: "2.5rem", margin: "0 0 0.75rem" }}>📂</p>
          <p style={{ fontWeight: 700, fontSize: "1.1rem", color: T.dark, marginBottom: "0.5rem" }}>Your portfolio is empty</p>
          <p style={{ color: T.muted, fontSize: "0.9rem", maxWidth: 380, margin: "0 auto" }}>
            Search a stock on the <strong>Stock Chart</strong> tab — a prompt will appear asking if you'd like to add it here. Or add any ticker manually above.
          </p>
        </div>
      ) : (
        <>
          {/* Stat cards */}
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(155px, 1fr))", gap: "1rem", marginBottom: "1.5rem" }}>
            <StatCard label="Portfolio Value"   value={`$${totalVal.toLocaleString("en-US",  { minimumFractionDigits: 2 })}`} color={T.teal}  sub={`${holdings.length} holding${holdings.length !== 1 ? "s" : ""}`} />
            <StatCard label="Total Invested"    value={`$${totalCost.toLocaleString("en-US", { minimumFractionDigits: 2 })}`} color={T.text}  />
            <StatCard label="Total Gain / Loss" value={`${totalGain >= 0 ? "+" : ""}$${Math.abs(totalGain).toFixed(2)}`}      color={totalGain  >= 0 ? T.green : T.red} />
            <StatCard label="Overall Return"    value={`${totalGainP >= 0 ? "+" : ""}${totalGainP.toFixed(2)}%`}             color={totalGainP >= 0 ? T.green : T.red} />
          </div>

          {/* Allocation bar */}
          {totalVal > 0 && (
            <div style={{ ...S.card, marginBottom: "1.5rem" }}>
              <h4 style={{ color: T.dark, margin: "0 0 0.85rem" }}>Portfolio Allocation</h4>
              <div style={{ display: "flex", height: 22, overflow: "hidden", borderRadius: 6, marginBottom: "0.75rem" }}>
                {sorted.map((r, i) => (
                  <div key={r.symbol} title={`${r.symbol}: ${((r.currentVal/totalVal)*100).toFixed(1)}%`}
                    style={{ width: `${(r.currentVal/totalVal)*100}%`, background: WHEEL[i%WHEEL.length], transition: "width 0.5s" }} />
                ))}
              </div>
              <div style={{ display: "flex", flexWrap: "wrap", gap: "0.6rem" }}>
                {sorted.map((r, i) => (
                  <span key={r.symbol} style={{ display: "flex", alignItems: "center", gap: "0.3rem", fontSize: "0.78rem" }}>
                    <span style={{ width: 10, height: 10, borderRadius: 2, background: WHEEL[i%WHEEL.length], display: "inline-block" }} />
                    <strong style={{ color: T.dark }}>{r.symbol}</strong>
                    <span style={{ color: T.muted }}>{((r.currentVal/totalVal)*100).toFixed(1)}%</span>
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Holdings table */}
          <div style={{ ...S.card, overflowX: "auto" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1rem", flexWrap: "wrap", gap: "0.75rem" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "0.25rem", flexWrap: "wrap" }}>
                <span style={{ fontSize: "0.78rem", color: T.muted, marginRight: "0.25rem" }}>Sort by:</span>
                <SortBtn k="symbol" label="Symbol"   />
                <SortBtn k="value"  label="Value"    />
                <SortBtn k="gain$"  label="Gain $"   />
                <SortBtn k="gain%"  label="Gain %"   />
                <SortBtn k="cost"   label="Invested" />
              </div>
              <div style={{ display: "flex", gap: "0.5rem", alignItems: "center", flexWrap: "wrap" }}>
                {exportMsg && <span style={{ fontSize: "0.8rem", color: T.green, fontWeight: 700 }}>{exportMsg}</span>}
                <button onClick={refreshAll} disabled={refreshing} style={S.btn(T.bg, true)}>
                  {refreshing ? "Refreshing…" : "🔄 Refresh Prices"}
                </button>
                <button onClick={exportCSV}  style={{ ...S.btn(T.bg, true), border: `1px solid ${T.green}`, color: T.green }}>⬇ CSV</button>
                <button onClick={exportXLSX} style={{ ...S.btn(T.bg, true), border: `1px solid ${T.blue}`,  color: T.blue  }}>⬇ Excel</button>
              </div>
            </div>

            <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "0.86rem", minWidth: 720 }}>
              <thead>
                <tr style={{ borderBottom: `2px solid ${T.border}` }}>
                  {["Symbol","Shares","Avg Cost","Current","Invested","Value","Gain / Loss","Return","Note",""].map((h, i) => (
                    <th key={i} style={{ padding: "0.6rem 0.75rem", textAlign: i > 1 && i < 8 ? "right" : "left", color: T.muted, fontWeight: 700, fontSize: "0.73rem", textTransform: "uppercase", letterSpacing: "0.05em" }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {sorted.map((r, i) => (
                  <tr key={r.symbol} style={{ borderBottom: `1px solid ${T.border}`, background: justAdded === r.symbol ? "rgba(0,201,167,0.08)" : i % 2 === 0 ? T.card : T.bg, transition: "background 0.5s" }}>
                    <td style={{ padding: "0.75rem", fontWeight: 900, color: T.dark }}>
                      <span style={{ display: "inline-block", width: 10, height: 10, borderRadius: 2, background: WHEEL[i%WHEEL.length], marginRight: "0.5rem", verticalAlign: "middle" }} />
                      {r.symbol}
                    </td>
                    <td style={{ padding: "0.75rem" }}>{r.shares.toLocaleString()}</td>
                    <td style={{ padding: "0.75rem", textAlign: "right", color: T.muted }}>${r.purchasePrice.toFixed(2)}</td>
                    <td style={{ padding: "0.75rem", textAlign: "right", fontWeight: 700 }}>${r.currentPrice.toFixed(2)}</td>
                    <td style={{ padding: "0.75rem", textAlign: "right", color: T.muted }}>${r.costBasis.toFixed(2)}</td>
                    <td style={{ padding: "0.75rem", textAlign: "right", fontWeight: 700 }}>${r.currentVal.toFixed(2)}</td>
                    <td style={{ padding: "0.75rem", textAlign: "right", fontWeight: 700, color: r.gainLoss >= 0 ? T.green : T.red }}>
                      {r.gainLoss >= 0 ? "+" : "−"}${Math.abs(r.gainLoss).toFixed(2)}
                    </td>
                    <td style={{ padding: "0.75rem", textAlign: "right" }}>
                      <span style={{ padding: "0.22rem 0.55rem", borderRadius: 4, fontSize: "0.82rem", fontWeight: 700, background: r.gainPct >= 0 ? "rgba(39,174,96,0.1)" : "rgba(231,76,60,0.1)", color: r.gainPct >= 0 ? T.green : T.red }}>
                        {r.gainPct >= 0 ? "+" : ""}{r.gainPct.toFixed(2)}%
                      </span>
                    </td>
                    <td style={{ padding: "0.75rem", color: T.muted, fontSize: "0.8rem", maxWidth: 160, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                      {r.note || "—"}
                    </td>
                    <td style={{ padding: "0.75rem", textAlign: "center" }}>
                      <button onClick={() => remove(r.symbol)} title="Remove" style={{ background: "none", border: "none", cursor: "pointer", color: T.red, fontSize: "1.2rem", lineHeight: 1, padding: "0.1rem 0.3rem" }}>×</button>
                    </td>
                  </tr>
                ))}
              </tbody>
              <tfoot>
                <tr style={{ background: T.dark }}>
                  <td colSpan={4} style={{ padding: "0.75rem", fontWeight: 800, color: "#fff", fontSize: "0.82rem" }}>
                    TOTAL ({holdings.length} holding{holdings.length !== 1 ? "s" : ""})
                  </td>
                  <td style={{ padding: "0.75rem", textAlign: "right", fontWeight: 700, color: "#fff" }}>${totalCost.toFixed(2)}</td>
                  <td style={{ padding: "0.75rem", textAlign: "right", fontWeight: 700, color: "#fff" }}>${totalVal.toFixed(2)}</td>
                  <td style={{ padding: "0.75rem", textAlign: "right", fontWeight: 800, color: totalGain >= 0 ? "#6effd4" : "#ff8a8a" }}>
                    {totalGain >= 0 ? "+" : "−"}${Math.abs(totalGain).toFixed(2)}
                  </td>
                  <td style={{ padding: "0.75rem", textAlign: "right", fontWeight: 800, color: totalGainP >= 0 ? "#6effd4" : "#ff8a8a" }}>
                    {totalGainP >= 0 ? "+" : ""}{totalGainP.toFixed(2)}%
                  </td>
                  <td colSpan={2} />
                </tr>
              </tfoot>
            </table>
            <p style={{ fontSize: "0.72rem", color: T.muted, marginTop: "0.75rem" }}>
              Prices via Polygon.io previous-day close (free tier) · Last refreshed: {holdings[0]?.lastUpdated ? new Date(holdings[0].lastUpdated).toLocaleTimeString() : "—"}
            </p>
          </div>
        </>
      )}
    </div>
  );
}

/* ══════════════════════════════════════════════════════════
   ROOT — STATE LIFTED HERE
   Both child tabs share: lastLookup, prefill, hasPending
══════════════════════════════════════════════════════════ */
export default function StockVisualizer() {
  const [tab, setTab]               = useState("chart");
  const [lastLookup, setLastLookup] = useState(null);
  const [prefill, setPrefill]       = useState(null);
  const [hasPending, setHasPending] = useState(false);

  const handleStockLoaded = useCallback((lookup) => {
    setLastLookup(lookup);
    setHasPending(true);
  }, []);

  const handleAddToPortfolio = () => {
    setPrefill(lastLookup);
    setLastLookup(null);
    setHasPending(false);
    setTab("portfolio");
  };

  const handleDismissPrompt    = () => { setLastLookup(null); setHasPending(false); };
  const handlePrefillConsumed  = () => setPrefill(null);

  const tabs = [
    { key: "chart",     icon: "📈", label: "Stock Chart"        },
    { key: "portfolio", icon: "💼", label: "Practice Portfolio", badge: hasPending ? "1" : null },
  ];

  return (
    <div style={{ fontFamily: "'Segoe UI', system-ui, sans-serif" }}>
      <div style={{ marginBottom: "1.75rem" }}>
        <h2 style={{ color: T.dark, margin: "0 0 0.35rem", fontWeight: 900, letterSpacing: "-0.02em" }}>
          Stock Explorer
        </h2>
        <p style={{ color: T.muted, fontSize: "0.9rem", margin: 0 }}>
          Research real stocks with historical charts, then build a zero-risk practice portfolio — exportable as CSV or Excel.
        </p>
      </div>

      <TabBar tabs={tabs} active={tab} onChange={setTab} />

      {tab === "chart" && (
        <StockChart
          onStockLoaded={handleStockLoaded}
          lastLookup={lastLookup}
          onAddToPortfolio={handleAddToPortfolio}
          onDismissPrompt={handleDismissPrompt}
        />
      )}
      {tab === "portfolio" && (
        <PortfolioBuilder
          prefill={prefill}
          onPrefillConsumed={handlePrefillConsumed}
        />
      )}
    </div>
  );
}