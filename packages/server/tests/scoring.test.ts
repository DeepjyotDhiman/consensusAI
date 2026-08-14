import { describe, it, expect } from 'vitest';
import { scoreMember, scoreCandidate } from '../src/services/ScoringEngine.js';
import { CANDIDATES } from '../src/data/candidates.js';
import type { Candidate, Preference } from '@consensus/shared';

const NOW = Date.now();

function makePreference(overrides: Partial<Preference> = {}): Preference {
  return {
    id: 'pref-test',
    groupMemberId: 'mem-test',
    skills: [],
    availabilityHours: 0,
    budget: 0,
    interests: [],
    learningGoals: [],
    priorities: [],
    notes: '',
    updatedAt: NOW,
    ...overrides,
  };
}

// cand-01: AI Accessibility Tool
// domainTags: ["AI", "Machine Learning", "Accessibility"]
// requiredSkills: ["Machine Learning", "Python", "Data Analysis"]
// costPerMember: 300, minHoursPerWeek: 15
const aiCandidate = CANDIDATES.find(c => c.id === 'cand-01')!;

describe('ScoringEngine', () => {
  it('scores interest match correctly (30pt max)', () => {
    // All 3 interests match all 3 domainTags → full 30pts
    const prefs = makePreference({ interests: ['AI', 'Machine Learning', 'Accessibility'] });
    const breakdown = scoreMember(aiCandidate, { preferences: prefs });
    expect(breakdown.interestScore).toBe(30);
  });

  it('scores skill match correctly (25pt max)', () => {
    // All 3 required skills present → full 25pts
    const prefs = makePreference({ skills: ['Machine Learning', 'Python', 'Data Analysis'] });
    const breakdown = scoreMember(aiCandidate, { preferences: prefs });
    expect(breakdown.skillScore).toBe(25);
  });

  it('scores availability correctly (20pt max)', () => {
    // availabilityHours >= minHoursPerWeek → full 20pts
    const prefs = makePreference({ availabilityHours: 20 }); // min is 15
    const breakdown = scoreMember(aiCandidate, { preferences: prefs });
    expect(breakdown.availabilityScore).toBe(20);
  });

  it('scores budget correctly (15pt max)', () => {
    // budget >= costPerMember → full 15pts
    const prefs = makePreference({ budget: 300 }); // cost is 300
    const breakdown = scoreMember(aiCandidate, { preferences: prefs });
    expect(breakdown.budgetScore).toBe(15);
  });

  it('scores learning goals correctly (10pt max)', () => {
    // All learning goals match domainTags → full 10pts
    const prefs = makePreference({ learningGoals: ['AI', 'Machine Learning', 'Accessibility'] });
    const breakdown = scoreMember(aiCandidate, { preferences: prefs });
    expect(breakdown.learningScore).toBe(10);
  });

  it('returns neutral scores when preferences are empty/zero', () => {
    // Empty interests → neutral 15, empty learningGoals → neutral 5, 0 availability → 0 budget → 0
    const prefs = makePreference({});
    const breakdown = scoreMember(aiCandidate, { preferences: prefs });
    expect(breakdown.interestScore).toBe(15); // neutral
    expect(breakdown.learningScore).toBe(5);  // neutral
    expect(breakdown.availabilityScore).toBe(0);
    expect(breakdown.budgetScore).toBe(0);
  });

  it('groupScore is less than averageSatisfaction when variance is high', () => {
    // One member scores high, another scores 0 → variance > 0 → groupScore < average
    const highPref = makePreference({
      skills: ['Machine Learning', 'Python', 'Data Analysis'],
      interests: ['AI', 'Machine Learning'],
      availabilityHours: 20,
      budget: 300,
      learningGoals: ['AI'],
    });
    const lowPref = makePreference({
      skills: [],
      interests: ['Gaming'],
      availabilityHours: 0,
      budget: 0,
      learningGoals: [],
    });
    const result = scoreCandidate(aiCandidate, [
      { userId: 'high', preferences: highPref },
      { userId: 'low', preferences: lowPref },
    ]);
    expect(result.groupScore).toBeLessThan(result.averageSatisfaction);
  });

  it('groupScore is clamped to [0, 100]', () => {
    const perfectPref = makePreference({
      skills: ['Machine Learning', 'Python', 'Data Analysis'],
      interests: ['AI', 'Machine Learning', 'Accessibility'],
      availabilityHours: 100,
      budget: 1000,
      learningGoals: ['AI', 'Machine Learning'],
    });
    const result = scoreCandidate(aiCandidate, [
      { userId: 'u1', preferences: perfectPref },
    ]);
    expect(result.groupScore).toBeGreaterThanOrEqual(0);
    expect(result.groupScore).toBeLessThanOrEqual(100);
  });
});
