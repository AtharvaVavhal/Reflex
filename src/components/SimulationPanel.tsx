import { useState, useRef, useCallback } from "react";
import { BrowserSummary, BROWSER_CONFIG, runBrowserExperiment, ExperimentConfig } from "../simulations/browser";
import { DEFAULT_PHASES } from "../simulations/environment";
import { Stats } from "../simulations/stats";

// ── Chart ─────────────────────────────────────────────────────────────────────

const SERIES = [
  { key: "adaptive" as const, label: "Adaptive", color: "#6366f1", dim: "rgba(99,102,241,0.12)"  },
  { key: "greedy"   as const, label: "Greedy",   color: "#f59e0b", dim: "rgba(245,158,11,0.10)"  },
  { key: "random"   as const, label: "Random",   color: "#52525b", dim: "rgba(82,82,91,0.08)"    },
] as const;

function smoothPath(values: number[], W: number, H: number, min: number, range: number): string {
  return values.reduce((d, v, i) => {
    const x = (i / (values.length - 1)) * W;
    const y = H - ((v - min) / range) * (H * 0.88) - H * 0.06;
    if (i === 0) return `M ${x.toFixed(1)},${y.toFixed(1)}`;
    const prev  = values[i - 1];
    const px    = ((i - 1) / (values.length - 1)) * W;
    const py    = H - ((prev - min) / range) * (H * 0.88) - H * 0.06;
    const cx    = (px + x) / 2;
    return `${d} C ${cx.toFixed(1)},${py.toFixed(1)} ${cx.toFixed(1)},${y.toFixed(1)} ${x.toFixed(1)},${y.toFixed(1)}`;
  }, "");
}

function RegretChart({
  summary,
  config,
}: {
  summary: BrowserSummary;
  config:  ExperimentConfig;
}) {
  const W = 600;
  const H = 120;

  const allVals = [
    ...summary.adaptive.avgCurve,
    ...summary.greedy.avgCurve,
    ...summary.random.avgCurve,
  ];
  const min   = 0;
  const max   = Math.max(...allVals);
  const range = max - min || 1;

  // Y-axis ticks
  const yTicks = [0, Math.round(max * 0.5), Math.round(max)];

  // Phase boundaries (x positions)
  const phaseBoundaries = config.phases
    .slice(1)
    .map(p => ({ x: (p.start / (config.iterations - 1)) * W, label: p.label }));

  return (
    <div style={{ position: "relative" }}>
      {/* Y labels */}
      <div style={{ position: "absolute", left: 0, top: 0, height: H, width: 28 }}>
        {yTicks.map(v => {
          const y = H - ((v - min) / range) * (H * 0.88) - H * 0.06;
          return (
            <div key={v} style={{
              position: "absolute", right: 4, top: y - 6,
              fontSize: 9, color: "var(--t5)", fontFamily: "var(--font-mono)",
              textAlign: "right",
            }}>
              {v}
            </div>
          );
        })}
      </div>

      <div style={{ paddingLeft: 32 }}>
        <svg
          viewBox={`0 0 ${W} ${H}`}
          width="100%"
          height={H}
          preserveAspectRatio="none"
          style={{ overflow: "visible", display: "block" }}
        >
          <defs>
            {SERIES.map(s => (
              <linearGradient key={s.key} id={`sg-${s.key}`} x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%"   stopColor={s.color} stopOpacity="0.18" />
                <stop offset="100%" stopColor={s.color} stopOpacity="0"    />
              </linearGradient>
            ))}
          </defs>

          {/* Horizontal grid */}
          {yTicks.map(v => {
            const y = H - ((v - min) / range) * (H * 0.88) - H * 0.06;
            return (
              <line key={v} x1={0} y1={y} x2={W} y2={y}
                stroke="rgba(255,255,255,0.04)" strokeWidth="1" />
            );
          })}

          {/* Phase boundaries */}
          {phaseBoundaries.map(({ x, label }) => (
            <g key={label}>
              <line x1={x} y1={0} x2={x} y2={H}
                stroke="rgba(255,255,255,0.08)" strokeWidth="1" strokeDasharray="3 3" />
              <text x={x + 4} y={10} fontSize="8" fill="rgba(255,255,255,0.2)"
                fontFamily="var(--font-mono)" style={{ fontSize: 8 }}>
                {label}
              </text>
            </g>
          ))}

          {/* Fill + line per series */}
          {SERIES.map(s => {
            const curve = summary[s.key].avgCurve;
            const path  = smoothPath(curve, W, H, min, range);
            return (
              <g key={s.key}>
                <path d={`${path} L ${W},${H} L 0,${H} Z`} fill={`url(#sg-${s.key})`} />
                <path d={path} fill="none" stroke={s.color} strokeWidth={s.key === "adaptive" ? 2 : 1.5} strokeLinecap="round" />
              </g>
            );
          })}

          {/* End dots */}
          {SERIES.map(s => {
            const curve = summary[s.key].avgCurve;
            const last  = curve[curve.length - 1];
            const y     = H - ((last - min) / range) * (H * 0.88) - H * 0.06;
            return <circle key={s.key} cx={W} cy={y} r={2.5} fill={s.color} />;
          })}
        </svg>

        {/* X-axis label */}
        <div style={{
          display: "flex", justifyContent: "space-between",
          paddingTop: 6,
        }}>
          <span style={{ fontSize: 9, color: "var(--t5)", fontFamily: "var(--font-mono)" }}>0</span>
          {phaseBoundaries.map(({ x, label }) => (
            <span key={label} style={{ fontSize: 9, color: "var(--t5)", fontFamily: "var(--font-mono)" }}>
              {config.phases.find(p => p.label === label)?.start}
            </span>
          ))}
          <span style={{ fontSize: 9, color: "var(--t5)", fontFamily: "var(--font-mono)" }}>
            {config.iterations}
          </span>
        </div>
        <div style={{ textAlign: "center", marginTop: 2 }}>
          <span style={{ fontSize: 9, color: "var(--t5)", letterSpacing: "0.06em" }}>iterations</span>
        </div>

        {/* Legend */}
        <div style={{ display: "flex", gap: 20, marginTop: 12 }}>
          {SERIES.map(s => (
            <div key={s.key} style={{ display: "flex", alignItems: "center", gap: 6 }}>
              <div style={{ width: 14, height: 2, background: s.color, borderRadius: 1 }} />
              <span style={{ fontSize: 10, color: "var(--t4)", fontFamily: "var(--font-mono)" }}>{s.label}</span>
            </div>
          ))}
          <span style={{ marginLeft: "auto", fontSize: 9, color: "var(--t5)" }}>
            avg across {summary.config.runs} runs
          </span>
        </div>
      </div>
    </div>
  );
}

