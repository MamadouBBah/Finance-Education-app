import React, { useState, useEffect } from "react";
import BudgetApp       from "./components/BudgetApp";
import StockVisualizer from "./components/StockVisualizer";
import GlossaryPage    from "./components/GlossaryPage";

/* ─────────────────────────────────────────────────────────
   FONT INJECTION
   DM Serif Display — editorial headline weight
   DM Sans          — clean, modern body + UI
   Fira Code        — monospace labels / tickers
───────────────────────────────────────────────────────── */
const FONT_HREF =
  "https://fonts.googleapis.com/css2?family=DM+Serif+Display:ital@0;1&family=DM+Sans:ital,opsz,wght@0,9..40,300;0,9..40,400;0,9..40,500;0,9..40,700;1,9..40,300&family=Fira+Code:wght@400;500&display=swap";

/* ─────────────────────────────────────────────────────────
   DESIGN TOKENS
───────────────────────────────────────────────────────── */
const T = {
  /* palette */
  night:    "#07111f",
  dark:     "#0d1b2a",
  navy:     "#112236",
  slate:    "#1b3050",
  teal:     "#00c9a7",
  tealDim:  "rgba(0,201,167,0.12)",
  tealGlow: "rgba(0,201,167,0.22)",
  amber:    "#f5a623",
  amberDim: "rgba(245,166,35,0.12)",
  green:    "#27ae60",
  red:      "#e74c3c",
  /* text */
  white:    "#ffffff",
  offWhite: "#dde8f4",
  muted:    "#6b8aaa",
  faint:    "#2e4a68",
  /* surface */
  bg:       "#f0f5fb",
  surface:  "#ffffff",
  border:   "#dde6ef",
};

/* ─────────────────────────────────────────────────────────
   NAV CONFIG
───────────────────────────────────────────────────────── */
const NAV = [
  {
    key:   "budget",
    icon:  "💰",
    label: "Budget Tools",
    sub:   "Plan · Track · Optimize",
    desc:  "5 calculators covering budgets, debt payoff, savings goals & net worth",
    accent: T.teal,
  },
  {
    key:   "stocks",
    icon:  "📈",
    label: "Stock Explorer",
    sub:   "Research · Practice · Export",
    desc:  "Live charts, top gainers & a zero-risk practice portfolio builder",
    accent: T.amber,
  },
  {
    key:   "glossary",
    icon:  "📚",
    label: "Glossary",
    sub:   "Learn · Reference · Search",
    desc:  "200 essential finance, investing & business terms — explained plainly",
    accent: "#8e44ad",
  },
];

/* ─────────────────────────────────────────────────────────
   TICKER STRIP  (decorative scrolling labels)
───────────────────────────────────────────────────────── */
const TICKERS = [
  "S&P 500", "NASDAQ", "DOW", "AAPL", "TSLA", "MSFT", "AMZN", "NVDA",
  "ETF", "401(k)", "ROTH IRA", "COMPOUND INTEREST", "NET WORTH",
  "PORTFOLIO", "DIVERSIFICATION", "YIELD", "DIVIDEND", "IPO",
];

function TickerStrip() {
  const repeated = [...TICKERS, ...TICKERS, ...TICKERS];
  return (
    <div style={{
      overflow: "hidden",
      borderTop:    `1px solid ${T.faint}`,
      borderBottom: `1px solid ${T.faint}`,
      padding: "0.45rem 0",
      background: T.night,
      position: "relative",
    }}>
      {/* fade edges */}
      {["left", "right"].map(side => (
        <div key={side} style={{
          position: "absolute", top: 0, bottom: 0, [side]: 0,
          width: 80, zIndex: 2,
          background: `linear-gradient(to ${side === "left" ? "right" : "left"}, ${T.night}, transparent)`,
          pointerEvents: "none",
        }} />
      ))}

      <div style={{
        display: "flex", gap: "2.5rem", width: "max-content",
        animation: "tickerScroll 60s linear infinite",
      }}>
        {repeated.map((t, i) => (
          <span key={i} style={{
            fontFamily: "'Fira Code', monospace",
            fontSize: "0.65rem",
            fontWeight: 500,
            letterSpacing: "0.12em",
            color: i % 4 === 0 ? T.teal : i % 4 === 2 ? T.amber : T.muted,
            textTransform: "uppercase",
            whiteSpace: "nowrap",
          }}>
            {t}
          </span>
        ))}
      </div>

      <style>{`
        @keyframes tickerScroll {
          from { transform: translateX(0); }
          to   { transform: translateX(-33.333%); }
        }
      `}</style>
    </div>
  );
}

