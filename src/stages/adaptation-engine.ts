import { Decision, FeedbackReport, PolicyWeights, SystemDelta } from "./types";

const WEIGHT_FLOOR   = 0.1;
const WEIGHT_CEIL    = 1.5;
const MAX_DELTA      = 0.3;
const GLOBAL_DECAY   = 0.02;

const DEFAULT_WEIGHTS: PolicyWeights = {
  "show-upsell": 1.0,
  "do-nothing":  1.0,
};

export class AdaptationEngine {
  private weights: PolicyWeights = { ...DEFAULT_WEIGHTS };

  adapt(report: FeedbackReport): SystemDelta {
    const previous = { ...this.weights };
    const next = { ...this.weights };
    const successRate = report.scores.length === 0
      ? 0
      : report.scores.reduce((sum, score) => sum + score.successRate, 0) / report.scores.length;

    // Global decay every iteration — prevents any weight from becoming permanent
    // High weights receive stronger decay to prevent overconfidence lock-in
    for (const decision of Object.keys(next) as Decision[]) {
      const w = next[decision];
      next[decision] = Math.max(WEIGHT_FLOOR, w > 1.3 ? w * 0.95 : w * (1 - GLOBAL_DECAY));
    }

    const updatedDecisions = new Set<string>();

    for (const score of report.scores) {
      const decision = score.decision as Decision;
      const current = next[decision] ?? 1.0;

      const direction = score.successRate;
      const scaledStep = 0.4 * (1 + Math.abs(score.successRate));
      let delta = direction * scaledStep;

      if (delta < 0) {
        delta *= 1.2;
      }

      delta = Math.max(-MAX_DELTA, Math.min(MAX_DELTA, delta));

      const confidence = Math.min(1, Math.abs(score.successRate));
      const momentum = 0.9 - 0.4 * confidence;
      const smoothed = current * momentum + (current + delta) * (1 - momentum);
      next[decision] = Math.min(WEIGHT_CEIL, Math.max(WEIGHT_FLOOR, smoothed));
      updatedDecisions.add(decision);
    }

    // Decay unused decisions toward baseline (1.0) so they never stay frozen
    const decay = 0.02;
    for (const decision of Object.keys(next) as Decision[]) {
      if (!updatedDecisions.has(decision)) {
        next[decision] = next[decision] + (1.0 - next[decision]) * decay;
      }
    }

    this.weights = next;

    return {
      policyWeights: { ...this.weights },
      rollbackable: true,
      previous,
      successRate,
    };
  }

  getWeights(): PolicyWeights {
    return { ...this.weights };
  }

  rollback(delta: SystemDelta): void {
    if (delta.rollbackable) {
      this.weights = { ...delta.previous };
    }
  }
}   