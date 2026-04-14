import { useEffect, useRef, useState } from "react";
import { gsap } from "gsap";
import { DecisionResult, UserProfile } from "../stages/types";

type Props = {
  decision:  DecisionResult;
  profile:   UserProfile;
  runCount:  number;
  onAccept:  () => void;
  onDismiss: () => void;
  onRerun:   () => void;
};

const COPY: Record<string, { headline: string; subtext: string }> = {
  "show-upsell": {
    headline: "Recommend upgrade to Pro",
    subtext:  "Behavioral signals indicate high receptiveness — this is the optimal moment to surface the offer.",
  },
  "do-nothing": {
    headline: "Hold — no action",
    subtext:  "Engagement pattern doesn't justify intervention. Acting now would increase fatigue risk.",
  },
};

function buildReasons(profile: UserProfile, decision: DecisionResult): string[] {
  const eng   = Math.round(profile.engagement  * 100);
  const churn = Math.round(profile.churnRisk   * 100);
  const gap   = (decision.ranked[0]?.score ?? 0) - (decision.ranked[1]?.score ?? 0);
  const reasons: string[] = [];

  if (decision.best === "show-upsell") {
    reasons.push(`Engagement at ${eng}% — above the 60% intervention threshold.`);
    if (churn < 40) reasons.push(`Churn risk is low (${churn}%) — conversion attempt carries minimal downside.`);
    if (profile.cohort === "power_user") reasons.push(`Power user cohort shows elevated upgrade affinity in learned policy.`);
    else reasons.push(`Cohort (${profile.cohort.replace("_", " ")}) is compatible with upsell trigger conditions.`);
  } else {
    reasons.push(`Engagement at ${eng}% — below threshold for high-confidence conversion attempts.`);
    if (churn >= 40) reasons.push(`Churn risk elevated (${churn}%) — aggressive nudge could accelerate exit.`);
    reasons.push(`Cohort "${profile.cohort.replace("_", " ")}" responds better to passive re-engagement.`);
  }

  if (gap >= 0.25) reasons.push(`Strong policy consensus — ${gap.toFixed(3)} score margin over nearest alternative.`);
  else             reasons.push(`Narrow margin (${gap.toFixed(3)}) — decision weight driven by recent signal recency.`);

  return reasons.slice(0, 3);
}

