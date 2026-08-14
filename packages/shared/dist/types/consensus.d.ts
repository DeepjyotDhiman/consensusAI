export interface Candidate {
    id: string;
    title: string;
    description: string;
    domain: string;
    domainTags: string[];
    requiredSkills: string[];
    costPerMember: number;
    minHoursPerWeek: number;
}
export type ConflictType = "skill" | "budget" | "interest";
export type ConflictSeverity = "low" | "medium" | "high";
export interface Conflict {
    type: ConflictType;
    affectedUserIds: string[];
    severity: ConflictSeverity;
    description: string;
}
export interface ConsensusInput {
    members: Array<{
        userId: string;
        displayName: string;
        preferences: import("./preference.js").Preference;
    }>;
}
export interface ConsensusOutput {
    recommendation: string;
    candidateId: string;
    roleAllocation: Record<string, string>;
    memberScores: Record<string, number>;
    groupScore: number;
    conflicts: Conflict[];
    explanation: string[];
    runnerUp: string;
}
export interface ConsensusEngine {
    generateConsensus(input: ConsensusInput): Promise<ConsensusOutput>;
}
//# sourceMappingURL=consensus.d.ts.map