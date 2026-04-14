/**
 * Browser-safe experiment runner.
 * Mirrors experiment.ts but removes all Node.js fs/path dependencies.
 * Calls resetDecisionEngine() after completion so the dashboard pipeline
 * is not affected by simulation module-level state.
 */

import { AdaptationEngine }  from "../stages/adaptation-engine";
import { resetDecisionEngine } from "../stages/decision";
import {
  makeAdaptiveStrategy, greedyStrategy, randomStrategy, DecisionFn,
} from "./strategies";
import { ExperimentConfig, SimulationResult, runSimulation } from "./runner";
import { RNG, makeRNG, Stats, computeStats }                 from "./stats";
import { DEFAULT_PHASES }                                     from "./environment";

export { DEFAULT_PHASES };
export type { ExperimentConfig, SimulationResult };

// ── Result types ──────────────────────────────────────────────────────────────

export interface StrategyResult {
  label:       string;
  stats:       Stats;
  regretByRun: number[];
  avgCurve:    number[];           // averaged cumulative regret per iteration
  runs:        SimulationResult[];
}

export interface BrowserSummary {
  config:   ExperimentConfig;
  runAt:    string;
  adaptive: StrategyResult;
  greedy:   StrategyResult;
  random:   StrategyResult;
}

// ── Default config (browser-appropriate scale) ────────────────────────────────

export const BROWSER_CONFIG: ExperimentConfig = {
  iterations:      100,
  runs:            20,
  regretThreshold: 0.30,
  maxDelay:        5,
  phases:          DEFAULT_PHASES,
};

// ── Internal helpers ──────────────────────────────────────────────────────────

type Factory = (rng: RNG) => { decisionFn: DecisionFn; adaptation?: AdaptationEngine };

function runStrategy(
  label:   string,
  factory: Factory,
  config:  ExperimentConfig,
  seed:    number,
): StrategyResult {
  const runs: SimulationResult[] = [];

  for (let r = 0; r < config.runs; r++) {
    const rng = makeRNG(seed + r);
    const { decisionFn, adaptation } = factory(rng);
    runs.push(runSimulation(label, decisionFn, config, rng, adaptation));
  }

  const regretByRun = runs.map(r => r.cumulativeRegret);

  // Average cumulative regret curve across all runs
  const totals = Array<number>(config.iterations).fill(0);
  for (const run of runs) {
    run.regretLog.forEach((e, i) => { totals[i] += e.cumulativeRegret; });
  }
  const avgCurve = totals.map(v => v / runs.length);

  return { label, stats: computeStats(regretByRun), regretByRun, avgCurve, runs };
}

// ── Public API ────────────────────────────────────────────────────────────────

export function runBrowserExperiment(
  config: ExperimentConfig = BROWSER_CONFIG,
  seed                     = 0xDEADBEEF,
): BrowserSummary {
  const adaptive = runStrategy(
    "adaptive",
    () => ({ decisionFn: makeAdaptiveStrategy(config.regretThreshold), adaptation: new AdaptationEngine() }),
    config, seed,
  );

  const greedy = runStrategy(
    "greedy",
    () => ({ decisionFn: greedyStrategy }),
    config, seed + 0x10000,
  );

  const random = runStrategy(
    "random",
    () => ({ decisionFn: randomStrategy }),
    config, seed + 0x20000,
  );

  // Restore clean module-level state so the live dashboard pipeline
  // is not affected by the simulation's iteration counter / decisionCounts.
  resetDecisionEngine();

  return { config, runAt: new Date().toISOString(), adaptive, greedy, random };
}
