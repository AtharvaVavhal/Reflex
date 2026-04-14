import { useState, useCallback } from "react";
import { useReflexContext } from "./ReflexContext";
import { processSignals } from "../stages/feedback-processor";
import { ActionInstruction, Intervention, UserProfile, DecisionResult, UserId, SessionId } from "../stages/types";

export type DecisionState = {
  action: ActionInstruction;
  profile: UserProfile;
  decision: DecisionResult;
  intervention: Intervention;
};

export type UseDecisionResult = {
  result: DecisionState | null;
  loading: boolean;
  run: (userId: string, sessionId: string) => void;
};

export function useDecision(): UseDecisionResult {
  const { pipeline, bus, tracker, adaptation } = useReflexContext();
  const [result, setResult] = useState<DecisionState | null>(null);
  const [loading, setLoading] = useState(false);

  const run = useCallback((userId: string, sessionId: string) => {
    setLoading(true);

    let capturedProfile: UserProfile | null = null;
    let capturedDecision: DecisionResult | null = null;
    let capturedIntervention: Intervention | null = null;

    const onProfile = (p: UserProfile) => { capturedProfile = p; };
    const onDecision = (d: DecisionResult) => { capturedDecision = d as unknown as DecisionResult; };
    const onIntervention = (i: Intervention) => { capturedIntervention = i; };

    bus.on("profile:computed", onProfile);
    bus.on("decision:made", onDecision as any);
    bus.on("intervention:calibrated", onIntervention);

    const action = pipeline.run({
      userId: userId as UserId,
      sessionId: sessionId as SessionId,
    });

    bus.off("profile:computed", onProfile);
    bus.off("decision:made", onDecision as any);
    bus.off("intervention:calibrated", onIntervention);

    const signals = tracker.flush();
    if (signals.length > 0) {
      const report = processSignals(signals);
      const delta = adaptation.adapt(report);
      pipeline.updateWeights(delta.policyWeights);
    }

    setResult({
      action,
      profile: capturedProfile!,
      decision: capturedDecision!,
      intervention: capturedIntervention!,
    });

    setLoading(false);
  }, [pipeline, bus, tracker, adaptation]);

  return { result, loading, run };
}