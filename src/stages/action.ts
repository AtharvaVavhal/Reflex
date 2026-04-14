import { Intervention, ActionInstruction } from "./types";

export function actionResolver(intervention: Intervention): ActionInstruction {
  return {
    action: intervention.decision,
    intensity: intervention.intensity,
  };
}