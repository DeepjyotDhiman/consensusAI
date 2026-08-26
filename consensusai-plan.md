# ConsensusAI — Implementation Plan

> **Revision 4** — Complete MVP with Unique Project Synthesis, Advanced Semantic Skill Matcher & 100% Passing 71-Test E2E Suite.
> **Positioning**: AI-powered Campus Collaboration & Consensus Platform.
> **AI Architecture & Code Generation**: Built and structured with **IBM BOB**. See [IBM_BOB.md](IBM_BOB.md).
> **Hackathon Alignment**:
> - **Track**: Student AI
> - **Use Case**: AI for Campus Life / Hyperlocal Innovation
> - **Application**: AI-assisted student team formation, project selection, and collaborative decision-making.
> Key decisions: pnpm monorepo · auto-blur/change triggers recalculation · result as dashboard summary panel + full detail page · single write path through Socket.IO · Campus Decision Candidates architecture · `useGroupSession` single hook · consensus score penalises outliers · `OllamaConsensusEngine` with automatic fallback seam to `MockConsensusEngine` · custom member profile creation · Candidate Archetype Catalog modal · Unique Project Synthesizer for bespoke projects · Advanced Semantic Skill Matcher with taxonomy aliases & 100% role coverage · Leader authorization & all-submitted auto-trigger · Cyber-glass design system & Markdown report export.

---

## Top-Level Overview

Build a fully local, free-to-run platform called **ConsensusAI** — an **AI-powered Campus Collaboration & Consensus Platform**.

ConsensusAI's base architecture, monorepo scaffolding, mathematical consensus scoring formula, real-time Socket.IO synchronization, and 71-test validation suite were engineered and generated with **IBM BOB**.

Students on campus frequently collaborate in teams but have different skills, interests, availability, budgets, and learning goals. ConsensusAI helps them reach an AI-assisted, transparent group decision instead of relying on informal discussion. While team project selection serves as the primary campus-life collaboration use case, the underlying architecture evaluates **Campus Decision Candidates** against multi-member preferences, detects conflicts, and delivers transparent consensus recommendations with trade-off explanations in real time across all connected browsers.

**Scope:** pnpm monorepo. Three packages: `packages/client` (React + Vite + Tailwind), `packages/server` (Node + Express + Socket.IO + SQLite), `packages/shared` (TypeScript types & contracts). A `ConsensusEngine` interface is the central seam — implemented with `OllamaConsensusEngine` (queries local Ollama `llama3` at `http://localhost:11434/api/generate`) with automatic, graceful fallback to `MockConsensusEngine` if Ollama is not active.

**Non-goals for MVP:** Production auth, external paid APIs, unrelated campus life utilities (no roommate matcher, no event discovery, no cafeteria recommender, no campus navigation — focusing purely on collaborative team decision-making).

**Architecture decisions locked:**
- AI Engineering & Scaffolding Platform: **IBM BOB** (for codebase generation, service design, algorithms, and test synthesis)
- pnpm workspaces (better symlink/hoisting on Windows; signals code quality to judges)
- Preference form auto-saves on field **blur/change** → triggers consensus recalculation server-side
- Consensus result shown as **summary panel** embedded in `/group/:id` dashboard AND as **full detail page** at `/group/:id/result`
- All live mutations go through **Socket.IO only** — no dual REST/socket write path
- Campus Decision Candidates stored as a **TypeScript constant file** + served via REST endpoint `GET /api/v1/candidates`
- Custom member profile registration via `POST /api/v1/users`
- Candidate Catalog Explorer modal (`CandidateCatalogModal.tsx`)
- Unique Project Synthesizer (`UniqueProjectSynthesizer.ts`) dynamically generates bespoke project recommendations with milestones, risks, and tailored role allocations
- Advanced Semantic Skill Matcher (`skillMatcher.ts`) canonicalizes tech aliases and optimizes role skill coverage
- `useGroupSession` **single hook** owns socket connection, room join, and live store state
- Consensus score = `mean(memberScores) − 0.5 × stddev(memberScores)` (penalises outlier dissatisfaction)
- Conflicts embedded in `consensus:updated` payload — **no separate** `group:conflict_detected` event
- Exportable Markdown Consensus Report for hackathon judge presentations

---

## Folder Structure

