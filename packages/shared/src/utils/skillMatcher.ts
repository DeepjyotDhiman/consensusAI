import type { SkillMatchTier, SkillMatchAssessment, TeamSkillCoverage } from "../types/consensus.js";

export function normalizeSkill(str: string): string {
  if (!str) return "";
  return str.toLowerCase().replace(/[^a-z0-9]/g, "");
}

// ---------------------------------------------------------------------------
// Skill Relationships Dictionary
// ---------------------------------------------------------------------------

/**
 * Direct variations/aliases that represent essentially the identical skill.
 */
const DIRECT_EQUIVALENTS: Record<string, string[]> = {
  react: ["reactjs", "react.js", "react-js"],
  nodejs: ["node.js", "node", "expressjs", "express.js"],
  "node.js": ["nodejs", "node", "expressjs", "express.js"],
  typescript: ["ts", "type-script"],
  javascript: ["js", "es6", "ecmascript"],
  python: ["python3", "py"],
  postgresql: ["postgres", "psql"],
  golang: ["go"],
  cpp: ["c++"],
  csharp: ["c#"],
  css: ["css3"],
  html: ["html5"],
  uidesign: ["ui design", "ui/ux", "ui/ux design", "user interface design"],
  machinglearning: ["machine learning", "ml"],
  "machine learning": ["ml"],
  ml: ["machine learning"],
};

/**
 * Closely related skills (weight: 0.75) — direct specializations, ecosystems, or tightly coupled frameworks.
 */
const CLOSE_RELATIONS: Record<string, string[]> = {
  "machine learning": ["deep learning", "nlp", "llm", "pytorch", "tensorflow", "scikit-learn", "data science"],
  ml: ["deep learning", "nlp", "llm", "pytorch", "tensorflow", "scikit-learn", "data science"],
  python: ["fastapi", "django", "flask", "pandas", "numpy"],
  react: ["next.js", "nextjs", "react native", "remix"],
  typescript: ["javascript", "js", "angular"],
  angular: ["typescript", "rxjs"],
  vue: ["nuxt", "nuxtjs", "vuejs"],
  flutter: ["dart", "mobile app", "cross-platform"],
  postgresql: ["sql", "prisma", "typeorm", "supabase"],
  sql: ["postgresql", "postgres", "mysql", "sqlite", "database"],
  "ui design": ["figma", "sketch", "adobe xd", "wireframing", "product design", "design system"],
  "network security": ["cybersecurity", "infosec", "penetration testing", "ethical hacking", "firewall"],
  cryptography: ["zero-knowledge", "zk-proofs", "encryption", "blockchain", "security"],
  css: ["tailwind", "tailwindcss", "sass", "scss", "styled-components", "bootstrap"],
  linux: ["bash", "shell scripting", "unix", "sysadmin"],
  "data analysis": ["pandas", "numpy", "tableau", "power bi", "analytics", "statistics"],
  "data visualization": ["d3", "d3.js", "chart.js", "tableau", "power bi", "matplotlib", "seaborn"],
  "project management": ["agile", "scrum", "kanban", "jira", "sprint planning", "product management"],
  "community outreach": ["community management", "public relations", "advocacy", "user research"],
  docker: ["containers", "kubernetes", "k8s", "docker-compose"],
};

/**
 * Adjacent/Transferable skills (weight: 0.45) — common domain or transferable concepts, but distinctly different paradigms.
 */
const ADJACENT_RELATIONS: Record<string, string[]> = {
  "machine learning": ["python", "data analysis", "mathematics", "statistics", "ai"],
  python: ["machine learning", "backend", "scripting", "data analysis"],
  react: ["vue", "angular", "svelte", "frontend", "web development"],
  angular: ["react", "vue", "frontend"],
  vue: ["react", "angular", "frontend"],
  postgresql: ["mongodb", "mysql", "sqlite", "dynamodb", "nosql", "redis"],
  sql: ["nosql", "mongodb", "database"],
  "network security": ["linux", "networking", "docker", "cloud security", "cryptography"],
  cryptography: ["network security", "mathematics", "cybersecurity"],
  css: ["html", "ui design", "web design"],
  flutter: ["react native", "swift", "kotlin", "mobile"],
  linux: ["docker", "devops", "cloud", "aws", "kubernetes"],
  "data analysis": ["sql", "python", "data visualization", "excel"],
  "data visualization": ["react", "frontend", "data analysis", "ui design"],
  "project management": ["team leadership", "coordination", "communication", "community outreach"],
  "community outreach": ["project management", "marketing", "user support"],
  "ui design": ["css", "frontend", "user research", "accessibility"],
};

