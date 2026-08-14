import { Router } from "express";
import db from "../db/db.js";
export const consensusRouter = Router();
// ---------------------------------------------------------------------------
// GET /api/v1/consensus/:groupId/latest — latest consensus result
// ---------------------------------------------------------------------------
consensusRouter.get("/:groupId/latest", (req, res, next) => {
    try {
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