import { Router, type IRouter } from "express";
import { z } from "zod";
import { v4 as uuidv4 } from "uuid";
import db from "../db/db.js";
import { validate } from "../middleware/validate.js";
import { hashPassword, verifyPassword, generateToken } from "../services/authService.js";
import { authenticateToken, type AuthenticatedRequest } from "../middleware/authMiddleware.js";

export const authRouter: IRouter = Router();

interface UserRow {
  id: string;
  username: string;
  password_hash: string;
  display_name: string;
  avatar_color: string;
  created_at: number;
}

const registerSchema = z.object({
  username: z.string().min(3, "Username must be at least 3 characters").max(30),
  password: z.string().min(4, "Password must be at least 4 characters"),
  displayName: z.string().min(1, "Display name is required"),
  avatarColor: z.string().optional(),
});

const loginSchema = z.object({
  username: z.string().min(1, "Username is required"),
  password: z.string().min(1, "Password is required"),
});

// POST /api/auth/register or /api/v1/auth/register
authRouter.post("/register", validate(registerSchema), (req, res, next) => {
  try {
    const { username, password, displayName, avatarColor } = req.body as z.infer<typeof registerSchema>;
    const cleanUsername = username.trim().toLowerCase();

    // Check if username already exists
    const existing = db
      .prepare<[string], UserRow>("SELECT * FROM users WHERE LOWER(username) = LOWER(?)")
      .get(cleanUsername);

    if (existing) {
      res.status(400).json({ error: "Username is already taken. Please choose another." });
      return;
    }

    const userId = `user-${uuidv4().substring(0, 8)}`;
    const color = avatarColor || "#6366f1";
    const pwdHash = hashPassword(password);
    const createdAt = Date.now();

    db.prepare(
      "INSERT INTO users (id, username, password_hash, display_name, avatar_color, created_at) VALUES (?, ?, ?, ?, ?, ?)"
    ).run(userId, cleanUsername, pwdHash, displayName.trim(), color, createdAt);

    const token = generateToken({ userId, username: cleanUsername });

    res.status(201).json({
      data: {
        token,
        user: {
          id: userId,
          username: cleanUsername,
          displayName: displayName.trim(),
          avatarColor: color,
          createdAt,
        },
      },
    });
  } catch (err) {
    next(err);
  }
});

// POST /api/auth/login or /api/v1/auth/login
authRouter.post("/login", validate(loginSchema), (req, res, next) => {
  try {
    const { username, password } = req.body as z.infer<typeof loginSchema>;
    const cleanUsername = username.trim().toLowerCase();

    const userRow = db
      .prepare<[string], UserRow>("SELECT * FROM users WHERE LOWER(username) = LOWER(?)")
      .get(cleanUsername);

    if (!userRow || !userRow.password_hash) {
      res.status(401).json({ error: "Invalid username or password." });
      return;
    }

    const isValid = verifyPassword(password, userRow.password_hash);
    if (!isValid) {
      res.status(401).json({ error: "Invalid username or password." });
      return;
    }

    const token = generateToken({ userId: userRow.id, username: cleanUsername });

    res.json({
      data: {
        token,
        user: {
          id: userRow.id,
          username: userRow.username,
          displayName: userRow.display_name,
          avatarColor: userRow.avatar_color,
          createdAt: userRow.created_at,
        },
      },
    });
  } catch (err) {
    next(err);
  }
});

// GET /api/auth/me
authRouter.get("/me", authenticateToken, (req: AuthenticatedRequest, res, next) => {
  try {
    const userId = req.user?.userId;
    if (!userId) {
      res.status(401).json({ error: "Unauthorized" });
      return;
    }

    const userRow = db
      .prepare<[string], UserRow>("SELECT * FROM users WHERE id = ?")
      .get(userId);

    if (!userRow) {
      res.status(444).json({ error: "User profile not found." });
      return;
    }

    res.json({
      data: {
        user: {
          id: userRow.id,
          username: userRow.username,
          displayName: userRow.display_name,
          avatarColor: userRow.avatar_color,
          createdAt: userRow.created_at,
        },
      },
    });
  } catch (err) {
    next(err);
  }
});