```
consensusAI/
├── packages/
│   ├── shared/
│   │   ├── src/
│   │   │   ├── types/
│   │   │   │   ├── group.ts
│   │   │   │   ├── user.ts
│   │   │   │   ├── preference.ts
│   │   │   │   ├── consensus.ts        ← Candidate & Synthesis types live here
│   │   │   │   ├── socket.ts           ← Typed Socket.IO event payloads
│   │   │   │   └── index.ts
│   │   │   ├── utils/
│   │   │   │   └── skillMatcher.ts     ← Semantic alias mapping & role coverage
│   │   │   └── index.ts
│   │   ├── tsconfig.json
│   │   └── package.json
│   │
│   ├── server/
│   │   ├── src/
│   │   │   ├── data/
│   │   │   │   └── candidates.ts       ← 10 hackathon archetypes as TS constant
│   │   │   ├── db/
│   │   │   │   ├── schema.sql
│   │   │   │   ├── seed.ts
│   │   │   │   └── db.ts
│   │   │   ├── services/
│   │   │   │   ├── PreferenceService.ts
│   │   │   │   ├── ConflictAnalyzer.ts
│   │   │   │   ├── ScoringEngine.ts
│   │   │   │   ├── ExplanationGenerator.ts
│   │   │   │   ├── UniqueProjectSynthesizer.ts
│   │   │   │   └── authService.ts
│   │   │   ├── consensus/
│   │   │   │   ├── ConsensusEngine.ts          ← interface
│   │   │   │   ├── MockConsensusEngine.ts      ← deterministic algorithm
│   │   │   │   ├── OllamaConsensusEngine.ts    ← LLM engine with auto fallback
│   │   │   │   └── README.md
│   │   │   ├── routes/
│   │   │   │   ├── auth.ts
│   │   │   │   ├── groups.ts
│   │   │   │   ├── preferences.ts              ← GET only; writes via socket
│   │   │   │   ├── consensus.ts                ← GET latest only
│   │   │   │   ├── candidates.ts               ← GET candidates catalog
│   │   │   │   └── users.ts                    ← GET/POST custom member profiles
│   │   │   ├── middleware/
│   │   │   │   ├── auth.ts
│   │   │   │   ├── errorHandler.ts
│   │   │   │   └── validate.ts
│   │   │   ├── socket/
│   │   │   │   └── handlers.ts
│   │   │   └── index.ts
│   │   ├── tests/
│   │   │   ├── auth.test.ts
│   │   │   ├── consensus.test.ts
│   │   │   ├── conflict.test.ts
│   │   │   ├── e2eJourney.test.ts
│   │   │   ├── explanation.test.ts
│   │   │   ├── preference.test.ts
│   │   │   ├── realtime.test.ts
│   │   │   ├── roleAllocation.test.ts
│   │   │   ├── scoring.test.ts
│   │   │   └── uniqueProject.test.ts
│   │   ├── tsconfig.json
│   │   └── package.json
│   │
│   └── client/
│       ├── src/
│       │   ├── api/
│       │   │   └── groupApi.ts                 ← REST API client
│       │   ├── components/
│       │   │   ├── MemberCard.tsx
│       │   │   ├── PreferenceForm.tsx           ← tag chips & range sliders, auto-save
│       │   │   ├── ConflictPanel.tsx
│       │   │   ├── ScoreBar.tsx
│       │   │   ├── RoleAllocationTable.tsx
│       │   │   ├── ExplanationPanel.tsx
│       │   │   ├── ConsensusSummaryPanel.tsx   ← embedded in dashboard
│       │   │   ├── CandidateCatalogModal.tsx   ← candidate archetypes modal
│       │   │   ├── AiThinkingTerminal.tsx      ← real-time pipeline execution display
│       │   │   ├── LeaderboardModal.tsx        ← team rankings modal
│       │   │   └── RealtimeBadge.tsx
│       │   ├── pages/
│       │   │   ├── Landing.tsx                  ← cyber-glass hero & project preview
│       │   │   ├── CreateGroup.tsx
│       │   │   ├── JoinGroup.tsx                ← preset & custom member registration
│       │   │   ├── GroupDashboard.tsx           ← live multi-user consensus room
│       │   │   └── ConsensusResult.tsx          ← full report & Markdown exporter
│       │   ├── hooks/
│       │   │   └── useGroupSession.ts           ← single hook owns all state + socket
│       │   ├── store/
│       │   │   └── groupStore.ts
│       │   ├── context/
│       │   │   └── AuthContext.tsx
│       │   ├── App.tsx
│       │   └── main.tsx
│       ├── tsconfig.json
│       ├── vite.config.ts
│       ├── tailwind.config.ts
│       └── package.json
│
├── pnpm-workspace.yaml
├── package.json
└── tsconfig.base.json
```

---

## Database Schema

**Five tables. No `candidates` table** — candidates are a static TypeScript constant in `server/src/data/candidates.ts`.

### `users`
| column | type | notes |
|---|---|---|
| id | TEXT PK | uuid |
| display_name | TEXT | Alice, Bob … |
| avatar_color | TEXT | hex for UI |
| created_at | INTEGER | unix ms |

### `groups`
| column | type | notes |
|---|---|---|
| id | TEXT PK | uuid |
| join_code | TEXT UNIQUE | 6-char uppercase |
| name | TEXT | |
| created_at | INTEGER | unix ms |

### `group_members`
| column | type | notes |
|---|---|---|
| id | TEXT PK | uuid |
| group_id | TEXT FK → groups | |
| user_id | TEXT FK → users | |
| joined_at | INTEGER | unix ms |

### `preferences`
| column | type | notes |
|---|---|---|
| id | TEXT PK | uuid |
| group_member_id | TEXT FK → group_members | UNIQUE — one row per member |
| skills | TEXT | JSON `string[]` e.g. `["AI","Frontend"]` |
| availability_hours | INTEGER | hrs/week |
| budget | INTEGER | USD |
| interests | TEXT | JSON `string[]` |
| learning_goals | TEXT | JSON `string[]` |
| priorities | TEXT | JSON `string[]` ordered by weight |
| notes | TEXT | free-text; LLM extension point |
| updated_at | INTEGER | unix ms |

### `consensus_results`
| column | type | notes |
|---|---|---|
| id | TEXT PK | uuid |
| group_id | TEXT FK → groups | |
| candidate_id | TEXT | matches `id` in `candidates.ts` constant |
| member_scores | TEXT | JSON `Record<userId, number>` |
| group_score | INTEGER | 0–100, outlier-penalised |
| role_allocation | TEXT | JSON `Record<userId, role>` |
| conflicts | TEXT | JSON `Conflict[]` |
| explanation | TEXT | JSON `string[]` |
| generated_at | INTEGER | unix ms |

