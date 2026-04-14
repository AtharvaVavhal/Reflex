import { useEffect, useRef } from "react";
import { gsap } from "gsap";
import { DecisionResult, Intervention, UserProfile } from "../stages/types";
import { PipelineOutput } from "../core/pipeline";

type Props = {
  profile:      UserProfile;
  decision:     DecisionResult;
  intervention: Intervention;
  action:       PipelineOutput;
  runKey:       number;
};

type Stage = {
  id:     string;
  label:  string;
  icon:   string;
  rows:   Array<{ key: string; value: string; highlight?: boolean }>;
};

function buildStages({ profile, decision, intervention, action }: Omit<Props, "runKey">): Stage[] {
  const score     = decision.ranked[0]?.score ?? 0;
  const confPct   = Math.round(Math.max(0, Math.min(1, (score + 1) / 2)) * 100);

  return [
    {
      id:    "context",
      label: "Context",
      icon:  "01",
      rows:  [
        { key: "user",   value: "user-1" },
        { key: "cohort", value: profile.cohort, highlight: true },
      ],
    },
    {
      id:    "behavior",
      label: "Behavior",
      icon:  "02",
      rows:  [
        { key: "engagement", value: `${Math.round(profile.engagement * 100)}%`, highlight: profile.engagement > 0.6 },
        { key: "churn",      value: `${Math.round(profile.churnRisk * 100)}%` },
      ],
    },
    {
      id:    "decision",
      label: "Decision",
      icon:  "03",
      rows:  [
        { key: "action", value: decision.best, highlight: true },
        { key: "conf",   value: `${confPct}%` },
      ],
    },
    {
      id:    "intervention",
      label: "Calibration",
      icon:  "04",
      rows:  [
        { key: "intensity", value: intervention.intensity, highlight: true },
        { key: "decision",  value: intervention.decision },
      ],
    },
    {
      id:    "action",
      label: "Action",
      icon:  "05",
      rows:  [
        { key: "output",    value: action.action,    highlight: true },
        { key: "intensity", value: action.intensity },
      ],
    },
  ];
}

export function PipelineViz({ runKey, ...rest }: Props) {
  const containerRef = useRef<HTMLDivElement>(null);
  const stages       = buildStages(rest);

  useEffect(() => {
    const ctx = gsap.context(() => {
      gsap.from(".pv-stage", {
        opacity: 0, y: 10, duration: 0.35, stagger: 0.07,
        ease: "power2.out", clearProps: "all",
      });
      gsap.from(".pv-connector", {
        scaleX: 0, duration: 0.3, stagger: 0.07, delay: 0.06,
        ease: "power2.out", transformOrigin: "left center", clearProps: "all",
      });
    }, containerRef);
    return () => ctx.revert();
  }, [runKey]);

  return (
    <div
      ref={containerRef}
      style={{
        background: "#111113",
        border: "1px solid rgba(255,255,255,0.06)",
        borderRadius: 14,
        padding: "18px 20px 20px",
        overflow: "hidden",
      }}
    >
      <div style={{
        fontSize: 10, fontWeight: 700, letterSpacing: "0.1em",
        textTransform: "uppercase", color: "#3f3f46", marginBottom: 16,
      }}>
        Pipeline · run {runKey}
      </div>

      <div style={{
        display: "grid",
        gridTemplateColumns: "repeat(5, 1fr)",
        alignItems: "start",
        gap: 0,
      }}>
        {stages.map((stage, i) => (
          <div key={stage.id} style={{ display: "flex", alignItems: "flex-start" }}>
            {/* Stage card */}
            <div className="pv-stage" style={{ flex: 1, minWidth: 0 }}>
              <div style={{
                display: "flex", alignItems: "center", gap: 6, marginBottom: 8,
              }}>
                <div style={{
                  width: 18, height: 18, borderRadius: 5,
                  background: "rgba(99,102,241,0.15)",
                  border: "1px solid rgba(99,102,241,0.25)",
                  display: "flex", alignItems: "center", justifyContent: "center",
                  flexShrink: 0,
                }}>
                  <span style={{ fontSize: 8, fontWeight: 800, color: "#818cf8", fontFamily: "var(--font-mono)" }}>
                    {stage.icon}
                  </span>
                </div>
                <span style={{ fontSize: 11, fontWeight: 600, color: "#71717a", letterSpacing: "0.02em" }}>
                  {stage.label}
                </span>
              </div>

              {stage.rows.map(({ key, value, highlight }) => (
                <div key={key} style={{ marginBottom: 4 }}>
                  <div style={{ fontSize: 9, color: "#3f3f46", fontWeight: 600, letterSpacing: "0.06em", textTransform: "uppercase", marginBottom: 1 }}>
                    {key}
                  </div>
                  <div style={{
                    fontSize: 11, fontWeight: 700,
                    color: highlight ? "#e4e4e7" : "#71717a",
                    fontFamily: "var(--font-mono)",
                    overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap",
                  }}>
                    {value}
                  </div>
                </div>
              ))}
            </div>

            {/* Connector */}
            {i < stages.length - 1 && (
              <div className="pv-connector" style={{
                display: "flex", alignItems: "center",
                padding: "0 6px", paddingTop: 9, flexShrink: 0,
              }}>
                <div style={{
                  width: "100%",
                  display: "flex", alignItems: "center", gap: 0,
                }}>
                  <div style={{ flex: 1, height: 1, background: "rgba(255,255,255,0.08)" }} />
                  <svg width="6" height="6" viewBox="0 0 6 6" fill="none" style={{ flexShrink: 0 }}>
                    <path d="M1 1l4 2-4 2" stroke="#3f3f46" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                </div>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