export function classifySkillMatch(
  memberSkill: string,
  targetRequiredSkill: string
): { tier: SkillMatchTier; weight: number; matchedMemberSkill: string } {
  const m = memberSkill.trim();
  const r = targetRequiredSkill.trim();
  const normM = normalizeSkill(m);
  const normR = normalizeSkill(r);

  if (!normM || !normR) {
    return { tier: "NONE", weight: 0.0, matchedMemberSkill: m };
  }

  // 1. Direct Equality or direct alias equivalence
  if (normM === normR || m.toLowerCase() === r.toLowerCase()) {
    return { tier: "DIRECT", weight: 1.0, matchedMemberSkill: m };
  }

  const directEquivR = DIRECT_EQUIVALENTS[r.toLowerCase()] || DIRECT_EQUIVALENTS[normR] || [];
  if (directEquivR.some((alias) => normalizeSkill(alias) === normM || alias.toLowerCase() === m.toLowerCase())) {
    return { tier: "DIRECT", weight: 1.0, matchedMemberSkill: m };
  }

  const directEquivM = DIRECT_EQUIVALENTS[m.toLowerCase()] || DIRECT_EQUIVALENTS[normM] || [];
  if (directEquivM.some((alias) => normalizeSkill(alias) === normR || alias.toLowerCase() === r.toLowerCase())) {
    return { tier: "DIRECT", weight: 1.0, matchedMemberSkill: m };
  }

  // 2. Close Relationship (0.75 weight)
  const closeListR = CLOSE_RELATIONS[r.toLowerCase()] || CLOSE_RELATIONS[normR] || [];
  if (closeListR.some((rel) => normalizeSkill(rel) === normM || normM.includes(normalizeSkill(rel)) || normalizeSkill(rel).includes(normM))) {
    return { tier: "CLOSE", weight: 0.75, matchedMemberSkill: m };
  }

  const closeListM = CLOSE_RELATIONS[m.toLowerCase()] || CLOSE_RELATIONS[normM] || [];
  if (closeListM.some((rel) => normalizeSkill(rel) === normR || normR.includes(normalizeSkill(rel)) || normalizeSkill(rel).includes(normR))) {
    return { tier: "CLOSE", weight: 0.75, matchedMemberSkill: m };
  }

  // Substring containment for direct compound names (e.g. "React Native" contains "React")
  if (normM.includes(normR) || normR.includes(normM)) {
    return { tier: "CLOSE", weight: 0.75, matchedMemberSkill: m };
  }

  // 3. Adjacent / Transferable Skill (0.45 weight)
  const adjListR = ADJACENT_RELATIONS[r.toLowerCase()] || ADJACENT_RELATIONS[normR] || [];
  if (adjListR.some((rel) => normalizeSkill(rel) === normM || normM.includes(normalizeSkill(rel)) || normalizeSkill(rel).includes(normM))) {
    return { tier: "ADJACENT", weight: 0.45, matchedMemberSkill: m };
  }

  const adjListM = ADJACENT_RELATIONS[m.toLowerCase()] || ADJACENT_RELATIONS[normM] || [];
  if (adjListM.some((rel) => normalizeSkill(rel) === normR || normR.includes(normalizeSkill(rel)) || normalizeSkill(rel).includes(normR))) {
    return { tier: "ADJACENT", weight: 0.45, matchedMemberSkill: m };
  }

  // 4. Missing Skill
  return { tier: "NONE", weight: 0.0, matchedMemberSkill: m };
}

/**
 * Assesses an individual member's skill fit against a candidate's required skills.
 */
