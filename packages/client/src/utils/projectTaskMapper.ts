import {
  classifySkillMatch,
  normalizeSkill,
  allocateProjectRoles,
  type SkillMatchTier,
  type MemberRoleAssignment,
} from '@consensus/shared';

export interface ProjectSkillProfile {
  projectName: string;
  requiredSkills: string[];
  roleMapping: Record<string, string>;
  defaultRole: string;
}

export const REAL_WORLD_PROJECT_SKILL_MAP: Record<string, ProjectSkillProfile> = {
  'AI Accessibility Tool': {
    projectName: 'AI Accessibility Tool',
    requiredSkills: ['Machine Learning', 'Python', 'Data Analysis'],
    roleMapping: {
      'machine learning': 'ML & Speech Model Lead',
      python: 'Backend Accessibility Engineer',
      'data analysis': 'Model Performance Analyst',
      react: 'Adaptive Interface Developer',
    },
    defaultRole: 'Accessibility AI Specialist',
  },
  'Community Design System': {
    projectName: 'Community Design System',
    requiredSkills: ['React', 'TypeScript', 'CSS', 'UI Design'],
    roleMapping: {
      react: 'Component Library Architect',
      typescript: 'Design System TypeScript Lead',
      css: 'Design Tokens & CSS Specialist',
      'ui design': 'UI/UX Visual Lead',
      figma: 'Figma Token Specialist',
    },
    defaultRole: 'Design System Contributor',
  },
  'SecureVault': {
    projectName: 'SecureVault',
    requiredSkills: ['Network Security', 'Python', 'Cryptography'],
    roleMapping: {
      'network security': 'Security Architecture Lead',
      python: 'Core Vault Backend Engineer',
      cryptography: 'Zero-Knowledge Crypto Specialist',
      linux: 'Hardened Infrastructure Lead',
    },
    defaultRole: 'Security & Systems Engineer',
  },
  'CityData Dashboard': {
    projectName: 'CityData Dashboard',
    requiredSkills: ['SQL', 'Data Visualization', 'PostgreSQL'],
    roleMapping: {
      sql: 'Data Pipeline & Query Lead',
      'data visualization': 'Visualization & Maps Lead',
      postgresql: 'Database Architect',
      react: 'Dashboard Frontend Engineer',
    },
    defaultRole: 'Data Platform Developer',
  },
  'PeerSupport Platform': {
    projectName: 'PeerSupport Platform',
    requiredSkills: ['React', 'Project Management', 'Community Outreach'],
    roleMapping: {
      react: 'Support Platform Frontend Lead',
      'project management': 'Product & Delivery Manager',
      'community outreach': 'Community & Volunteer Lead',
      'ui design': 'Empathy-Driven UX Designer',
    },
    defaultRole: 'Platform Contributor',
  },
  'EduBot': {
    projectName: 'EduBot',
    requiredSkills: ['Machine Learning', 'Python', 'React'],
    roleMapping: {
      'machine learning': 'Adaptive Learning ML Lead',
      python: 'Conversational AI Backend Engineer',
      react: 'Student Chat UI Developer',
      fastapi: 'Tutoring API Lead',
    },
    defaultRole: 'AI Feature Developer',
  },
  'OpenBudget': {
    projectName: 'OpenBudget',
    requiredSkills: ['React', 'TypeScript', 'Data Visualization', 'SQL'],
    roleMapping: {
      react: 'Financial Visualization UI Lead',
      typescript: 'Full-Stack TypeScript Engineer',
      'data visualization': 'Treemap & Chart Specialist',
      sql: 'Public Ledger Query Specialist',
    },
    defaultRole: 'Open Data Engineer',
  },
  'ThreatSense': {
    projectName: 'ThreatSense',
    requiredSkills: ['Network Security', 'Machine Learning', 'Python', 'Linux'],
    roleMapping: {
      'network security': 'Packet Inspection Lead',
      'machine learning': 'Anomaly Detection ML Lead',
      python: 'Detection Engine Developer',
      linux: 'Systems & Kernel Specialist',
    },
    defaultRole: 'Intrusion Detection Engineer',
  },
  'HealthTracker': {
    projectName: 'HealthTracker',
    requiredSkills: ['SQL', 'Data Analysis', 'Data Visualization'],
    roleMapping: {
      sql: 'Health Analytics Database Lead',
      'data analysis': 'Epidemiological Data Analyst',
      'data visualization': 'Trend Visualisation Specialist',
      react: 'Public Health UI Developer',
    },
    defaultRole: 'Health Informatics Developer',
  },
  'CollabSpace': {
    projectName: 'CollabSpace',
    requiredSkills: ['React', 'TypeScript', 'CSS', 'Project Management'],
    roleMapping: {
      react: 'Canvas & Realtime UI Architect',
      typescript: 'WebSocket & State Lead',
      css: 'Interactive Styling Specialist',
      'project management': 'Sprint & Collaboration Manager',
    },
    defaultRole: 'Real-Time Systems Developer',
  },
  'E-commerce': {
    projectName: 'E-commerce Platform',
    requiredSkills: ['React', 'Node.js', 'MongoDB', 'Stripe', 'Tailwind'],
    roleMapping: {
      react: 'Storefront UI Architect',
      'node.js': 'Order Service & API Lead',
      mongodb: 'Product Catalog Database Admin',
      stripe: 'Payment Gateway Integration Lead',
      tailwind: 'CSS & Design Tokens Lead',
    },
    defaultRole: 'E-commerce Developer',
  },
  'Mobile App': {
    projectName: 'Cross-Platform Mobile App',
    requiredSkills: ['Flutter', 'Firebase', 'Dart', 'UI/UX'],
    roleMapping: {
      flutter: 'Mobile App Lead Developer',
      firebase: 'Cloud Database & Auth Engineer',
      dart: 'State Management Specialist',
      'ui/ux': 'Mobile UX Designer',
    },
    defaultRole: 'Mobile Engineer',
  },
  'SaaS Platform': {
    projectName: 'SaaS Web Application',
    requiredSkills: ['Next.js', 'TypeScript', 'PostgreSQL', 'Prisma', 'Tailwind'],
    roleMapping: {
      'next.js': 'Full-Stack Next.js Lead',
      typescript: 'TypeScript Systems Architect',
      postgresql: 'Database Administrator',
      prisma: 'ORM & Data Layer Engineer',
      tailwind: 'UI Styling Lead',
    },
    defaultRole: 'SaaS Platform Developer',
  },
};

