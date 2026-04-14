import { ActionInstruction, BehaviorSignal, FeedbackReport, RawContext, UserProfile, DecisionResult, Intervention, LearningSnapshot } from "../stages/types";

export type ReflexEvents = {
  "context:collected": RawContext;
  "profile:computed": UserProfile;
  "decision:made": DecisionResult;
  "intervention:calibrated": Intervention;
  "action:resolved": ActionInstruction;
  "signal:tracked": BehaviorSignal;
  "feedback:processed": FeedbackReport;
  "weights:updated": LearningSnapshot;
};

type EventKey = keyof ReflexEvents;
type Handler<K extends EventKey> = (payload: ReflexEvents[K]) => void;

export class EventBus {
  private listeners = new Map<EventKey, Handler<any>[]>();

  on<K extends EventKey>(event: K, handler: Handler<K>): void {
    const handlers = this.listeners.get(event) ?? [];
    this.listeners.set(event, [...handlers, handler]);
  }

  off<K extends EventKey>(event: K, handler: Handler<K>): void {
    const handlers = this.listeners.get(event) ?? [];
    this.listeners.set(event, handlers.filter(h => h !== handler));
  }

  emit<K extends EventKey>(event: K, payload: ReflexEvents[K]): void {
    this.listeners.get(event)?.forEach(h => h(payload));
  }
}