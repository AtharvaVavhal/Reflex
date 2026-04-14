import { Pipeline } from "./core/pipeline";
import { EventBus } from "./core/event-bus";
import { BehaviorTracker } from "./stages/behavior-tracker";
import { AdaptationEngine } from "./stages/adaptation-engine";
import { contextCollector } from "./stages/context";
import { behaviorModel } from "./stages/behavior";
import { decisionEngine } from "./stages/decision";
import { interventionCalibrator } from "./stages/intervention";
import { actionResolver } from "./stages/action";
import { processSignals } from "./stages/feedback-processor";
import { SessionId, SignalType, UserId } from "./stages/types";

const bus = new EventBus();
const tracker = new BehaviorTracker(bus);
const adaptation = new AdaptationEngine();

bus.on("decision:made", (d) => console.log("[decision]", d));
bus.on("intervention:calibrated", (i) => console.log("[intervention]", i));
bus.on("action:resolved", (a) => console.log("[action]", a));
bus.on("signal:tracked", (s) => console.log("[signal]", s));

const pipeline = new Pipeline({
  contextCollector,
  behaviorModel,
  decisionEngine,
  interventionCalibrator,
  actionResolver,
}, bus);

// simulate multiple runs to test learning
const ITERATIONS = 8;
for (let i = 0; i < ITERATIONS; i++) {
  const result = pipeline.run({
    userId: "user-1" as UserId,
    sessionId: `session-${i + 1}` as SessionId,
  });

  const signal: "positive" | "negative" = Math.random() > 0.5 ? "positive" : "negative";
  const signalType: SignalType = signal === "positive" ? "click" : "dismiss";
  console.log(`[run ${i + 1}] action=${result.action} signal=${signal}`);
  tracker.track(signalType, signal, result.action);
}

// close the loop
const report = processSignals(tracker.flush());
const delta = adaptation.adapt(report);
pipeline.updateWeights(delta.policyWeights);

console.log("[weights updated]", delta.policyWeights);

// final run — decision engine now uses adapted weights
const finalResult = pipeline.run({
  userId: "user-1" as UserId,
  sessionId: `session-${ITERATIONS + 1}` as SessionId,
});

console.log("[final run result]", finalResult);