import { useEffect, useRef } from "react";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

gsap.registerPlugin(ScrollTrigger);

// ── Data ──────────────────────────────────────────────────────────────────────

const PRINCIPLES = [
  {
    n:    "01",
    name: "Event-driven pipeline",
    why:  "Stages are decoupled — each emits a typed event instead of calling the next directly. Failure stays local.",
  },
  {
    n:    "02",
    name: "Closed feedback loop",
    why:  "Every accept or dismiss becomes a weighted signal. The loop closes within the same session.",
  },
  {
    n:    "03",
    name: "Adaptive policy weights",
    why:  "UCB-style scoring with decaying epsilon avoids lock-in and keeps decisions competitive under non-stationarity.",
  },
  {
    n:    "04",
    name: "Stage isolation",
    why:  "Profile / Decision / Intervention / Action each own one transformation. No stage reads another's internal state.",
  },
];

const PIPELINE_STAGES = [
  {
    n:     "01",
    label: "Context",
    out:   "Resolves session + identity",
    event: "context:collected",
  },
  {
    n:     "02",
    label: "Behavior",
    out:   "Scores engagement, churn, cohort",
    event: "profile:computed",
  },
  {
    n:     "03",
    label: "Decision",
    out:   "Selects action via UCB weights",
    event: "decision:made",
    accent: true,
  },
  {
    n:     "04",
    label: "Intervention",
    out:   "Calibrates intensity + fatigue",
    event: "intervention:calibrated",
  },
  {
    n:     "05",
    label: "Action",
    out:   "Emits final instruction",
    event: "action:resolved",
  },
];

const STACK = [
  {
    group: "Frontend",
    items: [
      { tool: "React + TypeScript",     purpose: "Deterministic UI state with compile-time contracts on pipeline data shapes" },
      { tool: "Vite",                   purpose: "Sub-second HMR — iteration loop matches the real-time feedback loop" },
    ],
  },
  {
    group: "Motion",
    items: [
      { tool: "GSAP",   purpose: "Frame-accurate data transitions — confidence score counts up, score bar springs in" },
      { tool: "Lenis",  purpose: "Scroll that doesn't fight browser paint — defers to requestAnimationFrame" },
    ],
  },
  {
    group: "State / Events",
    items: [
      { tool: "EventBus (custom)", purpose: "Typed pub/sub connecting pipeline stages without import coupling" },
      { tool: "useRef over useState", purpose: "Run counter stays in sync with renders without triggering extra paint cycles" },
    ],
  },
];

// ── Section ───────────────────────────────────────────────────────────────────