// ── Stats table ───────────────────────────────────────────────────────────────

function cell(v: number): string {
  return typeof v === "number" ? v.toFixed(2) : "—";
}

function StatsTable({ summary }: { summary: BrowserSummary }) {
  const greedyMean = summary.greedy.stats.mean;

  return (
    <div>
      {/* Header */}
      <div style={{
        display: "grid",
        gridTemplateColumns: "90px 1fr 1fr 1fr 1fr 1fr",
        gap: "0 8px",
        padding: "0 0 8px",
        borderBottom: "1px solid var(--border)",
        fontSize: 9, fontWeight: 700, letterSpacing: "0.1em",
        textTransform: "uppercase", color: "var(--t5)",
      }}>
        <span>Strategy</span>
        <span style={{ textAlign: "right" }}>Mean</span>
        <span style={{ textAlign: "right" }}>Std</span>
        <span style={{ textAlign: "right" }}>Min</span>
        <span style={{ textAlign: "right" }}>Max</span>
        <span style={{ textAlign: "right" }}>vs greedy</span>
      </div>

      {SERIES.map(s => {
        const st: Stats = summary[s.key].stats;
        const diff      = st.mean - greedyMean;
        const diffColor = diff < -0.5 ? "var(--green)" : diff > 0.5 ? "var(--red)" : "var(--t4)";

        return (
          <div
            key={s.key}
            style={{
              display: "grid",
              gridTemplateColumns: "90px 1fr 1fr 1fr 1fr 1fr",
              gap: "0 8px",
              padding: "9px 0",
              borderBottom: "1px solid var(--border)",
              alignItems: "center",
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: 7 }}>
              <div style={{ width: 6, height: 6, borderRadius: "50%", background: s.color, flexShrink: 0 }} />
              <span style={{ fontSize: 11, fontWeight: 700, color: "var(--t2)", fontFamily: "var(--font-mono)" }}>
                {s.label}
              </span>
            </div>
            <span style={{ fontSize: 11, fontWeight: 700, color: "var(--t1)", fontFamily: "var(--font-mono)", textAlign: "right", fontVariantNumeric: "tabular-nums" }}>
              {cell(st.mean)}
            </span>
            <span style={{ fontSize: 11, color: "var(--t4)", fontFamily: "var(--font-mono)", textAlign: "right", fontVariantNumeric: "tabular-nums" }}>
              {cell(st.std)}
            </span>
            <span style={{ fontSize: 11, color: "var(--t4)", fontFamily: "var(--font-mono)", textAlign: "right", fontVariantNumeric: "tabular-nums" }}>
              {st.min}
            </span>
            <span style={{ fontSize: 11, color: "var(--t4)", fontFamily: "var(--font-mono)", textAlign: "right", fontVariantNumeric: "tabular-nums" }}>
              {st.max}
            </span>
            <span style={{ fontSize: 11, fontWeight: 700, color: diffColor, fontFamily: "var(--font-mono)", textAlign: "right", fontVariantNumeric: "tabular-nums" }}>
              {s.key === "greedy" ? "—" : `${diff >= 0 ? "+" : ""}${cell(diff)}`}
            </span>
          </div>
        );
      })}
    </div>
  );
}

