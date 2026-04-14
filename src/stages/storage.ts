import { PolicyWeights, Decision } from "./types";

const STORAGE_KEY = "reflex:policy_weights";

const DEFAULT_WEIGHTS: PolicyWeights = {
  "show-upsell": 0.6,
  "do-nothing":  0.4,
};

export function loadWeights(): PolicyWeights {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return { ...DEFAULT_WEIGHTS };
    const parsed = JSON.parse(raw) as Partial<PolicyWeights>;
    return {
      "show-upsell": parsed["show-upsell"] ?? DEFAULT_WEIGHTS["show-upsell"],
      "do-nothing":  parsed["do-nothing"]  ?? DEFAULT_WEIGHTS["do-nothing"],
    } satisfies PolicyWeights;
  } catch {
    return { ...DEFAULT_WEIGHTS };
  }
}

export function saveWeights(weights: PolicyWeights): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(weights));
  } catch {
    // storage unavailable — silent fail
  }
}

export function clearWeights(): void {
  try {
    localStorage.removeItem(STORAGE_KEY);
  } catch {
    // noop
  }
}

export { DEFAULT_WEIGHTS };