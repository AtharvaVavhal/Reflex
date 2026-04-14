import { Decision, PolicyWeights, UserProfile } from "../stages/types";
import { decisionEngine } from "../stages/decision";
import { RNG, computeVariance } from "./stats";

// =============================================================================
// Shared constants
// =============================================================================

export const DECISIONS: Decision[] = ["show-upsell", "do-nothing"];

export const PROFILE: UserProfile = {
  engagement:  0.6,
  churnRisk:   0.2,
  impulsivity: 0.5,
  cohort:      "power_user",
};

export const NEUTRAL_WEIGHTS: PolicyWeights = { "show-upsell": 1.0, "do-nothing": 1.0 };

// =============================================================================
// Strategy interface
// =============================================================================

export interface DecisionContext {
  weights:       PolicyWeights;
  iteration:     number;
  rollingRegret: number;
  srHistory:     Record<Decision, number[]>;
  rng:           RNG;
}

export type DecisionFn = (ctx: DecisionContext) => { decision: Decision; explored: boolean };

// =============================================================================
// Strategy implementations
// =============================================================================

function weakest(weights: PolicyWeights): Decision {
  return (Object.entries(weights) as [Decision, number][])
    .sort((a, b) => a[1] - b[1])[0][0];
}

/**
 * Adaptive: confidence-weighted scoring + regret-triggered exploration.
 * High successRate variance → lower confidence → discounted weight.
 * Explores toward the weakest-weight decision when rolling regret exceeds threshold.
 */
export function makeAdaptiveStrategy(regretThreshold: number): DecisionFn {
  return ({ weights, rollingRegret, srHistory }: DecisionContext) => {
    const confidence:      Record<Decision, number> = {} as Record<Decision, number>;
    const effectiveWeights: PolicyWeights           = {} as PolicyWeights;

    for (const d of DECISIONS) {
      confidence[d]       = 1 / (1 + computeVariance(srHistory[d]));
      effectiveWeights[d] = weights[d] * confidence[d];
    }

    const result   = decisionEngine(PROFILE, effectiveWeights);
    const explored = rollingRegret > regretThreshold;
    const decision = explored ? weakest(weights) : result.best;

    return { decision, explored };
  };
}

/**
 * Greedy: always follows static base-score ranking with neutral weights.
 * No learning — provides a context-aware but adaptation-free baseline.
 */
export const greedyStrategy: DecisionFn = () => {
  const result = decisionEngine(PROFILE, NEUTRAL_WEIGHTS);
  return { decision: result.best, explored: false };
};

/**
 * Random: uniform random selection using the run's seeded RNG.
 * Lower bound baseline — expected regret ≈ 50% of maximum.
 */
export const randomStrategy: DecisionFn = ({ rng }: DecisionContext) => ({
  decision: DECISIONS[Math.floor(rng() * DECISIONS.length)],
  explored: false,
});
