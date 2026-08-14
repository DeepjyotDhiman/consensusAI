import type { Preference, GroupMember, User } from "@consensus/shared";
export declare function get(groupMemberId: string): Preference | null;
export declare function upsert(groupMemberId: string, data: Partial<Preference>): Preference;
export declare function getAllForGroup(groupId: string): Array<{
    member: GroupMember;
    user: User;
    preference: Preference | null;
}>;
//# sourceMappingURL=PreferenceService.d.ts.map