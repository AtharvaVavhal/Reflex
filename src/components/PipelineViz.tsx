import { useEffect, useRef } from "react";
import { gsap } from "gsap";
import { DecisionResult, Intervention, UserProfile } from "../stages/types";
import { PipelineOutput } from "../core/pipeline";

type Props = {
  profile:            UserProfile;
  decision:           DecisionResult;
  intervention:       Intervention;
  action:             PipelineOutput;
  runKey:             number;
  computing?:         boolean;
  onComputeComplete?: () => void;
};

type Stage = {
  id:      string;
  label:   string;
  n:       string;
  primary: string;
  sub:     string;
  accent?: boolean;
};

function buildStages({ profile, decision, intervention, action }: Omit<Props, "runKey" | "computing" | "onComputeComplete">): Stage[] {
  const score   = decision.ranked[0]?.score ?? 0;
  const confPct = Math.round(Math.max(0, Math.min(1, (score + 1) / 2)) * 100);
  return [
    {
      id: "context", label: "Context", n: "01",
      primary: "user-1",
      sub: profile.cohort.replace("_", " "),
    },
    {
      id: "behavior", label: "Behavior", n: "02",
      primary: `${Math.round(profile.engagement * 100)}% eng`,
      sub: `${Math.round(profile.churnRisk * 100)}% churn`,
    },
    {
      id: "decision", label: "Decision", n: "03",
      primary: decision.best,
      sub: `${confPct}% conf`,
      accent: true,
    },
    {
      id: "calibration", label: "Calibration", n: "04",
      primary: intervention.intensity,
      sub: TYPE_SHORT[intervention.decision] ?? intervention.decision,
    },
    {
      id: "action", label: "Action", n: "05",
      primary: action.action,
      sub: action.intensity,
    },
  ];
}

const TYPE_SHORT: Record<string, string> = {
  "show-upsell": "upsell",
  "do-nothing":  "passive",
};

// Connector with traveling dot for computing animation
function Connector({ active, connIdx }: { active?: boolean; connIdx: number }) {
  return (
    <div
      data-conn={connIdx}
      style={{
        display: "flex", alignItems: "center",
        padding: "0 4px", paddingTop: 1,
        flexShrink: 0, width: 28,
      }}
    >
      <svg width="28" height="12" viewBox="0 0 28 12" fill="none" overflow="visible">
        <line
          x1="0" y1="6" x2="22" y2="6"
          stroke={active ? "rgba(99,102,241,0.4)" : "rgba(255,255,255,0.07)"}
          strokeWidth="1"
          strokeDasharray="3 3"
          style={active ? { animation: "flow-line 1.2s linear infinite" } : {}}
        />
        <path
          d="M20 3 L24 6 L20 9"
          stroke={active ? "rgba(99,102,241,0.5)" : "rgba(255,255,255,0.1)"}
          strokeWidth="1.2"
          strokeLinecap="round" strokeLinejoin="round"
          fill="none"
        />
        {/* Traveling dot — animated during computing */}
        <circle
          className="conn-dot"
          cx={0} cy={6} r={2.2}
          fill="rgba(99,102,241,0.95)"
          opacity={0}
        />
      </svg>
    </div>
  );
}