---

## REST API Design

All routes prefixed `/api/v1`. **REST is read-only for live session use.** Group creation and joining are the only writes via REST (they are not live preference mutations). All preference saves and consensus generation happen via Socket.IO.

### Groups
| method | path | description |
|---|---|---|
| POST | /groups | create group → returns `{ group, joinCode }` |
| GET | /groups/:id | get group with members |
| POST | /groups/join | join by code → returns `{ group, member, user }` |

### Preferences
| method | path | description |
|---|---|---|
| GET | /preferences/:groupMemberId | read current preferences (page load) |

### Consensus
| method | path | description |
|---|---|---|
| GET | /consensus/:groupId/latest | read latest result (page load / shareable link) |

All endpoints return `{ data, error }` envelope. Validation via `zod`. No `PUT /preferences` endpoint exists — the frontend never calls it.

---

## Socket.IO Event Design

### Client → Server
| event | payload | description |
|---|---|---|
| `group:join` | `{ groupId, userId }` | subscribe to group room; server replies with full snapshot |
| `preference:update` | `{ groupMemberId, preferences }` | fired on form field blur; server saves + recalculates |

### Server → Client (broadcast to entire room including sender)
| event | payload | description |
|---|---|---|
| `group:state` | `{ members, preferences, latestConsensus }` | full snapshot on join or reconnect |
| `preference:updated` | `{ groupMemberId, preferences }` | one member's prefs changed |
| `consensus:updated` | `{ result: ConsensusOutput }` | new result including conflicts and explanation |
| `error` | `{ message }` | server-side processing error |

**No `group:conflict_detected` event.** Conflicts are always included inside `consensus:updated.result.conflicts`.

**Reconnect behaviour:** on socket reconnect, `useGroupSession` re-emits `group:join` → server sends fresh `group:state` snapshot → UI re-syncs with zero manual reconciliation.

---

## Consensus Algorithm Design

### Interface (`ConsensusEngine.ts`)

```ts
// This interface is the LLM swap seam.
// Do NOT add implementation details (candidate lists, conflict structs)
// to either side of it. An LLM engine replaces this entire file.

interface ConsensusInput {
  members: Array<{
    userId: string;
    displayName: string;
    preferences: Preference;
  }>;
}

interface ConsensusOutput {
  recommendation: string;                  // chosen project title
  candidateId: string;                     // id from candidates.ts constant
  roleAllocation: Record<string, string>;  // userId → role label
  memberScores: Record<string, number>;    // 0–100 per member
  groupScore: number;                      // outlier-penalised aggregate 0–100
  conflicts: Conflict[];                   // detected conflicts
  explanation: string[];                   // human-readable trade-off sentences
  runnerUp: string;                        // title of second-place candidate
}

interface ConsensusEngine {
  generateConsensus(input: ConsensusInput): Promise<ConsensusOutput>;
}
```

The mock engine calls `ConflictAnalyzer`, `ScoringEngine`, role-allocation, and `ExplanationGenerator` **internally**. An LLM engine replaces the entire implementation file and calls the LLM instead. The interface signature never changes.

### Mock Pipeline (`MockConsensusEngine`)

**Step 1 — Conflict Detection**

Calls `ConflictAnalyzer(members)`:
- Any member-pair with skill overlap < 20% → skill conflict
- Budget range > 2× median across group → budget conflict
- Zero common interests across entire group → interest conflict

Returns `Conflict[]` with `{ type, affectedUserIds, severity: "low"|"medium"|"high", description }`.

**Step 2 — Candidate Scoring**

For each candidate in `candidates.ts` (10 archetypes), for each member with preferences:

| dimension | weight | rule |
|---|---|---|
| Interest match | 30 pts | % of member interests overlapping candidate domain tags |
| Skill match | 25 pts | % of candidate requiredSkills member lists |
| Availability | 20 pts | linear 0 hrs → 0 pts, ≥ 20 hrs → 20 pts |
| Budget | 15 pts | member budget ≥ candidate costPerMember → full pts; prorated below |
| Learning goal match | 10 pts | % of member learning_goals overlapping candidate domain tags |

```
memberScore(candidate, member) = sum of sub-scores   [0–100]
averageSatisfaction             = mean(memberScores)
groupScore                      = averageSatisfaction − 0.5 × stddev(memberScores)
groupScore                      = clamp(groupScore, 0, 100)
```

The candidate with the highest `groupScore` wins. Runner-up is the second-highest.

If fewer than 2 members have preferences, recalculation is skipped and no `consensus:updated` is emitted.

**Step 3 — Role Allocation**

For each `requiredSkill` in the winning candidate, greedily assign the highest-scoring available member for that skill. Members already assigned are skipped. Unmatched roles are flagged in the explanation.

**Step 4 — Explanation Generation**

`ExplanationGenerator` produces:
1. Opening: why winner beat runner-up (score delta, key differentiator)
2. One sentence per member score < 70: what trade-off they accept and why
3. One sentence per conflict: how the recommendation addresses or acknowledges it
4. Closing: overall consensus quality based on stddev (high/medium/low spread)

Minimum 3 sentences always emitted.

---

## Component Architecture

