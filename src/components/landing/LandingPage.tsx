import { useEffect, useRef } from "react";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { useLenis } from "../../hooks/useLenis";
import { useCountUp } from "../../hooks/useCountUp";
import { Badge, Button } from "../ui";

gsap.registerPlugin(ScrollTrigger);

// ─── Hero ─────────────────────────────────────────────────────────────────────

function Hero({ onLaunch }: { onLaunch: () => void }) {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const ctx = gsap.context(() => {
      gsap.from(".hero-badge", { y: 16, opacity: 0, duration: 0.6, ease: "power2.out", delay: 0.1 });
      gsap.from(".hero-headline", { y: 24, opacity: 0, duration: 0.7, ease: "power3.out", delay: 0.25 });
      gsap.from(".hero-sub", { y: 16, opacity: 0, duration: 0.6, ease: "power2.out", delay: 0.4 });
      gsap.from(".hero-actions", { y: 12, opacity: 0, duration: 0.5, ease: "power2.out", delay: 0.55 });
      gsap.from(".hero-meta", { opacity: 0, duration: 0.6, delay: 0.8 });
    }, containerRef);
    return () => ctx.revert();
  }, []);

  return (
    <section
      ref={containerRef}
      style={{
        minHeight: "100vh",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        padding: "80px 24px 100px",
        position: "relative",
        overflow: "hidden",
        textAlign: "center",
      }}
    >
      {/* Grid background */}
      <div style={{
        position: "absolute", inset: 0,
        backgroundImage: `
          linear-gradient(rgba(255,255,255,0.025) 1px, transparent 1px),
          linear-gradient(90deg, rgba(255,255,255,0.025) 1px, transparent 1px)
        `,
        backgroundSize: "48px 48px",
        maskImage: "radial-gradient(ellipse 80% 60% at 50% 50%, black 30%, transparent 100%)",
      }} />

      {/* Glow */}
      <div style={{
        position: "absolute",
        top: "30%", left: "50%",
        transform: "translate(-50%, -50%)",
        width: 600, height: 400,
        background: "radial-gradient(ellipse, rgba(99,102,241,0.12) 0%, transparent 70%)",
        pointerEvents: "none",
      }} />

      <div style={{ position: "relative", maxWidth: 720 }}>
        <div className="hero-badge" style={{ marginBottom: 28 }}>
          <Badge variant="indigo">
            <span style={{ width: 5, height: 5, borderRadius: "50%", background: "#818cf8", display: "inline-block" }} />
            Adaptive Decision Intelligence
          </Badge>
        </div>

        <h1
          className="hero-headline"
          style={{
            margin: "0 0 24px",
            fontSize: "clamp(40px, 6vw, 72px)",
            fontWeight: 800,
            letterSpacing: "-0.04em",
            lineHeight: 1.05,
            background: "linear-gradient(135deg, #ffffff 0%, #e4e4e7 40%, #a1a1aa 100%)",
            WebkitBackgroundClip: "text",
            WebkitTextFillColor: "transparent",
            backgroundClip: "text",
          }}
        >
          Decisions that learn
          <br />
          <span style={{
            background: "linear-gradient(135deg, #818cf8 0%, #6366f1 50%, #4f46e5 100%)",
            WebkitBackgroundClip: "text",
            WebkitTextFillColor: "transparent",
            backgroundClip: "text",
          }}>
            from every interaction.
          </span>
        </h1>

        <p
          className="hero-sub"
          style={{
            margin: "0 auto 40px",
            fontSize: 18,
            color: "#71717a",
            lineHeight: 1.7,
            maxWidth: 520,
          }}
        >
          Reflex runs a real-time adaptive pipeline — reading behavior, modeling risk,
          and calibrating interventions that improve with every cycle.
        </p>

        <div
          className="hero-actions"
          style={{ display: "flex", gap: 12, justifyContent: "center", flexWrap: "wrap" }}
        >
          <Button size="lg" onClick={onLaunch} style={{ boxShadow: "0 0 32px rgba(99,102,241,0.3)" }}>
            Run pipeline
            <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3" />
            </svg>
          </Button>
          <Button size="lg" variant="secondary">
            View source
          </Button>
        </div>

        <div
          className="hero-meta"
          style={{
            marginTop: 64,
            display: "flex",
            gap: 32,
            justifyContent: "center",
            flexWrap: "wrap",
          }}
        >
          {[
            { label: "Stages in pipeline", value: "5" },
            { label: "Signal types tracked", value: "3" },
            { label: "Strategy: UCB + ε-greedy", value: "" },
          ].map(({ label, value }) => (
            <div key={label} style={{ textAlign: "center" }}>
              {value && <div style={{ fontSize: 24, fontWeight: 700, color: "#e4e4e7", letterSpacing: "-0.03em" }}>{value}</div>}
              <div style={{ fontSize: 12, color: "#52525b", marginTop: value ? 2 : 0 }}>{label}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Scroll cue */}
      <div style={{
        position: "absolute", bottom: 32, left: "50%", transform: "translateX(-50%)",
        display: "flex", flexDirection: "column", alignItems: "center", gap: 6,
        opacity: 0.35,
      }}>
        <div style={{ fontSize: 11, color: "#52525b", letterSpacing: "0.08em" }}>SCROLL</div>
        <div style={{ width: 1, height: 32, background: "linear-gradient(to bottom, #52525b, transparent)" }} />
      </div>
    </section>
  );
}

// ─── Demo Preview ─────────────────────────────────────────────────────────────

function DemoPreview() {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const ctx = gsap.context(() => {
      gsap.from(".demo-frame", {
        y: 60, opacity: 0, duration: 1, ease: "power3.out",
        scrollTrigger: { trigger: ".demo-frame", start: "top 80%" },
      });
    }, ref);
    return () => ctx.revert();
  }, []);

  return (
    <section
      ref={ref}
      style={{ padding: "80px 24px 100px", maxWidth: 900, margin: "0 auto" }}
    >
      <div style={{ textAlign: "center", marginBottom: 56 }}>
        <SectionTag>Live preview</SectionTag>
        <h2 style={headingStyle}>The pipeline, visualized.</h2>
        <p style={subStyle}>
          Watch decisions get made, scored, and refined in real time as behavioral signals flow through each stage.
        </p>
      </div>

      <div
        className="demo-frame"
        style={{
          border: "1px solid rgba(255,255,255,0.08)",
          borderRadius: 20,
          overflow: "hidden",
          background: "#0c0c0e",
          boxShadow: "0 40px 80px rgba(0,0,0,0.6), 0 0 0 1px rgba(255,255,255,0.04)",
        }}
      >
        {/* Browser chrome */}
        <div style={{
          background: "#141416",
          borderBottom: "1px solid rgba(255,255,255,0.06)",
          padding: "12px 16px",
          display: "flex",
          alignItems: "center",
          gap: 12,
        }}>
          <div style={{ display: "flex", gap: 6 }}>
            {["#ef4444", "#f59e0b", "#22c55e"].map((c) => (
              <div key={c} style={{ width: 10, height: 10, borderRadius: "50%", background: c, opacity: 0.7 }} />
            ))}
          </div>
          <div style={{
            flex: 1, background: "#1c1c1f", borderRadius: 6,
            padding: "4px 10px", fontSize: 11, color: "#52525b",
            fontFamily: "var(--font-mono)", display: "flex", alignItems: "center", gap: 6,
          }}>
            <svg width="10" height="10" fill="none" stroke="#52525b" strokeWidth="2" viewBox="0 0 24 24">
              <path d="M12 2a10 10 0 100 20 10 10 0 000-20z" />
              <path strokeLinecap="round" d="M2 12h20M12 2c-2.8 2.7-4.5 6.2-4.5 10s1.7 7.3 4.5 10M12 2c2.8 2.7 4.5 6.2 4.5 10s-1.7 7.3-4.5 10" />
            </svg>
            reflex.app/dashboard
          </div>
        </div>

        {/* Mock dashboard content */}
        <div style={{ padding: 24, display: "flex", flexDirection: "column", gap: 16 }}>
          {/* Decision mock */}
          <div style={{
            background: "#18181b", border: "1px solid rgba(255,255,255,0.06)",
            borderRadius: 12, padding: "20px 22px",
          }}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 12 }}>
              <span style={{ fontSize: 10, fontWeight: 700, letterSpacing: "0.1em", color: "#52525b", textTransform: "uppercase" }}>Decision</span>
              <span style={{ fontSize: 11, fontWeight: 600, padding: "3px 10px", borderRadius: 999, background: "rgba(99,102,241,0.15)", color: "#a5b4fc" }}>87% confidence</span>
            </div>
            <div style={{ fontSize: 22, fontWeight: 700, color: "#fafafa", letterSpacing: "-0.03em", marginBottom: 6 }}>
              Recommend upgrade to Pro
            </div>
            <div style={{ fontSize: 13, color: "#52525b", lineHeight: 1.6 }}>
              User shows high engagement and low churn risk — optimal moment to surface the offer.
            </div>
          </div>

          {/* Metrics row mock */}
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 12 }}>
            {[
              { label: "Engagement", pct: 78, color: "#6366f1" },
              { label: "Churn Risk", pct: 22, color: "#22c55e" },
              { label: "Impulsivity", pct: 54, color: "#f59e0b" },
            ].map(({ label, pct, color }) => (
              <div key={label} style={{
                background: "#18181b", border: "1px solid rgba(255,255,255,0.06)",
                borderRadius: 12, padding: "14px 16px",
              }}>
                <div style={{ fontSize: 11, color: "#52525b", marginBottom: 8 }}>{label}</div>
                <div style={{ height: 4, background: "rgba(255,255,255,0.06)", borderRadius: 2, overflow: "hidden" }}>
                  <div style={{ height: "100%", width: `${pct}%`, background: color, borderRadius: 2 }} />
                </div>
                <div style={{ fontSize: 18, fontWeight: 700, color: "#fafafa", marginTop: 8, letterSpacing: "-0.02em" }}>{pct}%</div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

// ─── How It Works ─────────────────────────────────────────────────────────────

const STEPS = [
  {
    n: "01",
    title: "Collect behavioral signals",
    body: "Every click, scroll, and dismiss is captured with strength scores, timing data, and outcome labels fed directly into the feedback loop.",
    accent: "#6366f1",
  },
  {
    n: "02",
    title: "Compute weighted decisions",
    body: "UCB-style exploration bonuses and decaying epsilon-greedy sampling select the best action, balancing exploitation with uncertainty-driven exploration.",
    accent: "#818cf8",
  },
  {
    n: "03",
    title: "Adapt policy weights",
    body: "Continuous gradient updates with adaptive momentum and global decay prevent overconfidence and keep the system responsive to environment shifts.",
    accent: "#a5b4fc",
  },
];

function HowItWorks() {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const ctx = gsap.context(() => {
      gsap.from(".step-card", {
        y: 40, opacity: 0, duration: 0.7, stagger: 0.15, ease: "power3.out",
        scrollTrigger: { trigger: ".step-card", start: "top 80%" },
      });
    }, ref);
    return () => ctx.revert();
  }, []);

  return (
    <section
      ref={ref}
      style={{ padding: "80px 24px 100px", maxWidth: 900, margin: "0 auto" }}
    >
      <div style={{ textAlign: "center", marginBottom: 64 }}>
        <SectionTag>How it works</SectionTag>
        <h2 style={headingStyle}>Reinforcement learning, simplified.</h2>
        <p style={subStyle}>
          A three-stage loop that reads, decides, and improves — continuously.
        </p>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))", gap: 16 }}>
        {STEPS.map(({ n, title, body, accent }) => (
          <div
            key={n}
            className="step-card"
            style={{
              background: "#18181b",
              border: "1px solid rgba(255,255,255,0.07)",
              borderRadius: 16,
              padding: "28px 28px 32px",
              position: "relative",
              overflow: "hidden",
            }}
          >
            <div style={{
              position: "absolute", top: 0, left: 0, right: 0, height: 2,
              background: `linear-gradient(90deg, ${accent}, transparent)`,
            }} />
            <div style={{
              fontSize: 11, fontWeight: 800, letterSpacing: "0.12em",
              color: accent, marginBottom: 20, fontFamily: "var(--font-mono)",
            }}>
              {n}
            </div>
            <h3 style={{
              margin: "0 0 12px", fontSize: 17, fontWeight: 700,
              color: "#e4e4e7", letterSpacing: "-0.02em", lineHeight: 1.3,
            }}>
              {title}
            </h3>
            <p style={{ margin: 0, fontSize: 14, color: "#71717a", lineHeight: 1.7 }}>{body}</p>
          </div>
        ))}
      </div>
    </section>
  );
}