export function assessMemberSkillFit(
  memberSkills: string[],
  requiredSkills: string[]
): { skillScore: number; assessments: SkillMatchAssessment[] } {
  if (requiredSkills.length === 0) {
    return { skillScore: 25, assessments: [] };
  }

  const assessments: SkillMatchAssessment[] = [];
  let totalWeight = 0;

  for (const reqSkill of requiredSkills) {
    let bestAssessment: SkillMatchAssessment = {
      requiredSkill: reqSkill,
      tier: "NONE",
      weight: 0.0,
    };

    for (const memSkill of memberSkills) {
      const match = classifySkillMatch(memSkill, reqSkill);
      if (match.weight > bestAssessment.weight) {
        bestAssessment = {
          requiredSkill: reqSkill,
          matchedMemberSkill: memSkill,
          tier: match.tier,
          weight: match.weight,
        };
      }
    }

    assessments.push(bestAssessment);
    totalWeight += bestAssessment.weight;
  }

  const normalizedScore = (totalWeight / requiredSkills.length) * 25;
  return {
    skillScore: Math.round(normalizedScore * 100) / 100,
    assessments,
  };
}

/**
 * Evaluates the entire team's aggregate skill coverage across a candidate's required skills.
 */
export function assessTeamSkillCoverage(
  teamMembersSkills: string[][],
  requiredSkills: string[]
): TeamSkillCoverage {
  if (requiredSkills.length === 0) {
    return {
      coveredSkills: [],
      transferableSkills: [],
      missingSkills: [],
      overallCoveragePercentage: 100,
    };
  }

  const coveredSkills: string[] = [];
  const transferableSkills: string[] = [];
  const missingSkills: string[] = [];
  let aggregateWeight = 0;

  for (const reqSkill of requiredSkills) {
    let bestWeight = 0;
    let bestTier: SkillMatchTier = "NONE";

    for (const memberSkills of teamMembersSkills) {
      for (const mSkill of memberSkills) {
        const match = classifySkillMatch(mSkill, reqSkill);
        if (match.weight > bestWeight) {
          bestWeight = match.weight;
          bestTier = match.tier;
        }
      }
    }

    aggregateWeight += bestWeight;

    if (bestTier === "DIRECT" || bestTier === "CLOSE") {
      coveredSkills.push(reqSkill);
    } else if (bestTier === "ADJACENT") {
      transferableSkills.push(reqSkill);
    } else {
      missingSkills.push(reqSkill);
    }
  }

  const overallCoveragePercentage = Math.round((aggregateWeight / requiredSkills.length) * 100);

  return {
    coveredSkills,
    transferableSkills,
    missingSkills,
    overallCoveragePercentage,
  };
}

// ---------------------------------------------------------------------------
// Role & Task Allocation
// ---------------------------------------------------------------------------

export interface MemberProfileInput {
  userId: string;
  displayName?: string | undefined;
  skills: string[];
  learningGoals?: string[] | undefined;
  interests?: string[] | undefined;
}

export interface ProjectRequirementsInput {
  title: string;
  requiredSkills: string[];
  description?: string | undefined;
}

export interface RoleAllocationResult {
  roleAllocation: Record<string, string>;
  roleAssignments: import("../types/consensus.js").MemberRoleAssignment[];
  uncoveredSkills: string[];
}

