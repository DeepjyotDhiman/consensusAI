import { describe, it, expect } from 'vitest';
import { generate } from '../src/services/ExplanationGenerator.js';
import type { ExplanationInput } from '../src/services/ExplanationGenerator.js';

const MEMBERS = [
  { userId: 'u1', displayName: 'Alice' },
  { userId: 'u2', displayName: 'Bob' },
  { userId: 'u3', displayName: 'Carol' },
];

describe('ExplanationGenerator', () => {
  it('produces ≥ 4 sentences when all members score ≥ 70 (well-aligned group)', () => {
    const input: ExplanationInput = {
      recommendation: 'EduBot',
      runnerUp: 'AI Accessibility Tool',
      runnerUpGroupScore: 58,
      memberScores: { u1: 78, u2: 75, u3: 72 },
      groupScore: 75,
      roleAllocation: { u1: 'ML Engineer & Model Lead', u2: 'Frontend React Lead', u3: 'Python Backend Developer' },
      conflicts: [],
    };
    const result = generate(input, MEMBERS);
    // Expects: opening + aligned-members sentence + role-match sentence + closing
    expect(result.length).toBeGreaterThanOrEqual(4);
  });

  it('includes trade-off sentence with member name and score when a member scores < 70', () => {
    const input: ExplanationInput = {
      recommendation: 'SecureVault',
      runnerUp: 'ThreatSense',
      runnerUpGroupScore: 55,
      memberScores: { u1: 80, u2: 55, u3: 72 },
      groupScore: 68,
      roleAllocation: { u1: 'Security Engineer' },
      conflicts: [],
    };
    const result = generate(input, MEMBERS);
    const tradeOffSentence = result.find((s) => s.includes('Bob') && s.includes('55'));
    expect(tradeOffSentence).toBeTruthy();
    expect(tradeOffSentence).toContain('trade-off');
  });

  it('includes both conflict descriptions when two conflicts are provided', () => {
    const input: ExplanationInput = {
      recommendation: 'AI Accessibility Tool',
      runnerUp: 'EduBot',
      memberScores: { u1: 72, u2: 68, u3: 65 },
      groupScore: 65,
      roleAllocation: {},
      conflicts: [
        { type: 'budget', severity: 'low', affectedUserIds: ['u1', 'u3'], description: 'Budget range varies: $150 to $500' },
        { type: 'interest', severity: 'low', affectedUserIds: ['u1', 'u2', 'u3'], description: 'No shared interests across the full group' },
      ],
    };
    const result = generate(input, MEMBERS);
    const fullText = result.join(' ');
    expect(fullText).toContain('Budget range varies');
    expect(fullText).toContain('No shared interests');
  });

  it('closing sentence contains "Strong consensus" when stddev < 10', () => {
    // All scores closely aligned → low variance
    const input: ExplanationInput = {
      recommendation: 'CollabSpace',
      runnerUp: 'OpenBudget',
      memberScores: { u1: 72, u2: 73, u3: 74 }, // stddev ≈ 0.8
      groupScore: 73,
      roleAllocation: {},
      conflicts: [],
    };
    const result = generate(input, MEMBERS);
    const closing = result[result.length - 1]!;
    expect(closing).toContain('Strong consensus');
  });

  it('closing sentence contains "Weak consensus" when stddev > 20', () => {
    // Scores spread far apart → high variance
    const input: ExplanationInput = {
      recommendation: 'ThreatSense',
      runnerUp: 'SecureVault',
      memberScores: { u1: 90, u2: 40, u3: 85 }, // stddev ≈ 22.7
      groupScore: 60,
      roleAllocation: {},
      conflicts: [],
    };
    const result = generate(input, MEMBERS);
    const closing = result[result.length - 1]!;
    expect(closing).toContain('Weak consensus');
  });
});