```
GroupDashboard  (/group/:id)
├── RealtimeBadge                  green pulse | amber spinner | red dot
├── MemberList
│   └── MemberCard × N             avatar, name, preference chips, live indicator
├── PreferenceForm                 current user's fields; each field saves on onBlur
├── ConflictPanel                  renders from consensusResult.conflicts; empty state if none
└── ConsensusSummaryPanel          always visible; updates live
    ├── GroupScoreRing             big number: groupScore %
    ├── MemberScoreList            ScoreBar per member (animated width)
    └── QuickExplanation           first 2 sentences + "View full result →" link

ConsensusResult  (/group/:id/result)
├── WinnerCard                     project title, description, domain badge, runner-up
├── GroupScoreRing
├── MemberScoreList                full ScoreBar with sub-score tooltip on hover
├── RoleAllocationTable            member → assigned role
├── ConflictPanel                  full conflict list with severity badges
└── ExplanationPanel               all explanation sentences
```

**Single hook used by both pages:**

```
useGroupSession(groupId, userId)
  returns:
    group, members, preferencesMap, consensusResult, connectionStatus
    updatePreference(groupMemberId, fields)   ← only write path from UI
```

`updatePreference` emits `preference:update` over the socket. The hook re-subscribes all listeners on reconnect automatically.

---

## Data Flow (blur → broadcast)

```
User edits a field → clicks away (blur)
  → PreferenceForm.onBlur
    → useGroupSession.updatePreference(groupMemberId, updatedFields)
      → socket.emit("preference:update", { groupMemberId, preferences })

Server receives preference:update
  → PreferenceService.upsert(groupMemberId, preferences)       save to SQLite
  → count members with preferences; if < 2: skip engine
  → MockConsensusEngine.generateConsensus(allMembersWithPrefs) run pipeline
  → persist consensus_result to SQLite
  → io.to(groupRoom).emit("preference:updated", { groupMemberId, preferences })
  → io.to(groupRoom).emit("consensus:updated", { result })

All connected browsers receive both events
  → useGroupSession updates groupStore
    → ConsensusSummaryPanel re-renders with new scores + animated bars
    → ConflictPanel re-renders
    → MemberCard for affected member shows updated preference chips
```

---

## Development Phases

| Phase | Name | Deliverable |
|---|---|---|
| 1 | Monorepo Scaffolding & Shared Types | pnpm workspace, tsconfigs, all shared types |
| 2 | Candidate Constant + Database | `candidates.ts`, SQLite schema, seed script |
| 3 | Core Backend Services | PreferenceService, ConflictAnalyzer, ScoringEngine, ExplanationGenerator + unit tests |
| 4 | ConsensusEngine | Interface + MockConsensusEngine + integration test |
| 5 | REST API (reads only) | Express routes for group/preference/consensus reads |
| 6 | Socket.IO Layer | handlers.ts: join → snapshot, preference:update → save + recalculate + broadcast |
| 7 | Frontend Foundation | Vite + Tailwind + router + useGroupSession + groupStore + groupApi |
| 8 | UI Pages & Components | All pages and components wired to live data |
| 9 | Demo Polish | Seed tuning, README, 3-browser smoke test |
| 10 | Tests | Full unit + integration suite |

---

## Risks and Weaknesses

| # | Risk | Severity | Mitigation |
|---|---|---|---|
| 1 | `better-sqlite3` native binding fails on Windows cold machine | HIGH | Add `postinstall` build step; document Node 20+ in README; fallback: `sql.js` (pure JS) if native fails |
| 2 | Blur fires while second member is mid-edit → stale intermediate result | MEDIUM | Acceptable for MVP — partial state is valid input; label result as "Updating…" while socket is in-flight |
| 3 | Two simultaneous blurs → two concurrent SQLite writes → race | MEDIUM | `better-sqlite3` is synchronous; writes are serialized by Node's event loop naturally |
| 4 | `groupScore = mean − 0.5×stddev` goes below 0 on extreme input | LOW | Clamp to `[0, 100]` in ScoringEngine |
| 5 | Scoring weights produce tie between two candidates | LOW | Break ties by candidate `id` lexicographic order (deterministic); note tie in explanation |
| 6 | pnpm workspace symlinks break if dev runs `npm install` | LOW | `engines.packageManager: pnpm@8` + `.npmrc engine-strict=true` blocks npm |
| 7 | ConsensusResult page accessed before any consensus generated | LOW | Render "No consensus yet — go to the group dashboard to generate one" empty state |
| 8 | Socket room orphaned on server restart | LOW | Client reconnects → re-emits `group:join` → server rebuilds room from live connections |

---

## MVP vs Future Features

| Feature | MVP | Future |
|---|---|---|
| Consensus engine | Deterministic mock (`MockConsensusEngine`) | Swap to `OllamaConsensusEngine.ts` — one file, same interface |
| Candidate source | `candidates.ts` constant (10 archetypes) | LLM-generated candidates; persist to DB when user-authored |
| Notes field | Stored + displayed | Fed to LLM as freeform context for richer scoring |
| Auth | Guest / localStorage userId | JWT + OAuth |
| Preference history | Single latest row per member | Versioned with diff timeline |
| Scoring weights | Hardcoded constants | Per-group configurable sliders |
| Export | None | PDF / shareable snapshot link |
| Notifications | Socket only | Email / push |

---

## Sub-Tasks

---

### Sub-Task 1 — pnpm Monorepo Scaffolding & Shared Types
**Status:** `[x] done`

**Intent:** Establish the pnpm workspace, root TypeScript config with strict mode, and all shared type definitions that both server and client depend on.

