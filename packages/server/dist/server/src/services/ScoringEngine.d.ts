import type { Candidate, Preference } from "@consensus/shared";
export interface MemberScoreBreakdown {
    interestScore: number;
    skillScore: number;
    availabilityScore: number;
    budgetScore: number;
    learningScore: number;
    total: number;
}
export interface CandidateScoreResult {
    memberScores: Record<string, number>;
    memberBreakdowns: Record<string, MemberScoreBreakdown>;
    averageSatisfaction: number;
    groupScore: number;
}
export declare function scoreMember(candidate: Candidate, member: {
    preferences: Preference;
}): MemberScoreBreakdown;
export declare function scoreCandidate(candidate: Candidate, members: Array<{
    userId: string;
    preferences: Preference;
}>): CandidateScoreResult;
//# sourceMappingURL=ScoringEngine.d.ts.map