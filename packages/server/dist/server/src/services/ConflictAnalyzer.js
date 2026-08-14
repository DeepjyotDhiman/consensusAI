// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------
function jaccardSimilarity(a, b) {
    if (a.length === 0 && b.length === 0)
        return 1;
    const setA = new Set(a.map((s) => s.toLowerCase()));
    const setB = new Set(b.map((s) => s.toLowerCase()));
    let intersectionSize = 0;
    for (const item of setA) {
        if (setB.has(item))
            intersectionSize++;
    }
    const unionSize = new Set([...setA, ...setB]).size;
    return unionSize === 0 ? 1 : intersectionSize / unionSize;
}
function median(values) {
    if (values.length === 0)
        return 0;
    const sorted = [...values].sort((a, b) => a - b);
    const mid = Math.floor(sorted.length / 2);
    if (sorted.length % 2 === 0) {
        return ((sorted[mid - 1] ?? 0) + (sorted[mid] ?? 0)) / 2;
    }
    return sorted[mid] ?? 0;
}
// ---------------------------------------------------------------------------
// Rule 1: Skill overlap
// ---------------------------------------------------------------------------
function detectSkillOverlapConflict(members) {
    if (members.length < 2)
        return null;
    let worstOverlap = 1;
    let worstPair = [
        members[0]?.displayName ?? "",
        members[1]?.displayName ?? "",
    ];
    for (let i = 0; i < members.length; i++) {
        for (let j = i + 1; j < members.length; j++) {
            const mi = members[i];
            const mj = members[j];
            if (!mi || !mj)
                continue;
            const overlap = jaccardSimilarity(mi.preferences.skills, mj.preferences.skills);
            if (overlap < worstOverlap) {
                worstOverlap = overlap;
                worstPair = [mi.displayName, mj.displayName];
            }
        }
    }
    if (worstOverlap >= 0.2)
        return null;
    const pct = Math.round(worstOverlap * 100);
    const severity = worstOverlap === 0 ? "high" : worstOverlap < 0.1 ? "medium" : "low";
    return {
        type: "skill",
        affectedUserIds: members.map((m) => m.userId),
        severity,
        description: `${worstPair[0]} and ${worstPair[1]} have limited skill overlap (${pct}% shared)`,
    };
}
// ---------------------------------------------------------------------------
// Rule 2: Budget conflict
// ---------------------------------------------------------------------------
function detectBudgetConflict(members) {
    if (members.length < 2)
        return null;
    const budgets = members.map((m) => m.preferences.budget);
    const med = median(budgets);
    const maxBudget = Math.max(...budgets);
    const minBudget = Math.min(...budgets);
    if (med === 0 || maxBudget <= 2 * med)
        return null;
    const ratio = maxBudget / med;
    const severity = ratio > 4 ? "high" : ratio > 3 ? "medium" : "low";
    return {
        type: "budget",
        affectedUserIds: members.map((m) => m.userId),
        severity,
        description: `Budget range varies significantly: $${minBudget} to $${maxBudget}`,
    };
}
// ---------------------------------------------------------------------------
// Rule 3: Interest conflict
// ---------------------------------------------------------------------------
function detectInterestConflict(members) {
    if (members.length < 2)
        return null;
    const interestSets = members.map((m) => new Set(m.preferences.interests.map((i) => i.toLowerCase())));
    // Intersection: start with first member's interests, keep only those in all others
    let intersection = new Set(interestSets[0] ?? []);
    for (let i = 1; i < interestSets.length; i++) {
        const currentSet = interestSets[i];
        if (!currentSet)
            continue;
        for (const item of intersection) {
            if (!currentSet.has(item)) {
                intersection.delete(item);
            }
        }
    }
    if (intersection.size > 0)
        return null;
    return {
        type: "interest",
        affectedUserIds: members.map((m) => m.userId),
        severity: "low",
        description: "No shared interests across the full group",
    };
}
// ---------------------------------------------------------------------------
// Main export
// ---------------------------------------------------------------------------
export function analyze(members) {
    const results = [
        detectSkillOverlapConflict(members),
        detectBudgetConflict(members),
        detectInterestConflict(members),
    ];
    return results.filter((c) => c !== null);
}
//# sourceMappingURL=ConflictAnalyzer.js.map