**Expected Outcomes:**
- `pnpm-workspace.yaml` covers `packages/*`
- Root `package.json` declares `packageManager: pnpm@8`; `.npmrc` has `engine-strict=true`
- `tsconfig.base.json` at root: `strict: true`, `moduleResolution: bundler`, `target: ES2022`
- `packages/shared` (name: `@consensus/shared`) compiles with zero errors
- Exported types: `User`, `Group`, `GroupMember`, `Preference`, `Candidate`, `ConsensusOutput`, `ConsensusInput`, `Conflict`, all socket event payload types

**Todo List:**
1. Create `pnpm-workspace.yaml` with `packages: ["packages/*"]`
2. Create root `package.json` with `engines: { node: ">=20", packageManager: "pnpm@8" }` and minimal dev deps (TypeScript, tsx, concurrently)
3. Create `.npmrc` with `engine-strict=true`
4. Create `tsconfig.base.json` — strict mode, `moduleResolution: bundler`, `target: ES2022`, `declaration: true`
5. Scaffold `packages/shared/` — `package.json` (`name: @consensus/shared`, `main: src/index.ts`), `tsconfig.json` extending base
6. Define all shared types in `packages/shared/src/types/` — one file per domain
7. Export everything from `packages/shared/src/index.ts`
8. Run `pnpm install` and verify `packages/shared` type-checks cleanly

**Relevant Context:** Client imports from `@consensus/shared` resolved via pnpm workspace symlink + Vite alias. Server imports via `tsconfig paths`. All types used across the wire must live here — no type drift between packages.

---

### Sub-Task 2 — Candidate Constant + Database Layer
**Status:** `[x] done`

**Intent:** Define the 10 hackathon project archetypes as a typed TS constant (no DB table), create the 5-table SQLite schema, and seed the demo personas with partial preferences.

**Expected Outcomes:**
- `packages/server/src/data/candidates.ts` exports `CANDIDATES: Candidate[]` — 10 archetypes spanning AI/ML, Frontend, Cybersecurity, Data, Social Impact, and mixed domains
- `schema.sql` defines all 5 tables
- `db.ts` exports a single `db` instance (better-sqlite3), runs schema on first start
- `pnpm seed` creates: 5 users (Alice/Bob/Carol/David/Esha), 1 group (join code `HACK01`), 5 memberships, 3 filled preferences (Alice, Bob, Carol), David and Esha empty
- Seed is idempotent (`INSERT OR IGNORE`)

**Todo List:**
1. Add `better-sqlite3` + `@types/better-sqlite3` to server deps; add native rebuild step to `postinstall`
2. Write `packages/server/src/data/candidates.ts` — 10 `Candidate` objects each with `id`, `title`, `description`, `domain`, `domainTags: string[]`, `requiredSkills: string[]`, `costPerMember: number`, `minHoursPerWeek: number`
3. Write `schema.sql` — 5 tables per schema section; `preferences.group_member_id` is UNIQUE
4. Write `db.ts` — opens `consensusai.sqlite` in `packages/server/`, executes schema on startup
5. Write `seed.ts` — idempotent; Alice: AI/ML skills, 20 hrs/wk, $500 budget; Bob: Frontend skills, 10 hrs/wk, $200 budget; Carol: Cybersecurity skills, 15 hrs/wk, $150 budget
6. Add `"seed": "tsx src/db/seed.ts"` to server `package.json`

**Relevant Context:** The seed data is engineered to produce at least 2 conflicts: (1) Carol vs Bob have zero overlapping interests, (2) Alice budget ($500) vs Carol budget ($150) is a 3× spread. These conflicts must be detectable by `ConflictAnalyzer` in Sub-Task 3.

---

### Sub-Task 3 — Core Backend Services
**Status:** `[x] done`

**Intent:** Implement the four pure-function services that form the consensus pipeline — no HTTP, no sockets, fully unit-testable in isolation.

**Expected Outcomes:**
- `PreferenceService` — `get(groupMemberId)`, `upsert(groupMemberId, data)`, `getAllForGroup(groupId)` — parses JSON columns on read
- `ConflictAnalyzer` — `analyze(members[])` → `Conflict[]` using 3 rules
- `ScoringEngine` — `scoreCandidate(candidate, members[])` → `{ memberScores, averageSatisfaction, groupScore }`; `groupScore = clamp(mean − 0.5×stddev, 0, 100)`
- `ExplanationGenerator` — `generate(output, members[])` → `string[]` with ≥ 3 sentences
- All unit tests pass

**Todo List:**
1. Implement `PreferenceService.ts` — thin DB wrapper; JSON.parse on `skills`, `interests`, `learning_goals`, `priorities` columns
2. Implement `ConflictAnalyzer.ts` — three named rule functions: `detectSkillOverlapConflict`, `detectBudgetConflict`, `detectInterestConflict`; each returns `Conflict | null`
3. Implement `ScoringEngine.ts` — five weighted sub-score functions; `scoreCandidate` aggregates per member; exports `groupScore` formula with stddev penalty and clamp
4. Implement `ExplanationGenerator.ts` — template-driven sentences referencing actual member names and candidate title; no LLM
5. Write unit tests for all four services covering: happy path, zero-preference member (score = 0), single member (no stddev penalty), tie-break, clamp at boundaries

**Relevant Context:** `ScoringEngine` imports `Candidate` type from `@consensus/shared`. It does NOT import from `candidates.ts` — it receives the candidate as a parameter. Only `MockConsensusEngine` imports `CANDIDATES` from `data/candidates.ts`.