export function getProjectProfile(projectName?: string | null): ProjectSkillProfile | null {
  if (!projectName || !projectName.trim()) {
    return null;
  }

  const cleanName = projectName.trim();
  const normInput = normalizeSkill(cleanName);
  const keys = Object.keys(REAL_WORLD_PROJECT_SKILL_MAP);

  // Exact or containment match against known key dictionary
  const matchedKey = keys.find((k) => {
    const normK = normalizeSkill(k);
    return normInput === normK || normInput.includes(normK) || normK.includes(normInput);
  });

  if (matchedKey && REAL_WORLD_PROJECT_SKILL_MAP[matchedKey]) {
    return REAL_WORLD_PROJECT_SKILL_MAP[matchedKey]!;
  }

  // Dynamic project profile generation for custom unique project names
  const inferredSkills: string[] = [];
  const roleMapping: Record<string, string> = {};

  if (normInput.includes('ai') || normInput.includes('ml') || normInput.includes('nlp') || normInput.includes('vision') || normInput.includes('data') || normInput.includes('bot')) {
    inferredSkills.push('Python', 'Machine Learning', 'Data Analysis');
    roleMapping['machine learning'] = `${cleanName} ML Engineer`;
    roleMapping['python'] = `${cleanName} Backend Developer`;
    roleMapping['data analysis'] = `${cleanName} Data Analyst`;
  }
  if (normInput.includes('mobile') || normInput.includes('app') || normInput.includes('flutter') || normInput.includes('ios') || normInput.includes('android')) {
    inferredSkills.push('Flutter', 'Firebase', 'UI Design');
    roleMapping['flutter'] = `${cleanName} Mobile Lead`;
    roleMapping['firebase'] = `${cleanName} Cloud Engineer`;
    roleMapping['ui design'] = `${cleanName} Mobile UX Designer`;
  }
  if (normInput.includes('security') || normInput.includes('auth') || normInput.includes('crypto') || normInput.includes('shield') || normInput.includes('vault')) {
    inferredSkills.push('Network Security', 'Cryptography', 'Python');
    roleMapping['network security'] = `${cleanName} Security Lead`;
    roleMapping['cryptography'] = `${cleanName} Cryptography Engineer`;
    roleMapping['python'] = `${cleanName} Backend Security Dev`;
  }

  // Ensure baseline full-stack stack if none matched specifically
  if (inferredSkills.length === 0) {
    inferredSkills.push('React', 'TypeScript', 'Node.js', 'UI Design', 'PostgreSQL');
    roleMapping['react'] = `${cleanName} Frontend Lead`;
    roleMapping['typescript'] = `${cleanName} TypeScript Architect`;
    roleMapping['node.js'] = `${cleanName} Backend Engineer`;
    roleMapping['ui design'] = `${cleanName} UI/UX Designer`;
    roleMapping['postgresql'] = `${cleanName} Database Engineer`;
  }

  return {
    projectName: cleanName,
    requiredSkills: Array.from(new Set(inferredSkills)),
    roleMapping,
    defaultRole: `${cleanName} Contributor`,
  };
}

