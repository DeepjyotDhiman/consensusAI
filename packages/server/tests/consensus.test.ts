import { describe, it, expect } from 'vitest';
import { MockConsensusEngine } from '../src/consensus/MockConsensusEngine.js';
import type { ConsensusInput } from '@consensus/shared';

const NOW = Date.now();

const testMembers: ConsensusInput['members'] = [
  {
    userId: 'user-alice',
    displayName: 'Alice',
    preferences: {
      id: 'pref-alice',
      groupMemberId: 'member-alice',
      skills: ['Machine Learning', 'Python', 'Data Analysis'],
      availabilityHours: 20,
      budget: 500,
      interests: ['AI', 'Social Impact'],
      learningGoals: ['Deep Learning', 'MLOps'],
      priorities: [],
      notes: '',
      updatedAt: NOW,
    },
  },
  {
    userId: 'user-bob',
    displayName: 'Bob',
    preferences: {
      id: 'pref-bob',
      groupMemberId: 'member-bob',
      skills: ['React', 'TypeScript', 'Python', 'UI Design'],
      availabilityHours: 10,
      budget: 200,
      interests: ['AI', 'Frontend'],
      learningGoals: ['React Native', 'Accessibility'],
      priorities: [],
      notes: '',
      updatedAt: NOW,
    },
  },
  {
    userId: 'user-carol',
    displayName: 'Carol',
    preferences: {
      id: 'pref-carol',
      groupMemberId: 'member-carol',
      skills: ['Network Security', 'Linux', 'Python'],
      availabilityHours: 15,
      budget: 150,
      interests: ['AI', 'Cybersecurity'],
      learningGoals: ['Penetration Testing', 'Cryptography'],
      priorities: [],
      notes: '',
      updatedAt: NOW,
    },
  },
];

const engine = new MockConsensusEngine();

describe('MockConsensusEngine', () => {
  it('returns a valid ConsensusOutput with skillCoverage for 3-member seed-like input', async () => {
    const output = await engine.generateConsensus({ members: testMembers });
    expect(output).toBeDefined();
    expect(typeof output.recommendation).toBe('string');
    expect(output.recommendation.length).toBeGreaterThan(0);
    expect(typeof output.candidateId).toBe('string');
    expect(typeof output.groupScore).toBe('number');
    expect(Array.isArray(output.explanation)).toBe(true);
    expect(Array.isArray(output.conflicts)).toBe(true);
    expect(typeof output.roleAllocation).toBe('object');
    expect(typeof output.memberScores).toBe('object');
    expect(output.skillCoverage).toBeDefined();
    expect(Array.isArray(output.skillCoverage?.coveredSkills)).toBe(true);
    expect(typeof output.skillCoverage?.overallCoveragePercentage).toBe('number');
  });

  it('winner is deterministic across multiple runs', async () => {
    const run1 = await engine.generateConsensus({ members: testMembers });
    const run2 = await engine.generateConsensus({ members: testMembers });
    expect(run1.recommendation).toBe(run2.recommendation);
    expect(run1.candidateId).toBe(run2.candidateId);
    expect(run1.groupScore).toBe(run2.groupScore);
  });

  it('groupScore is within [0, 100]', async () => {
    const output = await engine.generateConsensus({ members: testMembers });
    expect(output.groupScore).toBeGreaterThanOrEqual(0);
    expect(output.groupScore).toBeLessThanOrEqual(100);
  });

  it('roleAllocation contains at least one member', async () => {
    const output = await engine.generateConsensus({ members: testMembers });
    expect(Object.keys(output.roleAllocation).length).toBeGreaterThan(0);
  });

  it('explanation has at least 3 sentences', async () => {
    const output = await engine.generateConsensus({ members: testMembers });
    expect(output.explanation.length).toBeGreaterThanOrEqual(3);
  });

  it('throws when fewer than 2 members have preferences', async () => {
    const singleMember: ConsensusInput['members'] = [testMembers[0]!];
    await expect(engine.generateConsensus({ members: singleMember })).rejects.toThrow(
      'At least 2 members must have preferences'
    );
  });

  it('runnerUp is different from recommendation', async () => {
    const output = await engine.generateConsensus({ members: testMembers });
    expect(output.runnerUp).not.toBe(output.recommendation);
  });

  it('recommends Security project for a team with cybersecurity profile', async () => {
    const securityTeam: ConsensusInput['members'] = [
      {
        userId: 'sec-1',
        displayName: 'SecLead',
        preferences: {
          id: 'p1',
          groupMemberId: 'm1',
          skills: ['Network Security', 'Cryptography', 'Linux'],
          availabilityHours: 20,
          budget: 200,
          interests: ['Cybersecurity', 'Privacy'],
          learningGoals: ['Zero-Knowledge'],
          priorities: [],
          notes: '',
          updatedAt: NOW,
        },
      },
      {
        userId: 'sec-2',
        displayName: 'SecDev',
        preferences: {
          id: 'p2',
          groupMemberId: 'm2',
          skills: ['Python', 'Network Security', 'Linux'],
          availabilityHours: 15,
          budget: 150,
          interests: ['Cybersecurity', 'Systems'],
          learningGoals: ['Cryptography'],
          priorities: [],
          notes: '',
          updatedAt: NOW,
        },
      },
    ];

    const result = await engine.generateConsensus({ members: securityTeam });
    expect(['SecureVault', 'ThreatSense']).toContain(result.recommendation);
    expect(result.skillCoverage?.coveredSkills).toContain('Network Security');
  });

  it('recommends Design/Frontend project for a team with UI & React profile', async () => {
    const designTeam: ConsensusInput['members'] = [
      {
        userId: 'des-1',
        displayName: 'Designer',
        preferences: {
          id: 'pd1',
          groupMemberId: 'md1',
          skills: ['UI Design', 'CSS', 'Figma'],
          availabilityHours: 20,
          budget: 100,
          interests: ['UI/UX', 'Design Systems'],
          learningGoals: ['Design Tokens'],
          priorities: [],
          notes: '',
          updatedAt: NOW,
        },
      },
      {
        userId: 'des-2',
        displayName: 'FrontendDev',
        preferences: {
          id: 'pd2',
          groupMemberId: 'md2',
          skills: ['React', 'TypeScript', 'CSS'],
          availabilityHours: 20,
          budget: 100,
          interests: ['Frontend', 'Design Systems'],
          learningGoals: ['Tailwind'],
          priorities: [],
          notes: '',
          updatedAt: NOW,
        },
      },
    ];

    const result = await engine.generateConsensus({ members: designTeam });
    expect(['Community Design System', 'CollabSpace']).toContain(result.recommendation);
    expect(result.skillCoverage?.coveredSkills).toContain('React');
  });
});
