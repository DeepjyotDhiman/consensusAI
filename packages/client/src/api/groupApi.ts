import type { Group, GroupMember, Preference, ConsensusOutput, User } from '@consensus/shared';

const BASE = '/api/v1';

async function request<T>(path: string, options?: RequestInit): Promise<T> {
  const res = await fetch(`${BASE}${path}`, {
    headers: { 'Content-Type': 'application/json' },
    ...options
  });
  const json = (await res.json()) as { data?: T; error?: string };
  if (!res.ok || json.error) {
    throw new Error(json.error ?? `Request failed: ${res.status}`);
  }
  return json.data as T;
}

export interface GroupWithMembers {
  group: Group;
  members: Array<{
    id: string;
    userId: string;
    displayName: string;
    avatarColor: string;
    joinedAt: number;
  }>;
}

export interface JoinResult {
  group: Group;
  member: GroupMember;
  user: User;
}

export interface Candidate {
  id: string;
  title: string;
  category: string;
  requiredSkills: string[];
  minBudget: number;
  maxBudget: number;
  minHoursWeek: number;
  description: string;
}

export const groupApi = {
  createGroup: (name: string, userId?: string) =>
    request<{ group: Group; joinCode: string }>('/groups', {
      method: 'POST',
      body: JSON.stringify({ name, userId })
    }),

  getUserGroups: (userId: string) =>
    request<{ groups: Group[] }>(`/groups?userId=${userId}`),

  getGroup: (id: string) =>
    request<GroupWithMembers>(`/groups/${id}`),

  deleteGroup: (id: string) =>
    request<{ success: boolean; id: string }>(`/groups/${id}`, {
      method: 'DELETE'
    }),

  joinGroup: (joinCode: string, userId: string) =>
    request<JoinResult>('/groups/join', {
      method: 'POST',
      body: JSON.stringify({ joinCode, userId })
    }),

  getPreferences: (groupMemberId: string) =>
    request<Preference | null>(`/preferences/${groupMemberId}`),

  getLatestConsensus: (groupId: string) =>
    request<ConsensusOutput | null>(`/consensus/${groupId}/latest`),

  getCandidates: () =>
    request<{ candidates: Candidate[] }>('/candidates'),

  getUsers: () =>
    request<{ users: User[] }>('/users'),

  createUser: (displayName: string, avatarColor?: string) =>
    request<{ user: User }>('/users', {
      method: 'POST',
      body: JSON.stringify({ displayName, avatarColor })
    })
};
