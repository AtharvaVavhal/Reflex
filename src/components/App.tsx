import { useState, useRef, useEffect, useCallback } from "react";
import { gsap } from "gsap";
import { DecisionPanel }    from "./DecisionPanel";
import { BehaviorPanel }    from "./BehaviorPanel";
import { InterventionPanel } from "./InterventionPanel";
import { PipelineViz }      from "./PipelineViz";
import { LearningPanel }    from "./LearningPanel";
import { SimulationPanel }  from "./SimulationPanel";
import { LandingPage }      from "./landing/LandingPage";
import { Pipeline }         from "../core/pipeline";
import { EventBus }         from "../core/event-bus";
import { BehaviorTracker }  from "../stages/behavior-tracker";
import { AdaptationEngine } from "../stages/adaptation-engine";
import { contextCollector } from "../stages/context";
import { behaviorModel }    from "../stages/behavior";
import { decisionEngine }   from "../stages/decision";
import { interventionCalibrator } from "../stages/intervention";
import { actionResolver }   from "../stages/action";
import { processSignals }   from "../stages/feedback-processor";
import {
  SessionId, UserId, ActionInstruction,
  UserProfile, DecisionResult, Intervention, LearningSnapshot,
} from "../stages/types";

const bus        = new EventBus();
const tracker    = new BehaviorTracker(bus);
const adaptation = new AdaptationEngine();
const pipeline   = new Pipeline(
  { contextCollector, behaviorModel, decisionEngine, interventionCalibrator, actionResolver },
  bus,
);

type RunResult = {
  action:       ActionInstruction;
  profile:      UserProfile;
  decision:     DecisionResult;
  intervention: Intervention;
  learning:     LearningSnapshot;
};

type WeightPoint = { showUpsell: number; doNothing: number };
type View        = "landing" | "dashboard";

// ── Dashboard ──────────────────────────────────────────────────────────────────

