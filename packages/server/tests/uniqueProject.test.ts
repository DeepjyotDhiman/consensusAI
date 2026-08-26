import { describe, it, expect } from 'vitest';
import { generateUniqueCandidates } from '../src/services/UniqueProjectSynthesizer.js';
import { scoreMember } from '../src/services/ScoringEngine.js';
import { MockConsensusEngine } from '../src/consensus/MockConsensusEngine.js';
import type { ConsensusInput } from '@consensus/shared';

const NOW = Date.now();

describe('Unique Project Synthesis & Evaluation', () => {
  it('generates structured unique candidates with problem statements from team profile', () => {
    const climateTeam: ConsensusInput['members'] = [
      {
        userId: 'm-1',
        displayName: 'ClimateAnalyst',
        preferences: {
          id: 'p1',
          groupMemberId: 'gm1',
          skills: ['Python', 'Data Analysis', 'Data Visualization'],
          availabilityHours: 15,
          budget: 50,
          interests: ['Climate', 'Sustainability'],
          learningGoals: ['Carbon Modeling'],
          priorities: [],
          notes: '',
          updatedAt: NOW,
        },
      },
      {
        userId: 'm-2',
        displayName: 'WebDev',
        preferences: {
          id: 'p2',
          groupMemberId: 'gm2',
          skills: ['React', 'TypeScript', 'Data Visualization'],
          availabilityHours: 20,
          budget: 50,
          interests: ['Sustainability', 'Open Data'],
          learningGoals: ['Analytics'],
          priorities: [],
          notes: '',
          updatedAt: NOW,
        },
      },
    ];

    const uniqueCandidates = generateUniqueCandidates(climateTeam);
    expect(uniqueCandidates.length).toBeGreaterThanOrEqual(1);

    const primaryConcept = uniqueCandidates[0]!;
    expect(primaryConcept.isUnique).toBe(true);
    expect(primaryConcept.problem).toBeDefined();
    expect(primaryConcept.problem!.length).toBeGreaterThan(10);
    expect(primaryConcept.domain).toBeDefined();
    expect(primaryConcept.requiredSkills.length).toBeGreaterThan(0);
    expect(primaryConcept.domainTags).toContain('Climate');
  });

  it('does NOT treat non-technical learning goals as requiredSkills, while retaining real technical required skills', () => {
    const team: ConsensusInput['members'] = [
      {
        userId: 'u1',
        displayName: 'Alice',
        preferences: {
          id: 'p1',
          groupMemberId: 'gm1',
          skills: ['Python', 'SQL'],
          availabilityHours: 15,
          budget: 50,
          interests: ['Climate', 'Sustainability'],
          learningGoals: ['Carbon Modeling', 'Decentralized Telemetry'],
          priorities: [],
          notes: '',
          updatedAt: NOW,
        },
      },
      {
        userId: 'u2',
        displayName: 'Bob',
        preferences: {
          id: 'p2',
          groupMemberId: 'gm2',
          skills: ['Python', 'React'],
          availabilityHours: 20,
          budget: 60,
          interests: ['Climate'],
          learningGoals: ['Carbon Modeling'],
          priorities: [],
          notes: '',
          updatedAt: NOW,
        },
      },
    ];

    const candidates = generateUniqueCandidates(team);
    expect(candidates.length).toBeGreaterThanOrEqual(1);

    for (const cand of candidates) {
      // Must NOT include raw learning goal text in requiredSkills
      expect(cand.requiredSkills).not.toContain('Carbon Modeling');
      expect(cand.requiredSkills).not.toContain('Decentralized Telemetry');

      // Must contain real technical skills (e.g. Python, SQL, Data Visualization)
      expect(cand.requiredSkills.some((s) => ['Python', 'SQL', 'Data Visualization', 'React'].includes(s))).toBe(true);
    }
  });

  it('evaluates learning goals separately contributing to learningScore in ScoringEngine', () => {
    const candidate = {
      id: 'unique-concept-01',
      title: 'EcoWatch Climate',
      description: 'An environmental telemetry platform.',
      domain: 'Climate & Environmental Sustainability',
      domainTags: ['Climate', 'Sustainability', 'Carbon Modeling', 'Open Data'],
      requiredSkills: ['Python', 'Data Visualization', 'SQL'],
      costPerMember: 50,
      minHoursPerWeek: 15,
      isUnique: true,
    };

    const memberWithLearningGoal = {
      preferences: {
        id: 'p1',
        groupMemberId: 'gm1',
        skills: ['Python'],
        availabilityHours: 15,
        budget: 50,
        interests: ['Climate'],
        learningGoals: ['Carbon Modeling'],
        priorities: [],
        notes: '',
        updatedAt: NOW,
      },
    };

    const memberWithoutGoal = {
      preferences: {
        id: 'p2',
        groupMemberId: 'gm2',
        skills: ['Python'],
        availabilityHours: 15,
        budget: 50,
        interests: ['Climate'],
        learningGoals: ['Quantum Computing'], // Unrelated goal
        priorities: [],
        notes: '',
        updatedAt: NOW,
      },
    };

    const score1 = scoreMember(candidate, memberWithLearningGoal);
    const score2 = scoreMember(candidate, memberWithoutGoal);

    // Learning goal aligned with candidate domainTags should score full 10 points
    expect(score1.learningScore).toBe(10);
    // Unrelated learning goal receives 0
    expect(score2.learningScore).toBe(0);
  });

  it('evaluates synthesized unique project in MockConsensusEngine against team preferences', async () => {
    const healthTeam: ConsensusInput['members'] = [
      {
        userId: 'doc-1',
        displayName: 'BioInformatics',
        preferences: {
          id: 'hp1',
          groupMemberId: 'hgm1',
          skills: ['Python', 'Data Analysis', 'FastAPI'],
          availabilityHours: 18,
          budget: 100,
          interests: ['Health', 'Biomedical'],
          learningGoals: ['Genomic Analytics'],
          priorities: [],
          notes: '',
          updatedAt: NOW,
        },
      },
      {
        userId: 'doc-2',
        displayName: 'HealthUX',
        preferences: {
          id: 'hp2',
          groupMemberId: 'hgm2',
          skills: ['React', 'TypeScript', 'UI Design'],
          availabilityHours: 15,
          budget: 80,
          interests: ['Health', 'Wellness'],
          learningGoals: ['Telehealth'],
          priorities: [],
          notes: '',
          updatedAt: NOW,
        },
      },
    ];

    const engine = new MockConsensusEngine();
    const result = await engine.generateConsensus({ members: healthTeam });

    expect(result).toBeDefined();
    expect(result.groupScore).toBeGreaterThan(0);
    expect(result.projectDetails).toBeDefined();
    expect(result.projectDetails?.domainTags.some((t) => t.toLowerCase().includes('health'))).toBe(true);
    expect(result.explanation.some((e) => e.includes('Health') || e.includes('consensus'))).toBe(true);
  });
});
