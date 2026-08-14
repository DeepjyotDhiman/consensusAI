import type { GroupMember } from "./group.js";
import type { Preference } from "./preference.js";
import type { ConsensusOutput } from "./consensus.js";
export interface GroupJoinPayload {
    groupId: string;
    userId: string;
}
export interface PreferenceUpdatePayload {
    groupMemberId: string;
    preferences: Preference;
}
export interface GroupStatePayload {
    members: GroupMember[];
    preferencesMap: Record<string, Preference | null>;
    latestConsensus: ConsensusOutput | null;
}
export interface PreferenceUpdatedPayload {
    groupMemberId: string;
    preferences: Preference;
}
export interface ConsensusUpdatedPayload {
    result: ConsensusOutput;
}
export interface ErrorPayload {
    message: string;
}
export interface ServerToClientEvents {
    "group:state": (payload: GroupStatePayload) => void;
    "preference:updated": (payload: PreferenceUpdatedPayload) => void;
    "consensus:updated": (payload: ConsensusUpdatedPayload) => void;
    error: (payload: ErrorPayload) => void;
}
export interface ClientToServerEvents {
    "group:join": (payload: GroupJoinPayload) => void;
    "preference:update": (payload: PreferenceUpdatePayload) => void;
}
//# sourceMappingURL=socket.d.ts.map