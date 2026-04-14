import { useState, useRef, useEffect } from "react";
import { gsap } from "gsap";
import { DecisionPanel }    from "./DecisionPanel";
import { BehaviorPanel }    from "./BehaviorPanel";
import { InterventionPanel } from "./InterventionPanel";
import { PipelineViz }      from "./PipelineViz";
import { LearningPanel }    from "./LearningPanel";
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

// ─── Dashboard ────────────────────────────────────────────────────────────────

function Dashboard({ onBack }: { onBack: () => void }) {
  const [result,        setResult]        = useState<RunResult | null>(null);
  const [weightHistory, setWeightHistory] = useState<WeightPoint[]>([]);
  const [running,       setRunning]       = useState(false);
  const runCount = useRef(0);
  const runLabel = useRef<HTMLSpanElement>(null);

  // Animate run counter increment
  function bumpRunLabel() {
    if (!runLabel.current) return;
    gsap.from(runLabel.current, { y: -8, opacity: 0, duration: 0.25, ease: "power2.out" });
  }

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

      setWeightHistory(prev => [...prev, {
        showUpsell: learning.weights["show-upsell"] ?? 1,
        doNothing:  learning.weights["do-nothing"]  ?? 1,
      }]);

      setResult({
        action, profile: capturedProfile,
        decision: capturedDecision,
        intervention: capturedIntervention,
        learning,
      });

      runCount.current += 1;
      bumpRunLabel();
    } catch (err) {
      console.error("[Reflex] Pipeline error:", err);
      bus.off("profile:computed",        onProfile);
      bus.off("decision:made",           onDecision);
      bus.off("intervention:calibrated", onIntervention);
    } finally {
      setRunning(false);
    }
  };

  const handleAccept = () => {
    if (!result) return;
    tracker.track("click", "positive", result.action.action);
    setTimeout(run, 280);
  };

  const handleDismiss = () => {
    if (!result) return;
    tracker.track("dismiss", "negative", result.action.action);
    setTimeout(run, 280);
  };

  return (
    <div style={{ minHeight: "100vh", background: "#09090b" }}>

      {/* ── Nav ─────────────────────────────────────────────────── */}
      <header style={{
        position: "sticky", top: 0, zIndex: 50,
        background: "rgba(9,9,11,0.9)",
        backdropFilter: "blur(16px) saturate(180%)",
        borderBottom: "1px solid rgba(255,255,255,0.055)",
        padding: "0 24px",
        height: 50,
        display: "flex", alignItems: "center", justifyContent: "space-between",
      }}>
        {/* Left */}
        <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
          <button
            onClick={onBack}
            style={{
              background: "none", border: "none", cursor: "pointer",
              color: "#3f3f46", fontSize: 11, fontFamily: "inherit",
              display: "flex", alignItems: "center", gap: 5, padding: 0,
              letterSpacing: "0.03em",
            }}
          >
            <svg width="10" height="10" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 19.5L3 12m0 0l7.5-7.5M3 12h18" />
            </svg>
            Back
          </button>

          <div style={{ width: 1, height: 14, background: "rgba(255,255,255,0.07)" }} />

          <span style={{
            fontSize: 12, fontWeight: 800, letterSpacing: "0.12em",
            textTransform: "uppercase", color: "#e4e4e7",
          }}>
            Reflex
          </span>

          <div style={{
            fontSize: 11, color: "#3f3f46",
            padding: "2px 8px", borderRadius: 4,
            background: "rgba(255,255,255,0.03)",
            border: "1px solid rgba(255,255,255,0.06)",
          }}>
            dashboard
          </div>
        </div>

        {/* Right */}
        <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
          {/* Live indicator */}
          <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
            <div style={{
              width: 6, height: 6, borderRadius: "50%",
              background: running ? "#f59e0b" : "#22c55e",
              animation: "pulse-live 2s ease-in-out infinite",
            }} />
            <span style={{ fontSize: 11, color: "#3f3f46", fontFamily: "var(--font-mono)" }}>
              run&nbsp;<span ref={runLabel}>{runCount.current}</span>
            </span>
          </div>

          <div style={{ width: 1, height: 14, background: "rgba(255,255,255,0.07)" }} />

          <button
            onClick={run}
            disabled={running}
            style={{
              background: running ? "rgba(99,102,241,0.4)" : "#6366f1",
              color: "#fff", border: "none",
              padding: "5px 14px", borderRadius: 7, fontSize: 11,
              fontWeight: 700, cursor: running ? "default" : "pointer",
              fontFamily: "inherit", letterSpacing: "0.04em",
              transition: "background 150ms",
              display: "flex", alignItems: "center", gap: 6,
            }}
          >
            {running && (
              <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"
                style={{ animation: "spin-slow 0.8s linear infinite" }}>
                <path d="M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4M4.93 19.07l2.83-2.83M16.24 7.76l2.83-2.83" strokeLinecap="round" />
              </svg>
            )}
            {running ? "Running…" : "Run pipeline"}
          </button>
        </div>
      </header>

      {/* ── Body ─────────────────────────────────────────────────── */}
      <div style={{ maxWidth: 980, margin: "0 auto", padding: "28px 24px 80px" }}>
        {!result ? (
          <EmptyState onRun={run} />
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>

            {/* Decision + sidebar */}
            <div style={{
              display: "grid",
              gridTemplateColumns: "1fr 280px",
              gap: 12,
              alignItems: "start",
            }}>
              <DecisionPanel
                decision={result.decision}
                runCount={runCount.current}
                onAccept={handleAccept}
                onDismiss={handleDismiss}
                onRerun={run}
              />

              {/* Sidebar: Behavior + Intervention stacked */}
              <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                <BehaviorPanel profile={result.profile} />
                <InterventionPanel intervention={result.intervention} />
              </div>
            </div>

            {/* Pipeline viz — full width */}
            <PipelineViz
              key={runCount.current}
              runKey={runCount.current}
              profile={result.profile}
              decision={result.decision}
              intervention={result.intervention}
              action={result.action}
            />

            {/* Learning — full width with history */}
            <LearningPanel
              learning={result.learning}
              weightHistory={weightHistory}
            />
          </div>
        )}
      </div>
    </div>
  );
}

