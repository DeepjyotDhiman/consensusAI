export interface Candidate {
    id: string;
    title: string;
    description: string;
    domain: string;
    domainTags: string[];
    requiredSkills: string[];
    costPerMember: number;
    minHoursPerWeek: number;
    problem?: string | undefined;
    opportunity?: string | undefined;
    isUnique?: boolean | undefined;
}
export interface ProjectDetails {
    title: string;
    description: string;
    domain: string;
    domainTags: string[];
    requiredSkills: string[];
    costPerMember: number;
    minHoursPerWeek: number;
    problem?: string | undefined;
    opportunity?: string | undefined;
    isUnique?: boolean | undefined;
}
export type ConflictType = "skill" | "budget" | "interest" | "BUDGET_MISMATCH" | "AVAILABILITY_GAP" | "availability";
export type ConflictSeverity = "low" | "medium" | "high";
export interface Conflict {
    id?: string;
    type: ConflictType;
    affectedUserIds: string[];
    severity: ConflictSeverity;
    description: string;
    suggestedResolution?: string;
}
export interface ConsensusInput {
    members: Array<{
        userId: string;
        displayName: string;
        preferences: import("./preference.js").Preference;
    }>;
}
export interface MemberScoreBreakdown {
    interestScore: number;
    skillScore: number;
    availabilityScore: number;
    budgetScore: number;
    learningScore: number;
    total: number;
}
export type SkillMatchTier = "DIRECT" | "CLOSE" | "ADJACENT" | "NONE";
export interface SkillMatchAssessment {
    requiredSkill: string;
    matchedMemberSkill?: string;
    tier: SkillMatchTier;
    weight: number;
}
export interface TeamSkillCoverage {
    coveredSkills: string[];
    transferableSkills: string[];
    missingSkills: string[];
    overallCoveragePercentage: number;
}
export interface MemberRoleAssignment {
    userId: string;
    displayName?: string | undefined;
    roleTitle: string;
    matchedSkill?: string | undefined;
    matchTier: SkillMatchTier;
    responsibilities: string[];
    rationale: string;
    rampUpAreas?: string[] | undefined;
}
export interface ConsensusOutput {
    recommendation: string;
    candidateId: string;
    projectDetails?: ProjectDetails | undefined;
    roleAllocation: Record<string, string>;
    roleAssignments?: MemberRoleAssignment[] | undefined;
    memberScores: Record<string, number>;
    memberBreakdowns?: Record<string, MemberScoreBreakdown> | undefined;
    groupScore: number;
    conflicts: Conflict[];
    explanation: string[];
    runnerUp: string;
    skillCoverage?: TeamSkillCoverage | undefined;
}
export interface ConsensusEngine {
    generateConsensus(input: ConsensusInput): Promise<ConsensusOutput>;
}
//# sourceMappingURL=consensus.d.ts.map