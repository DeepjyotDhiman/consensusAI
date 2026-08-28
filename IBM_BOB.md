# Built with IBM BOB — Development & Architecture Blueprint

ConsensusAI was architected, structured, and developed from the ground up utilizing **IBM BOB** as the primary AI development and code-generation assistant. IBM BOB powered the entire engineering lifecycle: from initial monorepo scaffolding and database schema modeling to the multi-dimensional consensus scoring engine, real-time WebSocket protocol, and the comprehensive 71-test verification suite.

---

## 1. Project Scaffolding & Base Structure via IBM BOB

IBM BOB generated the complete clean-architecture monorepo structure, ensuring strict type safety, zero circular dependencies, and optimal developer ergonomics across workspace packages:

```
consensusAI/
├── packages/
│   ├── shared/   ← Shared TypeScript domain models & semantic skill taxonomy
│   ├── server/   ← Express + Socket.IO + SQLite backend & scoring engines
│   └── client/   ← React + Vite + Tailwind CSS + Zustand cyber-glass UI
├── pnpm-workspace.yaml
├── tsconfig.base.json
└── README.md
```

### Why IBM BOB Recommended This Base Structure:
- **`packages/shared` as Single Source of Truth**: All data contracts (`User`, `Group`, `Preference`, `Candidate`, `ConsensusOutput`, `SocketEvents`) are shared across frontend and backend with zero duplicate definitions.
- **Strict pnpm Monorepo Setup**: Fast symlinking and isolated dependency resolution across workspaces.
- **Zero-Config Database Layer**: Embedded `sql.js` (WASM SQLite) for 100% portable, cross-platform persistence with zero native build compile errors on Windows.

---

## 2. Core Modules Engineered with IBM BOB

### A. 5-Dimension Scoring Engine & Variance Penalty
IBM BOB formulated and implemented the multi-member preference matching mathematical model:
- **Dimension Weights**: Interests (30%), Skills (25%), Availability (20%), Budget (15%), Learning Goals (10%).
- **Variance Penalty Formula**: `GroupScore = mean(memberScores) - 0.5 × stddev(memberScores)`, penalizing choices that leave individual teammates deeply dissatisfied.

### B. Multi-Tier Conflict Detection
IBM BOB modeled 4 proactive team conflict detection rules:
1. **Skill Overlap**: Pairwise Jaccard similarity `< 0.20` flags mismatched technical capabilities.
2. **Budget Spread**: Maximum member budget `> 2.0×` the median flags financial friction.
3. **Interest Divergence**: Empty intersection across all member interests.
4. **Availability Gap**: Ratio between most and least available member `> 2.5×`.

### C. Unique Project Synthesizer (`UniqueProjectSynthesizer.ts`)
IBM BOB created the dynamic synthesis engine that designs bespoke project proposals:
- Generates project titles, domain archetypes, required tech stacks, milestones, risk matrices, and team role assignments tailored to the group's exact skill intersection.

### D. Advanced Semantic Skill Matcher (`skillMatcher.ts`)
IBM BOB structured an extensive multi-alias canonicalization taxonomy covering 400+ skill permutations (e.g., TS/JS, PyTorch/TensorFlow/ML, Docker/Kubernetes/DevOps, Figma/UI/UX, SQL/PostgreSQL, Solidity/Web3) and designed the 100% team skill coverage assurance algorithm.

### E. Real-Time Socket.IO Synchronization & Auto-Save
IBM BOB architected the reactive event loop:
- Single write path through Socket.IO (`preference:update`).
- Client-side 400ms debounced input with immediate server-side state broadcasts.
- Automatic consensus recalculation when all group members submit preferences (`hasSubmitted: true`).
- Leader permission enforcement for manual consensus regeneration.

---

## 3. IBM BOB Development Workflow & Prompts

During development, IBM BOB was utilized across specific engineering phases:

### Phase 1: Architecture & Data Schema
* **Prompt**: *"Design a strict TypeScript monorepo for a real-time student group consensus platform with shared contracts, in-memory/WASM SQLite persistence, and a pluggable LLM consensus engine interface."*
* **Delivered**: `packages/shared`, `schema.sql`, `db.ts`, `ConsensusEngine.ts` interface.

### Phase 2: Scoring & Conflict Algorithms
* **Prompt**: *"Implement a deterministic multi-dimensional group scoring engine that calculates member sub-scores, applies a standard deviation variance penalty to prevent outlier dissatisfaction, and analyzes team budget/skill/interest conflicts."*
* **Delivered**: `ScoringEngine.ts`, `ConflictAnalyzer.ts`, `ExplanationGenerator.ts`.

### Phase 3: Real-Time Protocol & Reactive State
* **Prompt**: *"Build a single-hook React session manager with Socket.IO that automatically re-syncs on reconnect, handles 400ms debounced preference auto-saving, and broadcasts live state updates to all room participants."*
* **Delivered**: `useGroupSession.ts`, `handlers.ts`, `groupStore.ts`.

### Phase 4: Full-Suite Testing & Quality Assurance
* **Prompt**: *"Write a comprehensive Vitest test suite covering unit tests for scoring, conflict detection, authentication, role allocation with 100% skill coverage, and a 20-step E2E journey audit."*
* **Delivered**: 71 automated tests across 10 test suites with 100% pass rate.

---

## 4. Verification & Audit Results

All modules scaffolded and generated with IBM BOB pass all automated quality gates:

```bash
# Typecheck across all workspace packages
pnpm typecheck  # Output: 3 of 3 packages passed (0 errors)

# Test suite execution
pnpm test       # Output: 71 passed (10 test files, 100% green)
```

| Test Suite | Tests | Description |
|---|---|---|
| `e2eJourney.test.ts` | 9 | Complete 20-step end-to-end user journey audit |
| `scoring.test.ts` | 14 | 5-dimension scoring engine & variance penalty |
| `consensus.test.ts` | 9 | MockConsensusEngine deterministic pipeline |
| `realtime.test.ts` | 8 | Socket.IO room events & leader permissions |
| `auth.test.ts` | 7 | scrypt password hashing & JWT token verification |
| `roleAllocation.test.ts` | 5 | Smart role allocator & 100% skill coverage logic |
| `explanation.test.ts` | 5 | Natural language trade-off explanation builder |
| `conflict.test.ts` | 5 | All 4 conflict detection rules |
| `preference.test.ts` | 5 | PreferenceService CRUD & JSON parsing |
| `uniqueProject.test.ts` | 4 | AI bespoke project synthesis & roadmap |
