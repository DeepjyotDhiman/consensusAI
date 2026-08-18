export interface ProjectSkillProfile {
  projectName: string;
  requiredSkills: string[];
  roleMapping: Record<string, string>;
  defaultRole: string;
}

const PROJECT_DICTIONARY: Record<string, ProjectSkillProfile> = {
  'Community Design System': {
    projectName: 'Community Design System',
    requiredSkills: ['React', 'TypeScript', 'UI/UX Design', 'Figma', 'CSS', 'Accessibility'],
    roleMapping: {
      react: 'React Component Architect',
      typescript: 'TypeScript Design System Lead',
      'ui/ux': 'UI/UX Lead Designer',
      figma: 'Figma Layout Specialist',
      css: 'CSS & Design Tokens Engineer',
      accessibility: 'A11y Compliance Specialist',
    },
    defaultRole: 'Design System Contributor',
  },
  'EduBot': {
    projectName: 'EduBot',
    requiredSkills: ['Python', 'Machine Learning', 'NLP', 'React', 'Node.js', 'FastAPI'],
    roleMapping: {
      python: 'Core AI Backend Engineer',
      'machine learning': 'NLP Model Trainer',
      nlp: 'Conversational Intent Specialist',
      react: 'Chat Interface Developer',
      'node.js': 'Realtime WebSocket Engineer',
      fastapi: 'API Gateway Developer',
    },
    defaultRole: 'EduBot Feature Developer',
  },
  'SecureVault': {
    projectName: 'SecureVault',
    requiredSkills: ['Cryptography', 'Go', 'Docker', 'PostgreSQL', 'Security', 'Rust'],
    roleMapping: {
      cryptography: 'Zero-Knowledge Security Architect',
      go: 'High-Concurrency Backend Lead',
      docker: 'Container Security & DevOps Engineer',
      postgresql: 'Encrypted Database Administrator',
      security: 'Penetration & Compliance Auditor',
      rust: 'Memory-Safe Vault Engine Developer',
    },
    defaultRole: 'Security Infrastructure Engineer',
  },
  'HealthPulse': {
    projectName: 'HealthPulse',
    requiredSkills: ['React Native', 'Swift', 'Kotlin', 'GraphQL', 'Firebase', 'Data Analytics'],
    roleMapping: {
      'react native': 'Mobile App Lead Developer',
      swift: 'iOS Telemetry Engineer',
      kotlin: 'Android Vital Tracker Lead',
      graphql: 'Patient Data Sync Architect',
      firebase: 'Realtime Alert System Developer',
      'data analytics': 'Biometric Insights Analyst',
    },
    defaultRole: 'HealthPulse Feature Engineer',
  },
};

export function getProjectProfile(projectName?: string): ProjectSkillProfile {
  if (!projectName) {
    return PROJECT_DICTIONARY['Community Design System'];
  }
  const keys = Object.keys(PROJECT_DICTIONARY);
  const matchedKey = keys.find(
    (k) => k.toLowerCase() === projectName.toLowerCase() || projectName.toLowerCase().includes(k.toLowerCase())
  );
  if (matchedKey) {
    return PROJECT_DICTIONARY[matchedKey];
  }
  return {
    projectName,
    requiredSkills: ['React', 'TypeScript', 'Node.js', 'UI/UX', 'Python'],
    roleMapping: {
      react: `${projectName} Frontend Engineer`,
      typescript: `${projectName} Systems Lead`,
      'node.js': `${projectName} Backend Developer`,
      python: `${projectName} Data Analyst`,
    },
    defaultRole: `${projectName} Developer`,
  };
}

export function computeTaskAssignments(
  projectName: string,
  members: Array<{ id: string; userId: string; displayName: string; avatarColor?: string }>,
  preferencesMap: Record<string, any>
) {
  const profile = getProjectProfile(projectName);
  const assigned: Array<{
    member: any;
    task: string;
    matchedSkill: string;
    roleName: string;
  }> = [];
  const standby: any[] = [];

  members.forEach((member) => {
    const pref = preferencesMap[member.id] || preferencesMap[member.userId];
    let memberSkills: string[] = [];
    if (Array.isArray(pref?.skills)) {
      memberSkills = pref.skills.map(String);
    } else if (typeof pref?.skills === 'string') {
      memberSkills = pref.skills.split(',').map((s: string) => s.trim()).filter(Boolean);
    }

    const matchedSkill = memberSkills.find((skill) =>
      profile.requiredSkills.some(
        (req) => req.toLowerCase() === skill.toLowerCase() || skill.toLowerCase().includes(req.toLowerCase()) || req.toLowerCase().includes(skill.toLowerCase())
      )
    ) || (memberSkills.length > 0 ? memberSkills[0] : null);

    if (matchedSkill) {
      const lowerSkill = matchedSkill.toLowerCase();
      let roleName = profile.defaultRole;
      for (const [key, role] of Object.entries(profile.roleMapping)) {
        if (lowerSkill.includes(key) || key.includes(lowerSkill)) {
          roleName = role;
          break;
        }
      }

      assigned.push({
        member,
        matchedSkill,
        task: roleName,
        roleName,
      });
    } else {
      standby.push(member);
    }
  });

  return { profile, assigned, standby };
}
