import { BehaviorSignal, Decision, SignalOutcome, SignalType } from "./types";
import { EventBus } from "../core/event-bus";

type TrackOptions = {
  strength?: number;
  timeToAction?: number;
};

export class BehaviorTracker {
  private buffer: BehaviorSignal[] = [];
  private shownAt: number = Date.now();

  constructor(private bus: EventBus) {}

  markShown(): void {
    this.shownAt = Date.now();
  }

  track(
    type: SignalType,
    outcome: SignalOutcome,
    decision: Decision,
    options: TrackOptions = {}
  ): void {
    const signal: BehaviorSignal = {
      type,
      outcome,
      decision,
      timestamp: Date.now(),
      strength: options.strength ?? 1.0,
      timeToAction: options.timeToAction ?? Date.now() - this.shownAt,
    };
    this.buffer.push(signal);
    this.bus.emit("signal:tracked", signal);
  }

  flush(): BehaviorSignal[] {
    const signals = this.buffer;
    this.buffer = [];
    return signals;
  }

  peek(): readonly BehaviorSignal[] {
    return this.buffer;
  }
}