const SKILL_ROLE_MAP: Record<string, { roleTitle: string; responsibilities: string[] }> = {
  "machine learning": {
    roleTitle: "ML & Predictive Models Lead",
    responsibilities: ["Develop & evaluate predictive AI/ML models", "Build training and inference pipelines", "Validate model accuracy & fairness"],
  },
  ml: {
    roleTitle: "ML & Predictive Models Lead",
    responsibilities: ["Develop & evaluate predictive AI/ML models", "Build training and inference pipelines", "Validate model accuracy & fairness"],
  },
  python: {
    roleTitle: "Python Backend & API Engineer",
    responsibilities: ["Design resilient microservices & APIs", "Manage data transformation & server business logic", "Implement server security and unit tests"],
  },
  react: {
    roleTitle: "Frontend UI Architect",
    responsibilities: ["Build interactive and accessible UI views", "Manage state & client data synchronization", "Ensure responsive web performance"],
  },
  typescript: {
    roleTitle: "TypeScript Systems Lead",
    responsibilities: ["Architect type-safe data models and contracts", "Bridge frontend and backend interfaces", "Maintain code quality and modular architecture"],
  },
  "data analysis": {
    roleTitle: "Data Analyst & Insights Lead",
    responsibilities: ["Perform statistical analysis and trend modeling", "Derive actionable domain metrics from datasets", "Validate data integrity and KPIs"],
  },
  "data visualization": {
    roleTitle: "Data Visualization Specialist",
    responsibilities: ["Design charts, graphs, and visual maps", "Build interactive analytics dashboards", "Optimize visualization rendering and UX"],
  },
  sql: {
    roleTitle: "Database & Query Optimization Lead",
    responsibilities: ["Design database schemas and query structures", "Ensure high query performance and indexing", "Manage migrations and data reliability"],
  },
  postgresql: {
    roleTitle: "Relational Database Architect",
    responsibilities: ["Design relational schemas and transactional integrity", "Configure PostgreSQL storage and connection pooling", "Implement secure data persistence"],
  },
  "ui design": {
    roleTitle: "UI/UX & Product Experience Lead",
    responsibilities: ["Design user journeys, wireframes, and design systems", "Ensure intuitive usability and accessibility standards", "Prototype interactions and design tokens"],
  },
  css: {
    roleTitle: "Design Tokens & CSS Specialist",
    responsibilities: ["Implement styling systems and responsive layouts", "Manage CSS variables, tokens, and themes", "Ensure smooth transitions and polish"],
  },
  "network security": {
    roleTitle: "Security Architecture Lead",
    responsibilities: ["Perform vulnerability assessments and threat modeling", "Implement authentication & secure communication", "Audit code and environment for compliance"],
  },
  cryptography: {
    roleTitle: "Cryptography & Zero-Knowledge Specialist",
    responsibilities: ["Implement encryption protocols and key management", "Design secure hashing and proof verification", "Audit cryptographic algorithms and storage"],
  },
  linux: {
    roleTitle: "Systems & Linux Infrastructure Engineer",
    responsibilities: ["Configure Linux environments and deployment scripts", "Monitor system performance and process daemonization", "Automate server setups and container pipelines"],
  },
  flutter: {
    roleTitle: "Mobile Cross-Platform Engineer",
    responsibilities: ["Develop responsive cross-platform mobile views", "Integrate device native APIs and offline storage", "Manage app state and navigation flows"],
  },
  "project management": {
    roleTitle: "Delivery & Product Workflow Manager",
    responsibilities: ["Facilitate sprint milestones and team alignment", "Manage issue triage and delivery roadmaps", "Coordinate cross-functional tasks and demos"],
  },
  "community outreach": {
    roleTitle: "Community & User Research Lead",
    responsibilities: ["Conduct user testing and stakeholder outreach", "Collect user feedback and synthesize requirements", "Coordinate documentation and public communication"],
  },
};

export function resolveSkillRoleInfo(skill: string, projectTitle: string): { roleTitle: string; responsibilities: string[] } {
  const norm = skill.toLowerCase().trim();
  const direct = SKILL_ROLE_MAP[norm];
  if (direct) return direct;

  for (const [key, info] of Object.entries(SKILL_ROLE_MAP)) {
    if (norm.includes(key) || key.includes(norm)) {
      return info;
    }
  }

  return {
    roleTitle: `${skill} Specialist`,
    responsibilities: [
      `Lead technical implementation of ${skill} modules`,
      `Integrate ${skill} components with the ${projectTitle} platform`,
      `Ensure unit test coverage and code maintainability`,
    ],
  };
}

/**
 * Optimally assigns members to project roles based on the actual selected project requirements.
 */
