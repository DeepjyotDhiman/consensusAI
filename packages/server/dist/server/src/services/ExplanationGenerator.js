// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------
function stddev(values) {
    if (values.length === 0)
        return 0;
    const mean = values.reduce((a, b) => a + b, 0) / values.length;
    const variance = values.reduce((a, b) => a + Math.pow(b - mean, 2), 0) / values.length;
    return Math.sqrt(variance);
}
// ---------------------------------------------------------------------------
// Main export
// ---------------------------------------------------------------------------
export function generate(output, members) {
    const sentences = [];
    // 1. Opening sentence (always)
    const gap = output.runnerUpGroupScore != null
        ? Math.round(output.groupScore - output.runnerUpGroupScore)
        : 0;
    const gapText = Math.abs(gap);
    sentences.push(gapText > 0
        ? `The group reached consensus on '${output.recommendation}' with a group score of ${Math.round(output.groupScore)}%, beating runner-up '${output.runnerUp}' by ${gapText} points.`
        : `The group reached consensus on '${output.recommendation}' with a group score of ${Math.round(output.groupScore)}%.`);
    // 2. Per low-scorer (score < 70)
    const memberMap = new Map(members.map((m) => [m.userId, m.displayName]));
    const tradeOffAdded = [];
    for (const [userId, score] of Object.entries(output.memberScores)) {
        if (score < 70) {
            const name = memberMap.get(userId) ?? userId;
            sentences.push(`${name} accepted a trade-off (score: ${Math.round(score)}%) to support the group direction.`);
            tradeOffAdded.push(userId);
        }
    }
    // 3. One sentence per conflict
    for (const conflict of output.conflicts) {
        sentences.push(conflict.description);
    }
    // 4. Closing sentence based on stddev
    const scores = Object.values(output.memberScores);
    const sd = stddev(scores);
    let closing;
    if (sd < 10) {
        closing =
            "Strong consensus — member satisfaction is closely aligned.";
    }
    else if (sd <= 20) {
        closing =
            "Moderate consensus — some members have reservations but the choice is supported.";
    }
    else {
        closing =
            "Weak consensus — significant disagreement exists; consider revisiting priorities.";
    }
    sentences.push(closing);
    // Ensure minimum 3 sentences; if no trade-offs and no conflicts, add filler
    if (tradeOffAdded.length === 0 && output.conflicts.length === 0) {
        sentences.splice(1, 0, "All members are well-matched to this project.");
    }
    return sentences;
}
//# sourceMappingURL=ExplanationGenerator.js.map