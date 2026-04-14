import { createContext, useContext } from "react";
import { Pipeline } from "../core/pipeline";
import { EventBus } from "../core/event-bus";
import { BehaviorTracker } from "../stages/behavior-tracker";
import { AdaptationEngine } from "../stages/adaptation-engine";

export type ReflexContextValue = {
  pipeline: Pipeline;
  bus: EventBus;
  tracker: BehaviorTracker;
  adaptation: AdaptationEngine;
};

export const ReflexContext = createContext<ReflexContextValue | null>(null);

export function useReflexContext(): ReflexContextValue {
  const ctx = useContext(ReflexContext);
  if (!ctx) throw new Error("useReflexContext must be used inside <ReflexProvider>");
  return ctx;
}