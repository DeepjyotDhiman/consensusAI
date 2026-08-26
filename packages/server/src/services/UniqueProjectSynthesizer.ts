import type { Candidate, Preference } from "@consensus/shared";

function toArray(val: string[] | string | undefined | null): string[] {
  if (!val) return [];
  if (Array.isArray(val)) return val.map(String).map((s) => s.trim()).filter(Boolean);
  if (typeof val === "string") return val.split(",").map((s) => s.trim()).filter(Boolean);
  return [];
}

/**
 * Domain Theme Dictionary: Maps domain keywords to rich domain metadata and authentic domain technical requirements.
 */
interface DomainTheme {
  name: string;
  tags: string[];
  problemTemplate: (topic: string) => string;
  solutionTemplate: (topic: string) => string;
  namePrefixes: string[];
  nameSuffixes: string[];
  domainRequiredSkills: string[];
}

const DOMAIN_THEMES: Record<string, DomainTheme> = {
  health: {
    name: "Health & Biomedical Informatics",
    tags: ["Health", "Medical", "Wellness", "Analytics"],
    problemTemplate: (t) => `Fragmented health data and poor patient engagement in ${t}.`,
    solutionTemplate: (t) => `A secure, patient-centric analytics and telemetry platform for ${t}.`,
    namePrefixes: ["Pulse", "Vital", "Care", "Med", "Health"],
    nameSuffixes: ["Sync", "Flow", "Care", "Hub", "Track"],
    domainRequiredSkills: ["Python", "Data Analysis", "SQL"],
  },
  education: {
    name: "EdTech & Interactive Learning",
    tags: ["Education", "EdTech", "Interactive Learning", "Accessibility"],
    problemTemplate: (t) => `Lack of personalized, adaptive learning pathways in ${t}.`,
    solutionTemplate: (t) => `An adaptive interactive learning platform tailored for ${t}.`,
    namePrefixes: ["Learn", "Skill", "Edu", "Tutor", "Study"],
    nameSuffixes: ["Bridge", "Craft", "Path", "Flow", "AI"],
    domainRequiredSkills: ["React", "TypeScript", "UI Design"],
  },
  climate: {
    name: "Climate & Environmental Sustainability",
    tags: ["Climate", "Sustainability", "Open Data", "GreenTech"],
    problemTemplate: (t) => `Limited visibility and localized reporting for ${t}.`,
    solutionTemplate: (t) => `A transparent environmental monitoring and sustainability intelligence platform for ${t}.`,
    namePrefixes: ["Eco", "Green", "Terra", "Bio", "Carbon"],
    nameSuffixes: ["Sense", "Metrics", "Watch", "Grid", "Track"],
    domainRequiredSkills: ["Python", "Data Visualization", "SQL"],
  },
  security: {
    name: "Cybersecurity & Privacy Engineering",
    tags: ["Cybersecurity", "Privacy", "Security", "Infrastructure"],
    problemTemplate: (t) => `Vulnerabilities and privacy risks in decentralized ${t}.`,
    solutionTemplate: (t) => `A zero-trust hardened security audit and access management system for ${t}.`,
    namePrefixes: ["Zero", "Vault", "Shield", "Secure", "Cyber"],
    nameSuffixes: ["Guard", "Lock", "Auth", "Sense", "Shield"],
    domainRequiredSkills: ["Network Security", "Cryptography", "Python"],
  },
  community: {
    name: "CivicTech & Community Collaboration",
    tags: ["CivicTech", "Community", "Collaboration", "Social Impact"],
    problemTemplate: (t) => `Disconnected community volunteers and communication barriers in ${t}.`,
    solutionTemplate: (t) => `A real-time civic coordination and resource-sharing platform for ${t}.`,
    namePrefixes: ["Civic", "Peer", "Neighbour", "Unity", "Collab"],
    nameSuffixes: ["Connect", "Space", "Bridge", "Hub", "Commons"],
    domainRequiredSkills: ["React", "UI Design", "PostgreSQL"],
  },
  finance: {
    name: "FinTech & Open Financial Data",
    tags: ["FinTech", "Finance", "Open Data", "Analytics"],
    problemTemplate: (t) => `Opaque budgeting, hidden fees, and complex reporting in ${t}.`,
    solutionTemplate: (t) => `An open, auditable budget visualization and predictive ledger for ${t}.`,
    namePrefixes: ["Open", "Ledger", "Cash", "Fiscal", "Equi"],
    nameSuffixes: ["Budget", "Flow", "Audit", "Metric", "Wise"],
    domainRequiredSkills: ["TypeScript", "Data Analysis", "SQL"],
  },
  devtools: {
    name: "Developer Tooling & Platform Engineering",
    tags: ["DevTools", "Platform", "Productivity", "Open Source"],
    problemTemplate: (t) => `Repetitive developer friction and pipeline bottlenecks in ${t}.`,
    solutionTemplate: (t) => `An extensible developer toolkit and automated workflow orchestrator for ${t}.`,
    namePrefixes: ["Dev", "Code", "Stack", "Build", "Omni"],
    nameSuffixes: ["Forge", "Flow", "Engine", "Kit", "Craft"],
    domainRequiredSkills: ["TypeScript", "Linux", "Node.js"],
  },
};

