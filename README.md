# ConsensusAI — AI-powered Campus Collaboration & Consensus Platform

> **Track**: Student AI  
> **Use Case**: AI for Campus Life / Hyperlocal Innovation  
> **Application**: AI-assisted student team formation, project selection, and collaborative decision-making.  
> **AI Architecture & Code Generation**: Built and structured with **IBM BOB**. See [IBM_BOB.md](IBM_BOB.md) for full development blueprint.

Students on campus frequently collaborate in teams but have different skills, interests, availability, budgets, and learning goals. ConsensusAI eliminates informal "loudest voice wins" decision-making by running a transparent, multi-dimensional scoring engine — evaluating 10 candidate projects against the group's actual preferences, detecting conflicts, allocating roles, generating a plain-English explanation, and streaming the result in real-time to every connected browser.


---

## Prerequisites

- **Node.js 20+**
- **pnpm 8+**

Install pnpm if needed:

```bash
npm install -g pnpm@8
```

---

## Quick Start

```bash
# 1. Install dependencies
pnpm install

# 2. Seed demo data (creates 5 users, 1 group, 3 preference profiles)
pnpm seed

# 3. Start both server and client
pnpm dev
```

Open **http://localhost:5173**

---

## Demo Walkthrough

### Setup (30 seconds)
1. Open **http://localhost:5173** in **3 browser tabs**
2. Tab 1: Go to `/join/HACK01` → select **Alice** → click Join
3. Tab 2: Go to `/join/HACK01` → select **Bob** → click Join
4. Tab 3: Go to `/join/HACK01` → select **Carol** → click Join

Alice, Bob, and Carol have seed preferences already loaded. The consensus panel shows immediately.

### Live Demo
5. In **Tab 1 (Alice)**: scroll to the Preference Form
6. Change **Availability** from 20 to 5 hours/week → click away (400ms debounce)
7. Watch: **all 3 tabs** update simultaneously — group score drops and conflicts re-evaluate
8. Change it back to 20 → watch score recover

### Adding a New Member Live
9. Open Tab 4: Go to `/join/HACK01` → select **David** → click Join
10. Fill in David's preferences in Tab 4
11. Watch: consensus recalculates with 4 members — all browsers update instantly

### Full Result Page
12. Click **"View Full Result →"** in any tab
13. See: winning project, **sub-score breakdown per member**, role assignments, conflict analysis, full explanation

---

## Architecture

```
User Browser ─── Socket.IO ──► server/socket/handlers.ts
                                     │
                               PreferenceService ─► SQLite (sql.js)
                                     │
                             MockConsensusEngine
                             ┌───────┴────────────────────────────────────────┐
                             │ 1. ConflictAnalyzer  (skill/budget/interest/avail)
                             │ 2. ScoringEngine     (5-dimension weighted score)
                             │ 3. Sort by group score (variance-penalised)
                             │ 4. Greedy role allocator (skill → role title map)
                             │ 5. ExplanationGenerator (natural language rationale)
                             │ 6. Persist result + broadcast via Socket.IO
                             └──────────────────────────────────────────────────
```

**Stack:**
- **Backend**: Node.js + Express + Socket.IO + SQLite (sql.js WASM)
- **Frontend**: React + Vite + Tailwind CSS + Zustand
- **Consensus Engine**: Deterministic 6-step pipeline — swappable with any LLM (one env var change)
- **Realtime**: Socket.IO rooms — all group members receive updates instantly
- **AI Architecture & Code Generation**: **IBM BOB** (monorepo scaffolding, scoring algorithms, fuzzy taxonomy, and 71-test E2E audit)

---

## Built with IBM BOB

ConsensusAI was architected and developed using **IBM BOB** as the primary AI engineering platform. The structured assistance of IBM BOB powered:
- **Workspace Architecture**: Scaffolding the multi-package pnpm monorepo (`packages/shared`, `packages/server`, `packages/client`) with strict TypeScript configuration and zero circular dependencies.
- **Algorithm Design**: Modeling the 5-dimension preference scoring engine and standard-deviation variance penalty formula (`mean - 0.5 × stddev`).
- **Conflict Analysis**: Formulating 4 team conflict rules (skill overlap, budget spread, interest divergence, availability gap).
- **Unique Project Synthesis**: Implementing `UniqueProjectSynthesizer.ts` for bespoke proposal generation.
- **Fuzzy Skill Taxonomy**: Building `skillMatcher.ts` with 400+ tech alias resolutions and 100% role allocation coverage assurance.
- **Test Generation & Audit**: Synthesizing 71 automated Vitest tests across 10 test suites (including a complete 20-step E2E journey test).

For the complete technical blueprint, see [`IBM_BOB.md`](IBM_BOB.md).


## Scoring Formula

Each member is scored against each of the 10 candidate projects on 5 dimensions (total: 100 pts):