// ── Phase summary ─────────────────────────────────────────────────────────────

function PhaseBar({ config }: { config: ExperimentConfig }) {
  const total = config.iterations;
  return (
    <div style={{ display: "flex", gap: 0, height: 20 }}>
      {config.phases.map((phase, i) => {
        const width = ((phase.end - phase.start + 1) / total) * 100;
        const isOptimalUpsell = phase.optimal === "show-upsell";
        return (
          <div
            key={phase.label}
            title={`${phase.label}: optimal = ${phase.optimal}`}
            style={{
              width: `${width}%`,
              display: "flex", alignItems: "center", justifyContent: "center",
              background: isOptimalUpsell ? "rgba(99,102,241,0.12)" : "rgba(34,197,94,0.08)",
              borderLeft: i > 0 ? "1px solid var(--border)" : "none",
              borderRadius: i === 0 ? "4px 0 0 4px" : i === config.phases.length - 1 ? "0 4px 4px 0" : "0",
            }}
          >
            <span style={{ fontSize: 9, fontFamily: "var(--font-mono)", color: "var(--t5)", whiteSpace: "nowrap" }}>
              {phase.label} · {phase.optimal === "show-upsell" ? "upsell" : "passive"}
            </span>
          </div>
        );
      })}
    </div>
  );
}

// ── Adaptation speed ──────────────────────────────────────────────────────────

function AdaptationStats({ summary }: { summary: BrowserSummary }) {
  const flipRuns   = summary.adaptive.runs.filter(r => r.phaseAdaptLog.length > 0);
  const adaptTimes = flipRuns.flatMap(r => r.phaseAdaptLog.map(e => e.iterationsToAdapt));
  const avg        = adaptTimes.length > 0
    ? adaptTimes.reduce((a, b) => a + b, 0) / adaptTimes.length
    : null;
  const totalFlips = summary.adaptive.runs.reduce((s, r) => s + r.policySwitches, 0);

  return (
    <div style={{
      display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 8,
    }}>
      {[
        {
          label: "Avg adapt speed",
          value: avg !== null ? `${avg.toFixed(1)} iters` : "—",
          sub:   "after environment shift",
        },
        {
          label: "Runs with flip",
          value: `${flipRuns.length} / ${summary.adaptive.runs.length}`,
          sub:   "policy switch triggered",
        },
        {
          label: "Total policy switches",
          value: totalFlips.toString(),
          sub:   `across ${summary.adaptive.runs.length} runs`,
        },
      ].map(({ label, value, sub }) => (
        <div key={label} style={{
          padding: "10px 12px",
          background: "rgba(255,255,255,0.02)",
          border: "1px solid var(--border)",
          borderRadius: "var(--r-sm)",
        }}>
          <div style={{ fontSize: 9, fontWeight: 700, letterSpacing: "0.09em", textTransform: "uppercase", color: "var(--t5)", marginBottom: 4 }}>
            {label}
          </div>
          <div style={{ fontSize: 16, fontWeight: 800, color: "var(--t1)", fontFamily: "var(--font-mono)", letterSpacing: "-0.02em", marginBottom: 2 }}>
            {value}
          </div>
          <div style={{ fontSize: 10, color: "var(--t5)" }}>{sub}</div>
        </div>
      ))}
    </div>
  );
}

// ── Main panel ────────────────────────────────────────────────────────────────

