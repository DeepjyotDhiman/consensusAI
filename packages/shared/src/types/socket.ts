import type { GroupMember } from "./group.js";
import type { Preference } from "./preference.js";
import type { ConsensusOutput } from "./consensus.js";

// ── Client → Server ──────────────────────────────────────────────────────────

export interface GroupJoinPayload {
  groupId: string;
  userId: string;
}

export interface PreferenceUpdatePayload {
  groupMemberId: string;
  preferences: Preference;
}

// ── Server → Client ──────────────────────────────────────────────────────────

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

// ── Typed event maps (for socket.io type inference) ───────────────────────────

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
