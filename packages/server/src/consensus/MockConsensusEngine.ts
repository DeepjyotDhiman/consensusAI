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

// ---------------------------------------------------------------------------
// Skill → Human-readable role title
// Covers every requiredSkill that appears across all 10 candidates.
// ---------------------------------------------------------------------------
const SKILL_TO_ROLE_TITLE: Record<string, string> = {
  "Machine Learning":   "ML Engineer & Model Lead",
  "Python":             "Python Backend Developer",
  "Data Analysis":      "Data Analyst",
  "React":              "Frontend React Lead",
  "TypeScript":         "TypeScript Engineer",
  "Angular":            "Angular Frontend Lead",
  "Vue":                "Vue.js Frontend Lead",
  "Flutter":            "Mobile App Lead Engineer",
  "Django":             "Django Backend Developer",
  "FastAPI":            "FastAPI Services Lead",
  "Go":                 "Systems & Go Developer",
  "Rust":               "Systems & Rust Engineer",
  "CSS":                "UI/CSS Specialist",
  "UI Design":          "UI/UX Designer",
  "Network Security":   "Security Engineer",
  "Cryptography":       "Cryptography Specialist",
  "SQL":                "Database & SQL Engineer",
  "Data Visualization": "Data Visualisation Engineer",
  "PostgreSQL":         "Database Engineer",
  "Docker":             "DevOps & Container Specialist",
  "Project Management": "Project Manager",
  "Community Outreach": "Community & Outreach Lead",
  "Linux":              "Systems & Linux Engineer",
};

/** Returns a professional role title for a required skill, or the skill name itself as fallback. */
function toRoleTitle(skill: string): string {
  const exact = SKILL_TO_ROLE_TITLE[skill];
  if (exact) return exact;

  const lower = skill.toLowerCase();
  for (const [key, title] of Object.entries(SKILL_TO_ROLE_TITLE)) {
    if (lower.includes(key.toLowerCase()) || key.toLowerCase().includes(lower)) {
      return title;
    }
  }

  return `${skill} Specialist`;
}

export class MockConsensusEngine implements ConsensusEngine {
  async generateConsensus(input: ConsensusInput): Promise<ConsensusOutput> {
    // Filter members that have preferences with meaningful data
    const membersWithPrefs = input.members.filter(
      (m) => {
        if (!m.preferences) return false;
        const skillsCount = Array.isArray(m.preferences.skills)
          ? m.preferences.skills.length
          : typeof m.preferences.skills === "string"
          ? m.preferences.skills.trim().length
          : 0;
        return skillsCount > 0 || m.preferences.availabilityHours > 0;
      }
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
        memberBreakdowns: result.memberBreakdowns,
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
        const memberSkills: string[] = Array.isArray(member.preferences.skills)
          ? member.preferences.skills
          : typeof member.preferences.skills === "string"
          ? member.preferences.skills.split(",").map((s) => s.trim()).filter(Boolean)
          : [];
        const skillScore = memberSkills.filter(
          (s: string) =>
            s.toLowerCase().includes(skill.toLowerCase()) ||
            skill.toLowerCase().includes(s.toLowerCase())
        ).length;
        if (skillScore > bestScore) {
          bestScore = skillScore;
          bestMember = member.userId;
        }
      }

      if (bestMember !== null) {
        roleAllocation[bestMember] = toRoleTitle(skill);
        assigned.add(bestMember);
      } else {
        roleAllocation["Unassigned"] = toRoleTitle(skill);
      }
    }

    // -------------------------------------------------------------------------
    // Step 5: Generate explanation
    // -------------------------------------------------------------------------
    // Collect priorities map for enriched explanation text (no score effect)
    const prioritiesMap: Record<string, string[]> = {};
    for (const member of membersWithPrefs) {
      const prioRaw = member.preferences.priorities;
      const prioArr = Array.isArray(prioRaw)
        ? prioRaw
        : typeof prioRaw === "string"
        ? prioRaw.split(",").map((s) => s.trim()).filter(Boolean)
        : [];
      if (prioArr.length > 0) prioritiesMap[member.userId] = prioArr;
    }

    const partialOutput: ExplanationGenerator.ExplanationInput = {
      recommendation: winner.candidate.title,
      runnerUp: runnerUp?.candidate.title ?? "None",
      ...(runnerUp != null && { runnerUpGroupScore: Math.round(runnerUp.groupScore) }),
      memberScores: winner.memberScores,
      groupScore: Math.round(winner.groupScore),
      roleAllocation,
      conflicts,
      ...(Object.keys(prioritiesMap).length > 0 && { priorities: prioritiesMap }),
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
      memberBreakdowns: winner.memberBreakdowns,
      groupScore: Math.round(winner.groupScore),
      conflicts,
      explanation,
      runnerUp: runnerUp?.candidate.title ?? "None",
    };
  }
}
