import { useRef } from "react";
import { LearningSnapshot } from "../stages/types";
import { Sparkline } from "./Sparkline";

type WeightPoint = { showUpsell: number; doNothing: number };

type Props = {
  learning:      LearningSnapshot;
  weightHistory: WeightPoint[];
};

function formatTime(ts: number): string {
  if (!ts) return "—";
  return new Date(ts).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", second: "2-digit" });
}

// ── Mini area chart ────────────────────────────────────────────────────────────

function WeightChart({ history }: { history: WeightPoint[] }) {
  const W = 600;
  const H = 52;

  if (history.length < 2) {
    return (
      <div style={{
        height: H, display: "flex", alignItems: "center", justifyContent: "center",
        fontSize: 11, color: "var(--t5)", fontFamily: "var(--font-mono)",
        letterSpacing: "0.04em",
      }}>
        accumulating history…
      </div>
    );
  }

  const uVals = history.map(h => h.showUpsell);
  const nVals = history.map(h => h.doNothing);
  const all   = [...uVals, ...nVals];
  const min   = Math.min(...all);
  const max   = Math.max(...all);
  const range = max - min || 0.1;

  function pts(vals: number[]): Array<{ x: number; y: number }> {
    return vals.map((v, i) => ({
      x: (i / (vals.length - 1)) * W,
      y: H - 4 - ((v - min) / range) * (H - 10),
    }));
  }

  function smooth(points: Array<{ x: number; y: number }>): string {
    return points.reduce((d, p, i) => {
      if (i === 0) return `M ${p.x.toFixed(1)},${p.y.toFixed(1)}`;
      const prev = points[i - 1];
      const cx   = (prev.x + p.x) / 2;
      return `${d} C ${cx.toFixed(1)},${prev.y.toFixed(1)} ${cx.toFixed(1)},${p.y.toFixed(1)} ${p.x.toFixed(1)},${p.y.toFixed(1)}`;
    }, "");
  }

  const uPath = smooth(pts(uVals));
  const nPath = smooth(pts(nVals));

  // Y-axis ticks
  const ticks = 3;
  const yTicks = Array.from({ length: ticks }, (_, i) => {
    const v = min + (max - min) * (i / (ticks - 1));
    const y = H - 4 - ((v - min) / range) * (H - 10);
    return { v, y };
  });

  return (
    <div style={{ position: "relative" }}>
      {/* Y labels */}
      <div style={{ position: "absolute", left: 0, top: 0, height: H, width: 32, pointerEvents: "none" }}>
        {yTicks.map(({ v, y }) => (
          <div key={v} style={{
            position: "absolute", right: 4, top: y - 6,
            fontSize: 9, color: "var(--t5)", fontFamily: "var(--font-mono)",
            textAlign: "right",
          }}>
            {v.toFixed(2)}
          </div>
        ))}
      </div>

      <div style={{ paddingLeft: 36 }}>
        <svg viewBox={`0 0 ${W} ${H}`} width="100%" height={H} preserveAspectRatio="none" style={{ overflow: "visible", display: "block" }}>
          <defs>
            <linearGradient id="lg-u" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%"   stopColor="#6366f1" stopOpacity="0.18" />
              <stop offset="100%" stopColor="#6366f1" stopOpacity="0"    />
            </linearGradient>
            <linearGradient id="lg-n" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%"   stopColor="#22c55e" stopOpacity="0.12" />
              <stop offset="100%" stopColor="#22c55e" stopOpacity="0"    />
            </linearGradient>
          </defs>

          {/* Grid */}
          {yTicks.map(({ y }) => (
            <line key={y} x1={0} y1={y} x2={W} y2={y} stroke="rgba(255,255,255,0.04)" strokeWidth="1" />
          ))}

          {/* Fills */}
          <path d={`${uPath} L ${W},${H} L 0,${H} Z`} fill="url(#lg-u)" />
          <path d={`${nPath} L ${W},${H} L 0,${H} Z`} fill="url(#lg-n)" />

          {/* Lines */}
          <path d={uPath} fill="none" stroke="#6366f1" strokeWidth="1.5" strokeLinecap="round" />
          <path d={nPath} fill="none" stroke="#22c55e" strokeWidth="1.5" strokeLinecap="round" />

          {/* End dots */}
          {[
            { vals: uVals, color: "#6366f1" },
            { vals: nVals, color: "#22c55e" },
          ].map(({ vals, color }) => {
            const last = vals[vals.length - 1];
            const y    = H - 4 - ((last - min) / range) * (H - 10);
            return <circle key={color} cx={W} cy={y} r={2.5} fill={color} />;
          })}
        </svg>

        {/* Legend */}
        <div style={{ display: "flex", gap: 16, marginTop: 8 }}>
          {[{ label: "show-upsell", color: "#6366f1" }, { label: "do-nothing", color: "#22c55e" }].map(({ label, color }) => (
            <div key={label} style={{ display: "flex", alignItems: "center", gap: 5 }}>
              <div style={{ width: 12, height: 1.5, background: color, borderRadius: 1 }} />
              <span style={{ fontSize: 9, color: "var(--t5)", fontFamily: "var(--font-mono)", letterSpacing: "0.04em" }}>{label}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// ── Main ──────────────────────────────────────────────────────────────────────

export function LearningPanel({ learning, weightHistory }: Props) {
  const rowRef = useRef<HTMLDivElement>(null);
  const netDelta = Object.values(learning.delta).reduce((s, v) => s + (v ?? 0), 0);
  const trend = netDelta > 0.001 ? { label: "improving", color: "#22c55e" }
              : netDelta < -0.001 ? { label: "declining", color: "#ef4444" }
              : { label: "stable", color: "var(--t4)" };

  return (
    <div style={{
      background: "var(--surface-2)",
      border: "1px solid var(--border)",
      borderRadius: "var(--r-lg)",
      padding: "18px 20px",
    }}>
      {/* Header */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 16 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <span style={{ fontSize: 10, fontWeight: 700, letterSpacing: "0.1em", textTransform: "uppercase", color: "var(--t4)" }}>
            Learning
          </span>
          <div style={{ display: "flex", alignItems: "center", gap: 5 }}>
            <div style={{ width: 5, height: 5, borderRadius: "50%", background: trend.color }} />
            <span style={{ fontSize: 10, fontWeight: 700, color: trend.color, letterSpacing: "0.04em" }}>
              {trend.label}
            </span>
          </div>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
          <span style={{ fontSize: 10, color: "var(--t5)", fontFamily: "var(--font-mono)" }}>
            {weightHistory.length} runs · {Math.round(learning.successRate * 100)}% success
          </span>
          <span style={{ fontSize: 10, color: "var(--t5)" }}>
            {formatTime(learning.updatedAt)}
          </span>
        </div>
      </div>

      {/* Weight chart */}
      <div style={{
        background: "rgba(255,255,255,0.015)",
        border: "1px solid var(--border)",
        borderRadius: "var(--r-md)",
        padding: "12px 14px 10px",
        marginBottom: 16,
      }}>
        <div style={{ fontSize: 9, fontWeight: 700, letterSpacing: "0.1em", textTransform: "uppercase", color: "var(--t5)", marginBottom: 10 }}>
          Weight trajectory
        </div>
        <WeightChart history={weightHistory} />
      </div>

      {/* Weight table */}
      <div>
        {/* Column headers */}
        <div style={{
          display: "grid",
          gridTemplateColumns: "140px 1fr 1fr 72px 1fr",
          gap: "0 8px",
          padding: "0 0 8px",
          borderBottom: "1px solid var(--border)",
          fontSize: 9, fontWeight: 700, letterSpacing: "0.1em",
          textTransform: "uppercase", color: "var(--t5)",
          alignItems: "center",
        }}>
          <span>Decision</span>
          <span style={{ textAlign: "right" }}>Before</span>
          <span style={{ textAlign: "right" }}>After</span>
          <span>Trend</span>
          <span style={{ textAlign: "right" }}>Δ Delta</span>
        </div>

        {(Object.keys(learning.weights) as Array<keyof typeof learning.weights>).map((key) => {
          const before  = learning.previous[key] ?? 0;
          const after   = learning.weights[key]  ?? 0;
          const change  = learning.delta[key]    ?? 0;
          const history = key === "show-upsell"
            ? weightHistory.map(h => h.showUpsell)
            : weightHistory.map(h => h.doNothing);
          const sparkColor = key === "show-upsell" ? "#6366f1" : "#22c55e";
          const up  = change >  0.001;
          const dn  = change < -0.001;
          const dc  = up ? "#22c55e" : dn ? "#ef4444" : "var(--t5)";

          return (
            <div
              key={String(key)}
              ref={rowRef}
              style={{
                display: "grid",
                gridTemplateColumns: "140px 1fr 1fr 72px 1fr",
                gap: "0 8px",
                padding: "10px 0",
                borderBottom: "1px solid var(--border)",
                alignItems: "center",
                animation: "highlight-row 1.2s ease-out",
              }}
            >
              <span style={{ fontSize: 11, fontWeight: 700, color: "var(--t2)", fontFamily: "var(--font-mono)" }}>
                {String(key)}
              </span>
              <span style={{ fontSize: 11, color: "var(--t4)", fontFamily: "var(--font-mono)", textAlign: "right", fontVariantNumeric: "tabular-nums" }}>
                {before.toFixed(4)}
              </span>
              <span style={{ fontSize: 11, fontWeight: 700, color: "var(--t2)", fontFamily: "var(--font-mono)", textAlign: "right", fontVariantNumeric: "tabular-nums" }}>
                {after.toFixed(4)}
              </span>
              <div>
                <Sparkline values={history} width={64} height={20} color={sparkColor} fillOpacity={0.12} />
              </div>
              <span style={{
                fontSize: 11, fontWeight: 700, color: dc,
                fontFamily: "var(--font-mono)", textAlign: "right",
                fontVariantNumeric: "tabular-nums",
              }}>
                {up ? "+" : ""}{change.toFixed(4)}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
