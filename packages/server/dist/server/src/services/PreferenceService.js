import { v4 as uuidv4 } from "uuid";
import db from "../db/db.js";
// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------
function rowToPreference(row) {
    return {
        id: row.id,
        groupMemberId: row.group_member_id,
        skills: JSON.parse(row.skills),
        availabilityHours: row.availability_hours,
        budget: row.budget,
        interests: JSON.parse(row.interests),
        learningGoals: JSON.parse(row.learning_goals),
        priorities: JSON.parse(row.priorities),
        notes: row.notes,
        updatedAt: row.updated_at,
    };
}
// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------
export function get(groupMemberId) {
    const row = db
        .prepare("SELECT * FROM preferences WHERE group_member_id = ?")
        .get(groupMemberId);
    return row ? rowToPreference(row) : null;
}
export function upsert(groupMemberId, data) {
    const existing = get(groupMemberId);
    const base = existing ?? {
        groupMemberId,
        skills: [],
        availabilityHours: 0,
        budget: 0,
        interests: [],
        learningGoals: [],
        priorities: [],
        notes: "",
    };
    const merged = { ...base, ...data, groupMemberId };
    db.prepare(`INSERT OR REPLACE INTO preferences
       (id, group_member_id, skills, availability_hours, budget,
        interests, learning_goals, priorities, notes, updated_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`).run(merged.id ?? uuidv4(), merged.groupMemberId, JSON.stringify(merged.skills), merged.availabilityHours, merged.budget, JSON.stringify(merged.interests), JSON.stringify(merged.learningGoals), JSON.stringify(merged.priorities), merged.notes, Date.now());
    return get(groupMemberId);
}
export function getAllForGroup(groupId) {
    const memberRows = db
        .prepare("SELECT * FROM group_members WHERE group_id = ?")
        .all(groupId);
    return memberRows.map((memberRow) => {
        const userRow = db
            .prepare("SELECT * FROM users WHERE id = ?")
            .get(memberRow.user_id);
        const member = {
            id: memberRow.id,
            groupId: memberRow.group_id,
            userId: memberRow.user_id,
            joinedAt: memberRow.joined_at,
        };
        const user = userRow
            ? {
                id: userRow.id,
                displayName: userRow.display_name,
                avatarColor: userRow.avatar_color,
                createdAt: userRow.created_at,
            }
            : { id: memberRow.user_id, displayName: "Unknown", avatarColor: "#ccc", createdAt: 0 };
        const preference = get(memberRow.id);
        return { member, user, preference };
    });
}
//# sourceMappingURL=PreferenceService.js.map