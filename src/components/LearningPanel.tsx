import { LearningSnapshot } from "../stages/types";
import { Card, Badge, SectionLabel, Divider } from "./ui";

type Props = {
  learning: LearningSnapshot;
};

function formatDelta(value: number): string {
  const sign = value >= 0 ? "+" : "";
  return `${sign}${value.toFixed(3)}`;
}

function formatTime(ts: number): string {
  if (!ts) return "—";
  return new Date(ts).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", second: "2-digit" });
}

function trendBadge(delta: number): { label: string; variant: "green" | "red" | "default" } {
  if (delta > 0.001) return { label: `↑ ${formatDelta(delta)}`, variant: "green" };
  if (delta < -0.001) return { label: `↓ ${formatDelta(delta)}`, variant: "red"   };
  return { label: "→ 0.000", variant: "default" };
}

export function LearningPanel({ learning }: Props) {
  const netDelta    = Object.values(learning.delta).reduce((s, v) => s + (v ?? 0), 0);
  const overallUp   = netDelta > 0.001;
  const overallDown = netDelta < -0.001;

  return (
    <Card style={{ padding: "20px 24px" }}>
      {/* Header */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 20 }}>
        <SectionLabel>Learning</SectionLabel>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <Badge variant={overallUp ? "green" : overallDown ? "red" : "default"}>
            {overallUp ? "↑ Improving" : overallDown ? "↓ Declining" : "→ Stable"}
          </Badge>
          <span style={{ fontSize: 11, color: "#3f3f46" }}>{formatTime(learning.updatedAt)}</span>
        </div>
      </div>

      {/* KPI row */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 12, marginBottom: 20 }}>
        <KPICard label="Success rate" value={`${Math.round(learning.successRate * 100)}%`} />
        <KPICard label="Decisions tracked" value={Object.keys(learning.weights).length.toString()} />
        <KPICard label="Storage" value="in-memory" mono />
      </div>

      <Divider style={{ marginBottom: 16 }} />

      {/* Weight table */}
      <div style={{
        display: "grid",
        gridTemplateColumns: "1.4fr 0.9fr 0.9fr 1fr",
        gap: 8,
        padding: "0 0 10px",
        fontSize: 10,
        fontWeight: 700,
        letterSpacing: "0.08em",
        textTransform: "uppercase",
        color: "#3f3f46",
      }}>
        <span>Decision</span>
        <span>Before</span>
        <span>After</span>
        <span>Delta</span>
      </div>

      {(Object.keys(learning.weights) as Array<keyof typeof learning.weights>).map((key) => {
        const before = learning.previous[key] ?? 0;
        const after  = learning.weights[key]  ?? 0;
        const change = learning.delta[key]    ?? 0;
        const { label, variant } = trendBadge(change);

        return (
          <div
            key={String(key)}
            style={{
              display: "grid",
              gridTemplateColumns: "1.4fr 0.9fr 0.9fr 1fr",
              gap: 8,
              padding: "10px 0",
              alignItems: "center",
              borderTop: "1px solid rgba(255,255,255,0.04)",
            }}
          >
            <span style={{ fontSize: 12, fontWeight: 600, color: "#e4e4e7" }}>{String(key)}</span>
            <span style={{ fontSize: 12, color: "#52525b", fontFamily: "var(--font-mono)" }}>{before.toFixed(3)}</span>
            <span style={{ fontSize: 12, color: "#a1a1aa", fontFamily: "var(--font-mono)" }}>{after.toFixed(3)}</span>
            <Badge variant={variant} style={{ width: "fit-content" }}>{label}</Badge>
          </div>
        );
      })}
    </Card>
  );
}

function KPICard({ label, value, mono }: { label: string; value: string; mono?: boolean }) {
  return (
    <div style={{
      background: "rgba(255,255,255,0.03)",
      border: "1px solid rgba(255,255,255,0.06)",
      borderRadius: 10,
      padding: "12px 14px",
    }}>
      <div style={{ fontSize: 11, color: "#52525b", marginBottom: 6 }}>{label}</div>
      <div style={{
        fontSize: mono ? 12 : 20,
        fontWeight: 700,
        color: "#e4e4e7",
        letterSpacing: mono ? "0" : "-0.02em",
        fontFamily: mono ? "var(--font-mono)" : "inherit",
      }}>
        {value}
      </div>
    </div>
  );
}
