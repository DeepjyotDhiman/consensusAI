import db from "./db.js";

const NOW = Date.now();

// ── Destructive reset — clear stale consensus results and seeded preferences ──
// Running `pnpm seed` always produces a clean, predictable demo state.
// Only the three seeded preference rows and all consensus_results are cleared;
// users, groups, and group_members use INSERT OR IGNORE so they are safe to
// run multiple times without losing user accounts.

db.exec("DELETE FROM consensus_results");
db.exec(
  "DELETE FROM preferences WHERE id IN ('pref-alice','pref-bob','pref-carol')"
);

// ── Users ─────────────────────────────────────────────────────────────────────
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

// ── Group ─────────────────────────────────────────────────────────────────────
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

// ── Preferences ───────────────────────────────────────────────────────────────
// Each member is intentionally different to produce:
//   • Genuine score spread across the 10 candidate projects
//   • At least 2 detectable conflicts (budget spread + interest divergence)
//   • Meaningful role allocation (skills match winning candidate's requiredSkills)
//
// Scoring engine rules (for reference — do NOT change these here):
//   Interest match  (0–30 pts): member interests matched against candidate domainTags
//   Skill match     (0–25 pts): member skills matched against candidate requiredSkills
//   Availability    (0–20 pts): min(hours / minHoursPerWeek, 1) × 20
//   Budget          (0–15 pts): min(budget / costPerMember, 1) × 15
//   Learning goals  (0–10 pts): member learningGoals matched against candidate domainTags
//
// Conflict rules (for reference — do NOT change these here):
//   Skill overlap:  fires when worst-pair Jaccard similarity < 0.2
//   Budget spread:  fires when max > 2 × median([budgets])
//   Interest gap:   fires when full-group intersection of interests is empty

const insertPref = db.prepare(
  `INSERT INTO preferences
     (id, group_member_id, skills, availability_hours, budget,
      interests, learning_goals, priorities, notes, updated_at)
   VALUES
     (@id, @group_member_id, @skills, @availability_hours, @budget,
      @interests, @learning_goals, @priorities, @notes, @updated_at)`,
);

// ── Alice — ML/AI specialist ──────────────────────────────────────────────────
// High availability (20 hrs/wk) and high budget ($500) — no financial constraint.
// Skills exactly match cand-01 "AI Accessibility Tool" and cand-06 "EduBot"
// requiredSkills, giving her strong skill scores on AI candidates.
// Interests: "AI" and "Social Impact" match cand-01 and cand-06 domainTags directly.
// Learning goals: "Machine Learning" and "AI" match AI-domain candidate tags.
// Conflict driver: her $500 budget vs Carol's $150 creates a 3.3× budget spread
// (median=200, max=500, 500 > 2×200 → budget conflict fires, severity "low").
// Interest conflict: Alice has "AI"/"Social Impact" — no overlap with Carol's
// "Cybersecurity"/"Privacy", so full-group interest intersection is empty.
insertPref.run({
  id: "pref-alice",
  group_member_id: "member-alice",
  skills:            JSON.stringify(["Machine Learning", "Python", "Data Analysis"]),
  availability_hours: 20,
  budget:             500,
  interests:         JSON.stringify(["AI", "Social Impact"]),
  learning_goals:    JSON.stringify(["Machine Learning", "AI"]),
  priorities:        JSON.stringify(["impact", "learning"]),
  notes: "Focused on AI/ML applications with real-world social impact.",
  updated_at: NOW,
});

