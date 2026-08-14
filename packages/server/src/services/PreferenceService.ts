import { v4 as uuidv4 } from "uuid";
import type { Preference, GroupMember, User } from "@consensus/shared";
import db from "../db/db.js";

// ---------------------------------------------------------------------------
// Row shapes returned from SQLite (snake_case, JSON-stringified arrays)
// ---------------------------------------------------------------------------
interface PreferenceRow {
  id: string;
  group_member_id: string;
  skills: string;
  availability_hours: number;
  budget: number;
  interests: string;
  learning_goals: string;
  priorities: string;
  notes: string;
  updated_at: number;
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

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------
function rowToPreference(row: PreferenceRow): Preference {
  return {
    id: row.id,
    groupMemberId: row.group_member_id,
    skills: JSON.parse(row.skills) as string[],
    availabilityHours: row.availability_hours,
    budget: row.budget,
    interests: JSON.parse(row.interests) as string[],
    learningGoals: JSON.parse(row.learning_goals) as string[],
    priorities: JSON.parse(row.priorities) as string[],
    notes: row.notes,
    updatedAt: row.updated_at,
  };
}

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------
export function get(groupMemberId: string): Preference | null {
  const row = db
    .prepare<[string], PreferenceRow>(
      "SELECT * FROM preferences WHERE group_member_id = ?"
    )
    .get(groupMemberId);

  return row ? rowToPreference(row) : null;
}

export function upsert(
  groupMemberId: string,
  data: Partial<Preference>
): Preference {
  const existing = get(groupMemberId);
  const base: Preference = existing ?? {
    groupMemberId,
    skills: [],
    availabilityHours: 0,
    budget: 0,
    interests: [],
    learningGoals: [],
    priorities: [],
    notes: "",
  };

  const merged: Preference = { ...base, ...data, groupMemberId };

  db.prepare(
    `INSERT OR REPLACE INTO preferences
       (id, group_member_id, skills, availability_hours, budget,
        interests, learning_goals, priorities, notes, updated_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
  ).run(
    merged.id ?? uuidv4(),
    merged.groupMemberId,
    JSON.stringify(merged.skills),
    merged.availabilityHours,
    merged.budget,
    JSON.stringify(merged.interests),
    JSON.stringify(merged.learningGoals),
    JSON.stringify(merged.priorities),
    merged.notes,
    Date.now()
  );

  return get(groupMemberId) as Preference;
}

export function getAllForGroup(
  groupId: string
): Array<{ member: GroupMember; user: User; preference: Preference | null }> {
  const memberRows = db
    .prepare<[string], GroupMemberRow>(
      "SELECT * FROM group_members WHERE group_id = ?"
    )
    .all(groupId);

  return memberRows.map((memberRow) => {
    const userRow = db
      .prepare<[string], UserRow>("SELECT * FROM users WHERE id = ?")
      .get(memberRow.user_id);

    const member: GroupMember = {
      id: memberRow.id,
      groupId: memberRow.group_id,
      userId: memberRow.user_id,
      joinedAt: memberRow.joined_at,
    };

    const user: User = userRow
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