| Dimension | Weight | Logic |
|-----------|--------|-------|
| Interest match | **30 pts** | member `interests[]` ∩ candidate `domainTags[]` |
| Skill match | **25 pts** | member `skills[]` ∩ candidate `requiredSkills[]` |
| Availability | **20 pts** | `min(hours / minHoursPerWeek, 1) × 20` |
| Budget | **15 pts** | `min(budget / costPerMember, 1) × 15` |
| Learning goals | **10 pts** | member `learningGoals[]` ∩ candidate `domainTags[]` |

**Group score** = `mean(memberScores) − 0.5 × stddev(memberScores)` — penalises high disagreement.

---

## Conflict Detection

Four rules run on every consensus calculation:

| Rule | Trigger |
|------|---------|
| **Skill overlap** | Worst-pair Jaccard similarity < 0.2 |
| **Budget spread** | max > 2 × median (severity: low/medium/high by ratio) |
| **Interest divergence** | Full-group interest intersection is empty |
| **Availability gap** | max/min availability ratio > 2.5× |

---

## Seeded Demo Data

| Member | Skills | Budget | Interests | Availability |
|--------|--------|--------|-----------|--------------|
| Alice | Machine Learning, Python, Data Analysis | $500 | AI, Social Impact | 20 hrs/wk |
| Bob | React, TypeScript, Python, UI Design | $200 | AI, Frontend | 15 hrs/wk |
| Carol | Network Security, Linux, Python, Cryptography | $150 | Cybersecurity, Privacy | 15 hrs/wk |
| David | *(empty — enter live)* | — | — | — |
| Esha | *(empty — enter live)* | — | — | — |

**Expected conflicts on startup:**
- Budget spread: Alice $500 vs median $200 (ratio 2.5×)
- Interest gap: No single interest shared by all 3 members
- Skill overlap: Alice (ML/Python) vs Bob (React/TS): Jaccard ≈ 0.17 < 0.2

---

## Swap to LLM Mode (Optional)

ConsensusAI supports LLM-powered consensus via a pluggable engine architecture:

```bash
# Requires Ollama running locally (https://ollama.com)
CONSENSUS_ENGINE=ollama
OLLAMA_BASE_URL=http://localhost:11434
OLLAMA_MODEL=llama3
```

The `OllamaConsensusEngine` sends a structured prompt and validates the JSON response. On any failure (network error, timeout, invalid schema) it **automatically falls back** to MockConsensusEngine. See [`packages/server/src/consensus/README.md`](packages/server/src/consensus/README.md) for the full architecture and how to add any LLM provider.

---

## Available Scripts

| Command | Description |
|---------|-------------|
| `pnpm install` | Install all workspace dependencies |
| `pnpm seed` | Seed/reset demo data (destructive: clears consensus_results first) |
| `pnpm reset` | Alias for `pnpm seed` — use before a live demo |
| `pnpm dev` | Start server (port 3001) + client (port 5173) concurrently |
| `pnpm build` | Build all packages |
| `pnpm typecheck` | Type-check all packages |
| `pnpm test` | Run all server unit tests (39 test cases) |

---

## Demo Reset Procedure

Before a live demo, run this to guarantee a clean predictable state:

```bash
# 1. Stop the server (Ctrl+C in the terminal running pnpm dev)
# 2. Reset database to clean seed state
pnpm reset
# 3. Restart
pnpm dev
```

**Expected state after reset:**
- 5 users (Alice/Bob/Carol/David/Esha)
- 1 group: HACK01 (join code)
- 3 preference rows: Alice, Bob, Carol
- 0 consensus results (fresh — will compute on first join)

---

## Project Structure

