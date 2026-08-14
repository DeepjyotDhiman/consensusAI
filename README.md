# ConsensusAI

AI-powered group consensus for hackathon teams. Multiple students enter their preferences, the system detects conflicts, scores candidate projects, and generates a transparent consensus recommendation — live across all connected browsers.

## Prerequisites

- Node.js 20+
- pnpm 8+

Install pnpm if needed:

```bash
npm install -g pnpm@8
```

## Quick Start

```bash
# 1. Install dependencies
pnpm install

# 2. Seed demo data
pnpm seed

# 3. Start both server and client
pnpm dev
```

Open http://localhost:5173

## Demo Walkthrough

### Setup (30 seconds)
1. Open http://localhost:5173 in **3 browser tabs**
2. Tab 1: Go to `/join/HACK01` → select **Alice** → click Join
3. Tab 2: Go to `/join/HACK01` → select **Bob** → click Join
4. Tab 3: Go to `/join/HACK01` → select **Carol** → click Join

Alice, Bob, and Carol already have preferences from the seed data. The consensus panel shows immediately — **EduBot** wins with a ~67% group score.

### Live Demo
5. In Tab 1 (Alice): scroll to the Preference Form
6. Change **Availability** from 20 to 5 hours/week → click away
7. Watch: **all 3 tabs** update simultaneously — the group score drops
8. Change it back to 20 → watch score recover

### Adding a New Member
9. Open Tab 4: Go to `/join/HACK01` → select **David** → click Join
10. Fill in David's preferences in Tab 4
11. Watch: consensus recalculates with 4 members

### Full Result
12. Click **"View Full Result →"** in any tab
13. See: winning project, role assignments, conflict analysis, full explanation

## Architecture

```
preferences → conflict detection → candidate scoring → consensus → real-time broadcast
```

- **Backend**: Node.js + Express + Socket.IO + SQLite (better-sqlite3)
- **Frontend**: React + Vite + Tailwind CSS + Zustand
- **Consensus Engine**: Deterministic mock — swappable with Ollama/LLM (one file change)
- **Realtime**: Socket.IO rooms — all browsers in a group receive updates instantly

## Swap to Ollama (Post-MVP)

After running the MVP, add AI by:
1. Install Ollama: https://ollama.com
2. `ollama pull llama3`
3. Create `packages/server/src/consensus/OllamaConsensusEngine.ts`
4. Implement `generateConsensus(input: ConsensusInput): Promise<ConsensusOutput>`
5. In `packages/server/src/socket/handlers.ts`, swap the import
6. See `consensusai-plan.md` §"Sub-Task 4" for the full LLM extension contract

## Project Structure

```
packages/
  shared/    — TypeScript types shared between client and server
  server/    — Express + Socket.IO + SQLite backend
  client/    — React + Vite + Tailwind frontend
```

## Available Scripts

| Command | Description |
|---|---|
| `pnpm install` | Install all workspace dependencies |
| `pnpm seed` | Seed demo users, group HACK01, and preferences |
| `pnpm dev` | Start server (port 3001) + client (port 5173) concurrently |
| `pnpm build` | Build all packages |
| `pnpm typecheck` | Type-check all packages |
| `pnpm test` | Run server unit tests |

## Seeded Demo Data

| Member | Skills | Budget | Interests |
|---|---|---|---|
| Alice | Machine Learning, Python, Data Analysis | $500 | AI, Social Impact |
| Bob | React, TypeScript, Python, UI Design | $200 | AI, Frontend |
| Carol | Network Security, Linux, Python | $150 | AI, Cybersecurity |
| David | *(empty — enter live)* | — | — |
| Esha | *(empty — enter live)* | — | — |

The seed produces **2 conflicts** on startup: a skill-overlap conflict (Alice ↔ Bob) and a budget spread conflict ($150–$500). The consensus recommends **EduBot** (AI tutoring platform) with a 67% group score.
