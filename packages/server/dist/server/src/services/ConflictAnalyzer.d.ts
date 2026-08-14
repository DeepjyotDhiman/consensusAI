import type { Conflict, Preference } from "@consensus/shared";
export interface MemberInput {
    userId: string;
    displayName: string;
    preferences: Preference;
}
export declare function analyze(members: MemberInput[]): Conflict[];
//# sourceMappingURL=ConflictAnalyzer.d.ts.map