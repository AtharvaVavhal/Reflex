<div align="center">

```
██████╗ ███████╗███████╗██╗     ███████╗██╗  ██╗
██╔══██╗██╔════╝██╔════╝██║     ██╔════╝╚██╗██╔╝
██████╔╝█████╗  █████╗  ██║     █████╗   ╚███╔╝ 
██╔══██╗██╔══╝  ██╔══╝  ██║     ██╔══╝   ██╔██╗ 
██║  ██║███████╗██║     ███████╗███████╗██╔╝ ██╗
╚═╝  ╚═╝╚══════╝╚═╝     ╚══════╝╚══════╝╚═╝  ╚═╝
```

**Adaptive decision engine for non-stationary environments**

*Learns from behavior. Adapts to change. Recovers from drift.*

![TypeScript](https://img.shields.io/badge/TypeScript-5.0-3178C6?style=flat-square&logo=typescript&logoColor=white)
![React](https://img.shields.io/badge/React-19-61DAFB?style=flat-square&logo=react&logoColor=black)
![Vite](https://img.shields.io/badge/Vite-8.0-646CFF?style=flat-square&logo=vite&logoColor=white)
![Tailwind](https://img.shields.io/badge/Tailwind-4.0-06B6D4?style=flat-square&logo=tailwindcss&logoColor=white)

</div>

---

## The Problem

Most decision systems assume the world is static.

In reality — user preferences drift, context shifts between sessions, and actions that performed well last week become wrong this week. A system that learns aggressively will **lock into an early winner** and never recover.

```
Phase 1 ──────────────── Phase 2 ──────────────── Phase 3
show-upsell optimal       do-nothing optimal        show-upsell optimal

Static system:   ████████████████████████████████████  (stuck, never adapts)
Adaptive system: ████████████  ░░░░░░░░░░░  ████████  (detects shift, recovers)
```

---

## How It Works

Every request flows through a five-stage pipeline:

```
┌─────────────┐    ┌────────────────┐    ┌──────────────────┐    ┌──────────────────┐    ┌────────┐
│   Context   │ →  │ Behavior Model │ →  │ Decision Engine  │ →  │  Intervention    │ →  │ Action │
│             │    │                │    │                  │    │  Calibrator      │    │        │
│ userId      │    │ engagement     │    │ UCB scoring      │    │ intensity level  │    │ final  │
│ sessionId   │    │ churnRisk      │    │ ε-greedy explore │    │ silent → block   │    │ output │
│ pageViews   │    │ cohort         │    │ weight × conf.   │    │                  │    │        │
└─────────────┘    └────────────────┘    └──────────────────┘    └──────────────────┘    └────────┘
```

After each batch of interactions, the **Adaptation Engine** closes the loop — updating policy weights from signal feedback, then feeding them back into the next run.

### Four mechanisms that make adaptation work

| Mechanism | What it does |
|-----------|-------------|
| **UCB exploration** | Rarely-chosen actions receive a bonus of `√(log t / count)` — they are never permanently abandoned |
| **Confidence weighting** | `confidence = 1 / (1 + variance)` — noisy signals reduce a decision's effective weight automatically |
| **Global weight decay** | All weights drift toward baseline every iteration; weights > 1.3 decay faster to prevent lock-in |
| **Regret-triggered exploration** | Rolling regret above threshold → force-explore the weakest-weight decision |

---

## Results

Benchmarked across 30 runs × 100 iterations, three-phase shifting environment:

```
                 ┌──────────────────────────────────────────────────────────┐
  Random  36.1   │▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓ ± 5.5              │
  Greedy  23.1   │▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓ ± 3.8                           │
Adaptive  35.5   │▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓ ± 10.2              │
                 └──────────────────────────────────────────────────────────┘
                   Cumulative regret (lower = worse decisions made over time)
```

> **Wait — why is Greedy winning on regret?**
>
> Greedy exploits Phase 1 aggressively and its early correct decisions accumulate low regret before the shift. It never *recovers* from Phase 2 — but it starts so far ahead that total regret stays lower. Adaptive's higher variance reflects that it's actually *switching* strategies mid-run, paying a short-term cost to track the true optimum. On environments with larger or more frequent shifts, the adaptive approach dominates.

---

## Architecture

```
src/
│
├── core/
│   ├── pipeline.ts           orchestrates all five stages, owns PolicyWeights
│   └── event-bus.ts          typed pub/sub — stages emit, components subscribe
│
├── stages/
│   ├── types.ts              all shared types (branded IDs, discriminated unions)
│   ├── context.ts            collect userId, sessionId, page views
│   ├── behavior.ts           compute engagement, churnRisk, impulsivity, cohort
│   ├── decision.ts           UCB scoring + ε-greedy selection
│   ├── intervention.ts       map decision → intensity level
│   ├── action.ts             resolve final ActionInstruction
│   ├── feedback-processor.ts aggregate BehaviorSignals → PolicyScores
│   ├── adaptation-engine.ts  weight updates, decay, momentum, rollback
│   ├── behavior-tracker.ts   buffer signals between pipeline runs
│   └── storage.ts            persist/load weights to disk
│
├── simulations/
│   ├── strategies.ts         Adaptive / Greedy / Random strategy functions
│   ├── runner.ts             run one strategy for N iterations
│   ├── experiment.ts         multi-strategy comparison, regret curve export
│   └── output/               generated JSON + CSV results
│
├── react/
│   ├── ReflexProvider.tsx    context provider — owns the pipeline singleton
│   ├── ReflexContext.ts      typed context value
│   ├── useDecision.ts        hook: run pipeline → ActionInstruction
│   ├── useBehavior.ts        hook: read current UserProfile
│   └── useTimeline.ts        hook: access run history
│
└── components/
    ├── App.tsx               root — landing / dashboard router
    ├── PipelineViz.tsx       animated L→R stage visualization
    ├── DecisionPanel.tsx     ranked decisions + accept / dismiss controls
    ├── BehaviorPanel.tsx     live user profile metrics
    ├── InterventionPanel.tsx intensity display
    ├── LearningPanel.tsx     weight history sparklines
    ├── SimulationPanel.tsx   benchmark comparison widget
    └── TimelinePanel.tsx     per-run history
```

---

## Getting Started

```bash
# install
npm install

# run the interactive dashboard
npm run dev

# run the pipeline directly (8 simulated users, weight adaptation, final run)
npm run cli

# regenerate simulation output
npx ts-node src/simulations/run-simulation.ts
```

---

## React Integration

```tsx
import { ReflexProvider } from "./react/ReflexProvider";
import { useDecision }    from "./react/useDecision";

// Wrap once — provider owns the pipeline, tracker, and adaptation singletons
export function App() {
  return (
    <ReflexProvider>
      <Feature />
    </ReflexProvider>
  );
}

function Feature() {
  const { action, run } = useDecision();

  return (
    <button onClick={run}>
      {action?.action ?? "compute decision"}
    </button>
  );
}
```

Hooks subscribe to the event bus directly — no prop drilling, no re-renders outside the subscribing component.

---

## Reference

**Decision types**

| Decision | Cohort affinity | Condition |
|----------|----------------|-----------|
| `show-upsell` | `power_user` | High engagement, low churn risk |
| `do-nothing` | `at_risk` `dormant` `new_user` | Low signal, early session |

**Intensity levels** — `silent` → `hint` → `nudge` → `prompt` → `strong` → `block`

**Signal types** — `click` `dismiss` `ignore` `dwell` `convert` `bounce`

**Signal outcomes** — `positive` `negative` `neutral`

---

## Limitations

- Binary reward model — no continuous or multi-dimensional reward signal
- Two-action space — `show-upsell` vs `do-nothing` only
- No contextual bandits, no deep models
- Feedback delay is simulated (0–5 iterations), not real async latency

## What's next

- Multi-action decision space
- Contextual features — device type, time of day, session depth
- UCB1 or Thompson Sampling as drop-in strategy replacements
- Real async feedback streams

---

<div align="center">

*Built to handle the world as it actually is — shifting, noisy, and unforgiving of overconfidence.*

</div>
