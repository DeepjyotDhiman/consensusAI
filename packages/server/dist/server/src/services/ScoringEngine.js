// ---------------------------------------------------------------------------
// Score a single member against a candidate (0-100)
// ---------------------------------------------------------------------------
export function scoreMember(candidate, member) {
    const prefs = member.preferences;
    // Interest match (0-30)
    let interestScore;
    if (prefs.interests.length === 0) {
        interestScore = 15; // neutral
    }
    else {
        const domainTagsLower = new Set(candidate.domainTags.map((t) => t.toLowerCase()));
        const matched = prefs.interests.filter((i) => domainTagsLower.has(i.toLowerCase())).length;
        interestScore = (matched / prefs.interests.length) * 30;
    }
    // Skill match (0-25)
    let skillScore;
    if (candidate.requiredSkills.length === 0) {
        skillScore = 25;
    }
    else {
        const memberSkillsLower = new Set(prefs.skills.map((s) => s.toLowerCase()));
        const matched = candidate.requiredSkills.filter((rs) => memberSkillsLower.has(rs.toLowerCase())).length;
        skillScore = (matched / candidate.requiredSkills.length) * 25;
    }
    // Availability (0-20)
    let availabilityScore;
    if (candidate.minHoursPerWeek === 0) {
        availabilityScore = 20;
    }
    else {
        availabilityScore =
            Math.min(prefs.availabilityHours / candidate.minHoursPerWeek, 1) * 20;
    }
    // Budget (0-15)
    let budgetScore;
    if (candidate.costPerMember === 0) {
        budgetScore = 15;
    }
    else {
        budgetScore = Math.min(prefs.budget / candidate.costPerMember, 1) * 15;
    }
    // Learning goal match (0-10)
    let learningScore;
    if (prefs.learningGoals.length === 0) {
        learningScore = 5; // neutral
    }
    else {
        const domainTagsLower = new Set(candidate.domainTags.map((t) => t.toLowerCase()));
        const matched = prefs.learningGoals.filter((lg) => domainTagsLower.has(lg.toLowerCase())).length;
        learningScore = (matched / prefs.learningGoals.length) * 10;
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