// ─── System Intelligence ──────────────────────────────────────────────────────

function StatCard({ value, label, suffix = "" }: { value: number; label: string; suffix?: string }) {
  const numRef = useCountUp(value, 1.6);
  const cardRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const ctx = gsap.context(() => {
      gsap.from(cardRef.current, {
        y: 30, opacity: 0, duration: 0.8, ease: "power3.out",
        scrollTrigger: { trigger: cardRef.current, start: "top 85%" },
      });
    });
    return () => ctx.revert();
  }, []);

  return (
    <div
      ref={cardRef}
      style={{
        background: "#18181b",
        border: "1px solid rgba(255,255,255,0.07)",
        borderRadius: 16,
        padding: "28px 28px",
        textAlign: "center",
      }}
    >
      <div style={{
        fontSize: 48, fontWeight: 800, letterSpacing: "-0.04em",
        color: "#fafafa", lineHeight: 1, marginBottom: 8,
      }}>
        <span ref={numRef}>0</span>
        <span style={{ color: "#6366f1" }}>{suffix}</span>
      </div>
      <div style={{ fontSize: 13, color: "#71717a" }}>{label}</div>
    </div>
  );
}

function SystemIntelligence() {
  return (
    <section style={{
      padding: "80px 24px 100px", maxWidth: 900, margin: "0 auto",
    }}>
      <div style={{ textAlign: "center", marginBottom: 64 }}>
        <SectionTag>System intelligence</SectionTag>
        <h2 style={headingStyle}>Built for real environments.</h2>
        <p style={subStyle}>
          Designed to handle non-stationarity, delayed rewards, and adversarial phase shifts — not just toy scenarios.
        </p>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))", gap: 16, marginBottom: 48 }}>
        <StatCard value={30}  label="evaluation runs" suffix="×" />
        <StatCard value={100} label="iterations per run" />
        <StatCard value={5}   label="pipeline stages" />
        <StatCard value={3}   label="environment phases" />
      </div>

      <div style={{
        background: "#18181b",
        border: "1px solid rgba(255,255,255,0.07)",
        borderRadius: 16,
        padding: "28px 32px",
        display: "grid",
        gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
        gap: 24,
      }}>
        {[
          { label: "Exploration", value: "UCB + ε-greedy decay", mono: true },
          { label: "Signal processing", value: "Weighted recency scoring", mono: false },
          { label: "Adaptation", value: "Adaptive momentum SGD", mono: false },
          { label: "Regret mitigation", value: "Confidence-based weighting", mono: false },
        ].map(({ label, value, mono }) => (
          <div key={label}>
            <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: "0.08em", color: "#52525b", textTransform: "uppercase", marginBottom: 6 }}>
              {label}
            </div>
            <div style={{
              fontSize: 13, fontWeight: 600, color: "#e4e4e7",
              fontFamily: mono ? "var(--font-mono)" : "inherit",
            }}>
              {value}
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}

