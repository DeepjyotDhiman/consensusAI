import { describe, it, expect } from 'vitest';
import { scoreMember, scoreCandidate } from '../src/services/ScoringEngine.js';
import { CANDIDATES } from '../src/data/candidates.js';
import { classifySkillMatch, assessMemberSkillFit, assessTeamSkillCoverage } from '@consensus/shared';
import type { Preference } from '@consensus/shared';

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
const aiCandidate = CANDIDATES.find((c) => c.id === 'cand-01')!;

// cand-02: Community Design System
// requiredSkills: ["React", "TypeScript", "CSS", "UI Design"]
const designCandidate = CANDIDATES.find((c) => c.id === 'cand-02')!;

describe('ScoringEngine & Tiered Skill Matching', () => {
  describe('Skill Match Classification Tiers', () => {
    it('identifies DIRECT skill matches with 1.0 weight', () => {
      expect(classifySkillMatch('React', 'React').tier).toBe('DIRECT');
      expect(classifySkillMatch('React', 'React').weight).toBe(1.0);

      expect(classifySkillMatch('react.js', 'React').tier).toBe('DIRECT');
      expect(classifySkillMatch('Node.js', 'nodejs').tier).toBe('DIRECT');
      expect(classifySkillMatch('Python3', 'Python').tier).toBe('DIRECT');
      expect(classifySkillMatch('postgres', 'PostgreSQL').tier).toBe('DIRECT');
    });

    it('identifies CLOSE skill relationships with 0.75 weight', () => {
      expect(classifySkillMatch('React Native', 'React').tier).toBe('CLOSE');
      expect(classifySkillMatch('React Native', 'React').weight).toBe(0.75);

      expect(classifySkillMatch('Deep Learning', 'Machine Learning').tier).toBe('CLOSE');
      expect(classifySkillMatch('FastAPI', 'Python').tier).toBe('CLOSE');
      expect(classifySkillMatch('Figma', 'UI Design').tier).toBe('CLOSE');
      expect(classifySkillMatch('Tailwind', 'CSS').tier).toBe('CLOSE');
    });

    it('distinguishes ADJACENT / transferable skills (0.45 weight) without treating them as identical', () => {
      // React ≠ Angular / Vue
      const vueVsReact = classifySkillMatch('Vue', 'React');
      expect(vueVsReact.tier).toBe('ADJACENT');
      expect(vueVsReact.weight).toBe(0.45);

      const angularVsReact = classifySkillMatch('Angular', 'React');
      expect(angularVsReact.tier).toBe('ADJACENT');
      expect(angularVsReact.weight).toBe(0.45);

      // Python ≠ Machine Learning
      const pythonVsMl = classifySkillMatch('Python', 'Machine Learning');
      expect(pythonVsMl.tier).toBe('ADJACENT');
      expect(pythonVsMl.weight).toBe(0.45);

      // PostgreSQL ≠ MongoDB
      const mongoVsPostgres = classifySkillMatch('MongoDB', 'PostgreSQL');
      expect(mongoVsPostgres.tier).toBe('ADJACENT');
      expect(mongoVsPostgres.weight).toBe(0.45);
    });

    it('identifies MISSING skills with 0.0 weight', () => {
      expect(classifySkillMatch('Java', 'Python').tier).toBe('NONE');
      expect(classifySkillMatch('Java', 'Python').weight).toBe(0.0);

      expect(classifySkillMatch('Photoshop', 'SQL').tier).toBe('NONE');
      expect(classifySkillMatch('CSS', 'Cryptography').tier).toBe('NONE');
    });
  });

  describe('Candidate Member Scoring', () => {
    it('scores interest match correctly (30pt max)', () => {
      const prefs = makePreference({ interests: ['AI', 'Machine Learning', 'Accessibility'] });
      const breakdown = scoreMember(aiCandidate, { preferences: prefs });
      expect(breakdown.interestScore).toBe(30);
    });

    it('scores direct skill match with full 25pt max', () => {
      const prefs = makePreference({ skills: ['Machine Learning', 'Python', 'Data Analysis'] });
      const breakdown = scoreMember(aiCandidate, { preferences: prefs });
      expect(breakdown.skillScore).toBe(25);
    });

    it('scores adjacent skills with proportional realistic feasibility rather than claiming 100%', () => {
      // User only knows Vue and Angular (adjacent to React) + JavaScript (close to TypeScript) + HTML (adjacent to CSS) + Figma (close to UI Design)
      const adjacentPrefs = makePreference({ skills: ['Vue', 'JavaScript', 'HTML', 'Figma'] });
      const { skillScore } = assessMemberSkillFit(
        ['Vue', 'JavaScript', 'HTML', 'Figma'],
        designCandidate.requiredSkills // ["React", "TypeScript", "CSS", "UI Design"]
      );
      // React: 0.45, TypeScript: 0.75, CSS: 0.45, UI Design: 0.75 -> avg weight = (0.45+0.75+0.45+0.75)/4 = 0.6 -> 0.6 * 25 = 15
      expect(skillScore).toBeLessThan(25);
      expect(skillScore).toBeGreaterThan(10);
      expect(skillScore).toBe(15);
    });

    it('scores availability correctly (20pt max)', () => {
      const prefs = makePreference({ availabilityHours: 20 }); // min is 15
      const breakdown = scoreMember(aiCandidate, { preferences: prefs });
      expect(breakdown.availabilityScore).toBe(20);
    });

    it('scores budget correctly (15pt max)', () => {
      const prefs = makePreference({ budget: 300 }); // cost is 300
      const breakdown = scoreMember(aiCandidate, { preferences: prefs });
      expect(breakdown.budgetScore).toBe(15);
    });

    it('scores learning goals correctly (10pt max)', () => {
      const prefs = makePreference({ learningGoals: ['AI', 'Machine Learning', 'Accessibility'] });
      const breakdown = scoreMember(aiCandidate, { preferences: prefs });
      expect(breakdown.learningScore).toBe(10);
    });

    it('handles neutral scores when preferences are empty/zero/null', () => {
      const prefsZero = makePreference({});
      const breakdownZero = scoreMember(aiCandidate, { preferences: prefsZero });
      expect(breakdownZero.interestScore).toBe(15); // neutral
      expect(breakdownZero.learningScore).toBe(5);  // neutral
      expect(breakdownZero.availabilityScore).toBe(0);
      expect(breakdownZero.budgetScore).toBe(0); // 0 budget for 300 cost project

      const prefsNull = makePreference({ budget: null });
      const breakdownNull = scoreMember(aiCandidate, { preferences: prefsNull });
      expect(breakdownNull.budgetScore).toBe(15); // null budget means unconstrained
    });

    it('handles CSV string skills correctly alongside array skills', () => {
      const prefsString = makePreference({ skills: 'Machine Learning, Python, Data Analysis' });
      const breakdown = scoreMember(aiCandidate, { preferences: prefsString });
      expect(breakdown.skillScore).toBe(25);
    });
  });

  describe('Team Skill Coverage Assessment', () => {
    it('identifies covered, transferable, and missing skills accurately for a team', () => {
      const teamSkills = [
        ['React', 'TypeScript'],     // Member 1
        ['Python', 'Vue'],           // Member 2
      ];
      const requiredSkills = ['React', 'TypeScript', 'CSS', 'UI Design'];

      const coverage = assessTeamSkillCoverage(teamSkills, requiredSkills);
      expect(coverage.coveredSkills).toContain('React');
      expect(coverage.coveredSkills).toContain('TypeScript');
      expect(coverage.missingSkills).toContain('CSS');
      expect(coverage.missingSkills).toContain('UI Design');
      expect(coverage.overallCoveragePercentage).toBe(50);
    });
  });

  describe('Group Candidate Feasibility & Recommendation', () => {
    it('penalizes outlier dissatisfaction via standard deviation penalization', () => {
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
        availabilityHours: 2,
        budget: 10,
        learningGoals: [],
      });
      const result = scoreCandidate(aiCandidate, [
        { userId: 'high', preferences: highPref },
        { userId: 'low', preferences: lowPref },
      ]);
      expect(result.groupScore).toBeLessThan(result.averageSatisfaction);
    });
  });
});
