import type { Conflict, TeamSkillCoverage, ProjectDetails } from "@consensus/shared";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------
export interface ExplanationInput {
  recommendation: string;
  runnerUp: string;
  runnerUpGroupScore?: number;
  memberScores: Record<string, number>;
  groupScore: number;
  roleAllocation: Record<string, string>;
  conflicts: Conflict[];
  priorities?: Record<string, string[]>; // userId → priorities array (for explanation enrichment)
  skillCoverage?: TeamSkillCoverage;
  projectDetails?: ProjectDetails;
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------
function stddev(values: number[]): number {
  if (values.length === 0) return 0;
  const mean = values.reduce((a, b) => a + b, 0) / values.length;
  const variance =
    values.reduce((a, b) => a + Math.pow(b - mean, 2), 0) / values.length;
  return Math.sqrt(variance);
}

/** Return the display name for a userId from the members list, or the userId itself. */
function getName(
  userId: string,
  memberMap: Map<string, string>
): string {
  return memberMap.get(userId) ?? userId;
}

// ---------------------------------------------------------------------------
// Alignment sentence helpers
// ---------------------------------------------------------------------------
/** "Alice and Bob both score ≥ 70 — strong individual alignment." */
function alignedMembersSentence(
  scores: Record<string, number>,
  memberMap: Map<string, string>
): string | null {
  const highScorers = Object.entries(scores)
    .filter(([, s]) => s >= 70)
    .map(([uid]) => getName(uid, memberMap));
  if (highScorers.length === 0) return null;
  if (highScorers.length === 1)
    return `${highScorers[0]} is strongly aligned with this project (score ≥ 70%).`;
  const last = highScorers.pop()!;
  return `${highScorers.join(", ")} and ${last} are all strongly aligned with this project.`;
}

/** "The team's top skills directly match this project's requirements." */
function roleMatchSentence(roleAllocation: Record<string, string>): string | null {
  const roles = Object.values(roleAllocation).filter((r) => r && r !== "Unassigned");
  if (roles.length === 0) return null;
  if (roles.length === 1)
    return `The team has a direct skill match for the ${roles[0]} role.`;
  const last = roles.pop()!;
  return `The team's skills directly cover the required roles: ${roles.join(", ")}, and ${last}.`;
}

/** Adds a brief priorities mention when priorities data is available. */
function prioritiesSentence(
  priorities: Record<string, string[]>,
  memberMap: Map<string, string>
): string | null {
  const mentions: string[] = [];
  for (const [userId, prioList] of Object.entries(priorities)) {
    if (!prioList || prioList.length === 0) continue;
    const name = getName(userId, memberMap);
    mentions.push(`${name} prioritises ${prioList.slice(0, 2).join(" and ")}`);
  }
  if (mentions.length === 0) return null;
  return mentions.join("; ") + ".";
}

// ---------------------------------------------------------------------------
// Main export
// ---------------------------------------------------------------------------
export function generate(
  output: ExplanationInput,
  members: Array<{ userId: string; displayName: string }>
): string[] {
  const sentences: string[] = [];
  const memberMap = new Map(members.map((m) => [m.userId, m.displayName]));

  // 1. Opening sentence (always)
  const gap =
    output.runnerUpGroupScore != null
      ? Math.round(output.groupScore - output.runnerUpGroupScore)
      : 0;
  const gapText = Math.abs(gap);

  sentences.push(
    gapText > 0
      ? `The group reached consensus on '${output.recommendation}' with a group score of ${Math.round(output.groupScore)}%, beating runner-up '${output.runnerUp}' by ${gapText} points.`
      : `The group reached consensus on '${output.recommendation}' with a group score of ${Math.round(output.groupScore)}%.`
  );

  // 2. Unique project context if applicable
  if (output.projectDetails?.problem) {
    sentences.push(`Target problem: ${output.projectDetails.problem}`);
  }
  if (output.projectDetails?.isUnique) {
    sentences.push("Custom project recommendation: dynamically synthesized to maximize alignment with your team's specific skills and shared goals.");
  }

  // 3. Skill coverage insights (covered, transferable, missing)
  if (output.skillCoverage) {
    const { coveredSkills, transferableSkills, missingSkills } = output.skillCoverage;
    if (coveredSkills.length > 0) {
      sentences.push(`Team strengths: direct coverage for ${coveredSkills.join(", ")}.`);
    }
    if (transferableSkills.length > 0) {
      sentences.push(`Transferable skills identified: team brings adjacent experience in ${transferableSkills.join(", ")}.`);
    }
    if (missingSkills.length > 0) {
      sentences.push(`Feasibility trade-off: project requires ${missingSkills.join(", ")}, which will require upskilling.`);
    }
  }

  // 4. Alignment sentences for well-aligned groups
  const aligned = alignedMembersSentence(output.memberScores, memberMap);
  if (aligned) sentences.push(aligned);

  const roleMatch = roleMatchSentence(output.roleAllocation);
  if (roleMatch) sentences.push(roleMatch);

  // 5. Per low-scorer (score < 70) — trade-off sentences
  for (const [userId, score] of Object.entries(output.memberScores)) {
    if (score < 70) {
      const name = getName(userId, memberMap);
      sentences.push(
        `${name} accepted a trade-off (score: ${Math.round(score)}%) to support the group direction.`
      );
    }
  }

  // 6. Priorities enrichment (explanation-only, no score effect)
  if (output.priorities) {
    const prioSentence = prioritiesSentence(output.priorities, memberMap);
    if (prioSentence) sentences.push(prioSentence);
  }

  // 7. One sentence per conflict
  for (const conflict of output.conflicts) {
    sentences.push(conflict.description);
  }

  // 8. Closing sentence based on stddev
  const scores = Object.values(output.memberScores);
  const sd = stddev(scores);
  let closing: string;
  if (sd < 10) {
    closing =
      "Strong consensus — member satisfaction is closely aligned.";
  } else if (sd <= 20) {
    closing =
      "Moderate consensus — some members have reservations but the choice is supported.";
  } else {
    closing =
      "Weak consensus — significant disagreement exists; consider revisiting priorities.";
  }
  sentences.push(closing);

  // Ensure minimum 3 sentences (safety net for minimal inputs)
  if (sentences.length < 3) {
    sentences.splice(1, 0, "All members are well-matched to this project.");
  }

  return sentences;
}
