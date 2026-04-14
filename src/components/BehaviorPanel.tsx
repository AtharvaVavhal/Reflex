import { UserProfile } from "../stages/types";
import { Card, SectionLabel } from "./ui";

type Props = {
  profile: UserProfile;
};

type MetricRowProps = {
  label: string;
  value: number;
  invert?: boolean;
};

function getColor(pct: number, invert: boolean): string {
  const isHigh = pct >= 70;
  const isLow  = pct < 40;
  if (invert) return isHigh ? "#ef4444" : isLow ? "#22c55e" : "#f59e0b";
  return isHigh ? "#22c55e" : isLow ? "#ef4444" : "#f59e0b";
}

function getLabel(pct: number, invert: boolean): string {
  const isHigh = pct >= 70;
  const isLow  = pct < 40;
  if (invert) return isHigh ? "High" : isLow ? "Low" : "Medium";
  return isHigh ? "High" : isLow ? "Low" : "Medium";
}

function MetricRow({ label, value, invert = false }: MetricRowProps) {
  const pct   = Math.round(value * 100);
  const color = getColor(pct, invert);
  const qual  = getLabel(pct, invert);

  return (
    <div style={{ marginBottom: 18 }}>
      <div style={{
        display: "flex", justifyContent: "space-between", alignItems: "baseline",
        marginBottom: 8,
      }}>
        <span style={{ fontSize: 12, fontWeight: 500, color: "#a1a1aa" }}>{label}</span>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <span style={{ fontSize: 11, fontWeight: 700, color, letterSpacing: "0.03em" }}>{qual}</span>
          <span style={{ fontSize: 11, color: "#3f3f46", fontFamily: "var(--font-mono)" }}>{pct}%</span>
        </div>
      </div>
      <div style={{ height: 3, background: "rgba(255,255,255,0.05)", borderRadius: 2, overflow: "hidden" }}>
        <div style={{
          height: "100%",
          width: `${pct}%`,
          background: color,
          borderRadius: 2,
          opacity: 0.8,
          transition: "width 500ms cubic-bezier(0.4,0,0.2,1)",
        }} />
      </div>
    </div>
  );
}

export function BehaviorPanel({ profile }: Props) {
  return (
    <Card style={{ padding: "18px 20px" }}>
      <SectionLabel style={{ marginBottom: 20 }}>Behavior</SectionLabel>
      <MetricRow label="Engagement"  value={profile.engagement}  />
      <MetricRow label="Churn risk"  value={profile.churnRisk}  invert />
      <MetricRow label="Impulsivity" value={profile.impulsivity} />
    </Card>
  );
}