/* ─────────────────────────────────────────────────────────
   HEADER
───────────────────────────────────────────────────────── */
function Header() {
  return (
    <header style={{
      background:  T.dark,
      borderBottom: `1px solid ${T.faint}`,
      position: "sticky",
      top: 0,
      zIndex: 200,
    }}>
      <div style={{
        maxWidth: 1280,
        margin: "0 auto",
        padding: "0 2rem",
        height: 64,
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        gap: "1rem",
      }}>
        {/* ── Brand ── */}
        <div style={{ display: "flex", alignItems: "baseline", gap: "0.75rem" }}>
          {/* Logo mark */}
          <div style={{
            width: 32, height: 32,
            borderRadius: 8,
            background: T.teal,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            flexShrink: 0,
          }}>
            <span style={{ fontFamily: "'DM Serif Display', serif", fontSize: "1rem", color: T.dark, lineHeight: 1 }}>F</span>
          </div>

          <div>
            <span style={{
              fontFamily: "'DM Serif Display', serif",
              fontSize: "1.35rem",
              color: T.white,
              letterSpacing: "-0.01em",
              lineHeight: 1,
            }}>
              Fin<span style={{ color: T.teal }}>Edge</span>
            </span>
          </div>

          <span style={{
            fontFamily: "'Fira Code', monospace",
            fontSize: "0.6rem",
            color: T.muted,
            letterSpacing: "0.14em",
            textTransform: "uppercase",
            paddingLeft: "0.5rem",
            borderLeft: `1px solid ${T.faint}`,
            alignSelf: "center",
          }}>
            Financial Education Platform
          </span>
        </div>

        {/* ── Right side ── */}
        <div style={{ display: "flex", alignItems: "center", gap: "1.5rem" }}>
          <span style={{
            fontFamily: "'Fira Code', monospace",
            fontSize: "0.6rem",
            color: T.faint,
            letterSpacing: "0.1em",
            textTransform: "uppercase",
          }}>
            by Mamadou B. Bah
          </span>

          <a
            href=" https://mamadoubbah.github.io/"
            style={{
              fontFamily: "'DM Sans', sans-serif",
              fontSize: "0.78rem",
              fontWeight: 500,
              color: T.muted,
              textDecoration: "none",
              display: "flex",
              alignItems: "center",
              gap: "0.35rem",
              padding: "0.38rem 0.85rem",
              border: `1px solid ${T.faint}`,
              borderRadius: 6,
              transition: "color 0.2s, border-color 0.2s",
            }}
            onMouseOver={e => { e.currentTarget.style.color = T.teal; e.currentTarget.style.borderColor = T.teal; }}
            onMouseOut={e  => { e.currentTarget.style.color = T.muted; e.currentTarget.style.borderColor = T.faint; }}
          >
            ← Portfolio Hub
          </a>
        </div>
      </div>
    </header>
  );
}

