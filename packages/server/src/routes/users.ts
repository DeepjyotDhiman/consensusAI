import { Router, type IRouter } from "express";
import db from "../db/db.js";
import type { User } from "@consensus/shared";

export const usersRouter: IRouter = Router();

interface UserRow {
  id: string;
  display_name: string;
  avatar_color: string;
  created_at: number;
}

function rowToUser(row: UserRow): User {
  return {
    id: row.id,
    displayName: row.display_name,
    avatarColor: row.avatar_color,
    createdAt: row.created_at,
  };
}



// GET /api/v1/users
usersRouter.get("/", (_req, res, next) => {
  try {
    const rows = db
      .prepare<[], UserRow>("SELECT * FROM users ORDER BY created_at ASC")
      .all();
    res.json({ data: { users: rows.map(rowToUser) } });
  } catch (err) {
    next(err);
  }
});
