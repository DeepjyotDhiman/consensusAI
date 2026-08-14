import { describe, it, expect } from 'vitest';
import { analyze } from '../src/services/ConflictAnalyzer.js';
import type { MemberInput } from '../src/services/ConflictAnalyzer.js';

const NOW = Date.now();

function makeMember(
  userId: string,
  skills: string[],
  budget: number,
  interests: string[]
): MemberInput {
  return {
    userId,
    displayName: userId,
    preferences: {
      id: `pref-${userId}`,
      groupMemberId: `mem-${userId}`,
      skills,
      availabilityHours: 10,
      budget,
      interests,
      learningGoals: [],
      priorities: [],
      notes: '',
      updatedAt: NOW,
    },
  };
}

describe('ConflictAnalyzer', () => {
  it('detects skill overlap conflict when Jaccard < 0.2', () => {
    const members: MemberInput[] = [
      makeMember('alice', ['Machine Learning', 'Python', 'Data Analysis'], 300, ['AI']),
      makeMember('bob', ['React', 'TypeScript', 'CSS', 'UI Design'], 300, ['AI']),
    ];
    const conflicts = analyze(members);
    const skillConflict = conflicts.find(c => c.type === 'skill');
    expect(skillConflict).toBeDefined();
    expect(skillConflict!.affectedUserIds).toContain('alice');
    expect(skillConflict!.affectedUserIds).toContain('bob');
  });

  it('detects budget conflict when max > 2x median', () => {
    // median([100,100,500]) = 100, max=500 > 2*100 → triggers budget conflict
    const members: MemberInput[] = [
      makeMember('alice', ['Python'], 500, ['AI']),
      makeMember('bob',   ['Python'], 100, ['AI']),
      makeMember('carol', ['Python'], 100, ['AI']),
    ];
    const conflicts = analyze(members);
    const budgetConflict = conflicts.find(c => c.type === 'budget');
    expect(budgetConflict).toBeDefined();
    expect(budgetConflict!.description).toMatch(/budget/i);
  });

  it('detects interest conflict when no common interests', () => {
    const members: MemberInput[] = [
      makeMember('alice', ['Python'], 200, ['AI', 'ML']),
      makeMember('bob', ['React'], 200, ['Frontend', 'Design']),
    ];
    const conflicts = analyze(members);
    const interestConflict = conflicts.find(c => c.type === 'interest');
    expect(interestConflict).toBeDefined();
    expect(interestConflict!.description).toMatch(/shared interests/i);
  });

  it('returns empty array when no conflicts', () => {
    const members: MemberInput[] = [
      makeMember('alice', ['Python', 'ML', 'React'], 200, ['AI']),
      makeMember('bob', ['Python', 'ML', 'TypeScript'], 250, ['AI']),
    ];
    // Same interests (AI), close budgets (no 2x), overlapping skills (Python,ML = Jaccard >= 0.2)
    const conflicts = analyze(members);
    expect(conflicts.every(c => c.type !== 'interest')).toBe(true);
    expect(conflicts.every(c => c.type !== 'budget')).toBe(true);
  });

  it('handles single member without throwing', () => {
    const members: MemberInput[] = [
      makeMember('alice', ['Python'], 200, ['AI']),
    ];
    const conflicts = analyze(members);
    expect(conflicts).toEqual([]);
  });
});