export function ArchitectureSection() {
  const sectionRef = useRef<HTMLElement>(null);

  useEffect(() => {
    const ctx = gsap.context(() => {
      gsap.from(".arch-heading", {
        y: 20, opacity: 0, duration: 0.6, ease: "power3.out",
        scrollTrigger: { trigger: ".arch-heading", start: "top 82%" },
      });
      gsap.from(".arch-principle", {
        y: 14, opacity: 0, duration: 0.5, stagger: 0.07, ease: "power2.out",
        scrollTrigger: { trigger: ".arch-principle", start: "top 82%" },
      });
      gsap.from(".arch-stage", {
        y: 14, opacity: 0, duration: 0.45, stagger: 0.06, ease: "power2.out",
        scrollTrigger: { trigger: ".arch-stage", start: "top 82%" },
      });
      gsap.from(".arch-stack-col", {
        y: 14, opacity: 0, duration: 0.5, stagger: 0.08, ease: "power2.out",
        scrollTrigger: { trigger: ".arch-stack-col", start: "top 82%" },
      });
    }, sectionRef);
    return () => ctx.revert();
  }, []);

  return (
    <section
      ref={sectionRef}
      style={{ padding: "80px 24px 100px", maxWidth: 900, margin: "0 auto" }}
    >
      {/* Section label + heading */}
      <div className="arch-heading" style={{ marginBottom: 56 }}>
        <div style={{
          fontSize: 10, fontWeight: 700, letterSpacing: "0.14em",
          textTransform: "uppercase", color: "var(--t4)", marginBottom: 14,
        }}>
          System design
        </div>
        <h2 style={{
          margin: "0 0 12px",
          fontSize: "clamp(24px, 3vw, 36px)",
          fontWeight: 800, letterSpacing: "-0.04em", color: "var(--t1)", lineHeight: 1.1,
        }}>
          How the pipeline actually works.
        </h2>
        <p style={{ margin: 0, fontSize: 15, color: "var(--t3)", maxWidth: 480, lineHeight: 1.7 }}>
          Five isolated stages, one event bus, a closed feedback loop.
          No framework magic — just typed functions and observable state.
        </p>
      </div>

      {/* ── A: Architecture principles ─────────────────────────── */}
      <div style={{ marginBottom: 56 }}>
        <Label>Architecture</Label>

        <div style={{ display: "flex", flexDirection: "column" }}>
          {PRINCIPLES.map((p, i) => (
            <div
              key={p.n}
              className="arch-principle"
              style={{
                display: "grid",
                gridTemplateColumns: "28px 200px 1fr",
                gap: "0 20px",
                alignItems: "baseline",
                padding: "14px 0",
                borderBottom: i < PRINCIPLES.length - 1
                  ? "1px solid var(--border)"
                  : "none",
              }}
            >
              <span style={{
                fontSize: 10, fontWeight: 800, fontFamily: "var(--font-mono)",
                color: "var(--indigo)", letterSpacing: "0.06em",
              }}>
                {p.n}
              </span>
              <span style={{ fontSize: 13, fontWeight: 700, color: "var(--t1)", letterSpacing: "-0.01em" }}>
                {p.name}
              </span>
              <span style={{ fontSize: 13, color: "var(--t3)", lineHeight: 1.6 }}>
                {p.why}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* ── B: Pipeline flow ───────────────────────────────────── */}
      <div style={{ marginBottom: 56 }}>
        <Label>Pipeline flow</Label>

        {/* Stage row */}
        <div style={{ display: "flex", alignItems: "flex-start", gap: 0, marginBottom: 12 }}>
          {PIPELINE_STAGES.map((stage, i) => (
            <div key={stage.n} style={{ display: "flex", alignItems: "flex-start", flex: "1 1 0", minWidth: 0 }}>
              <div
                className="arch-stage"
                style={{
                  flex: "1 1 0", minWidth: 0,
                  padding: "12px 14px",
                  borderRadius: "var(--r-md)",
                  background: stage.accent
                    ? "rgba(99,102,241,0.07)"
                    : "rgba(255,255,255,0.02)",
                  border: `1px solid ${stage.accent ? "rgba(99,102,241,0.2)" : "var(--border)"}`,
                  position: "relative",
                }}
              >
                {/* Top accent line */}
                {stage.accent && (
                  <div style={{
                    position: "absolute", top: 0, left: 0, right: 0, height: 2,
                    borderRadius: "var(--r-md) var(--r-md) 0 0",
                    background: "linear-gradient(90deg, var(--indigo), #818cf8)",
                  }} />
                )}

                <div style={{ display: "flex", alignItems: "center", gap: 5, marginBottom: 6 }}>
                  <span style={{
                    fontSize: 8, fontWeight: 800, fontFamily: "var(--font-mono)",
                    color: stage.accent ? "#818cf8" : "var(--t5)", letterSpacing: "0.08em",
                  }}>
                    {stage.n}
                  </span>
                  <span style={{
                    fontSize: 11, fontWeight: 700,
                    color: stage.accent ? "#c7d2fe" : "var(--t2)",
                    letterSpacing: "0.01em",
                  }}>
                    {stage.label}
                  </span>
                </div>

                <div style={{ fontSize: 11, color: stage.accent ? "var(--t2)" : "var(--t4)", lineHeight: 1.5, marginBottom: 8 }}>
                  {stage.out}
                </div>

                <div style={{
                  fontSize: 9, fontFamily: "var(--font-mono)",
                  color: stage.accent ? "rgba(99,102,241,0.6)" : "var(--t5)",
                  letterSpacing: "0.03em",
                }}>
                  {stage.event}
                </div>
              </div>

              {/* Arrow connector */}
              {i < PIPELINE_STAGES.length - 1 && (
                <div style={{
                  display: "flex", alignItems: "center", justifyContent: "center",
                  width: 24, flexShrink: 0, paddingTop: 20,
                }}>
                  <svg width="18" height="10" viewBox="0 0 18 10" fill="none">
                    <path d="M0 5h14M11 2l3 3-3 3" stroke="rgba(255,255,255,0.12)" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                </div>
              )}
            </div>
          ))}
        </div>

        {/* Feedback loop annotation */}
        <div style={{
          display: "flex", alignItems: "center", gap: 8,
          padding: "10px 14px",
          borderRadius: "var(--r-sm)",
          background: "rgba(255,255,255,0.02)",
          border: "1px solid var(--border)",
        }}>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="var(--t5)" strokeWidth="1.5">
            <path strokeLinecap="round" strokeLinejoin="round" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
          </svg>
          <span style={{ fontSize: 11, color: "var(--t4)" }}>
            <span style={{ color: "var(--t2)", fontWeight: 600 }}>Feedback loop — </span>
            accept/dismiss signals are timestamped, weighted by recency + strength, then fed back into policy weight updates via the adaptation engine.
          </span>
        </div>
      </div>

      {/* ── C: Core stack ─────────────────────────────────────── */}
      <div>
        <Label>Core stack</Label>

        <div style={{
          display: "grid",
          gridTemplateColumns: "repeat(3, 1fr)",
          gap: 12,
        }}>
          {STACK.map(({ group, items }) => (
            <div
              key={group}
              className="arch-stack-col"
              style={{
                padding: "16px 18px",
                borderRadius: "var(--r-md)",
                background: "rgba(255,255,255,0.02)",
                border: "1px solid var(--border)",
              }}
            >
              <div style={{
                fontSize: 9, fontWeight: 700, letterSpacing: "0.12em",
                textTransform: "uppercase", color: "var(--t5)", marginBottom: 14,
              }}>
                {group}
              </div>

              <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
                {items.map(({ tool, purpose }) => (
                  <div key={tool}>
                    <div style={{
                      fontSize: 12, fontWeight: 700, color: "var(--t1)",
                      fontFamily: "var(--font-mono)", marginBottom: 4,
                      letterSpacing: "-0.01em",
                    }}>
                      {tool}
                    </div>
                    <div style={{ fontSize: 11, color: "var(--t4)", lineHeight: 1.6 }}>
                      {purpose}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>

    </section>
  );
}

// ── Helpers ───────────────────────────────────────────────────────────────────

function Label({ children }: { children: React.ReactNode }) {
  return (
    <div style={{
      fontSize: 9, fontWeight: 700, letterSpacing: "0.14em",
      textTransform: "uppercase", color: "var(--t4)",
      marginBottom: 18,
      display: "flex", alignItems: "center", gap: 10,
    }}>
      {children}
      <div style={{ flex: 1, height: 1, background: "var(--border)" }} />
    </div>
  );
}
