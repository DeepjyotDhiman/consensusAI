import { Router, type IRouter } from "express";
import db from "../db/db.js";
import type { ConsensusOutput, Conflict } from "@consensus/shared";
import { authenticateToken, type AuthenticatedRequest } from "../middleware/authMiddleware.js";

export const consensusRouter: IRouter = Router();

// ---------------------------------------------------------------------------
// Row shape
// ---------------------------------------------------------------------------
interface ConsensusResultRow {
  id: string;
  group_id: string;
  candidate_id: string;
  recommendation: string;
  runner_up: string;
  member_scores: string;
  group_score: number;
  role_allocation: string;
  conflicts: string;
  explanation: string;
  generated_at: number;
}

// ---------------------------------------------------------------------------
// GET /api/v1/consensus/:groupId/latest — latest consensus result
// ---------------------------------------------------------------------------
consensusRouter.get(
  "/:groupId/latest",
  authenticateToken,
  (req: AuthenticatedRequest, res, next) => {
  try {
     const groupId = req.params["groupId"] ?? "";

  const isMember = db
    .prepare<[string, string]>(
      "SELECT 1 FROM group_members WHERE group_id = ? AND user_id = ?"
    )
    .get(groupId, req.user!.userId);

  if (!isMember) {
    res.status(403).json({
      error: "You are not a member of this group.",
    });
    return;
  }
    const row = db
      .prepare<[string], ConsensusResultRow>(
        `SELECT * FROM consensus_results
         WHERE group_id = ?
         ORDER BY generated_at DESC
         LIMIT 1`
      )
      .get(req.params["groupId"] ?? "");

    if (!row) {
      res.json({ data: null });
      return;
    }

    const result: ConsensusOutput & { id: string; generatedAt: number } = {
      id: row.id,
      recommendation: row.recommendation || row.candidate_id,
      candidateId: row.candidate_id,
      memberScores: JSON.parse(row.member_scores) as Record<string, number>,
      groupScore: row.group_score,
      roleAllocation: JSON.parse(row.role_allocation) as Record<string, string>,
      conflicts: JSON.parse(row.conflicts) as Conflict[],
      explanation: JSON.parse(row.explanation) as string[],
      runnerUp: row.runner_up ?? "",
      generatedAt: row.generated_at,
    };

    res.json({ data: result });
  } catch (err) {
    next(err);
  }
});
