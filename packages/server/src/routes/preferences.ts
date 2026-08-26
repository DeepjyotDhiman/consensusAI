import { Router, type IRouter } from "express";
import * as PreferenceService from "../services/PreferenceService.js";
import { authenticateToken, type AuthenticatedRequest } from "../middleware/authMiddleware.js";
import db from "../db/db.js";
export const preferencesRouter: IRouter = Router();

// ---------------------------------------------------------------------------
// GET /api/v1/preferences/:groupMemberId — read preferences for a member
// ---------------------------------------------------------------------------
preferencesRouter.get(
  "/:groupMemberId",
  authenticateToken,
  (req: AuthenticatedRequest, res, next) =>  {
  try {
    const groupMemberId = req.params["groupMemberId"] ?? "";

const memberRow = db
  .prepare<[string], { user_id: string }>(
    "SELECT user_id FROM group_members WHERE id = ?"
  )
  .get(groupMemberId);

if (!memberRow) {
  res.status(404).json({ error: "Group member not found" });
  return;
}

if (memberRow.user_id !== req.user!.userId) {
  res.status(403).json({
    error: "You can only access your own preferences.",
  });
  return;
}
    const preference = PreferenceService.get(
      req.params["groupMemberId"] ?? ""
    );
    res.json({ data: preference });
  } catch (err) {
    next(err);
  }
});
