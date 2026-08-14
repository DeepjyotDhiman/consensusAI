import { Router } from "express";
import { z } from "zod";
import { v4 as uuidv4 } from "uuid";
import db from "../db/db.js";
import { validate } from "../middleware/validate.js";
export const groupsRouter = Router();
// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------
function generateJoinCode() {
    return Math.random().toString(36).substring(2, 8).toUpperCase();
}
function rowToGroup(row) {
    return {
        id: row.id,
        joinCode: row.join_code,
        name: row.name,
        createdAt: row.created_at,
    };
}
function rowToMember(row) {
    return {
        id: row.id,
        groupId: row.group_id,
        userId: row.user_id,
        joinedAt: row.joined_at,
    };
}
function rowToUser(row) {
    return {
        id: row.id,
        displayName: row.display_name,
        avatarColor: row.avatar_color,
        createdAt: row.created_at,
    };
}
// ---------------------------------------------------------------------------
// POST /api/v1/groups — create group
// ---------------------------------------------------------------------------
const createGroupSchema = z.object({
    name: z.string().min(1, "name is required"),
});
groupsRouter.post("/", validate(createGroupSchema), (req, res, next) => {
    try {
        const { name } = req.body;
        const id = uuidv4();
        const joinCode = generateJoinCode();
        const createdAt = Date.now();
        db.prepare("INSERT INTO groups (id, join_code, name, created_at) VALUES (?, ?, ?, ?)").run(id, joinCode, name, createdAt);
        const group = { id, joinCode, name, createdAt };
        res.status(201).json({ data: { group } });
    }
    catch (err) {
        next(err);
    }
});
// ---------------------------------------------------------------------------
// POST /api/v1/groups/join — join group by code
// ---------------------------------------------------------------------------
const joinGroupSchema = z.object({
    joinCode: z.string().length(6, "joinCode must be exactly 6 characters"),
    userId: z.string().min(1, "userId is required"),
});
groupsRouter.post("/join", validate(joinGroupSchema), (req, res, next) => {
    try {
        const { joinCode, userId } = req.body;
        const groupRow = db
            .prepare("SELECT * FROM groups WHERE UPPER(join_code) = UPPER(?)")
            .get(joinCode);
        if (!groupRow) {
            res.status(404).json({ error: "Group not found" });
            return;
        }
        const userRow = db
            .prepare("SELECT * FROM users WHERE id = ?")
            .get(userId);
        if (!userRow) {
            res.status(404).json({ error: "User not found" });
            return;
        }
        // Check if already a member
        let memberRow = db
            .prepare("SELECT * FROM group_members WHERE user_id = ? AND group_id = ?")
            .get(userId, groupRow.id);
        if (!memberRow) {
            const memberId = uuidv4();
            const joinedAt = Date.now();
            db.prepare("INSERT INTO group_members (id, group_id, user_id, joined_at) VALUES (?, ?, ?, ?)").run(memberId, groupRow.id, userId, joinedAt);
            memberRow = db
                .prepare("SELECT * FROM group_members WHERE id = ?")
                .get(memberId);
        }
        res.json({
            data: {
                group: rowToGroup(groupRow),
                member: rowToMember(memberRow),
                user: rowToUser(userRow),
            },
        });
    }
    catch (err) {
        next(err);
    }
});
// ---------------------------------------------------------------------------
// GET /api/v1/groups/:id — get group with members
// ---------------------------------------------------------------------------
groupsRouter.get("/:id", (req, res, next) => {
    try {
        const groupRow = db
            .prepare("SELECT * FROM groups WHERE id = ?")
            .get(req.params["id"] ?? "");
        if (!groupRow) {
            res.status(404).json({ error: "Group not found" });
            return;
        }
        const memberRows = db
            .prepare("SELECT * FROM group_members WHERE group_id = ?")
            .all(groupRow.id);
        const members = memberRows.map((memberRow) => {
            const userRow = db
                .prepare("SELECT * FROM users WHERE id = ?")
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
    }
    catch (err) {
        next(err);
    }
});
//# sourceMappingURL=groups.js.map