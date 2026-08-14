import { Router } from "express";
import { CANDIDATES } from "../data/candidates.js";
export const candidatesRouter = Router();
candidatesRouter.get("/", (_req, res) => {
    res.json({ data: { candidates: CANDIDATES } });
});
//# sourceMappingURL=candidates.js.map