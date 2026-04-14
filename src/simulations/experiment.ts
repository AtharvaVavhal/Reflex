import { writeFileSync } from "fs";
import { join } from "path";
import { AdaptationEngine } from "../stages/adaptation-engine";
import { Decision } from "../stages/types";
import { makeAdaptiveStrategy, greedyStrategy, randomStrategy, DecisionFn } from "./strategies";
import { ExperimentConfig, SimulationResult, runSimulation } from "./runner";
import { RNG, makeRNG, Stats, computeStats } from "./stats";

// =============================================================================
// Types
// =============================================================================

export interface StrategyResult {
  label:       string;
  stats:       Stats;
  regretByRun: number[];
  runs:        SimulationResult[];
}

export interface ExperimentSummary {
  config:   ExperimentConfig;
  runAt:    string;
  adaptive: StrategyResult;
  greedy:   StrategyResult;
  random:   StrategyResult;
}

type StrategyFactory = (rng: RNG) => { decisionFn: DecisionFn; adaptation?: AdaptationEngine };

// =============================================================================
// Per-strategy multi-run executor
// =============================================================================

function runStrategy(
  label:   string,
  factory: StrategyFactory,
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
  return { label, stats: computeStats(regretByRun), regretByRun, runs };
}

// =============================================================================
// Average regret curve across runs (for CSV/plotting)
// =============================================================================

function avgRegretCurve(result: StrategyResult, iterations: number): number[] {
  const totals = Array<number>(iterations).fill(0);
  for (const run of result.runs) {
    run.regretLog.forEach((e, i) => { totals[i] += e.cumulativeRegret; });
  }
  return totals.map(v => v / result.runs.length);
}

// =============================================================================
// Main experiment runner
// =============================================================================

export function runExperiment(
  config:  ExperimentConfig,
  outDir:  string,
  seed  = 0xDEADBEEF,
): ExperimentSummary {
  console.log(`\nExperiment: ${config.runs} runs × ${config.iterations} iterations`);
  console.log(`Seed: 0x${seed.toString(16).toUpperCase()}\n`);

  console.log("  [1/3] adaptive...");
  const adaptive = runStrategy(
    "adaptive",
    () => ({ decisionFn: makeAdaptiveStrategy(config.regretThreshold), adaptation: new AdaptationEngine() }),
    config,
    seed,
  );

  console.log("  [2/3] greedy...");
  const greedy = runStrategy(
    "greedy",
    () => ({ decisionFn: greedyStrategy }),
    config,
    seed + 0x10000,
  );

  console.log("  [3/3] random...");
  const random = runStrategy(
    "random",
    () => ({ decisionFn: randomStrategy }),
    config,
    seed + 0x20000,
  );

  const summary: ExperimentSummary = {
    config,
    runAt: new Date().toISOString(),
    adaptive,
    greedy,
    random,
  };

  // ── JSON export ─────────────────────────────────────────────────────────────
  writeFileSync(
    join(outDir, "experiment-summary.json"),
    JSON.stringify(
      {
        config:  summary.config,
        runAt:   summary.runAt,
        results: {
          adaptive: { stats: adaptive.stats, regretByRun: adaptive.regretByRun },
          greedy:   { stats: greedy.stats,   regretByRun: greedy.regretByRun },
          random:   { stats: random.stats,   regretByRun: random.regretByRun },
        },
      },
      null,
      2,
    ),
  );

  // ── Per-run weight trajectory (adaptive run 0 as representative) ─────────────
  writeFileSync(
    join(outDir, "weights.json"),
    JSON.stringify(adaptive.runs[0].weightLog, null, 2),
  );

  // ── Full per-iteration logs for all decisions (run 0 of each) ────────────────
  writeFileSync(
    join(outDir, "decisions.json"),
    JSON.stringify(
      {
        adaptive: adaptive.runs[0].decisionLog,
        greedy:   greedy.runs[0].decisionLog,
        random:   random.runs[0].decisionLog,
      },
      null,
      2,
    ),
  );

  // ── CSV: averaged regret curves across all runs ──────────────────────────────
  const adaptiveCurve = avgRegretCurve(adaptive, config.iterations);
  const greedyCurve   = avgRegretCurve(greedy,   config.iterations);
  const randomCurve   = avgRegretCurve(random,   config.iterations);

  const csv = [
    "iteration,adaptive_avg_regret,greedy_avg_regret,random_avg_regret",
    ...adaptiveCurve.map((v, i) =>
      `${i},${v.toFixed(3)},${greedyCurve[i].toFixed(3)},${randomCurve[i].toFixed(3)}`
    ),
  ].join("\n");

  writeFileSync(join(outDir, "regret-curves.csv"), csv);

  return summary;
}
