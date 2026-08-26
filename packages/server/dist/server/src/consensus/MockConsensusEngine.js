// LLM EXTENSION POINT
// To swap this for an LLM engine (e.g. Ollama):
//   1. Create OllamaConsensusEngine.ts in this directory
//   2. Implement: generateConsensus(input: ConsensusInput): Promise<ConsensusOutput>
//   3. In socket/handlers.ts change: import { MockConsensusEngine } → import { OllamaConsensusEngine }
//   4. Zero other changes required.
import { assessTeamSkillCoverage, allocateProjectRoles } from "@consensus/shared";
import { CANDIDATES } from "../data/candidates.js";
import * as ConflictAnalyzer from "../services/ConflictAnalyzer.js";
import * as ScoringEngine from "../services/ScoringEngine.js";
import * as ExplanationGenerator from "../services/ExplanationGenerator.js";
import * as UniqueProjectSynthesizer from "../services/UniqueProjectSynthesizer.js";
export class MockConsensusEngine {
    async generateConsensus(input) {
        // Filter members that have preferences with meaningful data
        const membersWithPrefs = input.members.filter((m) => {
            if (!m.preferences)
                return false;
            const skillsCount = Array.isArray(m.preferences.skills)
                ? m.preferences.skills.length
                : typeof m.preferences.skills === "string"
                    ? m.preferences.skills.trim().length
                    : 0;
            return skillsCount > 0 || m.preferences.availabilityHours > 0;
        });
        // Edge case: need at least 2 members with preferences
        if (membersWithPrefs.length < 2) {
            throw new Error("At least 2 members must have preferences to generate consensus");
        }
        // -------------------------------------------------------------------------
        // Step 1: Detect conflicts across all members with preferences
        // -------------------------------------------------------------------------
        const conflicts = ConflictAnalyzer.analyze(membersWithPrefs);
        // -------------------------------------------------------------------------
        // Step 2: Synthesize unique project candidates & build candidate pool
        // -------------------------------------------------------------------------
        const uniqueCandidates = UniqueProjectSynthesizer.generateUniqueCandidates(membersWithPrefs);
        const candidatePool = [...CANDIDATES, ...uniqueCandidates];
        if (candidatePool.length === 0) {
            throw new Error("No candidates available");
        }
        // -------------------------------------------------------------------------
        // Step 3: Score every candidate in the pool against the member set
        // -------------------------------------------------------------------------
        const scoredCandidates = candidatePool.map((candidate) => {
            const result = ScoringEngine.scoreCandidate(candidate, membersWithPrefs);
            return {
                candidate,
                memberScores: result.memberScores,
                memberBreakdowns: result.memberBreakdowns,
                groupScore: result.groupScore,
            };
        });
        // -------------------------------------------------------------------------
        // Step 4: Sort by groupScore descending; tie-break by candidate.id lexically
        // -------------------------------------------------------------------------
        scoredCandidates.sort((a, b) => {
            if (b.groupScore !== a.groupScore)
                return b.groupScore - a.groupScore;
            return a.candidate.id.localeCompare(b.candidate.id);
        });
        const winner = scoredCandidates[0];
        const runnerUp = scoredCandidates[1];
        // -------------------------------------------------------------------------
        // Step 5: Optimal Role & Task Allocation for the winning candidate
        // -------------------------------------------------------------------------
        const memberProfiles = membersWithPrefs.map((m) => {
            const skills = Array.isArray(m.preferences.skills)
                ? m.preferences.skills
                : typeof m.preferences.skills === "string"
                    ? m.preferences.skills.split(",").map((s) => s.trim()).filter(Boolean)
                    : [];
            const learningGoals = Array.isArray(m.preferences.learningGoals)
                ? m.preferences.learningGoals
                : typeof m.preferences.learningGoals === "string"
                    ? m.preferences.learningGoals.split(",").map((s) => s.trim()).filter(Boolean)
                    : [];
            const interests = Array.isArray(m.preferences.interests)
                ? m.preferences.interests
                : typeof m.preferences.interests === "string"
                    ? m.preferences.interests.split(",").map((s) => s.trim()).filter(Boolean)
                    : [];
            return {
                userId: m.userId,
                displayName: m.displayName,
                skills,
                learningGoals,
                interests,
            };
        });
        const { roleAllocation, roleAssignments } = allocateProjectRoles({
            title: winner.candidate.title,
            requiredSkills: winner.candidate.requiredSkills,
            description: winner.candidate.description,
        }, memberProfiles);
        // -------------------------------------------------------------------------
        // Step 6: Team Skill Coverage Analysis
        // -------------------------------------------------------------------------
        const teamSkills = memberProfiles.map((m) => m.skills);
        const skillCoverage = assessTeamSkillCoverage(teamSkills, winner.candidate.requiredSkills);
        // -------------------------------------------------------------------------
        // Step 7: Generate explanation with unique project & skill coverage insights
        // -------------------------------------------------------------------------
        const prioritiesMap = {};
        for (const member of membersWithPrefs) {
            const prioRaw = member.preferences.priorities;
            const prioArr = Array.isArray(prioRaw)
                ? prioRaw
                : typeof prioRaw === "string"
                    ? prioRaw.split(",").map((s) => s.trim()).filter(Boolean)
                    : [];
            if (prioArr.length > 0)
                prioritiesMap[member.userId] = prioArr;
        }
        const projectDetails = {
            title: winner.candidate.title,
            description: winner.candidate.description,
            domain: winner.candidate.domain,
            domainTags: winner.candidate.domainTags,
            requiredSkills: winner.candidate.requiredSkills,
            costPerMember: winner.candidate.costPerMember,
            minHoursPerWeek: winner.candidate.minHoursPerWeek,
            problem: winner.candidate.problem,
            opportunity: winner.candidate.opportunity,
            isUnique: winner.candidate.isUnique,
        };
        const partialOutput = {
            recommendation: winner.candidate.title,
            runnerUp: runnerUp?.candidate.title ?? "None",
            ...(runnerUp != null && { runnerUpGroupScore: Math.round(runnerUp.groupScore) }),
            memberScores: winner.memberScores,
            groupScore: Math.round(winner.groupScore),
            roleAllocation,
            conflicts,
            ...(Object.keys(prioritiesMap).length > 0 && { priorities: prioritiesMap }),
            skillCoverage,
            projectDetails,
        };
        const explanation = ExplanationGenerator.generate(partialOutput, membersWithPrefs);
        // -------------------------------------------------------------------------
        // Step 8: Assemble and return ConsensusOutput
        // -------------------------------------------------------------------------
        return {
            recommendation: winner.candidate.title,
            candidateId: winner.candidate.id,
            projectDetails,
            roleAllocation,
            roleAssignments,
            memberScores: winner.memberScores,
            memberBreakdowns: winner.memberBreakdowns,
            groupScore: Math.round(winner.groupScore),
            conflicts,
            explanation,
            runnerUp: runnerUp?.candidate.title ?? "None",
            skillCoverage,
        };
    }
}
//# sourceMappingURL=MockConsensusEngine.js.map