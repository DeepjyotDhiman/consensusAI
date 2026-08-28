import { assessMemberSkillFit } from "@consensus/shared";
function toArray(val) {
    if (!val)
        return [];
    if (Array.isArray(val))
        return val.map(String).filter(Boolean);
    if (typeof val === "string")
        return val.split(",").map((s) => s.trim()).filter(Boolean);
    return [];
}
// ---------------------------------------------------------------------------
// Score a single member against a candidate (0-100)
// ---------------------------------------------------------------------------
export function scoreMember(candidate, member) {
    const prefs = member.preferences;
    const interests = toArray(prefs.interests);
    const skills = toArray(prefs.skills);
    const learningGoals = toArray(prefs.learningGoals);
    // Interest match (0-30)
    let interestScore;
    if (interests.length === 0) {
        interestScore = 15; // neutral
    }
    else {
        const domainTagsLower = candidate.domainTags.map((t) => t.toLowerCase());
        const matched = interests.filter((i) => {
            const iLower = i.toLowerCase();
            return domainTagsLower.some((dt) => dt.includes(iLower) || iLower.includes(dt));
        }).length;
        interestScore = Math.min(30, (matched / interests.length) * 30);
    }
    // Multi-tiered skill match (0-25) using shared skill assessment
    const { skillScore } = assessMemberSkillFit(skills, candidate.requiredSkills);
    // Availability (0-20)
    let availabilityScore;
    if (candidate.minHoursPerWeek === 0) {
        availabilityScore = 20;
    }
    else {
        availabilityScore =
            Math.min((prefs.availabilityHours || 0) / candidate.minHoursPerWeek, 1) * 20;
    }
    // Budget (0-15)
    let budgetScore;
    if (candidate.costPerMember === 0 || prefs.budget === null || prefs.budget === undefined) {
        budgetScore = 15; // No budget constraint or zero cost candidate
    }
    else {
        budgetScore = Math.min(Number(prefs.budget) / candidate.costPerMember, 1) * 15;
    }
    // Learning goal match (0-10)
    let learningScore;
    if (learningGoals.length === 0) {
        learningScore = 5; // neutral
    }
    else {
        const domainTagsLower = candidate.domainTags.map((t) => t.toLowerCase());
        const matched = learningGoals.filter((lg) => {
            const lgLower = lg.toLowerCase();
            return domainTagsLower.some((dt) => dt.includes(lgLower) || lgLower.includes(dt));
        }).length;
        learningScore = Math.min(10, (matched / learningGoals.length) * 10);
    }
    const total = Math.round(interestScore + skillScore + availabilityScore + budgetScore + learningScore);
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
export function scoreCandidate(candidate, members) {
    const memberScores = {};
    const memberBreakdowns = {};
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
    const variance = values.reduce((a, b) => a + Math.pow(b - mean, 2), 0) / values.length;
    const stddev = Math.sqrt(variance);
    const groupScore = Math.max(0, Math.min(100, mean - 0.5 * stddev));
    return {
        memberScores,
        memberBreakdowns,
        averageSatisfaction: Math.round(mean * 100) / 100,
        groupScore: Math.round(groupScore * 100) / 100,
    };
}
//# sourceMappingURL=ScoringEngine.js.map