---

### Sub-Task 4 — ConsensusEngine Interface & Mock Implementation
**Status:** `[x] done`

**Intent:** Define the stable interface that is the LLM swap seam, then wire all Phase 3 services into `MockConsensusEngine` as the complete pipeline.

**Expected Outcomes:**
- `ConsensusEngine.ts` exports only the interface and I/O types — zero implementation code
- `MockConsensusEngine.ts` implements the full 4-step pipeline: ConflictAnalyzer → score all 10 candidates → pick winner by groupScore → greedy role allocation → ExplanationGenerator
- Integration test: feed 3-member seed-like input → assert valid `ConsensusOutput` shape, `groupScore ∈ [0,100]`, `explanation.length ≥ 3`, `roleAllocation` covers all required roles
- LLM swap point documented with a comment block

**Todo List:**
1. Write `ConsensusEngine.ts` interface exactly as specified in the algorithm design section above
2. Implement `MockConsensusEngine.ts` — imports `CANDIDATES` from `data/candidates.ts` internally; runs pipeline via Phase 3 services
3. Implement greedy role allocation: iterate `winningCandidate.requiredSkills`; assign member with highest skill-match score not yet assigned
4. Write integration test with 3-member input matching seed personas; assert deterministic winner across repeated runs
5. Add comment block at top of `MockConsensusEngine.ts` marking the LLM extension point and listing the interface contract

**Relevant Context:** The interface contract: input is `members[]` with embedded preferences. Output is `recommendation`, `candidateId`, `roleAllocation`, `memberScores`, `groupScore`, `conflicts`, `explanation`, `runnerUp`. Neither `CANDIDATES` nor `ConflictAnalyzer` appear in the interface — they are implementation details of the mock only.

---

### Sub-Task 5 — REST API (Read-Only)
**Status:** `[x] done`

**Intent:** Expose read endpoints for page loads and shareable links, plus group creation and joining (one-time writes, not live preference mutations).

**Expected Outcomes:**
- Express server starts on `PORT` env var (default `3001`)
- `POST /api/v1/groups` and `POST /api/v1/groups/join` work correctly
- `GET /api/v1/groups/:id` returns group + members
- `GET /api/v1/preferences/:groupMemberId` returns parsed preference object
- `GET /api/v1/consensus/:groupId/latest` returns latest `ConsensusOutput`
- Zod validates all POST bodies; returns 400 with `{ error }` on failure
- Centralized error handler returns `{ error: string }` on all unhandled failures
- No `PUT /preferences` endpoint exists

**Todo List:**
1. Set up Express app in `index.ts` — JSON middleware, CORS allowing `http://localhost:5173`
2. `routes/groups.ts` — POST create (generate uuid + 6-char join code), POST join, GET by id
3. `routes/preferences.ts` — GET only; calls `PreferenceService.get`
4. `routes/consensus.ts` — GET latest; queries `consensus_results` by group_id ordered by generated_at DESC
5. `middleware/validate.ts` — Zod middleware factory: `validate(schema)` wraps route handler
6. `middleware/errorHandler.ts` — catch-all: maps known error types to status codes, always returns `{ error: string }`
7. Mount all routers under `/api/v1`; start http server (not `app.listen` — shared with Socket.IO in Sub-Task 6)

**Relevant Context:** The http server must be created as `http.createServer(app)` and exported so Sub-Task 6 can attach Socket.IO to the same port. Do not call `server.listen` inside the route files.

---

### Sub-Task 6 — Socket.IO Realtime Layer
**Status:** `[x] done`

**Intent:** Wire the live collaboration flow: preference blur → save → recalculate → broadcast to all group members simultaneously.

**Expected Outcomes:**
- Socket.IO server attaches to the same `http.Server` as Express
- On `group:join`: socket joins room, server emits `group:state` snapshot (members + preferences + latest consensus) to that socket only
- On `preference:update`: server saves, runs `MockConsensusEngine` if ≥ 2 members have preferences, broadcasts `preference:updated` + `consensus:updated` to entire room
- If < 2 members have preferences, emits `preference:updated` only (no consensus yet)
- With 3 browser windows in the same group, changing a preference in one updates all three within ~200 ms
- Try/catch around engine call; emits `error` event to sender on failure

**Todo List:**
1. Attach `new Server(httpServer, { cors: { origin: "http://localhost:5173" } })` in `index.ts`
2. Write `socket/handlers.ts` — export `registerHandlers(io)` function
3. `group:join` handler: `socket.join(groupId)`, load snapshot via `PreferenceService.getAllForGroup` + latest consensus query, emit `group:state` to `socket` (not room)
4. `preference:update` handler: `PreferenceService.upsert` → count members with prefs → if ≥ 2 run engine → persist result → `io.to(groupId).emit("preference:updated", ...)` + `io.to(groupId).emit("consensus:updated", ...)`
5. Register `disconnect` handler (Socket.IO removes from rooms automatically; log for debug)
6. Keep `handlers.ts` under 120 lines; no business logic — delegates to services directly

**Relevant Context:** `handlers.ts` imports `PreferenceService` and `MockConsensusEngine` directly — no `RealtimeService` intermediary. The broadcast goes to the entire room including the sender, so the sender's UI also updates from the authoritative server state (not from local optimistic update).

---

### Sub-Task 7 — Frontend Foundation
**Status:** `[x] done`

