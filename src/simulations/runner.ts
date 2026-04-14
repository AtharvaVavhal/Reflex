import { Decision, PolicyWeights } from "../stages/types";
import { AdaptationEngine } from "../stages/adaptation-engine";
import { processSignals } from "../stages/feedback-processor";
import { decisionEngine, resetDecisionEngine } from "../stages/decision";
import { Phase, getPhase, simulateOutcome, buildSignal } from "./environment";
import { DecisionFn, DECISIONS, PROFILE } from "./strategies";
import { RNG, mean, computeVariance, pushCapped } from "./stats";

// =============================================================================
// Config
// =============================================================================

export interface ExperimentConfig {
  iterations:      number;
  runs:            number;
  regretThreshold: number;
  maxDelay:        number;
  phases:          Phase[];
}

// =============================================================================
// Log entry types
// =============================================================================

export interface WeightEntry   { iteration: number; showUpsellWeight: number; doNothingWeight: number }
export interface RegretEntry   { iteration: number; stepRegret: number; cumulativeRegret: number }
export interface DecisionEntry { iteration: number; phase: string; decision: Decision; explored: boolean; outcome: string }

export interface SimulationResult {
  label:            string;
  weightLog:        WeightEntry[];
  regretLog:        RegretEntry[];
  decisionLog:      DecisionEntry[];
  cumulativeRegret: number;
  policySwitches:   number;
  selectionCounts:  Record<Decision, number>;
  phaseAdaptLog:    Array<{ phase: string; flippedAt: number; iterationsToAdapt: number }>;
}

// =============================================================================
// Single simulation run
// =============================================================================

export function runSimulation(
  label:       string,
  decisionFn:  DecisionFn,
  config:      ExperimentConfig,
  rng:         RNG,
  adaptation?: AdaptationEngine,
): SimulationResult {
  // Reset decision.ts module state so exploration is fresh every run
  resetDecisionEngine();

  const weightLog:   WeightEntry[]   = [];
  const regretLog:   RegretEntry[]   = [];
  const decisionLog: DecisionEntry[] = [];
  const phaseAdaptLog: SimulationResult["phaseAdaptLog"] = [];

  const selectionCounts: Record<Decision, number> = { "show-upsell": 0, "do-nothing": 0 };
  const regretWindow:    number[]                 = [];
  const pending: Array<{ signal: ReturnType<typeof buildSignal>; releaseIteration: number }> = [];
  const srHistory: Record<Decision, number[]> = { "show-upsell": [], "do-nothing": [] };

  let weights: PolicyWeights  = { "show-upsell": 1.0, "do-nothing": 1.0 };
  let cumulativeRegret = 0;
  let policySwitches   = 0;
  let currentPolicy:   Decision | null = null;
  let lastShiftAt      = 0;
  let currentPhase     = config.phases[0].label;

  for (let i = 0; i < config.iterations; i++) {
    const phase = getPhase(config.phases, i);

    if (phase.label !== currentPhase) {
      currentPhase = phase.label;
      lastShiftAt  = i;
    }

    // ── Decision ─────────────────────────────────────────────────────────────
    const rollingRegret = mean(regretWindow);
    const { decision: chosen, explored } = decisionFn({
      weights, iteration: i, rollingRegret, srHistory, rng,
    });
    selectionCounts[chosen]++;

    // ── Regret ────────────────────────────────────────────────────────────────
    const actualReward  = rng() < phase.successProb[chosen]        ? 1 : 0;
    const optimalReward = rng() < phase.successProb[phase.optimal] ? 1 : 0;
    const stepRegret    = Math.max(0, optimalReward - actualReward);
    cumulativeRegret   += stepRegret;
    pushCapped(regretWindow, stepRegret, 10);

    // ── Policy flip detection (exploitation ranking only) ────────────────────
    if (adaptation) {
      const confidence:       Record<Decision, number> = {} as Record<Decision, number>;
      const effectiveWeights: PolicyWeights            = {} as PolicyWeights;
      for (const d of DECISIONS) confidence[d]       = 1 / (1 + computeVariance(srHistory[d]));
      for (const d of DECISIONS) effectiveWeights[d]  = weights[d] * confidence[d];
      const exploitDecision = decisionEngine(PROFILE, effectiveWeights).ranked[0].action;
      if (currentPolicy !== null && exploitDecision !== currentPolicy) {
        policySwitches++;
        phaseAdaptLog.push({ phase: currentPhase, flippedAt: i, iterationsToAdapt: i - lastShiftAt });
      }
      currentPolicy = exploitDecision;
    }

    // ── Delayed feedback ──────────────────────────────────────────────────────
    const outcome    = simulateOutcome(chosen, phase, rng);
    const delayIters = Math.floor(rng() * (config.maxDelay + 1));
    pending.push({ signal: buildSignal(chosen, outcome, delayIters * 100), releaseIteration: i + delayIters });

    if (adaptation) {
      const due = pending.filter(p => p.releaseIteration <= i);
      due.forEach(p => pending.splice(pending.indexOf(p), 1));
      if (due.length > 0) {
        const report = processSignals(due.map(p => p.signal));
        const delta  = adaptation.adapt(report);
        weights = delta.policyWeights;
        for (const score of report.scores) {
          pushCapped(srHistory[score.decision], score.successRate, 10);
        }
      }
    }

    // ── Per-iteration logs ────────────────────────────────────────────────────
    weightLog.push({ iteration: i, showUpsellWeight: weights["show-upsell"], doNothingWeight: weights["do-nothing"] });
    regretLog.push({ iteration: i, stepRegret, cumulativeRegret });
    decisionLog.push({ iteration: i, phase: phase.label, decision: chosen, explored, outcome });
  }

  return { label, weightLog, regretLog, decisionLog, cumulativeRegret, policySwitches, selectionCounts, phaseAdaptLog };
}