// ─── Final CTA ────────────────────────────────────────────────────────────────

function FinalCTA({ onLaunch }: { onLaunch: () => void }) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const ctx = gsap.context(() => {
      gsap.from(".cta-inner", {
        y: 40, opacity: 0, duration: 0.9, ease: "power3.out",
        scrollTrigger: { trigger: ".cta-inner", start: "top 80%" },
      });
    }, ref);
    return () => ctx.revert();
  }, []);

  return (
    <section
      ref={ref}
      style={{ padding: "80px 24px 120px", maxWidth: 900, margin: "0 auto", textAlign: "center" }}
    >
      <div
        className="cta-inner"
        style={{
          background: "linear-gradient(135deg, #18181b 0%, #1a1a2e 100%)",
          border: "1px solid rgba(99,102,241,0.2)",
          borderRadius: 24,
          padding: "72px 48px",
          position: "relative",
          overflow: "hidden",
        }}
      >
        {/* Glow */}
        <div style={{
          position: "absolute", bottom: -60, left: "50%", transform: "translateX(-50%)",
          width: 400, height: 200,
          background: "radial-gradient(ellipse, rgba(99,102,241,0.2) 0%, transparent 70%)",
          pointerEvents: "none",
        }} />

        <div style={{ position: "relative" }}>
          <h2 style={{
            margin: "0 0 16px",
            fontSize: "clamp(28px, 4vw, 44px)",
            fontWeight: 800,
            letterSpacing: "-0.04em",
            color: "#fafafa",
            lineHeight: 1.1,
          }}>
            See the engine run.
          </h2>
          <p style={{
            margin: "0 auto 40px",
            fontSize: 16, color: "#71717a", maxWidth: 420, lineHeight: 1.7,
          }}>
            One click starts the adaptive pipeline and surfaces a real-time decision with full introspection.
          </p>
          <Button size="lg" onClick={onLaunch} style={{ boxShadow: "0 0 40px rgba(99,102,241,0.35)" }}>
            Open dashboard
            <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3" />
            </svg>
          </Button>
        </div>
      </div>
    </section>
  );
}