**Intent:** Bootstrap the client package, wire the single `useGroupSession` hook to the server, and set up all state management infrastructure.

**Expected Outcomes:**
- `pnpm dev` from workspace root starts both server (tsx watch) and client (vite) concurrently
- React Router v6 routes: `/`, `/create`, `/join/:code`, `/group/:id`, `/group/:id/result`
- `useGroupSession(groupId, userId)` connects socket, handles all three server events, re-emits `group:join` on reconnect
- `groupStore` (Zustand) holds: `group`, `members`, `preferencesMap`, `consensusResult`, `connectionStatus`
- `groupApi.ts` typed fetch wrappers for: GET group, GET preferences, GET latest consensus, POST create group, POST join group

**Todo List:**
1. Scaffold `packages/client` — `pnpm create vite client --template react-ts`; install Tailwind CSS v3, React Router v6, Zustand, `socket.io-client`
2. Configure `vite.config.ts` — `resolve.alias: { "@consensus/shared": "../../shared/src" }`; proxy `/api` to `http://localhost:3001`
3. Configure Tailwind — `tailwind.config.ts`, import in `index.css`
4. Set up `App.tsx` — React Router `<Routes>` with all 5 route paths
5. Implement `store/groupStore.ts` — Zustand store with typed slices for all state fields
6. Implement `hooks/useGroupSession.ts` — socket lifecycle; `useEffect` on mount: connect → emit `group:join`; handle `group:state`, `preference:updated`, `consensus:updated`; on reconnect re-emit `group:join`; expose `updatePreference` function
7. Implement `api/groupApi.ts` — typed `fetch` wrappers; all returns `Promise<T>` with error throwing
8. Add root `package.json` dev script: `"dev": "concurrently \"pnpm --filter server dev\" \"pnpm --filter client dev\""`

**Relevant Context:** `useGroupSession.updatePreference` is the only write path from any UI component. It must emit `preference:update` via socket and never call a REST endpoint. The `connectionStatus` field drives `RealtimeBadge` display: `"connected" | "reconnecting" | "disconnected"`.

---

### Sub-Task 8 — UI Pages & Components
**Status:** `[x] done`

**Intent:** Build all five pages and all reusable components, fully wired to live socket data. Dashboard shows the live summary panel; result page shows full breakdown.

**Expected Outcomes:**
- `/` Landing — hero with tagline, "Create Group" and "Join Group" CTAs
- `/create` — group name input, POST, redirect to `/group/:id`, join code shown as large copyable chip
- `/join/:code` — code pre-filled from URL param, user picker dropdown (5 seeded users), POST join, store `userId` + `groupMemberId` in localStorage, redirect to `/group/:id`
- `/group/:id` — member list, preference form (blur-saves), conflict panel, `ConsensusSummaryPanel` with live scores and "View full result →" link, realtime badge
- `/group/:id/result` — full detail: winner card, complete score breakdown with sub-score tooltips, role table, all conflicts, all explanation sentences; subscribes to `consensus:updated` for live updates
- Score bars animate width on update (CSS transition)
- `RealtimeBadge`: green pulse when connected, amber spinner when reconnecting, red dot when disconnected

**Todo List:**
1. `Landing.tsx` — hero section, product tagline ("AI-powered group consensus"), two large CTA buttons
2. `CreateGroup.tsx` — controlled name input → POST `/api/v1/groups` → show join code → navigate to `/group/:id`
3. `JoinGroup.tsx` — join code from URL param, user dropdown (fetch seeded users or hardcode 5 names), POST join → save to localStorage → navigate
4. Shared components: `MemberCard`, `PreferenceForm`, `ConflictPanel`, `ScoreBar`, `RoleAllocationTable`, `ExplanationPanel`, `ConsensusSummaryPanel`, `RealtimeBadge`
5. `GroupDashboard.tsx` — uses `useGroupSession`; renders all components; passes `updatePreference` as prop to `PreferenceForm`
6. `ConsensusResult.tsx` — calls `groupApi.getLatestConsensus` on load; also subscribes via `useGroupSession` for live updates; full detail render
7. Apply Tailwind — dark background, high-contrast score rings, colour-coded conflict severity badges (red/amber/blue), smooth bar transitions (`transition-all duration-500`)

**Relevant Context:** `PreferenceForm` calls `updatePreference` on each field's `onBlur` event. It receives its current values from `preferencesMap[groupMemberId]` in the store — not from local state — so it always reflects server-confirmed data. This prevents UI/server divergence.

---

### Sub-Task 9 — Demo Polish & README
**Status:** `[x] done`

**Intent:** Make the seeded state immediately compelling, verify the 3-browser demo works end-to-end, write the demo script.

**Expected Outcomes:**
- `pnpm seed && pnpm dev` shows a dashboard with 3 members' preferences, ≥ 2 visible conflicts, group score visually in the 70–85% range with a readable winner
- Entering David's preferences in a second browser visibly changes the score and explanation
- The 3-browser demo (Alice + Bob + Carol): change Carol's availability from 15 to 5 hrs → group score drops visibly, explanation updates
- `README.md` covers: prerequisites, `pnpm install && pnpm seed && pnpm dev`, join code `HACK01`, demo walkthrough steps, architecture summary

