import { describe, it, expect } from 'vitest';
import { allocateProjectRoles } from '@consensus/shared';

describe('Project Role & Task Allocation Engine', () => {
  it('allocates distinct roles and concrete tasks for a normal project based on actual requirements', () => {
    const project = {
      title: 'AI Accessibility Tool',
      requiredSkills: ['Machine Learning', 'Python', 'Data Analysis'],
    };

    const members = [
      {
        userId: 'u1',
        displayName: 'Alice',
        skills: ['Machine Learning', 'Python'],
      },
      {
        userId: 'u2',
        displayName: 'Bob',
        skills: ['Python', 'SQL'],
      },
      {
        userId: 'u3',
        displayName: 'Charlie',
        skills: ['Data Analysis', 'Tableau'],
      },
    ];

    const result = allocateProjectRoles(project, members);

    expect(result.roleAssignments.length).toBe(3);
    expect(result.roleAllocation['u1']).toContain('ML');
    expect(result.roleAllocation['u2']).toContain('Python');
    expect(result.roleAllocation['u3']).toContain('Data');

    // Verify concrete responsibilities are generated
    const aliceAssignment = result.roleAssignments.find((a) => a.userId === 'u1')!;
    expect(aliceAssignment.responsibilities.length).toBeGreaterThanOrEqual(2);
    expect(aliceAssignment.matchTier).toBe('DIRECT');
    expect(result.uncoveredSkills.length).toBe(0);
  });

  it('allocates roles for a unique project with custom requirements without falling back to unrelated projects', () => {
    const uniqueProject = {
      title: 'EcoMetrics Dashboard',
      requiredSkills: ['React', 'TypeScript', 'Data Visualization', 'SQL'],
    };

    const members = [
      {
        userId: 'dev1',
        displayName: 'FrontendLead',
        skills: ['React', 'TypeScript'],
      },
      {
        userId: 'dev2',
        displayName: 'VizEngineer',
        skills: ['Data Visualization', 'D3'],
      },
      {
        userId: 'dev3',
        displayName: 'DataLead',
        skills: ['SQL', 'PostgreSQL'],
      },
    ];

    const result = allocateProjectRoles(uniqueProject, members);

    expect(result.roleAssignments.length).toBe(3);
    expect(result.roleAllocation['dev1']).toBe('Frontend UI Architect');
    expect(result.roleAllocation['dev2']).toBe('Data Visualization Specialist');
    expect(result.roleAllocation['dev3']).toBe('Database & Query Optimization Lead');

    // 1 uncovered skill remaining ('TypeScript' or 'React' covered by dev1, 'Data Visualization' by dev2, 'SQL' by dev3)
    expect(result.uncoveredSkills).toContain('TypeScript');
  });

  it('identifies missing skills when team does not cover all project requirements', () => {
    const project = {
      title: 'SecureVault',
      requiredSkills: ['Network Security', 'Cryptography', 'Python'],
    };

    const members = [
      {
        userId: 'sec1',
        displayName: 'SecurityDev',
        skills: ['Network Security'],
      },
      {
        userId: 'py1',
        displayName: 'PyDev',
        skills: ['Python'],
      },
    ];

    const result = allocateProjectRoles(project, members);

    expect(result.uncoveredSkills).toContain('Cryptography');
    expect(result.uncoveredSkills.length).toBe(1);
  });

  it('optimally assigns overlapping skills to avoid duplicate colliding assignments', () => {
    const project = {
      title: 'EduBot',
      requiredSkills: ['Machine Learning', 'Python', 'React'],
    };

    // Both Alice and Bob have Python; Alice also has ML, Bob also has React
    const members = [
      {
        userId: 'alice',
        displayName: 'Alice',
        skills: ['Python', 'Machine Learning'],
      },
      {
        userId: 'bob',
        displayName: 'Bob',
        skills: ['Python', 'React'],
      },
    ];

    const result = allocateProjectRoles(project, members);

    // Alice and Bob must receive distinct roles without colliding on Python
    expect(result.roleAllocation['alice']).not.toBe(result.roleAllocation['bob']);
    expect(['ML & Predictive Models Lead', 'Python Backend & API Engineer']).toContain(result.roleAllocation['alice']);
    expect(['Frontend UI Architect', 'Python Backend & API Engineer']).toContain(result.roleAllocation['bob']);
  });

  it('assigns a constructive upskilling / ramp-up role to a member with no matching skill', () => {
    const project = {
      title: 'SecureVault',
      requiredSkills: ['Network Security', 'Cryptography', 'Python'],
    };

    const members = [
      {
        userId: 'sec1',
        displayName: 'SecPro',
        skills: ['Network Security', 'Cryptography'],
      },
      {
        userId: 'py1',
        displayName: 'PythonPro',
        skills: ['Python'],
      },
      {
        userId: 'novice',
        displayName: 'NewMember',
        skills: ['Photoshop'], // No matching technical skill
        learningGoals: ['Python', 'Security'],
      },
    ];

    const result = allocateProjectRoles(project, members);

    expect(result.roleAssignments.length).toBe(3);
    const noviceAssignment = result.roleAssignments.find((a) => a.userId === 'novice')!;
    expect(noviceAssignment.matchTier).toBe('NONE');
    expect(noviceAssignment.roleTitle).toContain('Growth Contributor');
    expect(noviceAssignment.rampUpAreas).toBeDefined();
    expect(noviceAssignment.responsibilities.length).toBeGreaterThan(0);
  });
});
