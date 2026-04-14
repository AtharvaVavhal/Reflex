import { DecisionResult, Intervention, IntensityLevel, UserProfile } from "./types";

const CLOSE_THRESHOLD = 0.2;

export function interventionCalibrator(
  profile: UserProfile,
  result: DecisionResult
): Intervention {
  const { best: decision, ranked } = result;

  if (decision === "do-nothing") {
    return { decision, intensity: "silent" };
  }

  const topScore    = ranked[0]?.score ?? 0;
  const secondScore = ranked[1]?.score ?? 0;
  const isClose     = (topScore - secondScore) < CLOSE_THRESHOLD;

  const intensity: IntensityLevel = isClose
    ? "hint"
    : profile.engagement > 0.85 ? "nudge"
    : profile.engagement > 0.7  ? "prompt"
    :                              "strong";

  return { decision, intensity };
}