export function DecisionPanel({ decision, profile, runCount, onAccept, onDismiss, onRerun }: Props) {
  const [showWhy, setShowWhy] = useState(false);
  const cardRef  = useRef<HTMLDivElement>(null);
  const barRef   = useRef<HTMLDivElement>(null);
  const confRef  = useRef<HTMLSpanElement>(null);
  const isFirst  = useRef(true);

  const copy    = COPY[decision.best] ?? { headline: decision.best, subtext: "" };
  const rawScore = decision.ranked[0]?.score ?? 0;
  const confPct  = Math.round(Math.max(0, Math.min(1, (rawScore + 1) / 2)) * 100);
  const reasons  = buildReasons(profile, decision);

  useEffect(() => {
    const ctx = gsap.context(() => {
      if (isFirst.current) {
        gsap.from(cardRef.current, { y: 16, opacity: 0, duration: 0.45, ease: "power3.out" });
        isFirst.current = false;
      } else {
        // Border flash on update
        gsap.fromTo(cardRef.current,
          { outlineColor: "rgba(99,102,241,0.6)", outlineWidth: "1px", outlineStyle: "solid", outlineOffset: "0px" },
          { outlineColor: "rgba(99,102,241,0)", duration: 0.6, ease: "power2.out" },
        );
        gsap.from(".dp-content", { opacity: 0.4, duration: 0.25, ease: "power2.out" });
      }

      // Confidence counter
      const obj = { v: 0 };
      gsap.to(obj, {
        v: confPct, duration: 0.9, ease: "power3.out",
        onUpdate() { if (confRef.current) confRef.current.textContent = `${Math.round(obj.v)}`; },
      });

      // Score bar
      gsap.from(barRef.current, { scaleX: 0, duration: 0.7, ease: "expo.out", transformOrigin: "left" });
    }, cardRef);
    return () => ctx.revert();
  }, [runCount]);

  const isUpsell = decision.best === "show-upsell";
  const ranked   = decision.ranked;

  return (
    <div
      ref={cardRef}
      style={{
        position: "relative",
        background: "linear-gradient(135deg, #18181b 0%, #16161a 100%)",
        border: "1px solid var(--border)",
        borderRadius: "var(--r-lg)",
        overflow: "hidden",
        boxShadow: "0 1px 0 rgba(255,255,255,0.04) inset, 0 8px 32px rgba(0,0,0,0.4)",
      }}
    >
      {/* Left accent bar */}
      <div style={{
        position: "absolute", left: 0, top: 0, bottom: 0, width: 3,
        background: `linear-gradient(to bottom, ${isUpsell ? "#6366f1" : "#52525b"}, ${isUpsell ? "#818cf8" : "#3f3f46"} 60%, transparent)`,
      }} />

      <div className="dp-content" style={{ padding: "22px 24px 22px 28px" }}>

        {/* Header */}
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 16 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <span style={{ fontSize: 10, fontWeight: 700, letterSpacing: "0.1em", textTransform: "uppercase", color: "var(--t4)" }}>
              Decision
            </span>
            <span style={{ fontSize: 10, color: "var(--t5)", fontFamily: "var(--font-mono)" }}>
              #{runCount}
            </span>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
            <span style={{
              fontSize: 10, fontWeight: 700, letterSpacing: "0.06em",
              padding: "3px 8px", borderRadius: "var(--r-sm)",
              background: isUpsell ? "rgba(99,102,241,0.12)" : "rgba(255,255,255,0.04)",
              color: isUpsell ? "#a5b4fc" : "var(--t4)",
              border: `1px solid ${isUpsell ? "rgba(99,102,241,0.2)" : "var(--border)"}`,
              textTransform: "uppercase",
            }}>
              {isUpsell ? "convert" : "passive"}
            </span>
            <span style={{
              fontSize: 10, fontWeight: 700, letterSpacing: "0.04em",
              padding: "3px 8px", borderRadius: "var(--r-sm)",
              background: confPct >= 65 ? "rgba(99,102,241,0.1)" : "rgba(255,255,255,0.04)",
              color: confPct >= 65 ? "#818cf8" : "var(--t4)",
              border: "1px solid var(--border)",
              fontFamily: "var(--font-mono)",
            }}>
              <span ref={confRef}>0</span>% conf
            </span>
          </div>
        </div>

        {/* Headline */}
        <h2 style={{
          margin: "0 0 8px", fontSize: 24, fontWeight: 700,
          color: "var(--t1)", letterSpacing: "-0.03em", lineHeight: 1.2,
        }}>
          {copy.headline}
        </h2>
        <p style={{
          margin: "0 0 20px", fontSize: 13,
          color: "var(--t3)", lineHeight: 1.65, maxWidth: 520,
        }}>
          {copy.subtext}
        </p>

        {/* Action comparison */}
        <div style={{ display: "flex", gap: 8, marginBottom: 18 }}>
          {ranked.map(({ action, score }, idx) => {
            const pct = Math.round(Math.max(0, Math.min(1, (score + 1) / 2)) * 100);
            const isWinner = idx === 0;
            return (
              <div
                key={action}
                style={{
                  flex: 1,
                  padding: "12px 14px",
                  borderRadius: "var(--r-md)",
                  background: isWinner ? "rgba(99,102,241,0.08)" : "rgba(255,255,255,0.02)",
                  border: `1px solid ${isWinner ? "rgba(99,102,241,0.25)" : "var(--border)"}`,
                  position: "relative",
                  overflow: "hidden",
                }}
              >
                {/* Bar fill */}
                <div style={{
                  position: "absolute", bottom: 0, left: 0, right: 0, height: 2,
                  background: isWinner
                    ? "linear-gradient(90deg, #6366f1, #818cf8)"
                    : "rgba(255,255,255,0.05)",
                }} />
                <div ref={isWinner ? barRef : undefined} style={{
                  position: "absolute", bottom: 0, left: 0, height: 2,
                  width: `${pct}%`,
                  background: "linear-gradient(90deg, #6366f1, #818cf8)",
                  display: isWinner ? "block" : "none",
                }} />

                <div style={{ fontSize: 9, fontWeight: 700, letterSpacing: "0.1em", textTransform: "uppercase", color: isWinner ? "#818cf8" : "var(--t5)", marginBottom: 4 }}>
                  {isWinner ? "selected" : "alternative"}
                </div>
                <div style={{ fontSize: 12, fontWeight: 700, color: isWinner ? "var(--t1)" : "var(--t4)", marginBottom: 2, fontFamily: "var(--font-mono)" }}>
                  {action}
                </div>
                <div style={{ fontSize: 18, fontWeight: 800, letterSpacing: "-0.03em", color: isWinner ? "var(--t1)" : "var(--t5)", fontFamily: "var(--font-mono)", lineHeight: 1 }}>
                  {score.toFixed(3)}
                </div>
              </div>
            );
          })}
        </div>

        {/* Why expandable */}
        <div style={{
          borderTop: "1px solid var(--border)",
          marginBottom: 18,
          paddingTop: 14,
        }}>
          <button
            onClick={() => setShowWhy(s => !s)}
            style={{
              background: "none", border: "none", cursor: "pointer",
              display: "flex", alignItems: "center", gap: 6,
              padding: 0, fontFamily: "inherit",
            }}
          >
            <span style={{ fontSize: 11, fontWeight: 600, color: "var(--t3)", letterSpacing: "0.02em" }}>
              Why this decision?
            </span>
            <svg
              width="12" height="12" viewBox="0 0 24 24" fill="none"
              stroke="currentColor" strokeWidth="2.5"
              style={{
                color: "var(--t4)",
                transform: showWhy ? "rotate(180deg)" : "rotate(0deg)",
                transition: "transform 200ms ease",
              }}
            >
              <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
            </svg>
          </button>

          {showWhy && (
            <div style={{ marginTop: 12, display: "flex", flexDirection: "column", gap: 6, animation: "fade-up 200ms ease" }}>
              {reasons.map((reason, i) => (
                <div key={i} style={{ display: "flex", gap: 10, alignItems: "flex-start" }}>
                  <div style={{
                    width: 4, height: 4, borderRadius: "50%", background: "var(--indigo)",
                    marginTop: 5, flexShrink: 0,
                  }} />
                  <span style={{ fontSize: 12, color: "var(--t3)", lineHeight: 1.6 }}>{reason}</span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Actions */}
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <button className="btn-primary" onClick={onAccept}>Accept</button>
          <button className="btn-secondary" onClick={onDismiss}>Dismiss</button>
          <button className="btn-ghost" onClick={onRerun} style={{ marginLeft: "auto" }}>
            rerun ↺
          </button>
        </div>

      </div>
    </div>
  );
}
