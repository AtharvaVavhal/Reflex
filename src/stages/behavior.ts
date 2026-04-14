import { RawContext, UserProfile, Cohort } from "./types";

function deriveCohort(engagement: number, churnRisk: number): Cohort {
  if (engagement >= 0.7)                          return "power_user";
  if (engagement <= 0.3 && churnRisk >= 0.6)     return "dormant";
  if (engagement < 0.6  && churnRisk >= 0.45)    return "at_risk";
  return "new_user";
}

export function behaviorModel(ctx: RawContext): UserProfile {
  const engagement  = Math.min(1, ctx.pageViews / 20);
  const churnRisk   = parseFloat((1 - engagement * 0.85).toFixed(3));
  const impulsivity = parseFloat((engagement * 0.6 + Math.random() * 0.2).toFixed(3));
  const cohort      = deriveCohort(engagement, churnRisk);

  return { engagement, churnRisk, impulsivity, cohort };
}