import { useEffect, useRef } from "react";
import { gsap } from "gsap";
import { LearningSnapshot } from "../stages/types";
import { Card, Badge, SectionLabel, Divider } from "./ui";
import { Sparkline } from "./Sparkline";

type WeightPoint = { showUpsell: number; doNothing: number };

type Props = {
  learning:      LearningSnapshot;
  weightHistory: WeightPoint[];
};

function formatDelta(v: number): string {
  return `${v >= 0 ? "+" : ""}${v.toFixed(3)}`;
}

function formatTime(ts: number): string {
  if (!ts) return "—";
  return new Date(ts).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", second: "2-digit" });
}

// ─── Mini weight area chart ───────────────────────────────────────────────────

function WeightChart({ history }: { history: WeightPoint[] }) {
  if (history.length < 2) {
    return (
      <div style={{
        height: 56, display: "flex", alignItems: "center", justifyContent: "center",
        color: "#3f3f46", fontSize: 11,
      }}>
        Run more iterations to see weight trajectory
      </div>
    );
  }

  const W = 400;
  const H = 48;

  const upsellVals = history.map(h => h.showUpsell);
  const nothingVals = history.map(h => h.doNothing);
  const allVals = [...upsellVals, ...nothingVals];
  const min = Math.min(...allVals);
  const max = Math.max(...allVals);
  const range = max - min || 0.1;

  function toPath(vals: number[]): string {
    return vals.reduce((d, v, i) => {
      const x = (i / (vals.length - 1)) * W;
      const y = H - ((v - min) / range) * (H * 0.8) - H * 0.1;
      if (i === 0) return `M ${x.toFixed(1)} ${y.toFixed(1)}`;
      const prev = vals[i - 1];
      const px = ((i - 1) / (vals.length - 1)) * W;
      const py = H - ((prev - min) / range) * (H * 0.8) - H * 0.1;
      const cx = (px + x) / 2;
      return `${d} C ${cx.toFixed(1)} ${py.toFixed(1)} ${cx.toFixed(1)} ${y.toFixed(1)} ${x.toFixed(1)} ${y.toFixed(1)}`;
    }, "");
  }

  const upsellPath  = toPath(upsellVals);
  const nothingPath = toPath(nothingVals);

  // Y-axis ticks
  const ticks = [min, (min + max) / 2, max].map(v => ({
    label: v.toFixed(2),
    y:     H - ((v - min) / range) * (H * 0.8) - H * 0.1,
  }));

  return (
    <div style={{ position: "relative" }}>
      {/* Y-axis labels */}
      <div style={{ position: "absolute", left: 0, top: 0, height: H, pointerEvents: "none" }}>
        {ticks.map(({ label, y }) => (
          <div
            key={label}
            style={{
              position: "absolute", right: "calc(100% + 6px)", top: y - 7,
              fontSize: 9, color: "#3f3f46", fontFamily: "var(--font-mono)",
              whiteSpace: "nowrap",
            }}
          >
            {label}
          </div>
        ))}
      </div>

      <svg
        viewBox={`0 0 ${W} ${H}`}
        width="100%"
        height={H}
        preserveAspectRatio="none"
        style={{ overflow: "visible" }}
      >
        <defs>
          <linearGradient id="grad-upsell" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%"   stopColor="#6366f1" stopOpacity="0.2" />
            <stop offset="100%" stopColor="#6366f1" stopOpacity="0"   />
          </linearGradient>
          <linearGradient id="grad-nothing" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%"   stopColor="#22c55e" stopOpacity="0.12" />
            <stop offset="100%" stopColor="#22c55e" stopOpacity="0"    />
          </linearGradient>
        </defs>

        {/* Grid lines */}
        {ticks.map(({ y }) => (
          <line key={y} x1={0} y1={y} x2={W} y2={y}
            stroke="rgba(255,255,255,0.05)" strokeWidth={1} />
        ))}

        {/* Fill areas */}
        <path d={`${upsellPath} L ${W} ${H} L 0 ${H} Z`}  fill="url(#grad-upsell)"  />
        <path d={`${nothingPath} L ${W} ${H} L 0 ${H} Z`} fill="url(#grad-nothing)" />

        {/* Lines */}
        <path d={upsellPath}  fill="none" stroke="#6366f1" strokeWidth={1.5} strokeLinecap="round" />
        <path d={nothingPath} fill="none" stroke="#22c55e" strokeWidth={1.5} strokeLinecap="round" />

        {/* End dots */}
        {[
          { vals: upsellVals,  color: "#6366f1" },
          { vals: nothingVals, color: "#22c55e" },
        ].map(({ vals, color }) => {
          const last = vals[vals.length - 1];
          const y    = H - ((last - min) / range) * (H * 0.8) - H * 0.1;
          return (
            <circle key={color} cx={W} cy={y} r={2.5} fill={color} />
          );
        })}
      </svg>

      {/* Legend */}
      <div style={{ display: "flex", gap: 16, marginTop: 8 }}>
        {[
          { label: "show-upsell", color: "#6366f1" },
          { label: "do-nothing",  color: "#22c55e" },
        ].map(({ label, color }) => (
          <div key={label} style={{ display: "flex", alignItems: "center", gap: 5 }}>
            <div style={{ width: 12, height: 2, background: color, borderRadius: 1 }} />
            <span style={{ fontSize: 10, color: "#52525b", fontFamily: "var(--font-mono)" }}>{label}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── Main component ───────────────────────────────────────────────────────────

export function LearningPanel({ learning, weightHistory }: Props) {
  const ref     = useRef<HTMLDivElement>(null);
  const prevRef = useRef<LearningSnapshot | null>(null);

  useEffect(() => {
    if (!ref.current || !prevRef.current) { prevRef.current = learning; return; }
    const ctx = gsap.context(() => {
      gsap.from(".lp-row-flash", {
        backgroundColor: "rgba(99,102,241,0.08)", duration: 0.8, ease: "power2.out",
      });
    }, ref);
    prevRef.current = learning;
    return () => ctx.revert();
  }, [learning]);

  const netDelta    = Object.values(learning.delta).reduce((s, v) => s + (v ?? 0), 0);
  const overallUp   = netDelta >  0.001;
  const overallDown = netDelta < -0.001;

  return (
    <Card style={{ padding: "20px 24px" }}>
      <div ref={ref}>
        {/* Header */}
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 20 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <SectionLabel>Learning</SectionLabel>
            <Badge variant={overallUp ? "green" : overallDown ? "red" : "default"}>
              {overallUp ? "↑ improving" : overallDown ? "↓ declining" : "→ stable"}
            </Badge>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
            <span style={{ fontSize: 11, color: "#3f3f46", fontFamily: "var(--font-mono)" }}>
              {weightHistory.length} runs
            </span>
            <span style={{ fontSize: 11, color: "#3f3f46" }}>{formatTime(learning.updatedAt)}</span>
          </div>
        </div>

        {/* Weight chart */}
        <div style={{
          background: "rgba(255,255,255,0.02)",
          border: "1px solid rgba(255,255,255,0.05)",
          borderRadius: 10,
          padding: "14px 16px 10px 28px",
          marginBottom: 20,
        }}>
          <div style={{ fontSize: 10, fontWeight: 700, letterSpacing: "0.08em", textTransform: "uppercase", color: "#3f3f46", marginBottom: 10 }}>
            Weight trajectory
          </div>
          <WeightChart history={weightHistory} />
        </div>

        {/* KPI strip */}
        <div style={{ display: "flex", gap: 12, marginBottom: 20 }}>
          {[
            { label: "Success rate", value: `${Math.round(learning.successRate * 100)}%` },
            { label: "Decisions",    value: Object.keys(learning.weights).length.toString() },
            { label: "Updated",      value: learning.updatedAt ? "yes" : "never" },
          ].map(({ label, value }) => (
            <div key={label} style={{
              flex: 1, background: "rgba(255,255,255,0.02)",
              border: "1px solid rgba(255,255,255,0.05)",
              borderRadius: 8, padding: "8px 12px",
            }}>
              <div style={{ fontSize: 10, color: "#52525b", marginBottom: 4 }}>{label}</div>
              <div style={{ fontSize: 14, fontWeight: 700, color: "#e4e4e7", fontFamily: "var(--font-mono)" }}>{value}</div>
            </div>
          ))}
        </div>

        <Divider style={{ marginBottom: 14 }} />

        {/* Weight table */}
        <div style={{
          display: "grid", gridTemplateColumns: "1.5fr 0.8fr 0.8fr 80px 1fr",
          gap: 8, padding: "0 0 8px",
          fontSize: 9, fontWeight: 700, letterSpacing: "0.1em",
          textTransform: "uppercase", color: "#3f3f46",
        }}>
          <span>Decision</span><span>Before</span><span>After</span><span>Trend</span><span>Delta</span>
        </div>

        {(Object.keys(learning.weights) as Array<keyof typeof learning.weights>).map((key) => {
          const before  = learning.previous[key] ?? 0;
          const after   = learning.weights[key]  ?? 0;
          const change  = learning.delta[key]    ?? 0;
          const history = key === "show-upsell"
            ? weightHistory.map(h => h.showUpsell)
            : weightHistory.map(h => h.doNothing);
          const up = change >  0.001;
          const dn = change < -0.001;

          return (
            <div
              key={String(key)}
              className="lp-row-flash"
              style={{
                display: "grid", gridTemplateColumns: "1.5fr 0.8fr 0.8fr 80px 1fr",
                gap: 8, padding: "10px 0",
                alignItems: "center",
                borderTop: "1px solid rgba(255,255,255,0.04)",
              }}
            >
              <span style={{ fontSize: 12, fontWeight: 600, color: "#e4e4e7" }}>{String(key)}</span>
              <span style={{ fontSize: 11, color: "#52525b", fontFamily: "var(--font-mono)" }}>{before.toFixed(3)}</span>
              <span style={{ fontSize: 11, color: "#a1a1aa", fontFamily: "var(--font-mono)", fontWeight: 600 }}>{after.toFixed(3)}</span>
              <Sparkline
                values={history}
                width={72}
                height={22}
                color={key === "show-upsell" ? "#6366f1" : "#22c55e"}
              />
              <Badge variant={up ? "green" : dn ? "red" : "default"} style={{ width: "fit-content" }}>
                {formatDelta(change)}
              </Badge>
            </div>
          );
        })}
      </div>
    </Card>
  );
}
