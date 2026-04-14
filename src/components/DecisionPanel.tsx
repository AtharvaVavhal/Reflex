import { useEffect, useRef, useState } from "react";
import { gsap } from "gsap";
import { DecisionResult } from "../stages/types";
import { Card, Badge, Button, SectionLabel } from "./ui";

type Props = {
  decision: DecisionResult;
  onAccept: () => void;
  onDismiss: () => void;
  onRerun: () => void;
};

type ActionState = "idle" | "accepted" | "dismissed";

const COPY: Record<string, { headline: string; subtext: string }> = {
  "show-upsell": {
    headline: "Recommend upgrade to Pro",
    subtext: "User shows high engagement and low churn risk — a good moment to present the offer.",
  },
  "do-nothing": {
    headline: "No action required",
    subtext: "Engagement is within normal bounds. Intervening now would increase fatigue risk.",
  },
};

export function DecisionPanel({ decision, onAccept, onDismiss, onRerun }: Props) {
  const [state, setState] = useState<ActionState>("idle");
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const ctx = gsap.context(() => {
      gsap.from(ref.current, { y: 20, opacity: 0, duration: 0.5, ease: "power3.out" });
    });
    return () => ctx.revert();
  }, []);

  const copy = COPY[decision.best] ?? { headline: decision.best, subtext: "" };
  const score = decision.ranked[0]?.score ?? 0;
  const pct   = Math.round(Math.max(0, Math.min(1, (score + 1) / 2) ) * 100);
  const highConfidence = pct >= 60;

  const accept  = () => { setState("accepted");  onAccept();  };
  const dismiss = () => { setState("dismissed"); onDismiss(); };
  const rerun   = () => { setState("idle");       onRerun();   };

  return (
    <div ref={ref}>
      <Card style={{ padding: "24px 28px", opacity: state === "dismissed" ? 0.45 : 1, transition: "opacity 250ms ease" }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 16 }}>
          <SectionLabel>Decision</SectionLabel>
          <Badge variant={highConfidence ? "indigo" : "default"}>
            {pct}% confidence
          </Badge>
        </div>

        <h2 style={{
          margin: "0 0 10px",
          fontSize: 28,
          fontWeight: 700,
          color: "#fafafa",
          letterSpacing: "-0.03em",
          lineHeight: 1.2,
        }}>
          {copy.headline}
        </h2>

        <p style={{
          margin: "0 0 24px",
          fontSize: 14,
          color: "#71717a",
          lineHeight: 1.7,
          maxWidth: 560,
        }}>
          {copy.subtext}
        </p>

        {/* Score bar */}
        <div style={{ marginBottom: 24 }}>
          <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 6 }}>
            <span style={{ fontSize: 11, color: "#52525b", fontWeight: 600, letterSpacing: "0.05em", textTransform: "uppercase" }}>
              Policy score
            </span>
            <span style={{ fontSize: 11, color: "#52525b", fontFamily: "var(--font-mono)" }}>
              {score.toFixed(4)}
            </span>
          </div>
          <div style={{ height: 4, background: "rgba(255,255,255,0.06)", borderRadius: 2, overflow: "hidden" }}>
            <div style={{
              height: "100%",
              width: `${pct}%`,
              background: highConfidence
                ? "linear-gradient(90deg, #6366f1, #818cf8)"
                : "linear-gradient(90deg, #3f3f46, #52525b)",
              borderRadius: 2,
              transition: "width 600ms cubic-bezier(0.4,0,0.2,1)",
            }} />
          </div>
        </div>

        {/* Ranked decisions */}
        <div style={{
          display: "flex", gap: 8, marginBottom: 24, flexWrap: "wrap",
        }}>
          {decision.ranked.map(({ action, score: s }, idx) => (
            <div
              key={action}
              style={{
                display: "flex", alignItems: "center", gap: 8,
                padding: "6px 12px",
                borderRadius: 8,
                border: `1px solid ${idx === 0 ? "rgba(99,102,241,0.3)" : "rgba(255,255,255,0.06)"}`,
                background: idx === 0 ? "rgba(99,102,241,0.08)" : "rgba(255,255,255,0.02)",
              }}
            >
              <span style={{ fontSize: 11, color: idx === 0 ? "#a5b4fc" : "#52525b", fontWeight: 600 }}>
                {action}
              </span>
              <span style={{ fontSize: 10, color: "#3f3f46", fontFamily: "var(--font-mono)" }}>
                {s.toFixed(3)}
              </span>
            </div>
          ))}
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <Button
            onClick={accept}
            style={state === "accepted" ? { background: "#4f46e5" } : undefined}
          >
            {state === "accepted" ? "Accepted ✓" : "Accept"}
          </Button>
          <Button variant="secondary" onClick={dismiss}>
            Dismiss
          </Button>
          <button
            onClick={rerun}
            style={{
              marginLeft: "auto",
              background: "none",
              border: "none",
              color: "#3f3f46",
              fontSize: 12,
              cursor: "pointer",
              fontFamily: "inherit",
              fontWeight: 500,
              padding: "6px 8px",
            }}
          >
            Rerun ↺
          </button>
        </div>
      </Card>
    </div>
  );
}