function matchDomainTheme(interestOrTopic: string): DomainTheme {
  const norm = interestOrTopic.toLowerCase().trim();
  for (const [key, theme] of Object.entries(DOMAIN_THEMES)) {
    if (norm.includes(key) || theme.tags.some((t) => norm.includes(t.toLowerCase()))) {
      return theme;
    }
  }

  // Fallback domain theme for generic or creative interests
  return {
    name: interestOrTopic ? `${interestOrTopic} Platform` : "Collaborative Intelligence Platform",
    tags: [interestOrTopic || "Innovation", "Web", "Cloud", "Analytics"],
    problemTemplate: (t) => `Unstructured workflows and disjointed collaboration tools in ${t}.`,
    solutionTemplate: (t) => `A unified, modern data-driven collaboration workspace for ${t}.`,
    namePrefixes: ["Omni", "Core", "Smart", "Nova", "Sync"],
    nameSuffixes: ["Hub", "Studio", "Sphere", "Platform", "Lab"],
    domainRequiredSkills: ["React", "TypeScript", "SQL"],
  };
}

export function generateUniqueCandidates(
  members: Array<{ userId: string; displayName: string; preferences: Preference }>
): Candidate[] {
  if (members.length === 0) return [];

  // 1. Extract and rank team attributes
  const skillFrequency: Record<string, number> = {};
  const interestFrequency: Record<string, number> = {};
  const learningGoalFrequency: Record<string, number> = {};
  const availabilities: number[] = [];
  const budgets: number[] = [];

  for (const m of members) {
    const prefs = m.preferences;
    if (!prefs) continue;

    toArray(prefs.skills).forEach((s) => {
      skillFrequency[s] = (skillFrequency[s] || 0) + 1;
    });
    toArray(prefs.interests).forEach((i) => {
      interestFrequency[i] = (interestFrequency[i] || 0) + 1;
    });
    toArray(prefs.learningGoals).forEach((g) => {
      learningGoalFrequency[g] = (learningGoalFrequency[g] || 0) + 1;
    });

    if (prefs.availabilityHours > 0) {
      availabilities.push(prefs.availabilityHours);
    }
    if (prefs.budget !== null && prefs.budget !== undefined && Number(prefs.budget) >= 0) {
      budgets.push(Number(prefs.budget));
    }
  }

  const sortedSkills = Object.keys(skillFrequency).sort((a, b) => skillFrequency[b]! - skillFrequency[a]!);
  const sortedInterests = Object.keys(interestFrequency).sort((a, b) => interestFrequency[b]! - interestFrequency[a]!);
  const sortedLearningGoals = Object.keys(learningGoalFrequency).sort((a, b) => learningGoalFrequency[b]! - learningGoalFrequency[a]!);

  if (sortedSkills.length === 0 && sortedInterests.length === 0) {
    return [];
  }

  const avgAvailability =
    availabilities.length > 0
      ? Math.max(10, Math.round(availabilities.reduce((a, b) => a + b, 0) / availabilities.length))
      : 12;

  const avgBudget =
    budgets.length > 0
      ? Math.round(budgets.reduce((a, b) => a + b, 0) / budgets.length)
      : 50;

  const uniqueCandidates: Candidate[] = [];

  // Concept 1: Core Foundation + Domain Requirement Challenge Project
  if (sortedInterests.length > 0 || sortedSkills.length > 0) {
    const primaryInterest = sortedInterests[0] || "Innovation";
    const theme = matchDomainTheme(primaryInterest);

    // Combine 1-2 team foundation skills with 1 authentic domain technical requirement
    const requiredSkills: string[] = [];
    if (sortedSkills[0]) requiredSkills.push(sortedSkills[0]);
    if (sortedSkills[1] && !requiredSkills.includes(sortedSkills[1])) requiredSkills.push(sortedSkills[1]);

    for (const dSkill of theme.domainRequiredSkills) {
      if (!requiredSkills.some((s) => s.toLowerCase() === dSkill.toLowerCase())) {
        requiredSkills.push(dSkill);
        break; // Add 1 authentic domain requirement to avoid purely circular skill sets
      }
    }

    if (requiredSkills.length === 0) {
      requiredSkills.push("React", "TypeScript", "SQL");
    }

    const prefix = theme.namePrefixes[0] || "Smart";
    const suffix = theme.nameSuffixes[0] || "Hub";
    const title = `${prefix}${suffix} ${primaryInterest}`;

    uniqueCandidates.push({
      id: `unique-concept-01`,
      title,
      description: theme.solutionTemplate(primaryInterest),
      problem: theme.problemTemplate(primaryInterest),
      opportunity: `Leverages the team's capabilities in ${requiredSkills.slice(0, 2).join(", ")} while addressing real-world ${primaryInterest} domain needs.`,
      domain: theme.name,
      domainTags: Array.from(new Set([primaryInterest, ...theme.tags])),
      requiredSkills,
      costPerMember: Math.min(avgBudget, 100),
      minHoursPerWeek: Math.max(8, avgAvailability - 2),
      isUnique: true,
    });
  }

  // Concept 2: Upskilling & Domain Growth Project
  // Note: Learning goals (e.g. "Carbon Modeling", "Telehealth") are included in domainTags/opportunity,
  // NOT inserted raw into technical requiredSkills.
  if (sortedLearningGoals.length > 0 || sortedInterests.length > 1) {
    const targetGoal = sortedLearningGoals[0] || sortedInterests[1] || "Cloud Architecture";
    const secondaryInterest = sortedInterests[1] || sortedInterests[0] || targetGoal;
    const theme = matchDomainTheme(secondaryInterest);

    // Anchor with 1 team skill + authentic domain technical stack
    const requiredSkills: string[] = [];
    if (sortedSkills[0]) requiredSkills.push(sortedSkills[0]);

    for (const dSkill of theme.domainRequiredSkills) {
      if (!requiredSkills.some((s) => s.toLowerCase() === dSkill.toLowerCase())) {
        requiredSkills.push(dSkill);
      }
      if (requiredSkills.length >= 3) break;
    }

    if (requiredSkills.length === 0) {
      requiredSkills.push("Python", "SQL", "Data Analysis");
    }

    const prefix = theme.namePrefixes[1] || "Next";
    const suffix = theme.nameSuffixes[1] || "Flow";
    const title = `${prefix}${suffix} ${secondaryInterest}`;

    uniqueCandidates.push({
      id: `unique-concept-02`,
      title,
      description: `An advanced ${theme.name.toLowerCase()} system addressing ${secondaryInterest} needs.`,
      problem: theme.problemTemplate(secondaryInterest),
      opportunity: `Accelerates team growth and learning in ${targetGoal} through practical application in ${secondaryInterest}.`,
      domain: theme.name,
      domainTags: Array.from(new Set([secondaryInterest, targetGoal, ...theme.tags])),
      requiredSkills,
      costPerMember: Math.min(avgBudget, 150),
      minHoursPerWeek: Math.max(10, avgAvailability),
      isUnique: true,
    });
  }

  return uniqueCandidates;
}
