import { Router, type IRouter } from "express";
import { CANDIDATES } from "../data/candidates.js";

export const candidatesRouter: IRouter = Router();

candidatesRouter.get("/", (_req, res) => {
  res.json({ data: { candidates: CANDIDATES } });
});
