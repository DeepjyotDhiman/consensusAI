import { Router } from "express";
import db from "../db/db.js";
import { authenticateToken } from "../middleware/authMiddleware.js";
export const consensusRouter = Router();
// ---------------------------------------------------------------------------
// GET /api/v1/consensus/:groupId/latest — latest consensus result
// ---------------------------------------------------------------------------
consensusRouter.get("/:groupId/latest", authenticateToken, (req, res, next) => {
    try {
        const groupId = req.params["groupId"] ?? "";
        const isMember = db
            .prepare("SELECT 1 FROM group_members WHERE group_id = ? AND user_id = ?")
            .get(groupId, req.user.userId);
        if (!isMember) {
            res.status(403).json({
                error: "You are not a member of this group.",
            });
            return;
        }
        const row = db
            .prepare(`SELECT * FROM consensus_results
         WHERE group_id = ?
         ORDER BY generated_at DESC
         LIMIT 1`)
            .get(req.params["groupId"] ?? "");
        if (!row) {
            res.json({ data: null });
            return;
        }
        const result = {
            id: row.id,
            recommendation: row.recommendation || row.candidate_id,
            candidateId: row.candidate_id,
            memberScores: JSON.parse(row.member_scores),
            groupScore: row.group_score,
            roleAllocation: JSON.parse(row.role_allocation),
            conflicts: JSON.parse(row.conflicts),
            explanation: JSON.parse(row.explanation),
            runnerUp: row.runner_up ?? "",
            generatedAt: row.generated_at,
        };
        res.json({ data: result });
    }
    catch (err) {
        next(err);
    }
});
//# sourceMappingURL=consensus.js.map