function Dashboard({ onBack }: { onBack: () => void }) {
  const [result,        setResult]        = useState<RunResult | null>(null);
  const [weightHistory, setWeightHistory] = useState<WeightPoint[]>([]);
  const [running,       setRunning]       = useState(false);
  const [computing,     setComputing]     = useState(false);
  const pendingRef = useRef<RunResult | null>(null);
  const runCount   = useRef(0);
  const runRef     = useRef<HTMLSpanElement>(null);

  function bumpRun() {
    if (!runRef.current) return;
    gsap.from(runRef.current, { y: -6, opacity: 0, duration: 0.2, ease: "power2.out" });
  }

  // Called by PipelineViz after its L→R animation completes
  const handleComputeComplete = useCallback(() => {
    const r = pendingRef.current;
    if (!r) return;
    setWeightHistory(prev => [
      ...prev,
      {
        showUpsell: r.learning.weights["show-upsell"] ?? 1,
        doNothing:  r.learning.weights["do-nothing"]  ?? 1,
      },
    ]);
    setResult(r);
    setComputing(false);
    pendingRef.current = null;
    runCount.current += 1;
    bumpRun();
  }, []);

  const run = () => {
    setRunning(true);
    let capturedProfile:      UserProfile    | null = null;
    let capturedDecision:     DecisionResult | null = null;
    let capturedIntervention: Intervention   | null = null;

    const onProfile      = (p: UserProfile)    => { capturedProfile      = p; bus.off("profile:computed",        onProfile);      };
    const onDecision     = (d: DecisionResult) => { capturedDecision     = d; bus.off("decision:made",           onDecision);     };
    const onIntervention = (i: Intervention)   => { capturedIntervention = i; bus.off("intervention:calibrated", onIntervention); };

    bus.on("profile:computed",        onProfile);
    bus.on("decision:made",           onDecision);
    bus.on("intervention:calibrated", onIntervention);

    try {
      const action  = pipeline.run({
        userId:    "user-1" as UserId,
        sessionId: `session-${runCount.current}` as SessionId,
      });

      const signals = tracker.flush();
      if (signals.length > 0) {
        const report = processSignals(signals);
        const delta  = adaptation.adapt(report);
        pipeline.updateWeights(delta.policyWeights, delta.successRate);
      }

      if (!capturedProfile || !capturedDecision || !capturedIntervention) {
        console.error("[Reflex] Stage did not emit:", { capturedProfile, capturedDecision, capturedIntervention });
        setRunning(false);
        return;
      }

      const learning = pipeline.getLearning();

      // Store result and trigger the pipeline animation sequence.
      // handleComputeComplete will call setResult after the animation finishes.
      pendingRef.current = {
        action, learning,
        profile:      capturedProfile,
        decision:     capturedDecision,
        intervention: capturedIntervention,
      };
      setComputing(true);
    } catch (err) {
      console.error("[Reflex] Pipeline error:", err);
      bus.off("profile:computed",        onProfile);
      bus.off("decision:made",           onDecision);
      bus.off("intervention:calibrated", onIntervention);
    } finally {
      setRunning(false);
    }
  };

  const handleAccept  = () => { if (!result) return; tracker.track("click",   "positive", result.action.action); setTimeout(run, 280); };
  const handleDismiss = () => { if (!result) return; tracker.track("dismiss", "negative", result.action.action); setTimeout(run, 280); };

  // PipelineViz needs data during the computing phase (before result is committed).
  // Use pending data when available, fall back to committed result.
  const vizData = (computing && pendingRef.current) ? pendingRef.current : result;

  return (
    <div style={{ minHeight: "100vh", background: "var(--bg)" }}>

      {/* ── Nav ───────────────────────────────────────────────── */}
      <header style={{
        position: "sticky", top: 0, zIndex: 50,
        background: "rgba(9,9,11,0.92)",
        backdropFilter: "blur(20px) saturate(160%)",
        borderBottom: "1px solid var(--border)",
        padding: "0 24px",
        height: 48,
        display: "flex", alignItems: "center", justifyContent: "space-between",
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <button
            onClick={onBack}
            style={{
              background: "none", border: "none", cursor: "pointer",
              color: "var(--t4)", fontSize: 11, fontFamily: "inherit",
              display: "flex", alignItems: "center", gap: 5, padding: 0,
              letterSpacing: "0.02em", transition: "color 120ms ease",
            }}
            onMouseEnter={e => (e.currentTarget.style.color = "var(--t2)")}
            onMouseLeave={e => (e.currentTarget.style.color = "var(--t4)")}
          >
            <svg width="10" height="10" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 19.5L3 12m0 0l7.5-7.5M3 12h18" />
            </svg>
            Back
          </button>

          <div style={{ width: 1, height: 14, background: "var(--border)" }} />

          <span style={{ fontSize: 11, fontWeight: 800, letterSpacing: "0.14em", textTransform: "uppercase", color: "var(--t1)" }}>
            Reflex
          </span>
          <span style={{ fontSize: 10, color: "var(--t5)", letterSpacing: "0.06em" }}>
            / dashboard
          </span>
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
            <div style={{
              width: 5, height: 5, borderRadius: "50%",
              background: running ? "#f59e0b" : "#22c55e",
              animation: "pulse-live 2s ease-in-out infinite",
            }} />
            <span style={{ fontSize: 10, color: "var(--t3)", fontFamily: "var(--font-mono)" }}>
              run <span ref={runRef}>{runCount.current}</span>
            </span>
          </div>

          <div style={{ width: 1, height: 14, background: "var(--border)" }} />

          <button
            className="btn-primary"
            onClick={run}
            disabled={running}
            style={{ fontSize: 11, padding: "5px 14px" }}
          >
            {running ? (
              <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"
                style={{ animation: "spin-slow 0.7s linear infinite" }}>
                <path strokeLinecap="round" d="M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4M4.93 19.07l2.83-2.83M16.24 7.76l2.83-2.83" />
              </svg>
            ) : null}
            {running ? "Running" : "Run pipeline"}
          </button>
        </div>
      </header>

      {/* ── Body ──────────────────────────────────────────────── */}
      <div style={{ maxWidth: 1020, margin: "0 auto", padding: "24px 24px 80px" }}>
        {!vizData ? (
          <EmptyState onRun={run} />
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>

            {/* Row 1: Decision (main) + sidebar — dim while pipeline is computing */}
            <div style={{
              display: "grid",
              gridTemplateColumns: "1fr 256px",
              gap: 10,
              alignItems: "start",
              opacity: computing ? 0.38 : 1,
              transition: "opacity 250ms ease",
              pointerEvents: computing ? "none" : "auto",
            }}>
              <DecisionPanel
                decision={vizData.decision}
                profile={vizData.profile}
                runCount={runCount.current}
                onAccept={handleAccept}
                onDismiss={handleDismiss}
                onRerun={run}
              />
              <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                <BehaviorPanel profile={vizData.profile} />
                <InterventionPanel intervention={vizData.intervention} />
              </div>
            </div>

            {/* Row 2: Pipeline visualization — animates L→R during computing */}
            <PipelineViz
              key={runCount.current}
              runKey={runCount.current}
              computing={computing}
              onComputeComplete={handleComputeComplete}
              profile={vizData.profile}
              decision={vizData.decision}
              intervention={vizData.intervention}
              action={vizData.action}
            />

            {/* Row 3: Learning — dim while computing */}
            {result && (
              <div style={{
                opacity: computing ? 0.38 : 1,
                transition: "opacity 250ms ease",
              }}>
                <LearningPanel
                  key={weightHistory.length}
                  learning={result.learning}
                  weightHistory={weightHistory}
                />
              </div>
            )}

            {/* Row 4: Simulation benchmark */}
            {result && (
              <div style={{
                opacity: computing ? 0.38 : 1,
                transition: "opacity 250ms ease",
              }}>
                <SimulationPanel />
              </div>
            )}

          </div>
        )}
      </div>
    </div>
  );
}

// ── Empty state ────────────────────────────────────────────────────────────────

function EmptyState({ onRun }: { onRun: () => void }) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const ctx = gsap.context(() => {
      gsap.from(ref.current, { y: 20, opacity: 0, duration: 0.6, ease: "power3.out", delay: 0.1 });
    });
    return () => ctx.revert();
  }, []);

  return (
    <div
      ref={ref}
      style={{
        display: "flex", flexDirection: "column", alignItems: "center",
        justifyContent: "center", minHeight: "64vh", textAlign: "center",
        userSelect: "none",
      }}
    >
      {/* Orb */}
      <div style={{ position: "relative", width: 80, height: 80, marginBottom: 28 }}>
        {[80, 58, 40].map((size, i) => (
          <div key={size} style={{
            position: "absolute",
            inset: (80 - size) / 2,
            borderRadius: "50%",
            border: `1px solid rgba(99,102,241,${0.18 - i * 0.05})`,
            animation: `pulse-indigo ${2.2 + i * 0.5}s ease-in-out infinite`,
            animationDelay: `${i * 0.3}s`,
          }} />
        ))}
        <div style={{
          position: "absolute", inset: "50%",
          transform: "translate(-50%,-50%)",
          width: 14, height: 14, borderRadius: "50%",
          background: "radial-gradient(circle, #818cf8, #6366f1)",
          boxShadow: "0 0 20px rgba(99,102,241,0.5)",
        }} />
      </div>

      <div style={{ fontSize: 10, fontWeight: 700, letterSpacing: "0.14em", textTransform: "uppercase", color: "var(--t5)", marginBottom: 10 }}>
        Adaptive pipeline
      </div>
      <h3 style={{ margin: "0 0 8px", fontSize: 18, fontWeight: 700, color: "var(--t1)", letterSpacing: "-0.025em" }}>
        Ready to run
      </h3>
      <p style={{ margin: "0 0 28px", fontSize: 13, color: "var(--t4)", maxWidth: 260, lineHeight: 1.7 }}>
        Fire the pipeline to compute a decision from live behavioral signals.
      </p>
      <button
        className="btn-primary"
        onClick={onRun}
        style={{ fontSize: 13, padding: "10px 24px", boxShadow: "0 0 28px rgba(99,102,241,0.3)" }}
      >
        Run pipeline
      </button>
    </div>
  );
}

// ── Root ───────────────────────────────────────────────────────────────────────

export default function App() {
  const [view, setView] = useState<View>("landing");
  if (view === "dashboard") return <Dashboard onBack={() => setView("landing")} />;
  return <LandingPage onLaunch={() => setView("dashboard")} />;
}
