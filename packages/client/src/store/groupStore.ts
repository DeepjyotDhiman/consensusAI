import { create } from 'zustand';
import type { Group, Preference, ConsensusOutput } from '@consensus/shared';

// Combines GroupMember + User fields as returned from the group:state socket snapshot
export interface MemberWithDisplay {
  id: string;           // groupMemberId
  groupId: string;
  userId: string;
  role: 'leader' | 'member';
  displayName: string;
  avatarColor: string;
  joinedAt: number;
}

export type ConnectionStatus = 'connected' | 'reconnecting' | 'disconnected';

interface GroupState {
  group: Group | null;
  groupName: string | null;
  projectName: string | null;
  members: MemberWithDisplay[];
  preferencesMap: Record<string, Preference | null>;
  consensusResult: ConsensusOutput | null;
  connectionStatus: ConnectionStatus;

  // Current user (stored in localStorage)
  currentUserId: string | null;
  currentGroupMemberId: string | null;

  // Actions
  setGroup: (group: Group) => void;
  setGroupName: (groupName: string) => void;
  setProjectName: (projectName: string) => void;
  setMembers: (members: MemberWithDisplay[]) => void;
  removeMember: (memberId: string) => void;
  setPreference: (groupMemberId: string, preference: Preference | null) => void;
  setConsensusResult: (result: ConsensusOutput | null) => void;
  setConnectionStatus: (status: ConnectionStatus) => void;
  setCurrentUser: (userId: string, groupMemberId: string) => void;
  reset: () => void;
}

const initialState = {
  group: null,
  groupName: null,
  projectName: null,
  members: [],
  preferencesMap: {},
  consensusResult: null,
  connectionStatus: 'disconnected' as ConnectionStatus,
  currentUserId: null,
  currentGroupMemberId: null,
};

export const useGroupStore = create<GroupState>((set) => ({
  ...initialState,
  setGroup: (group) => set({ group, groupName: group.name }),
  setGroupName: (groupName) => set({ groupName }),
  setProjectName: (projectName) => set({ projectName }),
  setMembers: (members) => set({ members }),
  removeMember: (memberId) =>
    set((state) => {
      const updatedMembers = state.members.filter(
        (m) => m.id !== memberId && m.userId !== memberId
      );
      const updatedPrefs = { ...state.preferencesMap };
      delete updatedPrefs[memberId];
      return {
        members: updatedMembers,
        preferencesMap: updatedPrefs,
      };
    }),
  setPreference: (groupMemberId, preference) =>
    set((state) => ({
      preferencesMap: { ...state.preferencesMap, [groupMemberId]: preference },
    })),
  setConsensusResult: (result) => set({ consensusResult: result }),
  setConnectionStatus: (status) => set({ connectionStatus: status }),
  setCurrentUser: (userId, groupMemberId) =>
    set({ currentUserId: userId, currentGroupMemberId: groupMemberId }),
  reset: () => set(initialState),
}));
