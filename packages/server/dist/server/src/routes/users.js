import { Router } from "express";
import db from "../db/db.js";
export const usersRouter = Router();
function rowToUser(row) {
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
            .prepare("SELECT * FROM users ORDER BY created_at ASC")
            .all();
        res.json({ data: { users: rows.map(rowToUser) } });
    }
    catch (err) {
        next(err);
    }
});
//# sourceMappingURL=users.js.map