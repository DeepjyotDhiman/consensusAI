import type { Candidate, Preference } from "@consensus/shared";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------
export interface MemberScoreBreakdown {
  interestScore: number;
  skillScore: number;
  availabilityScore: number;
  budgetScore: number;
  learningScore: number;
  total: number;
}

export interface CandidateScoreResult {
  memberScores: Record<string, number>;
  memberBreakdowns: Record<string, MemberScoreBreakdown>;
  averageSatisfaction: number;
  groupScore: number;
}

function toArray(val: string[] | string | undefined | null): string[] {
  if (!val) return [];
  if (Array.isArray(val)) return val.map(String).filter(Boolean);
  if (typeof val === "string") return val.split(",").map((s) => s.trim()).filter(Boolean);
  return [];
}

const COMMON_SKILL_ALIASES: Record<string, string[]> = {
  "ml": ["machine learning", "ai", "artificial intelligence", "deep learning", "nlp", "llm", "data science"],
  "machine learning": ["ml", "ai", "artificial intelligence", "deep learning", "nlp", "llm", "data science"],
  "ai": ["artificial intelligence", "machine learning", "ml", "nlp", "llm", "deep learning", "data science"],
  "react": ["reactjs", "react.js", "frontend", "web", "angular", "vue", "nextjs", "next.js", "svelte"],
  "angular": ["frontend", "web", "react", "vue", "typescript", "javascript"],
  "vue": ["frontend", "web", "react", "angular", "vuejs", "javascript"],
  "typescript": ["ts", "javascript", "js", "frontend", "backend", "fullstack"],
  "python": ["py", "python3", "django", "fastapi", "flask", "backend", "data science"],
  "postgresql": ["postgres", "sql", "psql", "database", "db", "mysql", "mongodb"],
  "sql": ["postgresql", "postgres", "mysql", "database", "db", "sqlite", "nosql", "mongodb"],
  "ui design": ["ui", "ux", "figma", "design", "ui/ux", "wireframing", "product design", "adobe xd"],
  "network security": ["security", "cybersecurity", "infosec", "crypto", "ethical hacking"],
  "cryptography": ["crypto", "security", "blockchain", "web3"],
  "css": ["tailwind", "styling", "html/css", "frontend", "sass", "scss", "bootstrap"],
  "flutter": ["mobile", "dart", "react native", "android", "ios", "crossplatform"],
  "data analysis": ["data science", "pandas", "numpy", "python", "sql", "analytics", "bi", "tableau"],
  "data visualization": ["d3", "chartjs", "tableau", "powerbi", "matplotlib", "seaborn", "frontend"],
  "project management": ["management", "agile", "scrum", "lead", "leadership", "jira"],
  "linux": ["devops", "systems", "bash", "shell", "docker", "cloud", "unix"],
};

function normalize(str: string): string {
  return str.toLowerCase().replace(/[^a-z0-9]/g, "");
}

function skillsMatch(memberSkill: string, requiredSkill: string): boolean {
  const m = memberSkill.toLowerCase().trim();
  const r = requiredSkill.toLowerCase().trim();
  const normM = normalize(m);
  const normR = normalize(r);

  if (m === r || normM === normR) return true;
  if (normM.includes(normR) || normR.includes(normM)) return true;

  const aliasesR = COMMON_SKILL_ALIASES[r] || [];
  if (aliasesR.some((a) => {
    const normA = normalize(a);
    return normM === normA || normM.includes(normA) || normA.includes(normM);
  })) {
    return true;
  }

  const aliasesM = COMMON_SKILL_ALIASES[m] || [];
  if (aliasesM.some((a) => {
    const normA = normalize(a);
    return normR === normA || normR.includes(normA) || normA.includes(normR);
  })) {
    return true;
  }

  return false;
}

