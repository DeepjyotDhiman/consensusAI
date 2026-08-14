import { Router, type IRouter } from "express";
import { z } from "zod";
import { v4 as uuidv4 } from "uuid";
import db from "../db/db.js";
import { validate } from "../middleware/validate.js";
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

const createUserSchema = z.object({
  displayName: z.string().min(1, "displayName is required"),
  avatarColor: z.string().optional(),
});

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

// POST /api/v1/users
usersRouter.post("/", validate(createUserSchema), (req, res, next) => {
  try {
    const { displayName, avatarColor } = req.body as z.infer<typeof createUserSchema>;
    const id = `user-${uuidv4().substring(0, 8)}`;
    const color = avatarColor || "#6366f1";
    const createdAt = Date.now();

    db.prepare(
      "INSERT INTO users (id, display_name, avatar_color, created_at) VALUES (?, ?, ?, ?)"
    ).run(id, displayName, color, createdAt);

    const user: User = {
      id,
      displayName,
      avatarColor: color,
      createdAt,
    };

    res.status(201).json({ data: { user } });
  } catch (err) {
    next(err);
  }
});
