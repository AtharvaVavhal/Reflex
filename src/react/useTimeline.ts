import { useEffect, useRef, useState } from "react";
import { EventBus } from "../core/event-bus";
import { RawContext, UserProfile, DecisionResult, Intervention, ActionInstruction } from "../stages/types";

export type TimelineEntry =
  | { stage: "context";      payload: RawContext }
  | { stage: "behavior";     payload: UserProfile }
  | { stage: "decision";     payload: DecisionResult }
  | { stage: "intervention"; payload: Intervention }
  | { stage: "action";       payload: ActionInstruction };

export function useTimeline(bus: EventBus) {
  const [entries, setEntries] = useState<TimelineEntry[]>([]);
  const mounted = useRef(true);

  useEffect(() => {
    mounted.current = true;

    const push = (entry: TimelineEntry) => {
      if (mounted.current) setEntries(prev => [...prev, entry]);
    };

    bus.on("context:collected",       (p) => push({ stage: "context",      payload: p as RawContext }));
    bus.on("profile:computed",        (p) => push({ stage: "behavior",     payload: p as UserProfile }));
    bus.on("decision:made",           (p) => push({ stage: "decision",     payload: p as DecisionResult }));
    bus.on("intervention:calibrated", (p) => push({ stage: "intervention", payload: p as Intervention }));
    bus.on("action:resolved",         (p) => push({ stage: "action",       payload: p as ActionInstruction }));

    return () => { mounted.current = false; };
  }, [bus]);

  const reset = () => setEntries([]);

  return { entries, reset };
}