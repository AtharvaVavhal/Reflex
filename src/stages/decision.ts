import { UserProfile, Decision, DecisionResult, PolicyWeights, Cohort } from "./types";

let iteration = 0;
const decisionCounts: Record<string, number> = {};

/** Reset module-level exploration state between experiment runs. */
export function resetDecisionEngine(): void {
  iteration = 0;
  for (const key of Object.keys(decisionCounts)) {
    delete decisionCounts[key];
  }
}

const COHORT_AFFINITY: Record<Decision, Cohort[]> = {
  "show-upsell": ["power_user"],
  "do-nothing":  ["at_risk", "dormant", "new_user"],
};

const COHORT_BOOST   = 0.12;
const COHORT_PENALTY = 0.06;

function cohortModifier(decision: Decision, cohort: Cohort): number {
  return COHORT_AFFINITY[decision].includes(cohort) ? COHORT_BOOST : -COHORT_PENALTY;
}

export function decisionEngine(
  profile: UserProfile,
  weights: PolicyWeights,
): DecisionResult {
  const decisions = Object.keys(weights) as Decision[];

  const scored = decisions.map((action) => {
    const modifier    = cohortModifier(action, profile.cohort);
    const baseScore   = profile.engagement * 0.3 + modifier;
    const policyWeight = weights[action] ?? 1.0;
    const learnedBoost = policyWeight - 1;
    const count = decisionCounts[action] ?? 1;
    const explorationBonus = Math.sqrt(Math.log(iteration + 1) / count);
    const finalScore  = parseFloat((Math.min(2, Math.max(-1, baseScore + learnedBoost + 0.2 * explorationBonus))).toFixed(4));

    if (import.meta.env.DEV && import.meta.env.VITE_DEBUG) {
      console.log(`[decision] ${action} | base=${baseScore.toFixed(3)} | weight=${policyWeight.toFixed(3)} | final=${finalScore.toFixed(3)}`);
      console.log(`[decision] ${action} | count=${count} | bonus=${explorationBonus.toFixed(3)}`);
    }

    return { action, score: finalScore };
  });

  scored.sort((a, b) => b.score - a.score);

  iteration++;
  const epsilon = Math.max(0.02, 0.15 * Math.exp(-iteration / 50));
  if (import.meta.env.DEV && import.meta.env.VITE_DEBUG) console.log(`[decision] epsilon=${epsilon.toFixed(3)} | iteration=${iteration}`);

  let bestAction: Decision;

  if (Math.random() < epsilon) {
    const randomIndex = Math.floor(Math.random() * decisions.length);
    bestAction = decisions[randomIndex];
    if (process.env.DEBUG) console.log("[decision] exploration triggered → random action selected");
  } else {
    bestAction = scored[0].action;
  }

  decisionCounts[bestAction] = (decisionCounts[bestAction] ?? 1) + 1;

  return { best: bestAction, ranked: scored };
}