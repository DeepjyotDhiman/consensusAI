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
  budget: number | null;
  interests: string;
  learning_goals: string;
  priorities: string;
  notes: string;
  submitted_at: number | null;
  updated_at: number;
}

interface GroupMemberRow {
  id: string;
  group_id: string;
  user_id: string;
  role: string;
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
function parseArrayField(input: any): string[] {
  if (Array.isArray(input)) return input.filter(Boolean).map(String);
  if (typeof input === "string") {
    try {
      const parsed = JSON.parse(input);
      if (Array.isArray(parsed)) return parsed.filter(Boolean).map(String);
    } catch {
      /* not JSON string, parse as CSV */
    }
    return input.split(",").map((s) => s.trim()).filter(Boolean);
  }
  return [];
}

function rowToPreference(row: PreferenceRow): Preference {
  return {
    id: row.id,
    groupMemberId: row.group_member_id,
    skills: parseArrayField(row.skills),
    availabilityHours: Number(row.availability_hours) || 0,
    budget: row.budget != null ? Number(row.budget) : null,
    interests: parseArrayField(row.interests),
    learningGoals: parseArrayField(row.learning_goals),
    priorities: parseArrayField(row.priorities),
    notes: row.notes || "",
    submittedAt: row.submitted_at ?? null,
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
    budget: null,
    interests: [],
    learningGoals: [],
    priorities: [],
    notes: "",
    submittedAt: null,
  };

  const merged: Preference = {
    ...base,
    ...data,
    skills: parseArrayField(data.skills ?? base.skills),
    interests: parseArrayField(data.interests ?? base.interests),
    learningGoals: parseArrayField(data.learningGoals ?? base.learningGoals),
    priorities: parseArrayField(data.priorities ?? base.priorities),
    availabilityHours: Number(data.availabilityHours ?? base.availabilityHours) || 0,
    // Budget: null means "not set"; 0 means explicitly zero
    budget: data.budget !== undefined
      ? (data.budget === null ? null : Number(data.budget))
      : base.budget,
    // submittedAt: only set forward (never clear a submission)
    submittedAt: data.submittedAt !== undefined
      ? data.submittedAt
      : (base.submittedAt ?? null),
    groupMemberId,
  };

  db.prepare(
    `INSERT OR REPLACE INTO preferences
       (id, group_member_id, skills, availability_hours, budget,
        interests, learning_goals, priorities, notes, submitted_at, updated_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
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
    merged.submittedAt ?? null,
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
      role: (memberRow.role === "leader" ? "leader" : "member") as "leader" | "member",
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
