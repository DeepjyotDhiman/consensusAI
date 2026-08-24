import type { Group, GroupMember, Preference, ConsensusOutput, User } from '@consensus/shared';

const BASE = '/api/v1';
const TOKEN_KEY = 'consensus_auth_token';

function getAuthHeaders(): Record<string, string> {
  const token = localStorage.getItem(TOKEN_KEY);
  return token ? { Authorization: `Bearer ${token}` } : {};
}

async function request<T>(path: string, options?: RequestInit): Promise<T> {
  const res = await fetch(`${BASE}${path}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...getAuthHeaders(),
      ...(options?.headers as Record<string, string> | undefined),
    },
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
    role: 'leader' | 'member';
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
  /** Create a new group. Creator is automatically joined as leader. */
  createGroup: (name: string) =>
    request<{ group: Group; member: GroupMember }>('/groups', {
      method: 'POST',
      body: JSON.stringify({ name }),
    }),

  getUserGroups: (userId: string) =>
    request<{ groups: Group[] }>(`/groups?userId=${userId}`),

  getGroup: (id: string) =>
    request<GroupWithMembers>(`/groups/${id}`),

  deleteGroup: (id: string) =>
    request<{ success: boolean; id: string }>(`/groups/${id}`, {
      method: 'DELETE',
    }),

  /** Join a group by code. Auth token identifies who is joining — no userId param needed. */
  joinGroup: (joinCode: string) =>
    request<JoinResult>('/groups/join', {
      method: 'POST',
      body: JSON.stringify({ joinCode }),
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
      body: JSON.stringify({ displayName, avatarColor }),
    }),
};