export function SimulationPanel() {
  const [summary, setSummary]   = useState<BrowserSummary | null>(null);
  const [running, setRunning]   = useState(false);
  const [elapsed, setElapsed]   = useState<number | null>(null);
  const startRef                = useRef<number>(0);

  const run = useCallback(() => {
    setRunning(true);
    setSummary(null);
    setElapsed(null);
    startRef.current = performance.now();

    // Yield to the browser for one frame so the spinner renders before the
    // synchronous simulation blocks the main thread.
    requestAnimationFrame(() => {
      setTimeout(() => {
        const result = runBrowserExperiment(BROWSER_CONFIG);
        const ms     = performance.now() - startRef.current;
        setSummary(result);
        setElapsed(ms);
        setRunning(false);
      }, 0);
    });
  }, []);

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
            Simulation
          </span>
          {summary && (
            <span style={{ fontSize: 10, color: "var(--t5)", fontFamily: "var(--font-mono)" }}>
              {BROWSER_CONFIG.runs} runs × {BROWSER_CONFIG.iterations} iters · 3 strategies
            </span>
          )}
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          {elapsed !== null && (
            <span style={{ fontSize: 10, color: "var(--t5)", fontFamily: "var(--font-mono)" }}>
              {elapsed.toFixed(0)}ms
            </span>
          )}
          <button
            className="btn-primary"
            onClick={run}
            disabled={running}
            style={{ fontSize: 11, padding: "5px 14px" }}
          >
            {running ? (
              <>
                <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"
                  style={{ animation: "spin-slow 0.7s linear infinite" }}>
                  <path strokeLinecap="round" d="M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4M4.93 19.07l2.83-2.83M16.24 7.76l2.83-2.83" />
                </svg>
                Evaluating…
              </>
            ) : summary ? "Re-run" : "Run simulation"}
          </button>
        </div>
      </div>

      {/* Not-yet-run state */}
      {!summary && !running && (
        <div style={{
          padding: "32px 0",
          display: "flex", flexDirection: "column", alignItems: "center",
          textAlign: "center", gap: 8,
        }}>
          <div style={{ fontSize: 10, fontWeight: 700, letterSpacing: "0.1em", textTransform: "uppercase", color: "var(--t5)" }}>
            Benchmark mode
          </div>
          <p style={{ margin: 0, fontSize: 13, color: "var(--t4)", maxWidth: 380, lineHeight: 1.7 }}>
            Runs {BROWSER_CONFIG.runs} × {BROWSER_CONFIG.iterations} iterations across adaptive, greedy, and random
            strategies in a 3-phase non-stationary environment. Measures cumulative regret and adaptation speed.
          </p>
        </div>
      )}

      {/* Running state */}
      {running && (
        <div style={{
          padding: "32px 0",
          display: "flex", flexDirection: "column", alignItems: "center", gap: 10,
        }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="var(--indigo)" strokeWidth="2.5"
              style={{ animation: "spin-slow 0.7s linear infinite" }}>
              <path strokeLinecap="round" d="M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4M4.93 19.07l2.83-2.83M16.24 7.76l2.83-2.83" />
            </svg>
            <span style={{ fontSize: 12, color: "var(--t3)", fontFamily: "var(--font-mono)" }}>
              evaluating {BROWSER_CONFIG.runs * 3} runs…
            </span>
          </div>
        </div>
      )}

      {/* Results */}
      {summary && (
        <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>

          {/* Phase map */}
          <div>
            <div style={{ fontSize: 9, fontWeight: 700, letterSpacing: "0.1em", textTransform: "uppercase", color: "var(--t5)", marginBottom: 8 }}>
              Environment phases
            </div>
            <PhaseBar config={summary.config} />
          </div>

          {/* Regret curves */}
          <div style={{
            background: "rgba(255,255,255,0.015)",
            border: "1px solid var(--border)",
            borderRadius: "var(--r-md)",
            padding: "12px 14px 10px",
          }}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 10 }}>
              <span style={{ fontSize: 9, fontWeight: 700, letterSpacing: "0.1em", textTransform: "uppercase", color: "var(--t5)" }}>
                Cumulative regret
              </span>
              <span style={{ fontSize: 9, color: "var(--t5)" }}>lower = better</span>
            </div>
            <RegretChart summary={summary} config={summary.config} />
          </div>

          {/* Stats table */}
          <div>
            <div style={{ fontSize: 9, fontWeight: 700, letterSpacing: "0.1em", textTransform: "uppercase", color: "var(--t5)", marginBottom: 12 }}>
              Strategy comparison
            </div>
            <StatsTable summary={summary} />
          </div>

          {/* Adaptation stats */}
          <div>
            <div style={{ fontSize: 9, fontWeight: 700, letterSpacing: "0.1em", textTransform: "uppercase", color: "var(--t5)", marginBottom: 8 }}>
              Adaptive — learning speed
            </div>
            <AdaptationStats summary={summary} />
          </div>

        </div>
      )}
    </div>
  );
}
