import type { User } from "./user.js";
export interface Group {
    id: string;
    joinCode: string;
    name: string;
    createdAt: number;
}
export interface GroupMember {
    id: string;
    groupId: string;
    userId: string;
    /** 'leader' for the group creator; 'member' for everyone else */
    role: "leader" | "member";
    joinedAt: number;
    /** Populated in joined queries */
    user?: User;
}
//# sourceMappingURL=group.d.ts.map