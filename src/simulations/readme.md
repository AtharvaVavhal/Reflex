# Adaptive Decision Engine for Non-Stationary Environments

## Overview

This project implements an adaptive decision system that continuously learns from user behavior and adjusts its policy under changing conditions.

Unlike static rule-based systems, this engine is designed to operate in **non-stationary environments**, where the optimal decision shifts over time.

---

## Problem

Most decision systems (recommendations, upsells, notifications) assume stable user behavior.

In reality:
- user preferences change
- context shifts
- previously optimal actions become suboptimal

A system that learns aggressively early can **lock into the wrong decision** and fail to recover.

---

## Failure Case (Initial System)

In a simulated environment with shifting optimal actions:

- Phase 1 → `show-upsell` optimal  
- Phase 2 → `do-nothing` optimal  
- Phase 3 → `show-upsell` optimal  

### Observed behavior:

- Policy switches: **0**
- System stuck on initial winner
- Cumulative regret: **27%**
- Weight convergence: saturated (no movement)

### Root cause:

- Over-exploitation of early signals  
- No mechanism to re-evaluate alternatives  
- Weight saturation → no recovery  

---

## Approach

The system was redesigned to balance learning speed with adaptability.

### Key mechanisms:

#### 1. Continuous Weight Adaptation
- Decisions maintain dynamic weights based on feedback signals
- Negative reinforcement reduces weights for poor outcomes

#### 2. Global Decay
- All weights decay over time
- Prevents permanent dominance of early winners

#### 3. Confidence-Based Scoring
- Confidence derived from variance of recent outcomes  
- Formula:
  confidence = 1 / (1 + variance)

- Final decision score:
  score = baseScore × weight × confidence

#### 4. Regret-Triggered Exploration
- Rolling regret monitored over recent iterations
- If regret exceeds threshold → system explores weaker decisions

#### 5. Delayed & Noisy Feedback Simulation
- Feedback signals are delayed and probabilistic
- Reflects real-world uncertainty

---

## Results

### Adaptive System

- Policy switches: **2**
- Adaptation time: **~9–15 iterations after shift**
- Exploration rate: **~10–12%**
- Cumulative regret: **~18–21%**

### Baselines

| System   | Behavior                  | Regret |
|----------|--------------------------|--------|
| Random   | No learning              | High   |
| Greedy   | Stuck on initial choice  | Medium |
| Adaptive | Adjusts to shifts        | Lowest |

---

## Key Insight

A system that only learns fast is not sufficient.

> **Learning without forgetting leads to failure in dynamic environments.**

Adaptability requires:
- controlled exploration
- decay of confidence
- continuous re-evaluation of alternatives

---

## Architecture

- `decision.ts` → scoring logic  
- `adaptation-engine.ts` → weight updates  
- `feedback-processor.ts` → signal aggregation  
- `run-simulation.ts` → environment + evaluation  

---

## Simulation Design

- Multi-phase environment with shifting optimal actions  
- Noisy outcomes (positive / neutral / negative)  
- Delayed feedback (0–5 iterations)  
- Regret tracking and policy monitoring  

---

## Visualization

The system logs:
- weight evolution over time  
- cumulative regret  
- decision distribution  

(See `/outputs` for generated data and plots)

---

## Limitations

- Simplified reward model (binary outcomes)  
- Small decision space (2 actions)  
- No contextual bandits or deep models  

---

## Future Work

- Expand to multi-action decision space  
- Integrate contextual features  
- Apply reinforcement learning algorithms (e.g. UCB, Thompson Sampling)  
- Real-world deployment simulation  

---

## Why this matters

This system reflects real-world challenges in:

- recommendation systems  
- growth/upsell optimization  
- ad ranking systems  
- user engagement strategies  

Handling non-stationarity is critical for building robust intelligent systems.