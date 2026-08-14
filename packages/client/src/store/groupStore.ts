import { create } from 'zustand';
import type { Group, Preference, ConsensusOutput } from '@consensus/shared';

// Combines GroupMember + User fields as returned from the group:state socket snapshot
export interface MemberWithDisplay {
  id: string;           // groupMemberId
  groupId: string;
  userId: string;
  displayName: string;
  avatarColor: string;
  joinedAt: number;
}

export type ConnectionStatus = 'connected' | 'reconnecting' | 'disconnected';

interface GroupState {
  group: Group | null;
  members: MemberWithDisplay[];
  preferencesMap: Record<string, Preference | null>;
  consensusResult: ConsensusOutput | null;
  connectionStatus: ConnectionStatus;

  // Current user (stored in localStorage)
  currentUserId: string | null;
  currentGroupMemberId: string | null;

  // Actions
  setGroup: (group: Group) => void;
  setMembers: (members: MemberWithDisplay[]) => void;
  setPreference: (groupMemberId: string, preference: Preference | null) => void;
  setConsensusResult: (result: ConsensusOutput | null) => void;
  setConnectionStatus: (status: ConnectionStatus) => void;
  setCurrentUser: (userId: string, groupMemberId: string) => void;
  reset: () => void;
}

const initialState = {
  group: null,
  members: [],
  preferencesMap: {},
  consensusResult: null,
  connectionStatus: 'disconnected' as ConnectionStatus,
  currentUserId: null,
  currentGroupMemberId: null
};

export const useGroupStore = create<GroupState>((set) => ({
  ...initialState,
  setGroup: (group) => set({ group }),
  setMembers: (members) => set({ members }),
  setPreference: (groupMemberId, preference) =>
    set((state) => ({
      preferencesMap: { ...state.preferencesMap, [groupMemberId]: preference }
    })),
  setConsensusResult: (result) => set({ consensusResult: result }),
  setConnectionStatus: (status) => set({ connectionStatus: status }),
  setCurrentUser: (userId, groupMemberId) =>
    set({ currentUserId: userId, currentGroupMemberId: groupMemberId }),
  reset: () => set(initialState)
}));
