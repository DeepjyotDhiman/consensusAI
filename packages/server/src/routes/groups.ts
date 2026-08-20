import { Router, type IRouter } from "express";
import { z } from "zod";
import { v4 as uuidv4 } from "uuid";
import db from "../db/db.js";
import { validate } from "../middleware/validate.js";
import { optionalAuthenticateToken, type AuthenticatedRequest } from "../middleware/authMiddleware.js";
import type { Group, GroupMember, User } from "@consensus/shared";

export const groupsRouter: IRouter = Router();

interface GroupRow {
  id: string;
  user_id?: string;
  join_code: string;
  name: string;
  created_at: number;
}

interface GroupMemberRow {
  id: string;
  group_id: string;
  user_id: string;
  joined_at: number;
}

interface UserRow {
  id: string;
  display_name: string;
  avatar_color: string;
  created_at: number;
}

function generateJoinCode(): string {
  return Math.random().toString(36).substring(2, 8).toUpperCase();
}

function rowToGroup(row: GroupRow): Group {
  return {
    id: row.id,
    joinCode: row.join_code,
    name: row.name,
    createdAt: row.created_at,
  };
}

function rowToMember(row: GroupMemberRow): GroupMember {
  return {
    id: row.id,
    groupId: row.group_id,
    userId: row.user_id,
    joinedAt: row.joined_at,
  };
}

function rowToUser(row: UserRow): User {
  return {
    id: row.id,
    displayName: row.display_name,
    avatarColor: row.avatar_color,
    createdAt: row.created_at,
  };
}

// GET /api/v1/groups — list groups scoped by userId if provided
groupsRouter.get("/", optionalAuthenticateToken, (req: AuthenticatedRequest, res, next) => {
  try {
    const targetUserId = (req.query["userId"] as string) || req.user?.userId;
    let groupRows: GroupRow[] = [];

    if (targetUserId) {
      // Find groups created by or joined by targetUserId
      groupRows = db
        .prepare<[string, string], GroupRow>(
          `SELECT DISTINCT g.* FROM groups g 
           LEFT JOIN group_members gm ON g.id = gm.group_id 
           WHERE g.user_id = ? OR gm.user_id = ? 
           ORDER BY g.created_at DESC`
        )
        .all(targetUserId, targetUserId);
    } else {
      groupRows = db
        .prepare<[], GroupRow>("SELECT * FROM groups ORDER BY created_at DESC")
        .all();
    }

    res.json({ data: { groups: groupRows.map(rowToGroup) } });
  } catch (err) {
    next(err);
  }
});

// POST /api/v1/groups — create group
const createGroupSchema = z.object({
  name: z.string().min(1, "name is required"),
  userId: z.string().optional(),
});

groupsRouter.post(
  "/",
  optionalAuthenticateToken,
  validate(createGroupSchema),
  (req: AuthenticatedRequest, res, next) => {
    try {
      const { name, userId } = req.body as z.infer<typeof createGroupSchema>;
      const id = uuidv4();
      const joinCode = generateJoinCode();
      const createdAt = Date.now();
      const creatorUserId = req.user?.userId || userId || null;

      db.prepare(
        "INSERT INTO groups (id, user_id, join_code, name, created_at) VALUES (?, ?, ?, ?, ?)"
      ).run(id, creatorUserId, joinCode, name, createdAt);

      const group: Group = { id, joinCode, name, createdAt };
      res.status(201).json({ data: { group } });
    } catch (err) {
      next(err);
    }
  }
);

// POST /api/v1/groups/join — join group by code
const joinGroupSchema = z.object({
  joinCode: z.string().length(6, "joinCode must be exactly 6 characters"),
  userId: z.string().min(1, "userId is required"),
});

