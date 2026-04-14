import { UserProfile } from "../stages/types";

type Props = { profile: UserProfile };

type Metric = {
  key:    string;
  label:  string;
  value:  number;
  invert: boolean;
};

function segColor(pct: number, invert: boolean): string {
  if (invert) return pct >= 65 ? "#ef4444" : pct <= 35 ? "#22c55e" : "#f59e0b";
  return          pct >= 65 ? "#22c55e" : pct <= 35 ? "#ef4444" : "#f59e0b";
}

function segLabel(pct: number, invert: boolean): string {
  if (invert) return pct >= 65 ? "High" : pct <= 35 ? "Low" : "Mid";
  return          pct >= 65 ? "High" : pct <= 35 ? "Low" : "Mid";
}

function MetricRow({ label, value, invert }: Metric) {
  const pct   = Math.round(value * 100);
  const color = segColor(pct, invert);

  return (
    <div style={{ paddingBottom: 12, marginBottom: 12, borderBottom: "1px solid var(--border)" }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 7 }}>
        <span style={{ fontSize: 10, fontWeight: 700, letterSpacing: "0.09em", textTransform: "uppercase", color: "var(--t4)" }}>
          {label}
        </span>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <span style={{ fontSize: 10, fontWeight: 700, color, letterSpacing: "0.04em" }}>
            {segLabel(pct, invert)}
          </span>
          <span style={{ fontSize: 12, fontWeight: 700, color: "var(--t2)", fontFamily: "var(--font-mono)", minWidth: 30, textAlign: "right" }}>
            {pct}%
          </span>
        </div>
      </div>
      <div style={{ height: 2, background: "rgba(255,255,255,0.05)", borderRadius: 1, overflow: "hidden" }}>
        <div style={{
          height: "100%", width: `${pct}%`, background: color, borderRadius: 1,
          transition: "width 500ms cubic-bezier(0.4,0,0.2,1)",
        }} />
      </div>
    </div>
  );
}

export function BehaviorPanel({ profile }: Props) {
  const metrics: Metric[] = [
    { key: "engagement",  label: "Engagement",  value: profile.engagement,  invert: false },
    { key: "churn",       label: "Churn risk",  value: profile.churnRisk,   invert: true  },
    { key: "impulsivity", label: "Impulsivity", value: profile.impulsivity, invert: false },
  ];

  return (
    <div style={{
      background: "var(--surface-2)",
      border: "1px solid var(--border)",
      borderRadius: "var(--r-lg)",
      padding: "16px 18px",
    }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 16 }}>
        <span style={{ fontSize: 10, fontWeight: 700, letterSpacing: "0.1em", textTransform: "uppercase", color: "var(--t4)" }}>
          Behavior
        </span>
        <span style={{
          fontSize: 9, fontWeight: 700, letterSpacing: "0.08em", textTransform: "uppercase",
          padding: "2px 7px", borderRadius: 4,
          background: "rgba(255,255,255,0.04)", border: "1px solid var(--border)",
          color: "var(--t5)",
        }}>
          {profile.cohort.replace("_", " ")}
        </span>
      </div>

      {metrics.map((m, i) => (
        <div key={m.key} style={i === metrics.length - 1 ? { borderBottom: "none" } : {}}>
          <MetricRow {...m} />
        </div>
      ))}
    </div>
  );
}