```
packages/
  shared/    — TypeScript types & cross-package utilities
    src/
      types/
        consensus.ts   — Candidate, Conflict, ConsensusInput/Output, MemberScoreBreakdown
        preference.ts  — Preference interface
        group.ts       — Group, GroupMember
        socket.ts      — Typed Socket.IO event maps
      utils/
        skillMatcher.ts — Multi-alias canonicalization, taxonomy match & role skill coverage

  server/    — Express + Socket.IO + SQLite backend
    src/
      app.ts                  — Express routes
      index.ts                — Server entry point + Socket.IO setup
      db/
        db.ts                 — sql.js (WASM SQLite) DatabaseWrapper
        schema.sql            — 5-table schema
        seed.ts               — Demo data seeder (destructive reset)
      consensus/
        ConsensusEngine.ts    — Interface (LLM swap seam)
        MockConsensusEngine.ts — Deterministic 6-step pipeline (default)
        OllamaConsensusEngine.ts — LLM engine with fallback
        README.md             — Engine architecture documentation
      services/
        ScoringEngine.ts      — 5-dimension scoring + variance penalty
        ConflictAnalyzer.ts   — 4 conflict detection rules
        ExplanationGenerator.ts — Natural language explanation builder
        UniqueProjectSynthesizer.ts — AI bespoke project synthesis & roadmap
        PreferenceService.ts  — Preference CRUD + JSON parsing
        authService.ts        — scrypt password hashing + custom JWT
      socket/
        handlers.ts           — Socket.IO event handlers (permission checks + auto-trigger)
      routes/
        auth.ts               — register / login / me
        groups.ts             — group CRUD + join
        preferences.ts        — GET preference by member
        consensus.ts          — GET latest consensus
        candidates.ts         — GET all 10 candidates
      data/
        candidates.ts         — 10 static project archetypes

  client/    — React + Vite + Tailwind frontend
    src/
      pages/
        Dashboard.tsx         — User's group list
        GroupDashboard.tsx    — Main workspace (PreferenceForm + ConsensusSummaryPanel)
        ConsensusResult.tsx   — Full report (scores + sub-score breakdown + roles + conflicts + explanation + export)
        Login.tsx / Register.tsx
      components/
        PreferenceForm.tsx    — Skills/interests/budget/availability/learning/priorities form
        ScoreBar.tsx          — Animated score bar
        ConflictPanel.tsx     — Conflict cards (severity-badged)
        ExplanationPanel.tsx  — Explanation sentence list
        RoleAllocationTable.tsx — Role → member assignment with skill coverage
        CandidateCatalogModal.tsx — 10 archetype project catalog explorer
        AiThinkingTerminal.tsx — Pipeline execution monitor
        LeaderboardModal.tsx  — Team scores + campus rankings
      hooks/
        useGroupSession.ts    — Socket.IO lifecycle + debounced preference:update
      store/
        groupStore.ts         — Zustand state (group/members/preferences/consensus)
      api/
        groupApi.ts           — REST client (JWT auth headers on all requests)
      context/
        AuthContext.tsx       — JWT storage + /api/v1/auth/* calls
```

---

## Tests

**71 test cases across 10 test files (100% passing):**

| File | Cases | What it tests |
|------|-------|---------------|
| `e2eJourney.test.ts` | 9 | Complete 20-step end-to-end user journey audit (create, join, live socket sync, consensus compute, role allocation, export) |
| `scoring.test.ts` | 14 | ScoringEngine 5-dimension scoring, sub-score weights, variance penalty, clamping, tie-breakers |
| `consensus.test.ts` | 9 | MockConsensusEngine deterministic pipeline, scoring integration, runner-up calculation |
| `realtime.test.ts` | 8 | Socket.IO room events, leader authorization check, preference auto-save, multi-client broadcasts |
| `auth.test.ts` | 7 | scrypt password hashing, JWT generation/verification, auth middleware |
| `roleAllocation.test.ts` | 5 | Smart role allocator, skill coverage calculation, 100% fallback skill coverage logic |
| `explanation.test.ts` | 5 | ExplanationGenerator natural language trade-off sentences, stddev spread bands, conflict rationale |
| `conflict.test.ts` | 5 | ConflictAnalyzer — all 4 conflict rules (skill overlap, budget spread, interest divergence, availability gap) |
| `preference.test.ts` | 5 | PreferenceService CRUD, JSON column parsing & persistence |
| `uniqueProject.test.ts` | 4 | UniqueProjectSynthesizer bespoke project synthesis, roadmap, and custom team role specs |

Run: `pnpm test`

---

## Key Advanced Features

1. **Unique Project Synthesizer (`UniqueProjectSynthesizer.ts`)**
   - Synthesizes bespoke project proposals tailored specifically to the unique intersection of member skills, interests, and constraints.
   - Generates project architectures, milestone roadmaps, risk matrices, and customized role allocations.

2. **Advanced Semantic Skill Matcher (`skillMatcher.ts`)**
   - Alias dictionary and fuzzy skill canonicalization (e.g. JS/TypeScript, PyTorch/TensorFlow/ML, Docker/Kubernetes/DevOps, Figma/UI/UX, SQL/PostgreSQL, Solidity/Web3).
   - Domain taxonomy mapping and role allocation skill coverage calculator ensuring 100% team skill coverage.

3. **Greedy Role Allocator with Coverage Optimization**
   - Matches candidate skill requirements against team member proficiencies.
   - Computes individual match percentages, key deliverables, and fallback allocations for balanced workload distribution.

4. **Leader Controls & Auto-Triggering**
   - Role-based permissions preventing unauthorized consensus regeneration.
   - Automatic calculation trigger when all group members submit preference profiles.

5. **Cyber-Glass UI & Interactive Modals**
   - `CandidateCatalogModal`: Live explorer for all 10 campus project archetypes.
   - `AiThinkingTerminal`: Real-time pipeline step monitor displaying conflict analysis, candidate ranking, and role assignments.
   - `LeaderboardModal`: Team alignment score comparisons.
   - Full Markdown report export for presentations and submissions.

---

## Environment Variables

Copy `.env.example` to `.env` before deploying:

```bash
PORT=3001
DB_PATH=packages/server/consensusai.sqlite
JWT_SECRET=<generate with: node -e "require('crypto').randomBytes(48).toString('hex')">
CONSENSUS_ENGINE=mock
```