// ─── Shared helpers ───────────────────────────────────────────────────────────

function SectionTag({ children }: { children: React.ReactNode }) {
  return (
    <div style={{ marginBottom: 16 }}>
      <Badge variant="outline">{children}</Badge>
    </div>
  );
}

const headingStyle: React.CSSProperties = {
  margin: "0 0 16px",
  fontSize: "clamp(26px, 3.5vw, 40px)",
  fontWeight: 800,
  letterSpacing: "-0.04em",
  color: "#fafafa",
  lineHeight: 1.1,
};

const subStyle: React.CSSProperties = {
  margin: "0 auto",
  fontSize: 16,
  color: "#71717a",
  maxWidth: 500,
  lineHeight: 1.7,
};

// ─── Nav ──────────────────────────────────────────────────────────────────────

function Nav({ onLaunch }: { onLaunch: () => void }) {
  return (
    <header style={{
      position: "fixed", top: 0, left: 0, right: 0,
      zIndex: 50,
      padding: "0 32px",
      height: 56,
      display: "flex",
      alignItems: "center",
      justifyContent: "space-between",
      background: "rgba(9,9,11,0.8)",
      backdropFilter: "blur(12px)",
      borderBottom: "1px solid rgba(255,255,255,0.05)",
    }}>
      <div style={{
        fontSize: 13, fontWeight: 700, letterSpacing: "0.1em",
        textTransform: "uppercase", color: "#e4e4e7",
      }}>
        Reflex
      </div>
      <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
        <span style={{ fontSize: 11, color: "#52525b" }}>Adaptive decision engine</span>
        <Button size="sm" onClick={onLaunch}>Dashboard</Button>
      </div>
    </header>
  );
}

// ─── Landing Page ─────────────────────────────────────────────────────────────

export function LandingPage({ onLaunch }: { onLaunch: () => void }) {
  useLenis();

  return (
    <div style={{ background: "#09090b", minHeight: "100vh" }}>
      <Nav onLaunch={onLaunch} />
      <div style={{ paddingTop: 56 }}>
        <Hero onLaunch={onLaunch} />
        <DemoPreview />
        <HowItWorks />
        <SystemIntelligence />
        <FinalCTA onLaunch={onLaunch} />
      </div>
    </div>
  );
}