export function allocateProjectRoles(
  project: ProjectRequirementsInput,
  members: MemberProfileInput[]
): RoleAllocationResult {
  const roleAllocation: Record<string, string> = {};
  const roleAssignments: import("../types/consensus.js").MemberRoleAssignment[] = [];
  const assignedUserIds = new Set<string>();
  const claimedSkills = new Set<string>();

  // Build candidate pairings between every member and every required skill
  const candidatePairings: Array<{
    member: MemberProfileInput;
    reqSkill: string;
    matchedSkill: string;
    tier: SkillMatchTier;
    weight: number;
  }> = [];

  for (const member of members) {
    for (const reqSkill of project.requiredSkills) {
      let bestMatch = { tier: "NONE" as SkillMatchTier, weight: 0, matchedMemberSkill: "" };

      for (const mSkill of member.skills) {
        const match = classifySkillMatch(mSkill, reqSkill);
        if (match.weight > bestMatch.weight) {
          bestMatch = match;
        }
      }

      if (bestMatch.weight > 0) {
        candidatePairings.push({
          member,
          reqSkill,
          matchedSkill: bestMatch.matchedMemberSkill,
          tier: bestMatch.tier,
          weight: bestMatch.weight,
        });
      }
    }
  }

  // Sort candidate pairings by weight descending (Direct matches first, then Close, then Adjacent)
  candidatePairings.sort((a, b) => b.weight - a.weight);

  // Assign distinct required skills to distinct members
  for (const pairing of candidatePairings) {
    if (assignedUserIds.has(pairing.member.userId) || claimedSkills.has(pairing.reqSkill)) {
      continue;
    }

    const { roleTitle, responsibilities } = resolveSkillRoleInfo(pairing.reqSkill, project.title);

    roleAllocation[pairing.member.userId] = roleTitle;
    claimedSkills.add(pairing.reqSkill);
    assignedUserIds.add(pairing.member.userId);

    const matchDescription =
      pairing.tier === "DIRECT"
        ? `Direct skill proficiency in ${pairing.matchedSkill}.`
        : pairing.tier === "CLOSE"
          ? `Related expertise in ${pairing.matchedSkill} aligns with ${pairing.reqSkill}.`
          : `Transferable experience in ${pairing.matchedSkill} provides adaptable foundations.`;

    roleAssignments.push({
      userId: pairing.member.userId,
      displayName: pairing.member.displayName,
      roleTitle,
      matchedSkill: pairing.matchedSkill,
      matchTier: pairing.tier,
      responsibilities,
      rationale: `${matchDescription} Leads the ${pairing.reqSkill} engineering track for ${project.title}.`,
    });
  }

 // Determine actual team coverage independently from role assignment.
// A member may cover multiple project requirements even if they receive
// only one primary role.
const coveredSkills = new Set<string>();

for (const reqSkill of project.requiredSkills) {
  const hasTeamCoverage = members.some((member) =>
    member.skills.some((memberSkill) => {
      const match = classifySkillMatch(memberSkill, reqSkill);

      // Direct and close matches count as covered.
      return match.tier === 'DIRECT' || match.tier === 'CLOSE';
    })
  );

  if (hasTeamCoverage) {
    coveredSkills.add(reqSkill);
  }
}

const uncoveredSkills = project.requiredSkills.filter(
  (skill) => !coveredSkills.has(skill)
);

  // For members not assigned to a primary required skill: assign upskilling or collaborative support role
  for (const member of members) {
    if (assignedUserIds.has(member.userId)) continue;

    assignedUserIds.add(member.userId);
    const learningGoal = member.learningGoals?.[0];
    const rampUpAreas = uncoveredSkills.length > 0 ? uncoveredSkills : project.requiredSkills;

    const roleTitle = learningGoal
      ? `${learningGoal} / Growth Contributor`
      : `${project.title} Contributor & QA`;

    const responsibilities = [
      `Support system integration and cross-functional testing`,
      `Contribute to code reviews and sprint delivery milestones`,
      `Upskill in ${rampUpAreas.slice(0, 2).join(" & ")} alongside the team`,
    ];

    roleAllocation[member.userId] = roleTitle;
    roleAssignments.push({
      userId: member.userId,
      displayName: member.displayName,
      roleTitle,
      matchTier: "NONE",
      responsibilities,
      rationale: `Supports team delivery while building proficiency in project-specific required areas.`,
      rampUpAreas,
    });
  }

  return {
    roleAllocation,
    roleAssignments,
    uncoveredSkills,
  };
}