**Todo List:**
1. Verify seed data produces ≥ 2 conflicts after `ConflictAnalyzer` runs (budget spread Alice vs Carol; zero common interests Carol vs Bob)
2. Run `MockConsensusEngine` against seed data manually; confirm group score ∈ [70, 85] and winner title is meaningful
3. Tune `ExplanationGenerator` templates if sentences read awkwardly against real seed data
4. Run 3-browser smoke test: open 3 tabs → each picks Alice/Bob/Carol → change one preference → confirm all three tabs update
5. Write `README.md` — prerequisites section, `pnpm install`, `pnpm seed`, `pnpm dev`, join code `HACK01`, demo script with exact steps, architecture diagram (ASCII or link to plan)

**Relevant Context:** Demo narrative: 3 tabs open → preferences pre-filled → consensus summary already visible → change Carol's availability → score drops → add David's preferences in tab 4 → score recovers with updated role allocation → open `/group/:id/result` for full breakdown. This is the story that wins judges.

---

### Sub-Task 10 — Test Suite (10 Files / 71 Tests Passing)
**Status:** `[x] done`

**Intent:** Validate the full multi-tier consensus pipeline, authentication, conflict detection, real-time Socket.IO flows, and role allocation using in-memory SQLite and mock network adapters.

**Expected Outcomes:**
- `pnpm test` in `packages/server` runs 71 tests across 10 test files with 100% pass rate
- Coverage across all domains: auth, preference CRUD, all 4 conflict rules, 5-dimension scoring with stddev penalty, consensus deterministic pipeline, role allocation skill coverage, unique project synthesis, realtime socket rooms, and end-to-end journey audit

**Delivered Test Suites:**
1. `e2eJourney.test.ts` (9 tests) — Complete 20-step end-to-end user journey audit: registration, group creation, member join, live socket sync, debounce auto-save, consensus calculation, greedy role allocation, Markdown export, and summary retrieval.
2. `scoring.test.ts` (14 tests) — 5-dimension scoring engine, sub-score weights (interests 30, skills 25, availability 20, budget 15, learning 10), variance penalty, clamping, tie-breakers.
3. `consensus.test.ts` (9 tests) — MockConsensusEngine deterministic pipeline, scoring integration, runner-up calculation, boundary handling.
4. `realtime.test.ts` (8 tests) — Socket.IO room events, leader authorization check, preference auto-save, multi-client broadcasts, error handling.
5. `auth.test.ts` (7 tests) — scrypt password hashing, JWT generation/verification, auth middleware.
6. `roleAllocation.test.ts` (5 tests) — Smart role allocator, skill coverage calculation, 100% fallback skill coverage logic.
7. `explanation.test.ts` (5 tests) — ExplanationGenerator natural language trade-off sentences, stddev spread bands, conflict rationale.
8. `conflict.test.ts` (5 tests) — ConflictAnalyzer — all 4 conflict rules (skill overlap, budget spread, interest divergence, availability gap).
9. `preference.test.ts` (5 tests) — PreferenceService CRUD, JSON column parsing & persistence.
10. `uniqueProject.test.ts` (4 tests) — UniqueProjectSynthesizer bespoke project synthesis, roadmap, and custom team role specs.

---

### Sub-Task 11 — Unique Project Synthesis, Semantic Skill Taxonomy, 100% Role Coverage & E2E Journey Audit
**Status:** `[x] done`

**Intent:** Introduce AI synthesis of custom project proposals when catalog archetypes require deeper customization, provide fuzzy semantic skill matching with taxonomy mapping, guarantee 100% role allocation coverage, and implement leader permissions with all-submitted auto-triggering.

**Expected Outcomes:**
- `UniqueProjectSynthesizer.ts`: Synthesizes bespoke project proposals based on group skills, interests, and budget, complete with custom architecture, milestone roadmaps, risk factors, and custom role specs.
- `skillMatcher.ts`: Multi-alias canonicalization (e.g. JS/TypeScript, PyTorch/TensorFlow/ML, Docker/Kubernetes/DevOps, Figma/UI/UX, SQL/PostgreSQL, Solidity/Web3) and domain taxonomy mapping.
- Enhanced Role Allocator: Computes individual match percentages and deliverables per member, with fallback allocation ensuring 100% skill coverage.
- Socket Permissions & Auto-Trigger: `consensus:generate` leader check prevents unauthorized regeneration; automatically triggers consensus recalculation when all group members submit preferences (`hasSubmitted: true`).
- UI Enhancements: `CandidateCatalogModal`, `AiThinkingTerminal`, `LeaderboardModal`, and full Markdown report export.

---

## Recommended Implementation Order

1. **Sub-Task 1** — pnpm Scaffolding & Types *(foundation — nothing else compiles without this)*
2. **Sub-Task 2** — Candidates Constant + Database *(data layer needed by all services)*
3. **Sub-Task 3** — Core Services *(pure logic, independently testable)*
4. **Sub-Task 4** — ConsensusEngine + Mock *(wires services into the main pipeline)*
5. **Sub-Task 5** — REST API — reads only *(exposes data for page loads)*
6. **Sub-Task 6** — Socket.IO Layer *(live collaboration, the demo keystone)*
7. **Sub-Task 7** — Frontend Foundation *(client infrastructure)*
8. **Sub-Task 8** — UI Pages & Components *(visible product)*
9. **Sub-Task 9** — Demo Polish *(seed tuning + README)*
10. **Sub-Task 10** — Test Suite (10 files / 71 tests) *(core verification)*
11. **Sub-Task 11** — Unique Project Synthesizer, Semantic Taxonomy & E2E Journey Audit *(extended stabilization)*

