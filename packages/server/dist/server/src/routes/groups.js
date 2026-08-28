import { Router } from "express";
import { z } from "zod";
import { v4 as uuidv4 } from "uuid";
import db from "../db/db.js";
import { validate } from "../middleware/validate.js";
import { optionalAuthenticateToken, authenticateToken } from "../middleware/authMiddleware.js";
export const groupsRouter = Router();
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
        role: (row.role === "leader" ? "leader" : "member"),
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
// GET /api/v1/groups — list groups scoped by userId if provided
groupsRouter.get("/", optionalAuthenticateToken, (req, res, next) => {
    try {
        const targetUserId = req.query["userId"] || req.user?.userId;
        let groupRows = [];
        if (targetUserId) {
            // Find groups created by or joined by targetUserId
            groupRows = db
                .prepare(`SELECT DISTINCT g.* FROM groups g
           LEFT JOIN group_members gm ON g.id = gm.group_id
           WHERE g.user_id = ? OR gm.user_id = ?
           ORDER BY g.created_at DESC`)
                .all(targetUserId, targetUserId);
        }
        else {
            groupRows = db
                .prepare("SELECT * FROM groups ORDER BY created_at DESC")
                .all();
        }
        res.json({ data: { groups: groupRows.map(rowToGroup) } });
    }
    catch (err) {
        next(err);
    }
});
// POST /api/v1/groups — create group (requires auth; creator is auto-joined as leader)
const createGroupSchema = z.object({
    name: z.string().min(1, "name is required"),
});
groupsRouter.post("/", authenticateToken, validate(createGroupSchema), (req, res, next) => {
    try {
        const { name } = req.body;
        const creatorUserId = req.user.userId;
        const id = uuidv4();
        const joinCode = generateJoinCode();
        const createdAt = Date.now();
        db.prepare("INSERT INTO groups (id, user_id, join_code, name, created_at) VALUES (?, ?, ?, ?, ?)").run(id, creatorUserId, joinCode, name, createdAt);
        // Auto-join creator as the group leader
        const memberId = uuidv4();
        db.prepare("INSERT INTO group_members (id, group_id, user_id, role, joined_at) VALUES (?, ?, ?, ?, ?)").run(memberId, id, creatorUserId, "leader", createdAt);
        const group = { id, joinCode, name, createdAt };
        const member = {
            id: memberId,
            groupId: id,
            userId: creatorUserId,
            role: "leader",
            joinedAt: createdAt,
        };
        res.status(201).json({ data: { group, member } });
    }
    catch (err) {
        next(err);
    }
});
// POST /api/v1/groups/join — join group by code (requires auth; must join as yourself)
const joinGroupSchema = z.object({
    joinCode: z.string().length(6, "joinCode must be exactly 6 characters"),
});
groupsRouter.post("/join", authenticateToken, validate(joinGroupSchema), (req, res, next) => {
    try {
        const { joinCode } = req.body;
        const userId = req.user.userId;
        const groupRow = db
            .prepare("SELECT * FROM groups WHERE UPPER(join_code) = UPPER(?)")
            .get(joinCode);
        if (!groupRow) {
            res.status(404).json({ error: "Group not found. Check the join code and try again." });
            return;
        }
        const userRow = db
            .prepare("SELECT * FROM users WHERE id = ?")
            .get(userId);
        if (!userRow) {
            res.status(404).json({ error: "User account not found." });
            return;
        }
        // Check if already a member
        let memberRow = db
            .prepare("SELECT * FROM group_members WHERE user_id = ? AND group_id = ?")
            .get(userId, groupRow.id);
        if (!memberRow) {
            const memberId = uuidv4();
            const joinedAt = Date.now();
            db.prepare("INSERT INTO group_members (id, group_id, user_id, role, joined_at) VALUES (?, ?, ?, ?, ?)").run(memberId, groupRow.id, userId, "member", joinedAt);
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
// GET /api/v1/groups/:id — get group with members
groupsRouter.get("/:id", authenticateToken, (req, res, next) => {
    try {
        const groupRow = db
            .prepare("SELECT * FROM groups WHERE id = ?")
            .get(req.params["id"] ?? "");
        if (!groupRow) {
            res.status(404).json({ error: "Group not found" });
            return;
        }
        const isMember = db
            .prepare("SELECT 1 FROM group_members WHERE group_id = ? AND user_id = ?")
            .get(groupRow.id, req.user.userId);
        if (!isMember) {
            res.status(403).json({
                error: "You are not a member of this group.",
            });
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
                role: memberRow.role,
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
// DELETE /api/v1/groups/:id — delete group (creator only)
groupsRouter.delete("/:id", authenticateToken, (req, res, next) => {
    try {
        const groupId = req.params["id"] ?? "";
        const groupRow = db
            .prepare("SELECT * FROM groups WHERE id = ?")
            .get(groupId);
        if (!groupRow) {
            res.status(404).json({ error: "Group not found" });
            return;
        }
        // Only allow the creator to delete the group
        if (groupRow.user_id && req.user.userId !== groupRow.user_id) {
            res.status(403).json({ error: "Only the group creator can delete this group" });
            return;
        }
        // Cascade delete preferences, group_members, consensus_results & group
        db.prepare("DELETE FROM consensus_results WHERE group_id = ?").run(groupId);
        db.prepare("DELETE FROM preferences WHERE group_member_id IN (SELECT id FROM group_members WHERE group_id = ?)").run(groupId);
        db.prepare("DELETE FROM group_members WHERE group_id = ?").run(groupId);
        db.prepare("DELETE FROM groups WHERE id = ?").run(groupId);
        res.json({ data: { success: true, id: groupId } });
    }
    catch (err) {
        next(err);
    }
});
//# sourceMappingURL=groups.js.map