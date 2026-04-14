import { EventBus } from "./event-bus";
import { loadWeights, saveWeights } from "../stages/storage";
import {
  ContextInput, RawContext, UserProfile, DecisionResult,
  Intervention, ActionInstruction, PolicyWeights, LearningSnapshot,
} from "../stages/types";

export type PipelineOutput = ActionInstruction;

type Stages = {
  contextCollector:       (input: ContextInput)                            => RawContext;
  behaviorModel:          (ctx: RawContext)                                => UserProfile;
  decisionEngine:         (profile: UserProfile, weights: PolicyWeights)   => DecisionResult;
  interventionCalibrator: (profile: UserProfile, decision: DecisionResult) => Intervention;
  actionResolver:         (intervention: Intervention)                     => ActionInstruction;
};

export class Pipeline {
  private stages:   Stages;
  private bus:      EventBus;
  private weights:  PolicyWeights;
  private learning: LearningSnapshot;

  constructor(stages: Stages, bus: EventBus) {
    this.stages  = stages;
    this.bus     = bus;
    this.weights = loadWeights();
    this.learning = {
      weights:     { ...this.weights },
      previous:    { ...this.weights },
      successRate: 0,
      delta:       {},
      updatedAt:   0,
    };
  }

  run(input: ContextInput): PipelineOutput {
    const ctx          = this.stages.contextCollector(input);
    this.bus.emit("context:collected", ctx);

    const profile      = this.stages.behaviorModel(ctx);
    this.bus.emit("profile:computed", profile);

    const decision     = this.stages.decisionEngine(profile, this.weights);
    this.bus.emit("decision:made", decision);

    const intervention = this.stages.interventionCalibrator(profile, decision);
    this.bus.emit("intervention:calibrated", intervention);

    const action       = this.stages.actionResolver(intervention);
    this.bus.emit("action:resolved", action);

    return action;
  }

  updateWeights(next: PolicyWeights, successRate = 0): void {
    const previous = { ...this.weights };

    const delta: Partial<PolicyWeights> = {};
    for (const key of Object.keys(next) as Array<keyof PolicyWeights>) {
      const diff = next[key] - (previous[key] ?? 0);
      if (Math.abs(diff) > 0.0001) {
        delta[key] = parseFloat(diff.toFixed(4));
      }
    }

    this.weights  = { ...next };
    this.learning = { weights: { ...next }, previous, successRate, delta, updatedAt: Date.now() };

    saveWeights(this.weights);
    this.bus.emit("weights:updated", this.learning);
  }

  getWeights(): PolicyWeights {
    return { ...this.weights };
  }

  getLearning(): LearningSnapshot {
    return { ...this.learning };
  }
}