/* ─────────────────────────────────────────────────────────
   HERO BAND  (sits between header and nav)
───────────────────────────────────────────────────────── */
function HeroBand({ activeNav }) {
  const active = NAV.find(n => n.key === activeNav);

  return (
    <div style={{
      background: T.night,
      padding: "2.25rem 2rem 2rem",
      position: "relative",
      overflow: "hidden",
    }}>
      {/* subtle dot grid */}
      <div style={{
        position: "absolute", inset: 0,
        backgroundImage: "radial-gradient(circle, rgba(255,255,255,0.035) 1px, transparent 1px)",
        backgroundSize: "28px 28px",
        pointerEvents: "none",
      }} />

      {/* glow orb */}
      <div style={{
        position: "absolute",
        top: -60, left: -40,
        width: 320, height: 320,
        borderRadius: "50%",
        background: `radial-gradient(circle, ${active?.accent ?? T.teal}18 0%, transparent 70%)`,
        pointerEvents: "none",
        transition: "background 0.5s ease",
      }} />

      <div style={{ maxWidth: 1280, margin: "0 auto", position: "relative", zIndex: 1 }}>
        <p style={{
          fontFamily: "'Fira Code', monospace",
          fontSize: "0.65rem",
          color: active?.accent ?? T.teal,
          letterSpacing: "0.18em",
          textTransform: "uppercase",
          margin: "0 0 0.6rem",
        }}>
          Financial Education · Practice Platform
        </p>
        <h1 style={{
          fontFamily: "'DM Serif Display', serif",
          fontSize: "clamp(1.8rem, 4vw, 2.9rem)",
          color: T.white,
          margin: "0 0 0.6rem",
          letterSpacing: "-0.02em",
          lineHeight: 1.1,
          fontWeight: 400,
        }}>
          {active ? (
            <>
              <span style={{ color: active.accent }}>{active.icon} {active.label}</span>
              <span style={{ color: T.offWhite }}> — {active.sub}</span>
            </>
          ) : (
            <>Learn Finance.<br />
              <span style={{ color: T.teal, fontStyle: "italic" }}>Build Wealth.</span>
            </>
          )}
        </h1>
        <p style={{
          fontFamily: "'DM Sans', sans-serif",
          fontSize: "0.9rem",
          color: T.muted,
          margin: 0,
          maxWidth: 540,
          lineHeight: 1.65,
        }}>
          {active?.desc ?? "An interactive playground covering budgeting, stock research, portfolio building, and financial literacy — built to make finance approachable for everyone."}
        </p>
      </div>
    </div>
  );
}

/* ─────────────────────────────────────────────────────────
   NAV TABS
───────────────────────────────────────────────────────── */
function NavTabs({ active, onChange }) {
  return (
    <div style={{
      background: T.navy,
      borderBottom: `1px solid ${T.faint}`,
      padding: "0 2rem",
      position: "sticky",
      top: 64,
      zIndex: 150,
    }}>
      <div style={{
        maxWidth: 1280,
        margin: "0 auto",
        display: "flex",
        gap: 0,
        overflowX: "auto",
        msOverflowStyle: "none",
        scrollbarWidth: "none",
      }}>
        {NAV.map(n => {
          const isActive = active === n.key;
          return (
            <button
              key={n.key}
              onClick={() => onChange(n.key)}
              style={{
                padding: "0 1.6rem",
                height: 52,
                border: "none",
                background: "none",
                cursor: "pointer",
                display: "flex",
                alignItems: "center",
                gap: "0.55rem",
                fontFamily: "'DM Sans', sans-serif",
                fontSize: "0.88rem",
                fontWeight: isActive ? 700 : 400,
                color: isActive ? n.accent : T.muted,
                borderBottom: isActive ? `2px solid ${n.accent}` : "2px solid transparent",
                marginBottom: "-1px",
                transition: "color 0.2s, border-color 0.2s",
                whiteSpace: "nowrap",
                flexShrink: 0,
              }}
              onMouseOver={e => { if (!isActive) e.currentTarget.style.color = T.offWhite; }}
              onMouseOut={e  => { if (!isActive) e.currentTarget.style.color = T.muted; }}
            >
              <span style={{ fontSize: "1rem" }}>{n.icon}</span>
              {n.label}
            </button>
          );
        })}
      </div>
    </div>
  );
}

