import { useEffect, useRef } from "react";
import { gsap } from "gsap";
import { DecisionResult } from "../stages/types";
import { Badge, SectionLabel } from "./ui";

type Props = {
  decision:  DecisionResult;
  runCount:  number;
  onAccept:  () => void;
  onDismiss: () => void;
  onRerun:   () => void;
};

const COPY: Record<string, { headline: string; subtext: string }> = {
  "show-upsell": {
    headline: "Recommend upgrade to Pro",
    subtext:  "User shows high engagement and low churn risk — a good moment to present the offer.",
  },
  "do-nothing": {
    headline: "No action required",
    subtext:  "Engagement is within normal bounds. Intervening now would increase fatigue risk.",
  },
};

export function DecisionPanel({ decision, runCount, onAccept, onDismiss, onRerun }: Props) {
  const cardRef  = useRef<HTMLDivElement>(null);
  const confRef  = useRef<HTMLSpanElement>(null);
  const scoreRef = useRef<HTMLDivElement>(null);
  const prevRun  = useRef(-1);

  const copy       = COPY[decision.best] ?? { headline: decision.best, subtext: "" };
  const rawScore   = decision.ranked[0]?.score ?? 0;
  const confPct    = Math.round(Math.max(0, Math.min(1, (rawScore + 1) / 2)) * 100);

  useEffect(() => {
    const ctx = gsap.context(() => {
      if (prevRun.current === -1) {
        // Initial entrance
        gsap.from(cardRef.current, { y: 14, opacity: 0, duration: 0.4, ease: "power3.out" });
      } else {
        // Flash border on update
        gsap.fromTo(cardRef.current,
          { boxShadow: "0 0 0 1px rgba(99,102,241,0.6), 0 0 20px rgba(99,102,241,0.15)" },
          { boxShadow: "0 0 0 1px rgba(255,255,255,0.07), 0 0 0px rgba(99,102,241,0)", duration: 0.7, ease: "power2.out" },
        );
        // Headline slide-replace
        gsap.from(".dp-headline", { y: 8, opacity: 0, duration: 0.3, ease: "power2.out" });
        gsap.from(".dp-subtext",  { y: 6, opacity: 0, duration: 0.3, ease: "power2.out", delay: 0.05 });
      }

      // Confidence counter
      if (confRef.current) {
        const obj = { v: 0 };
        gsap.to(obj, {
          v: confPct, duration: 0.8, ease: "power3.out",
          onUpdate() { if (confRef.current) confRef.current.textContent = `${Math.round(obj.v)}%`; },
        });
      }

      // Score bar
      if (scoreRef.current) {
        gsap.from(scoreRef.current, { scaleX: 0, duration: 0.6, ease: "power3.out", transformOrigin: "left" });
      }

      prevRun.current = runCount;
    }, cardRef);
    return () => ctx.revert();
  }, [runCount]);

  const isUpsell = decision.best === "show-upsell";

  return (
    <div
      ref={cardRef}
      style={{
        background: "#18181b",
        border: "1px solid rgba(255,255,255,0.07)",
        borderRadius: 16,
        padding: "24px 28px",
      }}
    >
      {/* Header row */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 18 }}>
        <SectionLabel>Decision · run {runCount}</SectionLabel>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <Badge variant={confPct >= 65 ? "indigo" : "default"}>
            <span ref={confRef}>0%</span> confidence
          </Badge>
          <Badge variant={isUpsell ? "blue" : "default"}>
            {isUpsell ? "upsell" : "passive"}
          </Badge>
        </div>
      </div>

      <h2
        className="dp-headline"
        style={{
          margin: "0 0 8px", fontSize: 26, fontWeight: 700,
          color: "#fafafa", letterSpacing: "-0.035em", lineHeight: 1.2,
        }}
      >
        {copy.headline}
      </h2>
      <p
        className="dp-subtext"
        style={{ margin: "0 0 22px", fontSize: 14, color: "#71717a", lineHeight: 1.65, maxWidth: 560 }}
      >
        {copy.subtext}
      </p>

      {/* Score bar */}
      <div style={{ marginBottom: 22 }}>
        <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 6 }}>
          <span style={{ fontSize: 10, fontWeight: 700, letterSpacing: "0.08em", textTransform: "uppercase", color: "#3f3f46" }}>
            Policy score
          </span>
          <div style={{ display: "flex", gap: 12 }}>
            {decision.ranked.map(({ action, score: s }, idx) => (
              <span key={action} style={{
                fontSize: 10, fontFamily: "var(--font-mono)",
                color: idx === 0 ? "#a5b4fc" : "#3f3f46",
                fontWeight: idx === 0 ? 700 : 400,
              }}>
                {action}: {s.toFixed(4)}
              </span>
            ))}
          </div>
        </div>
        <div style={{ height: 3, background: "rgba(255,255,255,0.05)", borderRadius: 2, overflow: "hidden" }}>
          <div
            ref={scoreRef}
            style={{
              height: "100%",
              width: `${confPct}%`,
              background: confPct >= 65
                ? "linear-gradient(90deg, #4f46e5, #818cf8)"
                : "linear-gradient(90deg, #3f3f46, #52525b)",
              borderRadius: 2,
            }}
          />
        </div>
      </div>

      {/* Actions */}
      <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
        <button
          onClick={onAccept}
          style={{
            background: "#6366f1", color: "#fff", border: "none",
            padding: "8px 20px", borderRadius: 9, fontSize: 13,
            fontWeight: 600, cursor: "pointer", fontFamily: "inherit",
            letterSpacing: "0.01em",
          }}
        >
          Accept
        </button>
        <button
          onClick={onDismiss}
          style={{
            background: "rgba(255,255,255,0.05)", color: "#a1a1aa",
            border: "1px solid rgba(255,255,255,0.08)",
            padding: "8px 20px", borderRadius: 9, fontSize: 13,
            fontWeight: 500, cursor: "pointer", fontFamily: "inherit",
          }}
        >
          Dismiss
        </button>
        <button
          onClick={onRerun}
          style={{
            marginLeft: "auto", background: "none", border: "none",
            color: "#3f3f46", fontSize: 11, cursor: "pointer",
            fontFamily: "var(--font-mono)", padding: "6px 8px",
            letterSpacing: "0.04em",
          }}
        >
          rerun ↺
        </button>
      </div>
    </div>
  );
}
