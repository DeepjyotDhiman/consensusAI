import type { Conflict, TeamSkillCoverage, ProjectDetails } from "@consensus/shared";
export interface ExplanationInput {
    recommendation: string;
    runnerUp: string;
    runnerUpGroupScore?: number;
    memberScores: Record<string, number>;
    groupScore: number;
    roleAllocation: Record<string, string>;
    conflicts: Conflict[];
    priorities?: Record<string, string[]>;
    skillCoverage?: TeamSkillCoverage;
    projectDetails?: ProjectDetails;
}
export declare function generate(output: ExplanationInput, members: Array<{
    userId: string;
    displayName: string;
}>): string[];
//# sourceMappingURL=ExplanationGenerator.d.ts.map