# Humanoid Roadmap - Autonomous Evolution Roadmap

## Objective
To create a self-developing visualization project that continuously updates its own frontend logic and UI over time to reflect real-world progress between human labor and AI/robotics, based on daily news data.

## Mechanism
The `claude-agent-blueprint` acts as the engine for this evolution.
1. **Data Collection (cron-triggered):** `npm run collect-data` fetches recent news, forecasts, and models, storing them in `src/data/*.json`.
2. **Task Generation:** A script (`generate-daily-task.ts`) analyzes the newly fetched data, comparing the initial projections to actual observed outcomes, and writes a dynamic feature plan to `docs/backlog/features/FEAT-YYYYMMDD_daily_update.md`.
3. **Agent Orchestration:** The open-source `aider` CLI is invoked via GitHub Actions, using the completely free **GitHub Models API** (via the default `GITHUB_TOKEN`).
4. **Implementation & Refinement:** The Aider agent reads the daily feature plan, modifies React components (`App.tsx` or new UI widgets) to highlight new insights, and commits the changes.
5. **Continuous Deployment:** Once merged, Vercel/Netlify automatically builds and deploys the newly modified visualization.

## Phases
1. **Phase 1: Basic AI Task Injection** - The pipeline just collects data, generates a simple plan to add a new insight card to the UI, and commits it.
2. **Phase 2: UI Component Evolution** - The agent dynamically replaces older UI components with more sophisticated visualizations based on the complexity of new data.
3. **Phase 3: Deep Model Adjustments** - The agent not only tweaks the UI, but automatically refines the cost models to alter the timeline prediction.

## Setup
- `.github/workflows/daily-evolution.yml` manages the schedule.
- `docs/orchestrator_state.json` tracks agent queue.
- `.claude` holds the blueprint subagents.