groupsRouter.post(
  "/join",
  validate(joinGroupSchema),
  (req, res, next) => {
    try {
      const { joinCode, userId } = req.body as z.infer<typeof joinGroupSchema>;

      const groupRow = db
        .prepare<[string], GroupRow>(
          "SELECT * FROM groups WHERE UPPER(join_code) = UPPER(?)"
        )
        .get(joinCode);

      if (!groupRow) {
        res.status(404).json({ error: "Group not found" });
        return;
      }

      let userRow = db
        .prepare<[string], UserRow>("SELECT * FROM users WHERE id = ?")
        .get(userId);

      if (!userRow) {
        // Auto-provision user record so preset or custom members can join seamlessly
        db.prepare(
          "INSERT INTO users (id, display_name, avatar_color, created_at) VALUES (?, ?, ?, ?)"
        ).run(userId, "Group Member", "#0d9488", Date.now());

        userRow = db
          .prepare<[string], UserRow>("SELECT * FROM users WHERE id = ?")
          .get(userId) as UserRow;
      }

      // Check if already a member
      let memberRow = db
        .prepare<[string, string], GroupMemberRow>(
          "SELECT * FROM group_members WHERE user_id = ? AND group_id = ?"
        )
        .get(userId, groupRow.id);

      if (!memberRow) {
        const memberId = uuidv4();
        const joinedAt = Date.now();
        db.prepare(
          "INSERT INTO group_members (id, group_id, user_id, joined_at) VALUES (?, ?, ?, ?)"
        ).run(memberId, groupRow.id, userId, joinedAt);

        memberRow = db
          .prepare<[string], GroupMemberRow>(
            "SELECT * FROM group_members WHERE id = ?"
          )
          .get(memberId) as GroupMemberRow;
      }

      res.json({
        data: {
          group: rowToGroup(groupRow),
          member: rowToMember(memberRow),
          user: rowToUser(userRow),
        },
      });
    } catch (err) {
      next(err);
    }
  }
);

// GET /api/v1/groups/:id — get group with members
groupsRouter.get("/:id", (req, res, next) => {
  try {
    const groupRow = db
      .prepare<[string], GroupRow>("SELECT * FROM groups WHERE id = ?")
      .get(req.params["id"] ?? "");

    if (!groupRow) {
      res.status(404).json({ error: "Group not found" });
      return;
    }

    const memberRows = db
      .prepare<[string], GroupMemberRow>(
        "SELECT * FROM group_members WHERE group_id = ?"
      )
      .all(groupRow.id);

    const members = memberRows.map((memberRow) => {
      const userRow = db
        .prepare<[string], UserRow>("SELECT * FROM users WHERE id = ?")
        .get(memberRow.user_id);

      return {
        id: memberRow.id,
        userId: memberRow.user_id,
        displayName: userRow?.display_name ?? "Unknown",
        avatarColor: userRow?.avatar_color ?? "#ccc",
        joinedAt: memberRow.joined_at,
      };
    });

    res.json({ data: { group: rowToGroup(groupRow), members } });
  } catch (err) {
    next(err);
  }
});

// DELETE /api/v1/groups/:id — delete group and associated members, preferences & consensus results
groupsRouter.delete("/:id", (req, res, next) => {
  try {
    const groupId = req.params["id"] ?? "";

    const groupRow = db
      .prepare<[string], GroupRow>("SELECT * FROM groups WHERE id = ?")
      .get(groupId);

    if (!groupRow) {
      res.status(404).json({ error: "Group not found" });
      return;
    }

    // Cascade delete preferences, group_members, consensus_results & group
    db.prepare("DELETE FROM consensus_results WHERE group_id = ?").run(groupId);
    db.prepare(
      "DELETE FROM preferences WHERE group_member_id IN (SELECT id FROM group_members WHERE group_id = ?)"
    ).run(groupId);
    db.prepare("DELETE FROM group_members WHERE group_id = ?").run(groupId);
    db.prepare("DELETE FROM groups WHERE id = ?").run(groupId);

    res.json({ data: { success: true, id: groupId } });
  } catch (err) {
    next(err);
  }
});
