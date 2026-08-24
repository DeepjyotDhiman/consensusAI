CREATE TABLE IF NOT EXISTS users (
  id TEXT PRIMARY KEY,
  username TEXT UNIQUE,
  password_hash TEXT,
  display_name TEXT NOT NULL,
  avatar_color TEXT NOT NULL,
  created_at INTEGER NOT NULL
);

CREATE TABLE IF NOT EXISTS groups (
  id TEXT PRIMARY KEY,
  user_id TEXT REFERENCES users(id),
  join_code TEXT UNIQUE NOT NULL,
  name TEXT NOT NULL,
  created_at INTEGER NOT NULL
);

CREATE TABLE IF NOT EXISTS group_members (
  id TEXT PRIMARY KEY,
  group_id TEXT NOT NULL REFERENCES groups(id),
  user_id TEXT NOT NULL REFERENCES users(id),
  role TEXT NOT NULL DEFAULT 'member',
  joined_at INTEGER NOT NULL
);

CREATE TABLE IF NOT EXISTS preferences (
  id TEXT PRIMARY KEY,
  group_member_id TEXT UNIQUE NOT NULL REFERENCES group_members(id),
  skills TEXT NOT NULL DEFAULT '[]',
  availability_hours INTEGER NOT NULL DEFAULT 0,
  budget INTEGER DEFAULT NULL,
  interests TEXT NOT NULL DEFAULT '[]',
  learning_goals TEXT NOT NULL DEFAULT '[]',
  priorities TEXT NOT NULL DEFAULT '[]',
  notes TEXT NOT NULL DEFAULT '',
  submitted_at INTEGER DEFAULT NULL,
  updated_at INTEGER NOT NULL
);

CREATE TABLE IF NOT EXISTS consensus_results (
  id TEXT PRIMARY KEY,
  group_id TEXT NOT NULL REFERENCES groups(id),
  candidate_id TEXT NOT NULL,
  recommendation TEXT NOT NULL DEFAULT '',
  runner_up TEXT NOT NULL DEFAULT '',
  member_scores TEXT NOT NULL DEFAULT '{}',
  group_score INTEGER NOT NULL DEFAULT 0,
  role_allocation TEXT NOT NULL DEFAULT '{}',
  conflicts TEXT NOT NULL DEFAULT '[]',
  explanation TEXT NOT NULL DEFAULT '[]',
  member_breakdowns TEXT NOT NULL DEFAULT '{}',
  generated_at INTEGER NOT NULL
);