// ---------------------------------------------------------------------------
// Score a single member against a candidate (0-100)
// ---------------------------------------------------------------------------
export function scoreMember(
  candidate: Candidate,
  member: { preferences: Preference }
): MemberScoreBreakdown {
  const prefs = member.preferences;
  const interests = toArray(prefs.interests);
  const skills = toArray(prefs.skills);
  const learningGoals = toArray(prefs.learningGoals);

  // Interest match (0-30)
  let interestScore: number;
  if (interests.length === 0) {
    interestScore = 15; // neutral
  } else {
    const domainTagsLower = candidate.domainTags.map((t) => t.toLowerCase());
    const matched = interests.filter((i: string) => {
      const iLower = i.toLowerCase();
      return domainTagsLower.some((dt) => dt.includes(iLower) || iLower.includes(dt));
    }).length;
    interestScore = Math.min(30, (matched / interests.length) * 30);
  }

  // Skill match (0-25)
  let skillScore: number;
  if (candidate.requiredSkills.length === 0) {
    skillScore = 25;
  } else {
    const matched = candidate.requiredSkills.filter((rs) =>
      skills.some((ms) => skillsMatch(ms, rs))
    ).length;
    skillScore = (matched / candidate.requiredSkills.length) * 25;
  }

  // Availability (0-20)
  let availabilityScore: number;
  if (candidate.minHoursPerWeek === 0) {
    availabilityScore = 20;
  } else {
    availabilityScore =
      Math.min((prefs.availabilityHours || 0) / candidate.minHoursPerWeek, 1) * 20;
  }

  // Budget (0-15)
  let budgetScore: number;
  if (candidate.costPerMember === 0 || prefs.budget === null || prefs.budget === undefined) {
    budgetScore = 15; // No budget constraint or zero cost candidate
  } else {
    budgetScore = Math.min(Number(prefs.budget) / candidate.costPerMember, 1) * 15;
  }

  // Learning goal match (0-10)
  let learningScore: number;
  if (learningGoals.length === 0) {
    learningScore = 5; // neutral
  } else {
    const domainTagsLower = candidate.domainTags.map((t) => t.toLowerCase());
    const matched = learningGoals.filter((lg: string) => {
      const lgLower = lg.toLowerCase();
      return domainTagsLower.some((dt) => dt.includes(lgLower) || lgLower.includes(dt));
    }).length;
    learningScore = Math.min(10, (matched / learningGoals.length) * 10);
  }

  const total = Math.round(
    interestScore + skillScore + availabilityScore + budgetScore + learningScore
  );

  return {
    interestScore: Math.round(interestScore * 100) / 100,
    skillScore: Math.round(skillScore * 100) / 100,
    availabilityScore: Math.round(availabilityScore * 100) / 100,
    budgetScore: Math.round(budgetScore * 100) / 100,
    learningScore: Math.round(learningScore * 100) / 100,
    total,
  };
}

// ---------------------------------------------------------------------------
// Score all members against a candidate, return group stats
// ---------------------------------------------------------------------------
export function scoreCandidate(
  candidate: Candidate,
  members: Array<{ userId: string; preferences: Preference }>
): CandidateScoreResult {
  const memberScores: Record<string, number> = {};
  const memberBreakdowns: Record<string, MemberScoreBreakdown> = {};

  for (const member of members) {
    const breakdown = scoreMember(candidate, member);
    memberScores[member.userId] = breakdown.total;
    memberBreakdowns[member.userId] = breakdown;
  }

  const values = Object.values(memberScores);

  if (values.length === 0) {
    return { memberScores, memberBreakdowns, averageSatisfaction: 0, groupScore: 0 };
  }

  const mean = values.reduce((a, b) => a + b, 0) / values.length;
  const variance =
    values.reduce((a, b) => a + Math.pow(b - mean, 2), 0) / values.length;
  const stddev = Math.sqrt(variance);
  const groupScore = Math.max(0, Math.min(100, mean - 0.5 * stddev));

  return {
    memberScores,
    memberBreakdowns,
    averageSatisfaction: Math.round(mean * 100) / 100,
    groupScore: Math.round(groupScore * 100) / 100,
  };
}
