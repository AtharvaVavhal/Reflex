import { useRef, type ReactNode } from "react";
import { ReflexContext, type ReflexContextValue } from "./ReflexContext";
import { Pipeline } from "../core/pipeline";
import { EventBus } from "../core/event-bus";
import { BehaviorTracker } from "../stages/behavior-tracker";
import { AdaptationEngine } from "../stages/adaptation-engine";
import { contextCollector } from "../stages/context";
import { behaviorModel } from "../stages/behavior";
import { decisionEngine } from "../stages/decision";
import { interventionCalibrator } from "../stages/intervention";
import { actionResolver } from "../stages/action";

type Props = {
  children: ReactNode;
};

export function ReflexProvider({ children }: Props) {
  const value = useRef<ReflexContextValue | null>(null);

  if (!value.current) {
    const bus = new EventBus();
    const tracker = new BehaviorTracker(bus);
    const adaptation = new AdaptationEngine();

    const pipeline = new Pipeline({
      contextCollector,
      behaviorModel,
      decisionEngine,
      interventionCalibrator,
      actionResolver,
    }, bus);

    value.current = { pipeline, bus, tracker, adaptation };
  }

  return (
    <ReflexContext.Provider value={value.current}>
      {children}
    </ReflexContext.Provider>
  );
}