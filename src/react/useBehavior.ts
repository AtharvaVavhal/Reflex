import { useCallback } from "react";
import { useReflexContext } from "./ReflexContext";
import { Decision, SignalOutcome, SignalType } from "../stages/types";

type TrackOptions = {
  strength?: number;
};

type UseBehaviorResult = {
  clicked: (decision: Decision, options?: TrackOptions) => void;
  dismissed: (decision: Decision, options?: TrackOptions) => void;
  converted: (decision: Decision, options?: TrackOptions) => void;
  ignored: (decision: Decision, options?: TrackOptions) => void;
};

export function useBehavior(): UseBehaviorResult {
  const { tracker } = useReflexContext();

  const track = useCallback((
    type: SignalType,
    outcome: SignalOutcome,
    decision: Decision,
    options: TrackOptions = {}
  ) => {
    tracker.markShown();
    tracker.track(type, outcome, decision, { strength: options.strength ?? 1.0 });
  }, [tracker]);

  const clicked   = useCallback((d: Decision, o?: TrackOptions) => track("click",   "positive", d, o), [track]);
  const dismissed = useCallback((d: Decision, o?: TrackOptions) => track("dismiss",  "negative", d, o), [track]);
  const converted = useCallback((d: Decision, o?: TrackOptions) => track("convert",  "positive", d, o), [track]);
  const ignored   = useCallback((d: Decision, o?: TrackOptions) => track("ignore",   "neutral",  d, o), [track]);

  return { clicked, dismissed, converted, ignored };
}