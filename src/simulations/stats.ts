// =============================================================================
// Seeded PRNG + statistical utilities
// =============================================================================

/** Mulberry32 — fast, high-quality 32-bit seeded PRNG. */
export type RNG = () => number;

export function makeRNG(seed: number): RNG {
  let s = seed >>> 0;
  return (): number => {
    s = (s + 0x6D2B79F5) >>> 0;
    let t = Math.imul(s ^ (s >>> 15), 1 | s);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 0x100000000;
  };
}

export interface Stats {
  mean: number;
  std:  number;
  min:  number;
  max:  number;
}

export function mean(arr: number[]): number {
  return arr.length === 0 ? 0 : arr.reduce((s, v) => s + v, 0) / arr.length;
}

export function std(arr: number[]): number {
  if (arr.length < 2) return 0;
  const m = mean(arr);
  return Math.sqrt(arr.reduce((s, v) => s + (v - m) ** 2, 0) / arr.length);
}

export function computeStats(values: number[]): Stats {
  return {
    mean: round(mean(values)),
    std:  round(std(values)),
    min:  Math.min(...values),
    max:  Math.max(...values),
  };
}

export function computeVariance(arr: number[]): number {
  if (arr.length < 2) return 1; // no data → maximum uncertainty
  const m = mean(arr);
  return arr.reduce((s, v) => s + (v - m) ** 2, 0) / arr.length;
}

export function pushCapped<T>(arr: T[], value: T, cap: number): void {
  arr.push(value);
  if (arr.length > cap) arr.shift();
}

function round(n: number, dp = 4): number {
  return parseFloat(n.toFixed(dp));
}
