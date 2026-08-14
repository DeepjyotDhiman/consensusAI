// LLM EXTENSION POINT
// To swap this for an LLM engine (e.g. Ollama):
//   1. Create OllamaConsensusEngine.ts in this directory
//   2. Implement: generateConsensus(input: ConsensusInput): Promise<ConsensusOutput>
//   3. In socket/handlers.ts change: import { MockConsensusEngine } → import { OllamaConsensusEngine }
//   4. Zero other changes required.
//
// The LLM engine should:
//   - Build a prompt from input.members and their preferences
//   - Include the CANDIDATES list from ../data/candidates.ts
//   - Request JSON output matching ConsensusOutput shape
//   - Parse and validate the JSON response
//   - Fall back to MockConsensusEngine if parsing fails

import type { ConsensusInput, ConsensusOutput } from "@consensus/shared";
import type { ConsensusEngine } from "./ConsensusEngine.js";
import { CANDIDATES } from "../data/candidates.js";
import * as ConflictAnalyzer from "../services/ConflictAnalyzer.js";
import * as ScoringEngine from "../services/ScoringEngine.js";
import * as ExplanationGenerator from "../services/ExplanationGenerator.js";

export class MockConsensusEngine implements ConsensusEngine {
  async generateConsensus(input: ConsensusInput): Promise<ConsensusOutput> {
    // Filter members that have preferences with meaningful data
    const membersWithPrefs = input.members.filter(
      (m) =>
        m.preferences != null &&
        (m.preferences.skills.length > 0 || m.preferences.availabilityHours > 0)
    );

    // Edge case: need at least 2 members with preferences
    if (membersWithPrefs.length < 2) {
      throw new Error(
        "At least 2 members must have preferences to generate consensus"
      );
    }

    // Edge case: no candidates available
    if (CANDIDATES.length === 0) {
      throw new Error("No candidates available");
    }

    // -------------------------------------------------------------------------
    // Step 1: Detect conflicts across all members with preferences
    // -------------------------------------------------------------------------
    const conflicts = ConflictAnalyzer.analyze(membersWithPrefs);

    // -------------------------------------------------------------------------
    // Step 2: Score every candidate against the filtered member set
    // -------------------------------------------------------------------------
    const scoredCandidates = CANDIDATES.map((candidate) => {
      const result = ScoringEngine.scoreCandidate(candidate, membersWithPrefs);
      return {
        candidate,
        memberScores: result.memberScores,
        groupScore: result.groupScore,
      };
    });

    // -------------------------------------------------------------------------
    // Step 3: Sort by groupScore descending; tie-break by candidate.id lexically
    // -------------------------------------------------------------------------
    scoredCandidates.sort((a, b) => {
      if (b.groupScore !== a.groupScore) return b.groupScore - a.groupScore;
      return a.candidate.id.localeCompare(b.candidate.id);
    });

    const winner = scoredCandidates[0]!;
    const runnerUp = scoredCandidates[1];

    // -------------------------------------------------------------------------
    // Step 4: Greedy role allocation for the winning candidate
    // -------------------------------------------------------------------------
    const roleAllocation: Record<string, string> = {};
    const assigned = new Set<string>();

    for (const skill of winner.candidate.requiredSkills) {
      let bestMember: string | null = null;
      let bestScore = -1;

      for (const member of membersWithPrefs) {
        if (assigned.has(member.userId)) continue;
        const skillScore = member.preferences.skills.filter(
          (s) =>
            s.toLowerCase().includes(skill.toLowerCase()) ||
            skill.toLowerCase().includes(s.toLowerCase())
        ).length;
        if (skillScore > bestScore) {
          bestScore = skillScore;
          bestMember = member.userId;
        }
      }

      if (bestMember !== null) {
        roleAllocation[bestMember] = skill;
        assigned.add(bestMember);
      } else {
        roleAllocation["Unassigned"] = skill;
      }
    }

    // -------------------------------------------------------------------------
    // Step 5: Generate explanation
    // -------------------------------------------------------------------------
    const partialOutput: ExplanationGenerator.ExplanationInput = {
      recommendation: winner.candidate.title,
      runnerUp: runnerUp?.candidate.title ?? "None",
      ...(runnerUp != null && { runnerUpGroupScore: Math.round(runnerUp.groupScore) }),
      memberScores: winner.memberScores,
      groupScore: Math.round(winner.groupScore),
      roleAllocation,
      conflicts,
    };

    const explanation = ExplanationGenerator.generate(partialOutput, membersWithPrefs);

    // -------------------------------------------------------------------------
    // Step 6: Assemble and return ConsensusOutput
    // -------------------------------------------------------------------------
    return {
      recommendation: winner.candidate.title,
      candidateId: winner.candidate.id,
      roleAllocation,
      memberScores: winner.memberScores,
      groupScore: Math.round(winner.groupScore),
      conflicts,
      explanation,
      runnerUp: runnerUp?.candidate.title ?? "None",
    };
  }
}
