import db from "./db.js";

const NOW = Date.now();

// ── Users ────────────────────────────────────────────────────────────────────
const users = [
  { id: "user-alice", display_name: "Alice",  avatar_color: "#6366f1" },
  { id: "user-bob",   display_name: "Bob",    avatar_color: "#f59e0b" },
  { id: "user-carol", display_name: "Carol",  avatar_color: "#10b981" },
  { id: "user-david", display_name: "David",  avatar_color: "#3b82f6" },
  { id: "user-esha",  display_name: "Esha",   avatar_color: "#ec4899" },
];

const insertUser = db.prepare(
  `INSERT OR IGNORE INTO users (id, display_name, avatar_color, created_at)
   VALUES (@id, @display_name, @avatar_color, @created_at)`,
);

for (const u of users) {
  insertUser.run({ ...u, created_at: NOW });
}

// ── Group ────────────────────────────────────────────────────────────────────
const insertGroup = db.prepare(
  `INSERT OR IGNORE INTO groups (id, join_code, name, created_at)
   VALUES (@id, @join_code, @name, @created_at)`,
);

insertGroup.run({
  id: "group-hackathon-01",
  join_code: "HACK01",
  name: "Hackathon Team Alpha",
  created_at: NOW,
});

// ── Group Members ─────────────────────────────────────────────────────────────
const members = [
  { id: "member-alice", user_id: "user-alice" },
  { id: "member-bob",   user_id: "user-bob"   },
  { id: "member-carol", user_id: "user-carol" },
  { id: "member-david", user_id: "user-david" },
  { id: "member-esha",  user_id: "user-esha"  },
];

const insertMember = db.prepare(
  `INSERT OR IGNORE INTO group_members (id, group_id, user_id, joined_at)
   VALUES (@id, @group_id, @user_id, @joined_at)`,
);

for (const m of members) {
  insertMember.run({ ...m, group_id: "group-hackathon-01", joined_at: NOW });
}

// ── Preferences (Alice, Bob, Carol only) ─────────────────────────────────────
const insertPref = db.prepare(
  `INSERT OR IGNORE INTO preferences
     (id, group_member_id, skills, availability_hours, budget,
      interests, learning_goals, priorities, notes, updated_at)
   VALUES
     (@id, @group_member_id, @skills, @availability_hours, @budget,
      @interests, @learning_goals, @priorities, @notes, @updated_at)`,
);

// Alice — AI/ML focus, high budget, high availability
insertPref.run({
  id: "pref-alice",
  group_member_id: "member-alice",
  skills: JSON.stringify([]),
  availability_hours: 20,
  budget: 500,
  interests: JSON.stringify([]),
  learning_goals: JSON.stringify([]),
  priorities: JSON.stringify(["impact", "learning"]),
  notes: "",
  updated_at: NOW,
});

// Bob — Frontend focus with AI interest, low budget (conflict driver), mid availability
insertPref.run({
  id: "pref-bob",
  group_member_id: "member-bob",
  skills: JSON.stringify([]),
  availability_hours: 15,
  budget: 200,
  interests: JSON.stringify([]),
  learning_goals: JSON.stringify([]),
  priorities: JSON.stringify(["creativity", "learning"]),
  notes: "",
  updated_at: NOW,
});

// Carol — Cybersecurity + AI focus, mid budget, mid availability (conflict: tightest budget vs Alice)
insertPref.run({
  id: "pref-carol",
  group_member_id: "member-carol",
  skills: JSON.stringify([]),
  availability_hours: 15,
  budget: 150,
  interests: JSON.stringify([]),
  learning_goals: JSON.stringify([]),
  priorities: JSON.stringify(["security", "impact"]),
  notes: "",
  updated_at: NOW,
});

// David and Esha intentionally have NO preferences row (live demo entry)

console.log("✅ Seed complete.");
console.log("   Users:        5 (Alice, Bob, Carol, David, Esha)");
console.log("   Groups:       1 (HACK01 — Hackathon Team Alpha)");
console.log("   Members:      5");
console.log("   Preferences:  3 (Alice, Bob, Carol) — David & Esha pending live entry");
