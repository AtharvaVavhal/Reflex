import { join } from "path";
import { DEFAULT_PHASES } from "./environment";
import { ExperimentConfig } from "./runner";
import { runExperiment } from "./experiment";

// =============================================================================
// Experiment configuration
// =============================================================================

const config: ExperimentConfig = {
  iterations:      100,
  runs:             30,
  regretThreshold:  0.30,
  maxDelay:          5,
  phases:          DEFAULT_PHASES,
};

const OUT = join(__dirname, "output");

// =============================================================================
// Run
// =============================================================================

const summary = runExperiment(config, OUT);

// =============================================================================
// Console report
// =============================================================================

console.log("\n=== RESULTS ===\n");

for (const key of ["adaptive", "greedy", "random"] as const) {
  const r = summary[key];
  console.log(`${key.padEnd(10)} regret — mean: ${r.stats.mean.toFixed(2)}  std: ${r.stats.std.toFixed(2)}  min: ${r.stats.min}  max: ${r.stats.max}`);
}

const adaptivePolicySwitches = summary.adaptive.runs
  .map(r => r.policySwitches)
  .reduce((a, b) => a + b, 0);

console.log(`\nadaptive   policy switches (total across ${config.runs} runs): ${adaptivePolicySwitches}`);
console.log(`           avg switches per run: ${(adaptivePolicySwitches / config.runs).toFixed(2)}`);

console.log("\nAdaptation speed (adaptive only, runs with flips):");
const flipRuns = summary.adaptive.runs.filter(r => r.phaseAdaptLog.length > 0);
console.log(`  runs with at least 1 policy flip: ${flipRuns.length} / ${config.runs}`);
if (flipRuns.length > 0) {
  const adaptTimes = flipRuns.flatMap(r => r.phaseAdaptLog.map(e => e.iterationsToAdapt));
  const avgAdapt = adaptTimes.reduce((a, b) => a + b, 0) / adaptTimes.length;
  console.log(`  avg iterations to adapt after shift: ${avgAdapt.toFixed(1)}`);
}

console.log(`\nOutput written to ${OUT}/`);
console.log("  experiment-summary.json — full stats + regretByRun for all strategies");
console.log("  regret-curves.csv       — averaged cumulative regret curves (plot-ready)");
console.log("  weights.json            — adaptive weight trajectory (run 0)");
console.log("  decisions.json          — decision + outcome log per strategy (run 0)");