// ─── Empty state ──────────────────────────────────────────────────────────────

function EmptyState({ onRun }: { onRun: () => void }) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const ctx = gsap.context(() => {
      gsap.from(ref.current, { y: 24, opacity: 0, duration: 0.7, ease: "power3.out", delay: 0.15 });
    });
    return () => ctx.revert();
  }, []);

  return (
    <div
      ref={ref}
      style={{
        display: "flex", flexDirection: "column", alignItems: "center",
        justifyContent: "center", minHeight: "62vh", textAlign: "center",
      }}
    >
      {/* Concentric rings */}
      <div style={{ position: "relative", width: 72, height: 72, marginBottom: 28 }}>
        {[72, 52, 34].map((size, i) => (
          <div key={size} style={{
            position: "absolute",
            top: (72 - size) / 2, left: (72 - size) / 2,
            width: size, height: size, borderRadius: "50%",
            border: `1px solid rgba(99,102,241,${0.15 - i * 0.04})`,
            background: i === 2 ? "rgba(99,102,241,0.1)" : "transparent",
            animation: `pulse-live ${2 + i * 0.4}s ease-in-out infinite`,
            animationDelay: `${i * 0.2}s`,
          }} />
        ))}
        <div style={{
          position: "absolute", top: "50%", left: "50%",
          transform: "translate(-50%,-50%)",
          width: 12, height: 12, borderRadius: "50%",
          background: "#6366f1",
          boxShadow: "0 0 16px rgba(99,102,241,0.6)",
        }} />
      </div>

      <h3 style={{ margin: "0 0 8px", fontSize: 17, fontWeight: 700, color: "#e4e4e7", letterSpacing: "-0.025em" }}>
        Pipeline ready
      </h3>
      <p style={{ margin: "0 0 32px", fontSize: 13, color: "#52525b", maxWidth: 280, lineHeight: 1.7 }}>
        Fire the adaptive pipeline to generate a decision with full behavioral context.
      </p>
      <button
        onClick={onRun}
        style={{
          background: "#6366f1", color: "#fff", border: "none",
          padding: "10px 28px", borderRadius: 9, fontSize: 13,
          fontWeight: 700, cursor: "pointer", fontFamily: "inherit",
          letterSpacing: "0.02em",
          boxShadow: "0 0 32px rgba(99,102,241,0.35), 0 1px 0 rgba(255,255,255,0.1) inset",
        }}
      >
        Run pipeline
      </button>
    </div>
  );
}

// ─── Root ─────────────────────────────────────────────────────────────────────

export default function App() {
  const [view, setView] = useState<View>("landing");
  if (view === "dashboard") return <Dashboard onBack={() => setView("landing")} />;
  return <LandingPage onLaunch={() => setView("dashboard")} />;
}
