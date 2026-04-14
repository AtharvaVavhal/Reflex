import { useState, useRef, useEffect } from "react";
import { gsap } from "gsap";
import { DecisionPanel }    from "./DecisionPanel";
import { BehaviorPanel }    from "./BehaviorPanel";
import { InterventionPanel } from "./InterventionPanel";
import { TimelinePanel }    from "./TimelinePanel";
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

type View = "landing" | "dashboard";

// ─── Dashboard ────────────────────────────────────────────────────────────────

function Dashboard({ onBack }: { onBack: () => void }) {
  const [result, setResult] = useState<RunResult | null>(null);
  const runCount            = useRef(0);
  const dashRef             = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const ctx = gsap.context(() => {
      gsap.from(dashRef.current, { opacity: 0, duration: 0.4, ease: "power2.out" });
    });
    return () => ctx.revert();
  }, []);

  const run = () => {
    let capturedProfile:      UserProfile      | null = null;
    let capturedDecision:     DecisionResult   | null = null;
    let capturedIntervention: Intervention     | null = null;

    // Use one-shot handlers that unregister themselves after first fire
    const onProfile      = (p: UserProfile)      => { capturedProfile      = p;                                   bus.off("profile:computed",        onProfile);      };
    const onDecision     = (d: DecisionResult)   => { capturedDecision     = d as unknown as DecisionResult;      bus.off("decision:made",           onDecision);     };
    const onIntervention = (i: Intervention)     => { capturedIntervention = i;                                   bus.off("intervention:calibrated", onIntervention); };

    bus.on("profile:computed",        onProfile);
    bus.on("decision:made",           onDecision);
    bus.on("intervention:calibrated", onIntervention);

    try {
      const action = pipeline.run({
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
        console.error("[Reflex] Pipeline ran but one or more stages did not emit:", { capturedProfile, capturedDecision, capturedIntervention });
        return;
      }

      setResult({
        action,
        profile:      capturedProfile,
        decision:     capturedDecision,
        intervention: capturedIntervention,
        learning:     pipeline.getLearning(),
      });
      runCount.current += 1;
    } catch (err) {
      console.error("[Reflex] Pipeline error:", err);
      // Clean up any listeners that didn't fire
      bus.off("profile:computed",        onProfile);
      bus.off("decision:made",           onDecision);
      bus.off("intervention:calibrated", onIntervention);
    }
  };

  const handleAccept = () => {
    if (!result) return;
    tracker.track("click", "positive", result.action.action);
    setTimeout(run, 300);
  };

  const handleDismiss = () => {
    if (!result) return;
    tracker.track("dismiss", "negative", result.action.action);
    setTimeout(run, 300);
  };

  return (
    <div ref={dashRef} style={{ minHeight: "100vh", background: "#09090b" }}>

      {/* Top nav */}
      <header style={{
        position: "sticky", top: 0, zIndex: 40,
        background: "rgba(9,9,11,0.85)",
        backdropFilter: "blur(12px)",
        borderBottom: "1px solid rgba(255,255,255,0.05)",
        padding: "0 24px",
        height: 52,
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
          <button
            onClick={onBack}
            style={{
              background: "none", border: "none", cursor: "pointer",
              color: "#52525b", fontSize: 12, fontFamily: "inherit",
              display: "flex", alignItems: "center", gap: 6, padding: "4px 0",
            }}
          >
            <svg width="12" height="12" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 19.5L3 12m0 0l7.5-7.5M3 12h18" />
            </svg>
            Back
          </button>
          <div style={{ width: 1, height: 16, background: "rgba(255,255,255,0.08)" }} />
          <span style={{ fontSize: 13, fontWeight: 700, letterSpacing: "0.08em", textTransform: "uppercase", color: "#e4e4e7" }}>
            Reflex
          </span>
          <span style={{ fontSize: 11, color: "#3f3f46" }}>Dashboard</span>
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
            <div style={{ width: 6, height: 6, borderRadius: "50%", background: "#22c55e", boxShadow: "0 0 6px rgba(34,197,94,0.6)" }} />
            <span style={{ fontSize: 11, color: "#52525b" }}>run {runCount.current}</span>
          </div>
          {!result && (
            <button
              onClick={run}
              style={{
                background: "#6366f1", color: "#fff", border: "none",
                padding: "6px 16px", borderRadius: 8, fontSize: 12,
                fontWeight: 600, cursor: "pointer", fontFamily: "inherit",
              }}
            >
              Run pipeline
            </button>
          )}
        </div>
      </header>

      {/* Body */}
      <div style={{ maxWidth: 960, margin: "0 auto", padding: "32px 24px 80px" }}>
        {!result ? (
          <EmptyState onRun={run} />
        ) : (
          <>
            <div style={{ marginBottom: 16 }}>
              <DecisionPanel
                key={runCount.current}
                decision={result.decision}
                onAccept={handleAccept}
                onDismiss={handleDismiss}
                onRerun={run}
              />
            </div>

            <div style={{
              display: "grid",
              gridTemplateColumns: "repeat(3, minmax(0, 1fr))",
              gap: 12,
              marginBottom: 12,
            }}>
              <BehaviorPanel     profile={result.profile} />
              <InterventionPanel intervention={result.intervention} />
              <TimelinePanel
                action={result.action}
                profile={result.profile}
                decision={result.decision}
                intervention={result.intervention}
              />
            </div>

            <LearningPanel learning={result.learning} />
          </>
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
      gsap.from(ref.current, { y: 20, opacity: 0, duration: 0.6, ease: "power3.out", delay: 0.1 });
    });
    return () => ctx.revert();
  }, []);

  return (
    <div ref={ref} style={{
      display: "flex", flexDirection: "column", alignItems: "center",
      justifyContent: "center", minHeight: "60vh", textAlign: "center",
    }}>
      {/* Animated ring */}
      <div style={{
        width: 64, height: 64, borderRadius: "50%",
        border: "1px solid rgba(99,102,241,0.3)",
        display: "flex", alignItems: "center", justifyContent: "center",
        marginBottom: 24,
        background: "rgba(99,102,241,0.06)",
      }}>
        <div style={{ width: 20, height: 20, borderRadius: "50%", background: "rgba(99,102,241,0.5)" }} />
      </div>

      <h3 style={{ margin: "0 0 8px", fontSize: 18, fontWeight: 700, color: "#e4e4e7", letterSpacing: "-0.02em" }}>
        Pipeline ready
      </h3>
      <p style={{ margin: "0 0 28px", fontSize: 14, color: "#52525b", maxWidth: 320, lineHeight: 1.7 }}>
        Run the pipeline to generate a real-time decision with full behavioral context.
      </p>
      <button
        onClick={onRun}
        style={{
          background: "#6366f1", color: "#fff", border: "none",
          padding: "10px 28px", borderRadius: 10, fontSize: 14,
          fontWeight: 600, cursor: "pointer", fontFamily: "inherit",
          boxShadow: "0 0 32px rgba(99,102,241,0.3)",
        }}
      >
        Run pipeline →
      </button>
    </div>
  );
}

// ─── Root ─────────────────────────────────────────────────────────────────────

export default function App() {
  const [view, setView] = useState<View>("landing");

  const launch = () => setView("dashboard");
  const back   = () => setView("landing");

  if (view === "dashboard") return <Dashboard onBack={back} />;
  return <LandingPage onLaunch={launch} />;
}