// ── Bob — Frontend/React developer ───────────────────────────────────────────
// Mid availability (15 hrs/wk) and mid-low budget ($200).
// Skills: React, TypeScript, Python, UI Design — strong match for cand-02
// "Community Design System" and cand-07 "OpenBudget"; partial Python overlap
// with AI candidates.
// Interests: "AI" and "Frontend" — shares "AI" with Alice but not Social Impact;
// no overlap with Carol's interests → helps trigger interest conflict.
// Learning goals: "React" and "Accessibility" — "Accessibility" matches cand-01
// and cand-02 domainTags.
// Skill conflict: Bob's skills (React/TS/Python/UI) vs Alice's (ML/Python/Data)
// share only Python → Jaccard = 1/6 ≈ 0.167, which is < 0.2 → fires with
// severity "medium" (overlap < 0.1 would be "medium", 0 would be "high").
// Actually 0.167 is between 0.1 and 0.2, so severity = "low" per current logic.
insertPref.run({
  id: "pref-bob",
  group_member_id: "member-bob",
  skills:            JSON.stringify(["React", "TypeScript", "Python", "UI Design"]),
  availability_hours: 15,
  budget:             200,
  interests:         JSON.stringify(["AI", "Frontend"]),
  learning_goals:    JSON.stringify(["React", "Accessibility"]),
  priorities:        JSON.stringify(["creativity", "learning"]),
  notes: "Frontend-focused, interested in AI-powered interfaces.",
  updated_at: NOW,
});

// ── Carol — Cybersecurity specialist ─────────────────────────────────────────
// Mid availability (15 hrs/wk) and tight budget ($150 — lowest in the group).
// Skills: Network Security, Linux, Python, Cryptography — strong match for
// cand-03 "SecureVault" and cand-08 "ThreatSense" requiredSkills.
// Interests: "Cybersecurity" and "Privacy" — match cand-03 and cand-08 domainTags
// directly. No overlap with Alice's "AI"/"Social Impact" or Bob's "AI"/"Frontend"
// → full-group interest intersection is empty → interest conflict fires.
// Budget conflict: budgets [500, 200, 150], median=200, max=500 > 2×200=400
// → budget conflict fires. Ratio=2.5 → severity="low".
// Learning goals: "Penetration Testing" and "Cryptography" — these do NOT appear
// as domainTags in any candidate (so learning score will be 0 for Carol on most
// candidates — making her satisfaction lower than Alice's on AI projects, which
// correctly reflects a genuine trade-off the explanation will describe).
insertPref.run({
  id: "pref-carol",
  group_member_id: "member-carol",
  skills:            JSON.stringify(["Network Security", "Linux", "Python", "Cryptography"]),
  availability_hours: 15,
  budget:             150,
  interests:         JSON.stringify(["Cybersecurity", "Privacy"]),
  learning_goals:    JSON.stringify(["Penetration Testing", "Cryptography"]),
  priorities:        JSON.stringify(["security", "impact"]),
  notes: "Security-first approach; prefers cryptography and network hardening projects.",
  updated_at: NOW,
});

// David and Esha intentionally have NO preferences row (for live demo entry).
// During the demo, adding their preferences triggers a live consensus update
// visible to all connected browsers.

console.log("✅ Seed complete — clean demo state restored.");
console.log("   Users:        5 (Alice, Bob, Carol, David, Esha)");
console.log("   Groups:       1 (HACK01 — Hackathon Team Alpha)");
console.log("   Members:      5");
console.log("   Preferences:  3 (Alice, Bob, Carol) — David & Esha pending live entry");
console.log("");
console.log("   Alice   — ML/Python/Data Analysis  | AI, Social Impact | $500 | 20 hrs/wk");
console.log("   Bob     — React/TypeScript/Python   | AI, Frontend      | $200 | 15 hrs/wk");
console.log("   Carol   — Network Security/Linux    | Cybersecurity     | $150 | 15 hrs/wk");
console.log("");
console.log("   Expected conflicts:");
console.log("     • Budget spread  — Alice $500 vs median $200 (ratio 2.5×)");
console.log("     • Interest gap   — No interest shared across all 3 members");
console.log("     • Skill overlap  — Alice (ML) vs Bob (React): Jaccard ≈ 0.17 (<0.2)");
console.log("");
console.log("   Expected winner: ThreatSense (cand-08) — security+AI hybrid");
console.log("     Satisfies Carol's security focus while meeting Alice's AI interest.");
console.log("     Bob accepts a trade-off (limited skill match, still reasonable fit).");
