# Consensus Engine Architecture

## Overview

ConsensusAI uses a pluggable consensus engine architecture. The active engine is selected via the `CONSENSUS_ENGINE` environment variable. All engines implement the same TypeScript interface, meaning you can swap the underlying AI provider with a single environment variable change — no application code changes required.

```
Client (Socket.IO) → handlers.ts → ConsensusEngine (interface)
                                         ↓
                              ┌──────────┴──────────┐
                              │                     │
                    MockConsensusEngine    OllamaConsensusEngine
                    (default, always         (LLM mode, falls
                      deterministic)          back to Mock)
```

---

## Engine Selection

Set the `CONSENSUS_ENGINE` environment variable:

| Value    | Engine used          | Requires                      |
|----------|----------------------|-------------------------------|
| `mock`   | MockConsensusEngine  | Nothing (default, always works) |
| `ollama` | OllamaConsensusEngine → MockConsensusEngine fallback | Running Ollama server |

```bash
# Default — always works, deterministic
CONSENSUS_ENGINE=mock

# LLM mode — requires Ollama running locally
CONSENSUS_ENGINE=ollama
OLLAMA_BASE_URL=http://localhost:11434
OLLAMA_MODEL=llama3
```

---

## The ConsensusEngine Interface

Defined in [`ConsensusEngine.ts`](./ConsensusEngine.ts):

```typescript
interface ConsensusEngine {
  generateConsensus(input: ConsensusInput): Promise<ConsensusOutput>;
}
```

**`ConsensusInput`** — contains all member preferences:
```typescript
{
  members: Array<{
    userId: string;
    displayName: string;
    preferences: Preference; // skills, interests, budget, availability, learningGoals, priorities
  }>
}
```

**`ConsensusOutput`** — the full consensus result:
```typescript
{
  recommendation: string;      // winning project title
  candidateId: string;         // e.g. "cand-08"
  groupScore: number;          // 0–100, variance-penalised group satisfaction
  memberScores: Record<string, number>;        // per-member fit score
  memberBreakdowns?: Record<string, { ... }>;  // sub-score breakdown (interest/skill/avail/budget/learning)
  roleAllocation: Record<string, string>;      // userId → human-readable role title
  conflicts: Conflict[];       // skill / budget / interest / availability conflicts
  explanation: string[];       // 4–8 natural language sentences
  runnerUp: string;            // second-place project title
}
```

---

## MockConsensusEngine (default)

**File:** [`MockConsensusEngine.ts`](./MockConsensusEngine.ts)

A fully deterministic 6-step pipeline — no external services required:

| Step | Code | Description |
|------|------|-------------|
| 1 | `ConflictAnalyzer.analyze()` | Detects skill overlap, budget spread, interest divergence, availability gap |
| 2 | `ScoringEngine.scoreCandidate()` | Scores all 10 candidates against member preferences (5-dimension weighted formula) |
| 3 | Sort by `groupScore` | Variance-penalised group score: `mean − 0.5 × stddev` |
| 4 | Greedy role allocator | Matches member skills to winning candidate's `requiredSkills`, maps to human-readable titles |
| 5 | `ExplanationGenerator.generate()` | Produces 4–8 natural language sentences from scores, conflicts, and member priorities |
| 6 | Return `ConsensusOutput` | Persisted to DB and broadcast via Socket.IO |

**Scoring weights** (total 100 points per member):
- Interest match: **30 pts** — member `interests[]` vs candidate `domainTags[]`
- Skill match: **25 pts** — member `skills[]` vs candidate `requiredSkills[]`
- Availability: **20 pts** — `min(hours / minHoursPerWeek, 1) × 20`
- Budget: **15 pts** — `min(budget / costPerMember, 1) × 15`
- Learning goals: **10 pts** — member `learningGoals[]` vs candidate `domainTags[]`

---

## OllamaConsensusEngine (LLM mode)

**File:** [`OllamaConsensusEngine.ts`](./OllamaConsensusEngine.ts)

Sends a structured prompt to a locally-running Ollama server and expects a JSON response matching `ConsensusOutput`. If Ollama is unavailable, times out (8 seconds), or returns invalid JSON, it **automatically falls back to MockConsensusEngine** with no user-visible error.

### Prompt structure

```
System: You are ConsensusAI, an intelligent project matching engine...
Candidates: [ <10 project objects with domainTags and requiredSkills> ]
Team Member Preferences: [ <member objects with skills/interests/budget/availability/learningGoals> ]
Return ONLY a JSON object with this exact structure: { recommendation, candidateId, ... }
```

### Fallback chain

```
OllamaConsensusEngine.generateConsensus()
  → fetch("http://localhost:11434/api/generate", { timeout: 8s })
     ✓ success → parse JSON → validate schema → return ConsensusOutput
     ✗ network error | timeout | invalid JSON → MockConsensusEngine.generateConsensus()
```

---

## Adding a New AI Provider

To add a new LLM provider (e.g., OpenAI, Anthropic, IBM WatsonX):

1. Create `packages/server/src/consensus/YourEngine.ts`
2. Implement: `export class YourEngine implements ConsensusEngine`
3. In `packages/server/src/socket/handlers.ts`, add your engine to the selection block:
   ```typescript
   const engine =
     process.env["CONSENSUS_ENGINE"] === "ollama" ? new OllamaConsensusEngine() :
     process.env["CONSENSUS_ENGINE"] === "your_engine" ? new YourEngine() :
     new MockConsensusEngine();
   ```
4. Document the required env vars in `.env.example`
5. Zero other changes required — the interface contract handles everything else

---

## Testing

The MockConsensusEngine pipeline is covered by:
- `tests/consensus.test.ts` — end-to-end engine tests (7 cases)
- `tests/scoring.test.ts` — ScoringEngine unit tests (7 cases)
- `tests/conflict.test.ts` — ConflictAnalyzer unit tests (5 cases)
- `tests/explanation.test.ts` — ExplanationGenerator unit tests (5 cases)

Run: `pnpm test` from the repo root.
