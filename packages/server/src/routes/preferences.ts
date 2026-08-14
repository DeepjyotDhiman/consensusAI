import { Router, type IRouter } from "express";
import * as PreferenceService from "../services/PreferenceService.js";

export const preferencesRouter: IRouter = Router();

// ---------------------------------------------------------------------------
// GET /api/v1/preferences/:groupMemberId — read preferences for a member
// ---------------------------------------------------------------------------
preferencesRouter.get("/:groupMemberId", (req, res, next) => {
  try {
    const preference = PreferenceService.get(
      req.params["groupMemberId"] ?? ""
    );
    res.json({ data: preference });
  } catch (err) {
    next(err);
  }
});