/* ─────────────────────────────────────────────────────────
   CONTENT WRAPPER  (the light surface under the dark shell)
───────────────────────────────────────────────────────── */
function ContentArea({ children }) {
  return (
    <div style={{
      background: T.bg,
      minHeight: "calc(100vh - 64px - 52px - 110px)", // fill page
      padding: "2.5rem 2rem 4rem",
    }}>
      <div style={{ maxWidth: 1280, margin: "0 auto" }}>
        {children}
      </div>
    </div>
  );
}

/* ─────────────────────────────────────────────────────────
   FOOTER
───────────────────────────────────────────────────────── */
function Footer() {
  return (
    <footer style={{
      background: T.night,
      borderTop: `1px solid ${T.faint}`,
      padding: "1.5rem 2rem",
    }}>
      <div style={{
        maxWidth: 1280,
        margin: "0 auto",
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
        flexWrap: "wrap",
        gap: "0.75rem",
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: "0.6rem" }}>
          <div style={{
            width: 22, height: 22, borderRadius: 5,
            background: T.teal,
            display: "flex", alignItems: "center", justifyContent: "center",
          }}>
            <span style={{ fontFamily: "'DM Serif Display', serif", fontSize: "0.75rem", color: T.dark }}>F</span>
          </div>
          <span style={{ fontFamily: "'DM Serif Display', serif", fontSize: "0.95rem", color: T.offWhite }}>
            Fin<span style={{ color: T.teal }}>Edge</span>
          </span>
          <span style={{ fontSize: "0.72rem", color: T.faint, fontFamily: "'DM Sans', sans-serif" }}>
            · by Mamadou B. Bah
          </span>
        </div>

        <div style={{ display: "flex", gap: "1.5rem", alignItems: "center" }}>
          <span style={{
            fontFamily: "'Fira Code', monospace",
            fontSize: "0.62rem",
            color: T.faint,
            letterSpacing: "0.08em",
          }}>
            PRICES VIA POLYGON.IO & FINNHUB · FREE TIER · PREVIOUS-DAY CLOSE
          </span>
          <span style={{
            fontFamily: "'Fira Code', monospace",
            fontSize: "0.62rem",
            color: T.faint,
            letterSpacing: "0.08em",
          }}>
            FOR EDUCATIONAL USE ONLY
          </span>
        </div>
      </div>
    </footer>
  );
}

/* ─────────────────────────────────────────────────────────
   ROOT APP
───────────────────────────────────────────────────────── */
export default function App() {
  const [view, setView] = useState("budget");

  /* Inject Google Fonts */
  useEffect(() => {
    if (document.getElementById("finedge-fonts")) return;
    const link = document.createElement("link");
    link.id   = "finedge-fonts";
    link.rel  = "stylesheet";
    link.href = FONT_HREF;
    document.head.appendChild(link);
  }, []);

  /* Global base styles */
  useEffect(() => {
    const style = document.createElement("style");
    style.id = "finedge-base";
    style.textContent = `
      *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
      html { scroll-behavior: smooth; }
      body {
        font-family: 'DM Sans', system-ui, sans-serif;
        background: ${T.night};
        color: ${T.dark};
        -webkit-font-smoothing: antialiased;
      }
      ::-webkit-scrollbar { width: 6px; height: 6px; }
      ::-webkit-scrollbar-track { background: ${T.night}; }
      ::-webkit-scrollbar-thumb { background: ${T.faint}; border-radius: 3px; }
      ::-webkit-scrollbar-thumb:hover { background: ${T.muted}; }
      input, button, select, textarea { font-family: inherit; }
      a { color: inherit; }
    `;
    if (!document.getElementById("finedge-base")) {
      document.head.appendChild(style);
    }
  }, []);

  return (
    <div>
      <Header />
      <TickerStrip />
      <HeroBand activeNav={view} />
      <NavTabs active={view} onChange={setView} />

      <ContentArea>
        {view === "budget"   && <BudgetApp />}
        {view === "stocks"   && <StockVisualizer />}
        {view === "glossary" && <GlossaryPage />}
      </ContentArea>

      <Footer />
    </div>
  );
}
