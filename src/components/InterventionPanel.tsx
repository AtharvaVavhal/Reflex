import { Intervention, IntensityLevel } from "../stages/types";

type Props = { intervention: Intervention };

const STEPS: IntensityLevel[] = ["silent", "hint", "nudge", "prompt", "strong"];

const TYPE_LABEL: Record<string, string> = {
  "show-upsell": "Upsell prompt",
  "do-nothing":  "No action",
};

const INTENSITY_COLOR: Record<IntensityLevel, string> = {
  silent: "#3f3f46",
  hint:   "#22c55e",
  nudge:  "#22c55e",
  prompt: "#f59e0b",
  strong: "#ef4444",
  block:  "#ef4444",
};

const FATIGUE: Record<IntensityLevel, { label: string; color: string }> = {
  silent: { label: "None",   color: "#22c55e" },
  hint:   { label: "Low",    color: "#22c55e" },
  nudge:  { label: "Low",    color: "#22c55e" },
  prompt: { label: "Medium", color: "#f59e0b" },
  strong: { label: "High",   color: "#ef4444" },
  block:  { label: "High",   color: "#ef4444" },
};

export function InterventionPanel({ intervention }: Props) {
  const filled  = STEPS.indexOf(intervention.intensity) + 1;
  const color   = INTENSITY_COLOR[intervention.intensity];
  const fatigue = FATIGUE[intervention.intensity];
  const typeLabel = TYPE_LABEL[intervention.decision] ?? intervention.decision;

  return (
    <div style={{
      background: "var(--surface-2)",
      border: "1px solid var(--border)",
      borderRadius: "var(--r-lg)",
      padding: "16px 18px",
    }}>
      <span style={{ fontSize: 10, fontWeight: 700, letterSpacing: "0.1em", textTransform: "uppercase", color: "var(--t4)", display: "block", marginBottom: 16 }}>
        Intervention
      </span>

      {/* Type */}
      <div style={{ marginBottom: 14 }}>
        <div style={{ fontSize: 9, fontWeight: 700, letterSpacing: "0.09em", textTransform: "uppercase", color: "var(--t5)", marginBottom: 4 }}>Type</div>
        <div style={{ fontSize: 13, fontWeight: 700, color: "var(--t1)" }}>{typeLabel}</div>
      </div>

      {/* Intensity */}
      <div style={{ marginBottom: 14 }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 8 }}>
          <div style={{ fontSize: 9, fontWeight: 700, letterSpacing: "0.09em", textTransform: "uppercase", color: "var(--t5)" }}>Intensity</div>
          <span style={{ fontSize: 11, fontWeight: 700, color, letterSpacing: "0.03em" }}>
            {intervention.intensity.charAt(0).toUpperCase() + intervention.intensity.slice(1)}
          </span>
        </div>
        <div style={{ display: "flex", gap: 3 }}>
          {STEPS.map((_, i) => (
            <div
              key={i}
              style={{
                flex: 1, height: 4, borderRadius: 2,
                background: i < filled ? color : "rgba(255,255,255,0.06)",
                boxShadow: i < filled && i === filled - 1 ? `0 0 8px ${color}80` : "none",
                transition: "background 300ms ease, box-shadow 300ms ease",
              }}
            />
          ))}
        </div>
      </div>

      {/* Fatigue risk */}
      <div>
        <div style={{ fontSize: 9, fontWeight: 700, letterSpacing: "0.09em", textTransform: "uppercase", color: "var(--t5)", marginBottom: 4 }}>Fatigue risk</div>
        <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
          <div style={{ width: 6, height: 6, borderRadius: "50%", background: fatigue.color, flexShrink: 0 }} />
          <span style={{ fontSize: 12, fontWeight: 700, color: fatigue.color }}>{fatigue.label}</span>
        </div>
      </div>
    </div>
  );
}
