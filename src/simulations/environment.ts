import { BehaviorSignal, Decision } from "../stages/types";
import { RNG } from "./stats";

// =============================================================================
// Phase definition
// =============================================================================

export interface Phase {
  label:       string;
  start:       number;
  end:         number;
  optimal:     Decision;
  successProb: Record<Decision, number>;
}

export const DEFAULT_PHASES: Phase[] = [
  {
    label: "Phase 1", start:  0, end: 30,
    optimal: "show-upsell",
    successProb: { "show-upsell": 0.70, "do-nothing": 0.30 },
  },
  {
    label: "Phase 2", start: 31, end: 60,
    optimal: "do-nothing",
    successProb: { "show-upsell": 0.40, "do-nothing": 0.60 },
  },
  {
    label: "Phase 3", start: 61, end: 99,
    optimal: "show-upsell",
    successProb: { "show-upsell": 0.80, "do-nothing": 0.20 },
  },
];

export function getPhase(phases: Phase[], i: number): Phase {
  const phase = phases.find(p => i >= p.start && i <= p.end);
  if (!phase) throw new Error(`No phase defined for iteration ${i}`);
  return phase;
}

// =============================================================================
// Outcome simulation (noisy: positive / neutral / negative)
// =============================================================================

export function simulateOutcome(
  decision: Decision,
  phase:    Phase,
  rng:      RNG,
): BehaviorSignal["outcome"] {
  const r   = rng();
  const pos = phase.successProb[decision];
  if (r < pos)                    return "positive";
  if (r < pos + (1 - pos) * 0.5) return "neutral";
  return "negative";
}

export function buildSignal(
  decision: Decision,
  outcome:  BehaviorSignal["outcome"],
  delayMs:  number,
): BehaviorSignal {
  return {
    type:         outcome === "positive" ? "convert"
                : outcome === "negative" ? "dismiss"
                : "dwell",
    outcome,
    decision,
    timestamp:    Date.now(),
    strength:     1.0,
    timeToAction: 500,
    delayMs,
  };
}
