export type UserId    = string & { __brand: "UserId" };
export type SessionId = string & { __brand: "SessionId" };

export type ContextInput = {
  userId:    UserId;
  sessionId: SessionId;
};

export type RawContext = {
  userId:    UserId;
  sessionId: SessionId;
  pageViews: number;
};

export type Cohort = "power_user" | "at_risk" | "dormant" | "new_user";

export type UserProfile = {
  engagement:  number;
  churnRisk:   number;
  impulsivity: number;
  cohort:      Cohort;
};

export type Decision = "show-upsell" | "do-nothing";

export type IntensityLevel =
  | "silent" | "hint" | "nudge" | "prompt" | "strong" | "block";

export type Intervention = {
  decision:  Decision;
  intensity: IntensityLevel;
};

export type ActionInstruction = {
  action:    Decision;
  intensity: IntensityLevel;
};

export type SignalType    = "click" | "dismiss" | "ignore" | "dwell" | "convert" | "bounce";
export type SignalOutcome = "positive" | "negative" | "neutral";

export type BehaviorSignal = {
  type:         SignalType;
  outcome:      SignalOutcome;
  decision:     Decision;
  timestamp:    number;
  strength:     number;
  timeToAction: number;
  delayMs?:     number;
};

export type PolicyScore = {
  decision:    Decision;
  total:       number;
  positive:    number;
  performance: number;
  confidence:  number;
  successRate: number;
};

export type FeedbackReport = {
  scores:      PolicyScore[];
  processedAt: number;
};

export type PolicyWeights = Record<Decision, number>;

export type SystemDelta = {
  policyWeights: PolicyWeights;
  rollbackable:  boolean;
  previous:      PolicyWeights;
  successRate:   number;
};

export type DecisionResult = {
  best:   Decision;
  ranked: Array<{ action: Decision; score: number }>;
};

export type LearningSnapshot = {
  weights:     PolicyWeights;
  previous:    PolicyWeights;
  successRate: number;
  delta:       Partial<PolicyWeights>;
  updatedAt:   number;
};