export function PipelineViz({ runKey, computing = false, onComputeComplete, ...rest }: Props) {
  const containerRef = useRef<HTMLDivElement>(null);
  const stages       = buildStages(rest);

  // ── Entrance animation (result revealed after computing) ─────────────────────
  useEffect(() => {
    if (computing) return;
    const ctx = gsap.context(() => {
      gsap.from(".pv-node", {
        opacity: 0, y: 8, duration: 0.3,
        stagger: 0.06, ease: "power2.out", clearProps: "all",
      });
    }, containerRef);
    return () => ctx.revert();
  }, [runKey, computing]);

  // ── Computing animation: L→R stage activation ────────────────────────────────
  useEffect(() => {
    if (!computing) return;
    const el = containerRef.current;
    if (!el) return;

    const nodes = Array.from(el.querySelectorAll<HTMLElement>(".pv-node"));
    const dots  = Array.from(el.querySelectorAll<SVGCircleElement>(".conn-dot"));
    if (!nodes.length) return;

    // All nodes start dim and slightly scaled down
    gsap.set(nodes, { opacity: 0.18, scale: 0.95, clearProps: "boxShadow" });
    gsap.set(dots,  { opacity: 0, attr: { cx: 2 } });

    const stageGap = 0.17; // seconds between stage activations

    const tl = gsap.timeline({
      onComplete: () => { onComputeComplete?.(); },
    });

    nodes.forEach((node, i) => {
      const t = i * stageGap;

      // Activate stage
      tl.to(node, {
        opacity: 1,
        scale: 1,
        duration: 0.22,
        ease: "power2.out",
        clearProps: "transform",
      }, t);

      // Decision stage (index 2) gets an extra glow pulse
      if (i === 2) {
        tl.fromTo(
          node,
          { boxShadow: "0 0 0px rgba(99,102,241,0)" },
          {
            boxShadow: "0 0 24px rgba(99,102,241,0.4), 0 0 8px rgba(99,102,241,0.25)",
            duration: 0.2,
            yoyo: true,
            repeat: 1,
            ease: "power1.inOut",
          },
          t + 0.05,
        );
      }
    });

    // Connector dot travels right immediately after each stage lights up
    dots.forEach((dot, i) => {
      const t = i * stageGap + 0.16;
      tl.fromTo(
        dot,
        { attr: { cx: 2 }, opacity: 0 },
        { attr: { cx: 20 }, opacity: 1, duration: 0.16, ease: "power2.in" },
        t,
      );
      // Dot fades out as it reaches the arrow
      tl.to(dot, { opacity: 0, duration: 0.06, ease: "power1.in" }, t + 0.16);
    });

    return () => { tl.kill(); };
  }, [computing, onComputeComplete]);

  return (
    <div style={{
      background: "var(--surface-1)",
      border: `1px solid ${computing ? "rgba(99,102,241,0.2)" : "var(--border)"}`,
      borderRadius: "var(--r-lg)",
      padding: "14px 18px",
      transition: "border-color 300ms ease, box-shadow 300ms ease",
      boxShadow: computing ? "0 0 0 1px rgba(99,102,241,0.08), 0 4px 20px rgba(99,102,241,0.06)" : "none",
    }}>
      {/* Header */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 14 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <span style={{
            fontSize: 10, fontWeight: 700, letterSpacing: "0.1em",
            textTransform: "uppercase", color: "var(--t4)",
          }}>
            Pipeline
          </span>
          {computing && (
            <span style={{
              fontSize: 9, fontWeight: 700, letterSpacing: "0.1em",
              textTransform: "uppercase", color: "#818cf8",
              fontFamily: "var(--font-mono)",
              animation: "pulse-live 1.4s ease-in-out infinite",
            }}>
              computing
            </span>
          )}
        </div>
        <span style={{ fontSize: 10, color: "var(--t5)", fontFamily: "var(--font-mono)" }}>
          5 stages · run {runKey}
        </span>
      </div>

      {/* Stages */}
      <div
        ref={containerRef}
        style={{ display: "flex", alignItems: "center" }}
      >
        {stages.map((stage, i) => (
          <div
            key={stage.id}
            style={{ display: "flex", alignItems: "center", flex: i < stages.length - 1 ? "1 1 0" : "0 0 auto" }}
          >
            {/* Node */}
            <div
              className="pv-node"
              style={{
                flex: "0 0 auto",
                padding: "10px 12px",
                borderRadius: "var(--r-md)",
                background: stage.accent
                  ? "rgba(99,102,241,0.08)"
                  : "rgba(255,255,255,0.02)",
                border: `1px solid ${stage.accent ? "rgba(99,102,241,0.2)" : "var(--border)"}`,
                boxShadow: stage.accent ? "0 0 16px rgba(99,102,241,0.08)" : "none",
                minWidth: 0,
              }}
            >
              <div style={{ display: "flex", alignItems: "center", gap: 5, marginBottom: 5 }}>
                <span style={{
                  fontSize: 8, fontWeight: 800, fontFamily: "var(--font-mono)",
                  color: stage.accent ? "#818cf8" : "var(--t5)",
                  letterSpacing: "0.06em",
                }}>
                  {stage.n}
                </span>
                <span style={{
                  fontSize: 10, fontWeight: 600,
                  color: stage.accent ? "#a5b4fc" : "var(--t4)",
                  letterSpacing: "0.03em",
                }}>
                  {stage.label}
                </span>
              </div>
              <div style={{
                fontSize: 11, fontWeight: 700,
                color: stage.accent ? "var(--t1)" : "var(--t2)",
                fontFamily: "var(--font-mono)",
                whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis",
                marginBottom: 2,
              }}>
                {stage.primary}
              </div>
              <div style={{
                fontSize: 10,
                color: stage.accent ? "#818cf8" : "var(--t5)",
                fontFamily: "var(--font-mono)",
                whiteSpace: "nowrap",
              }}>
                {stage.sub}
              </div>
            </div>

            {/* Connector */}
            {i < stages.length - 1 && (
              <div style={{ flex: "1 1 0", minWidth: 16, display: "flex", justifyContent: "center" }}>
                <Connector
                  active={!computing && (stage.accent || stages[i + 1].accent)}
                  connIdx={i}
                />
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
