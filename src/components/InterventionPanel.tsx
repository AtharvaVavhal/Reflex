import { Intervention, IntensityLevel } from "../stages/types";
import { Card, SectionLabel, Badge } from "./ui";

type Props = {
  intervention: Intervention;
};

const INTENSITY_STEPS: IntensityLevel[] = ["silent", "hint", "nudge", "prompt", "strong"];

const TYPE_LABELS: Record<string, string> = {
  "show-upsell": "Upsell prompt",
  "do-nothing":  "No action",
};

const INTENSITY_META: Record<IntensityLevel, { label: string; variant: "green" | "amber" | "red" | "default" }> = {
  silent: { label: "Silent",  variant: "default" },
  hint:   { label: "Hint",    variant: "green"   },
  nudge:  { label: "Nudge",   variant: "green"   },
  prompt: { label: "Prompt",  variant: "amber"   },
  strong: { label: "Strong",  variant: "red"     },
  block:  { label: "Block",   variant: "red"     },
};

const FATIGUE_META: Record<IntensityLevel, { label: string; color: string }> = {
  silent: { label: "None",   color: "#22c55e" },
  hint:   { label: "Low",    color: "#22c55e" },
  nudge:  { label: "Low",    color: "#22c55e" },
  prompt: { label: "Medium", color: "#f59e0b" },
  strong: { label: "High",   color: "#ef4444" },
  block:  { label: "High",   color: "#ef4444" },
};

function IntensityDots({ intensity }: { intensity: IntensityLevel }) {
  const filledCount = Math.min(INTENSITY_STEPS.indexOf(intensity) + 1, INTENSITY_STEPS.length);
  const meta = INTENSITY_META[intensity] ?? INTENSITY_META.silent;

  return (
    <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
      <div style={{ display: "flex", gap: 5 }}>
        {INTENSITY_STEPS.map((_, i) => (
          <div
            key={i}
            style={{
              width: 8, height: 8, borderRadius: "50%",
              background: i < filledCount ? "#6366f1" : "rgba(255,255,255,0.08)",
              transition: "background 200ms",
            }}
          />
        ))}
      </div>
      <Badge variant={meta.variant}>{meta.label}</Badge>
    </div>
  );
}

function Row({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div style={{ marginBottom: 16 }}>
      <div style={{ fontSize: 10, fontWeight: 700, letterSpacing: "0.09em", textTransform: "uppercase", color: "#52525b", marginBottom: 7 }}>
        {label}
      </div>
      {children}
    </div>
  );
}

export function InterventionPanel({ intervention }: Props) {
  const fatigue   = FATIGUE_META[intervention.intensity];
  const typeLabel = TYPE_LABELS[intervention.decision] ?? intervention.decision;

  return (
    <Card style={{ padding: "18px 20px" }}>
      <SectionLabel style={{ marginBottom: 20 }}>Intervention</SectionLabel>

      <Row label="Type">
        <span style={{ fontSize: 13, fontWeight: 600, color: "#e4e4e7" }}>{typeLabel}</span>
      </Row>

      <Row label="Intensity">
        <IntensityDots intensity={intervention.intensity} />
      </Row>

      <Row label="Fatigue risk">
        <span style={{ fontSize: 13, fontWeight: 700, color: fatigue.color }}>{fatigue.label}</span>
      </Row>
    </Card>
  );
}
