export interface ProjectSkillProfile {
  projectName: string;
  requiredSkills: string[];
  roleMapping: Record<string, string>;
  defaultRole: string;
}

export const REAL_WORLD_PROJECT_SKILL_MAP: Record<string, ProjectSkillProfile> = {
  'EduBot': {
    projectName: 'EduBot AI Chatbot',
    requiredSkills: ['Python', 'NLP', 'FastAPI', 'React'],
    roleMapping: {
      python: 'AI Model & Core Backend Engineer',
      nlp: 'NLP & Intent Classification Lead',
      fastapi: 'API Gateway Developer',
      react: 'Chat Interface Developer',
    },
    defaultRole: 'AI Feature Developer',
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
  'Portfolio': {
    projectName: 'Portfolio Website',
    requiredSkills: ['HTML', 'CSS', 'JavaScript', 'Figma'],
    roleMapping: {
      html: 'Semantic Markup & DOM Architect',
      css: 'CSS Animations & Styling Specialist',
      javascript: 'Client-Side Interactions Lead',
      figma: 'UI/UX Visual Designer',
    },
    defaultRole: 'Web Developer',
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
  'Design System': {
    projectName: 'Enterprise Design System',
    requiredSkills: ['Figma', 'UI/UX', 'CSS', 'React', 'TypeScript'],
    roleMapping: {
      figma: 'Figma Token Specialist',
      'ui/ux': 'UI/UX System Lead',
      css: 'CSS Tokens Engineer',
      react: 'Component Library Developer',
      typescript: 'TypeScript Type Safety Lead',
    },
    defaultRole: 'Design System Contributor',
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
};

const PROJECT_DICTIONARY = REAL_WORLD_PROJECT_SKILL_MAP;

export function getProjectProfile(projectName?: string): ProjectSkillProfile {
  if (!projectName) {
    return REAL_WORLD_PROJECT_SKILL_MAP['Community Design System'];
  }

  const normInput = normalizeSkill(projectName);
  const keys = Object.keys(REAL_WORLD_PROJECT_SKILL_MAP);

  // Exact or containment match against known key dictionary
  const matchedKey = keys.find((k) => {
    const normK = normalizeSkill(k);
    return normInput === normK || normInput.includes(normK) || normK.includes(normInput);
  });

  if (matchedKey) {
    return REAL_WORLD_PROJECT_SKILL_MAP[matchedKey];
  }

  // Fuzzy keyword matching for user inputs
  if (normInput.includes('shop') || normInput.includes('store') || normInput.includes('commerce') || normInput.includes('cart')) {
    return REAL_WORLD_PROJECT_SKILL_MAP['E-commerce'];
  }

  if (normInput.includes('bot') || normInput.includes('ai') || normInput.includes('chat') || normInput.includes('nlp') || normInput.includes('llm')) {
    return REAL_WORLD_PROJECT_SKILL_MAP['EduBot'];
  }

  if (normInput.includes('portfolio') || normInput.includes('personal') || normInput.includes('resume')) {
    return REAL_WORLD_PROJECT_SKILL_MAP['Portfolio'];
  }

  if (normInput.includes('mobile') || normInput.includes('flutter') || normInput.includes('ios') || normInput.includes('android')) {
    return REAL_WORLD_PROJECT_SKILL_MAP['Mobile App'];
  }

  if (normInput.includes('design') || normInput.includes('figma') || normInput.includes('ui') || normInput.includes('ux')) {
    return REAL_WORLD_PROJECT_SKILL_MAP['Design System'];
  }

  if (normInput.includes('saas') || normInput.includes('dashboard') || normInput.includes('cloud') || normInput.includes('next')) {
    return REAL_WORLD_PROJECT_SKILL_MAP['SaaS Platform'];
  }

  if (normInput.includes('web') || normInput.includes('site') || normInput.includes('frontend')) {
    return {
      projectName,
      requiredSkills: ['React', 'CSS', 'HTML', 'JavaScript', 'UI/UX'],
      roleMapping: {
        react: `${projectName} React Lead`,
        css: `${projectName} Styling Engineer`,
        html: `${projectName} HTML Specialist`,
        javascript: `${projectName} JS Developer`,
        'ui/ux': `${projectName} UI/UX Designer`,
      },
      defaultRole: `${projectName} Frontend Engineer`,
    };
  }

  // Fallback for custom unique project names
  return {
    projectName,
    requiredSkills: ['React', 'Node.js', 'TypeScript', 'Tailwind', 'Python'],
    roleMapping: {
      react: `${projectName} Frontend Lead`,
      'node.js': `${projectName} Backend Lead`,
      typescript: `${projectName} Systems Architect`,
      tailwind: `${projectName} UI Specialist`,
      python: `${projectName} Data Analyst`,
    },
    defaultRole: `${projectName} Developer`,
  };
}

/**
 * Skill Alias Dictionary: Groups of synonymous or closely related skills
 * that should be treated as interchangeable for role matching and task allocation.
 */
export const SKILL_ALIAS_GROUPS: string[][] = [
  ['ui/ux', 'ui design', 'ux design', 'ui', 'ux', 'user interface', 'user experience', 'visual design', 'design system', 'ui/ux design'],
  ['node.js', 'nodejs', 'node', 'express', 'express.js', 'expressjs', 'backend', 'backend developer'],
  ['react', 'react native', 'react.js', 'reactjs', 'frontend', 'frontend developer'],
  ['python', 'python3', 'py', 'django', 'fastapi', 'flask', 'ai model'],
  ['typescript', 'ts', 'type script'],
  ['javascript', 'js', 'es6', 'ecmascript'],
  ['css', 'css3', 'styling', 'tailwind', 'tailwindcss', 'styles', 'css tokens'],
  ['html', 'html5', 'markup', 'dom'],
  ['postgresql', 'postgres', 'sql', 'mongodb', 'mongo', 'database', 'db', 'prisma', 'sql/db'],
  ['flutter', 'dart', 'cross-platform', 'mobile app'],
  ['firebase', 'firestore', 'cloud database', 'auth'],
  ['next.js', 'nextjs', 'next', 'full-stack'],
  ['figma', 'sketch', 'adobe xd', 'wireframing', 'mockups'],
  ['nlp', 'ai', 'llm', 'machine learning', 'ml', 'intent classification', 'natural language processing'],
  ['stripe', 'payments', 'payment', 'checkout', 'billing'],
  ['accessibility', 'a11y', 'wcag'],
];

export function normalizeSkill(str: string): string {
  if (!str) return '';
  return str.toLowerCase().replace(/[^a-z0-9]/g, '');
}

/**
 * Calculates Levenshtein edit distance between two strings.
 */
export function getLevenshteinDistance(a: string, b: string): number {
  if (a.length === 0) return b.length;
  if (b.length === 0) return a.length;

  const matrix: number[][] = [];
  for (let i = 0; i <= b.length; i++) matrix[i] = [i];
  for (let j = 0; j <= a.length; j++) matrix[0][j] = j;

  for (let i = 1; i <= b.length; i++) {
    for (let j = 1; j <= a.length; j++) {
      if (b.charAt(i - 1) === a.charAt(j - 1)) {
        matrix[i][j] = matrix[i - 1][j - 1];
      } else {
        matrix[i][j] = Math.min(
          matrix[i - 1][j - 1] + 1, // substitution
          matrix[i][j - 1] + 1,     // insertion
          matrix[i - 1][j] + 1      // deletion
        );
      }
    }
  }
  return matrix[b.length][a.length];
}

/**
 * Checks if two strings are fuzzy typo matches within threshold (Levenshtein distance <= 2).
 */
export function isTypoMatch(skillA: string, skillB: string, maxDistance: number = 2): boolean {
  const normA = normalizeSkill(skillA);
  const normB = normalizeSkill(skillB);
  if (!normA || !normB) return false;

  // Short terms (length <= 4) require distance <= 1 to avoid false positives (e.g., 'ui' vs 'ux')
  const threshold = Math.min(normA.length, normB.length) <= 4 ? 1 : maxDistance;
  return getLevenshteinDistance(normA, normB) <= threshold;
}

/**
 * Checks if two skill terms match directly or via synonymous skill aliases.
 */
export function areSkillsAliased(skillA: string, skillB: string): boolean {
  const normA = normalizeSkill(skillA);
  const normB = normalizeSkill(skillB);
  if (!normA || !normB) return false;

  return SKILL_ALIAS_GROUPS.some((group) => {
    const normGroup = group.map(normalizeSkill);
    const hasA = normGroup.some((g) => normA === g || normA.includes(g) || g.includes(normA));
    const hasB = normGroup.some((g) => normB === g || normB.includes(g) || g.includes(normB));
    return hasA && hasB;
  });
}

/**
 * Intelligent skill comparison supporting exact match, string containment, skill aliases, and Levenshtein typo tolerance.
 */
export function isSkillMatch(skillA: string, skillB: string): boolean {
  const normA = normalizeSkill(skillA);
  const normB = normalizeSkill(skillB);
  if (!normA || !normB) return false;

  // 1. Direct equality or substring containment
  if (normA === normB || normA.includes(normB) || normB.includes(normA)) {
    return true;
  }

  // 2. Synonymous skill alias clusters
  if (areSkillsAliased(skillA, skillB)) {
    return true;
  }

  // 3. Typo tolerance matching (Levenshtein distance <= 2)
  return isTypoMatch(skillA, skillB, 2);
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
  const teamSkillsSet = new Set<string>();
  const claimedRequiredSkills = new Set<string>();

  members.forEach((member) => {
    const pref = preferencesMap[member.id] || preferencesMap[member.userId];
    let memberSkills: string[] = [];
    if (Array.isArray(pref?.skills)) {
      memberSkills = pref.skills.map(String);
    } else if (typeof pref?.skills === 'string') {
      memberSkills = pref.skills.split(',').map((s: string) => s.trim()).filter(Boolean);
    }

    memberSkills.forEach((s) => teamSkillsSet.add(s));

    // Priority 1: Pick an UNCLAIMED required skill that matches this member's skills (or aliases)
    let selectedReqSkill = profile.requiredSkills.find(
      (req) => !claimedRequiredSkills.has(req) && memberSkills.some((s) => isSkillMatch(s, req))
    );

    // Priority 2: If all matching required skills are claimed, pick ANY matching required skill (or alias)
    if (!selectedReqSkill) {
      selectedReqSkill = profile.requiredSkills.find(
        (req) => memberSkills.some((s) => isSkillMatch(s, req))
      );
    }

    if (selectedReqSkill) {
      claimedRequiredSkills.add(selectedReqSkill);
      const matchedMemberSkill =
        memberSkills.find((s) => isSkillMatch(s, selectedReqSkill!)) || selectedReqSkill;

      let roleName = profile.defaultRole;
      const normReq = normalizeSkill(selectedReqSkill);

      // Resolve role name matching required skill key or member matched skill or aliases
      for (const [key, role] of Object.entries(profile.roleMapping)) {
        const normKey = normalizeSkill(key);
        if (
          normReq === normKey ||
          normReq.includes(normKey) ||
          normKey.includes(normReq) ||
          isSkillMatch(matchedMemberSkill, key) ||
          isSkillMatch(selectedReqSkill, key)
        ) {
          roleName = role;
          break;
        }
      }

      assigned.push({
        member,
        matchedSkill: matchedMemberSkill,
        task: roleName,
        roleName,
      });
    } else {
      standby.push(member);
    }
  });

  // Dynamically calculate missing required skills using alias-supported comparison
  const teamSkillsArray = Array.from(teamSkillsSet);
  const missingSkills = profile.requiredSkills.filter((req) => {
    return !teamSkillsArray.some((ts) => isSkillMatch(ts, req));
  });

  return { profile, assigned, standby, missingSkills };
}