export function computeTaskAssignments(
  projectName: string | undefined | null,
  members: Array<{ id: string; userId: string; displayName: string; avatarColor?: string }>,
  preferencesMap: Record<string, any>,
  customRequiredSkills?: string[]
) {
  const profile = getProjectProfile(projectName);
  if (!profile && (!customRequiredSkills || customRequiredSkills.length === 0)) {
    return {
      profile: null,
      assigned: [],
      standby: members,
      missingSkills: [],
      transferableSkills: [],
      roleAssignments: [] as MemberRoleAssignment[],
    };
  }

  const effectiveTitle = projectName?.trim() || profile?.projectName || 'Project';
  const requiredSkills =
    customRequiredSkills && customRequiredSkills.length > 0
      ? customRequiredSkills
      : profile?.requiredSkills || [];

  const memberProfiles = members.map((m) => {
    const pref = preferencesMap[m.id] || preferencesMap[m.userId];
    let skills: string[] = [];
    if (Array.isArray(pref?.skills)) {
      skills = pref.skills.map(String);
    } else if (typeof pref?.skills === 'string') {
      skills = pref.skills.split(',').map((s: string) => s.trim()).filter(Boolean);
    }

    let learningGoals: string[] = [];
    if (Array.isArray(pref?.learningGoals)) {
      learningGoals = pref.learningGoals.map(String);
    } else if (typeof pref?.learningGoals === 'string') {
      learningGoals = pref.learningGoals.split(',').map((s: string) => s.trim()).filter(Boolean);
    }

    let interests: string[] = [];
    if (Array.isArray(pref?.interests)) {
      interests = pref.interests.map(String);
    } else if (typeof pref?.interests === 'string') {
      interests = pref.interests.split(',').map((s: string) => s.trim()).filter(Boolean);
    }

    return {
      userId: m.userId || m.id,
      displayName: m.displayName,
      skills,
      learningGoals,
      interests,
    };
  });

  const { roleAllocation, roleAssignments, uncoveredSkills } = allocateProjectRoles(
    {
      title: effectiveTitle,
      requiredSkills,
    },
    memberProfiles
  );

  const assignedMap = new Map(roleAssignments.map((ra) => [ra.userId, ra]));

  const assigned = members.map((m) => {
    const ra = assignedMap.get(m.userId) || assignedMap.get(m.id);
    return {
      member: m,
      task: ra?.roleTitle || roleAllocation[m.userId] || roleAllocation[m.id] || 'Contributor',
      roleName: ra?.roleTitle || roleAllocation[m.userId] || roleAllocation[m.id] || 'Contributor',
      matchedSkill: ra?.matchedSkill || '',
      matchTier: ra?.matchTier || ('NONE' as SkillMatchTier),
      matchWeight: ra?.matchTier === 'DIRECT' ? 1.0 : ra?.matchTier === 'CLOSE' ? 0.75 : ra?.matchTier === 'ADJACENT' ? 0.45 : 0,
      responsibilities: ra?.responsibilities || [],
      rationale: ra?.rationale || '',
      rampUpAreas: ra?.rampUpAreas || [],
    };
  });

  return {
    profile: profile || {
      projectName: effectiveTitle,
      requiredSkills,
      roleMapping: {},
      defaultRole: 'Contributor',
    },
    assigned,
    standby: [],
    missingSkills: uncoveredSkills,
    transferableSkills: [],
    roleAssignments,
  };
}
