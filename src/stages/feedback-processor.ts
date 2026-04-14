import { BehaviorSignal, Decision, FeedbackReport, PolicyScore } from "./types";

const TIME_REFERENCE_MS = 3000;
const COUNT_SCALE       = 5;

function timeFactor(timeToAction: number): number {
  return Math.max(0.1, Math.min(1.0, TIME_REFERENCE_MS / Math.max(timeToAction, 100)));
}

function recencyFactor(timestamp: number, now: number): number {
  const ageInSeconds = (now - timestamp) / 1000;
  return 1 / (1 + ageInSeconds / 10);
}

function outcomeValue(outcome: BehaviorSignal["outcome"]): number {
  if (outcome === "positive") return 1;
  if (outcome === "negative") return -1;
  return 0;
}

export function processSignals(signals: BehaviorSignal[]): FeedbackReport {
  const now = Date.now();
  const buckets = new Map<Decision, { totalWeight: number; weightedScore: number; count: number }>();

  for (const signal of signals) {
    if (!buckets.has(signal.decision)) {
      buckets.set(signal.decision, { totalWeight: 0, weightedScore: 0, count: 0 });
    }
    const bucket = buckets.get(signal.decision)!;
    const weight = signal.strength
      * timeFactor(signal.timeToAction)
      * recencyFactor(signal.timestamp, now);

    // Neutral signals contribute less weight so they don't dilute strong directional signals
    const neutralScale = signal.outcome === "neutral" ? 0.3 : 1.0;
    bucket.totalWeight   += weight * neutralScale;
    bucket.weightedScore += outcomeValue(signal.outcome) * weight * neutralScale;
    bucket.count         += 1;
  }

  const scores: PolicyScore[] = Array.from(buckets.entries()).map(
    ([decision, { totalWeight, weightedScore, count }]): PolicyScore => {
      const performance = totalWeight === 0 ? 0 : weightedScore / totalWeight;
      const confidence  = count / (count + COUNT_SCALE);
      const scaledConfidence = 0.5 + 0.5 * confidence;
      let successRate = performance * scaledConfidence;

      if (Math.abs(successRate) < 0.05) {
        successRate = 0;
      }

      if (import.meta.env.DEV && import.meta.env.VITE_DEBUG) console.log(
        `[feedback-processor] decision=${decision}` +
        ` | performance=${performance.toFixed(4)} | confidence=${confidence.toFixed(4)} | successRate=${successRate.toFixed(4)}`
      );

      return { decision, total: totalWeight, positive: Math.max(0, weightedScore), performance, confidence, successRate };
    }
  );

  return { scores, processedAt: now };
}

