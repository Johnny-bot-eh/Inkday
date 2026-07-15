import fs from "node:fs";
import path from "node:path";
import { createClient } from "@libsql/client";

const statements = [
  `CREATE TABLE IF NOT EXISTS user (
  id TEXT PRIMARY KEY NOT NULL,
  name TEXT NOT NULL,
  email TEXT NOT NULL UNIQUE,
  email_verified INTEGER NOT NULL DEFAULT 0,
  image TEXT,
  display_name TEXT,
  created_at INTEGER NOT NULL DEFAULT (cast(unixepoch('subsecond') * 1000 as integer)),
  updated_at INTEGER NOT NULL DEFAULT (cast(unixepoch('subsecond') * 1000 as integer))
)`,
  `CREATE TABLE IF NOT EXISTS session (
  id TEXT PRIMARY KEY NOT NULL,
  expires_at INTEGER NOT NULL,
  token TEXT NOT NULL UNIQUE,
  created_at INTEGER NOT NULL DEFAULT (cast(unixepoch('subsecond') * 1000 as integer)),
  updated_at INTEGER NOT NULL DEFAULT (cast(unixepoch('subsecond') * 1000 as integer)),
  ip_address TEXT,
  user_agent TEXT,
  user_id TEXT NOT NULL REFERENCES user(id) ON DELETE CASCADE
)`,
  `CREATE INDEX IF NOT EXISTS session_user_id_idx ON session(user_id)`,
  `CREATE TABLE IF NOT EXISTS account (
  id TEXT PRIMARY KEY NOT NULL,
  account_id TEXT NOT NULL,
  provider_id TEXT NOT NULL,
  user_id TEXT NOT NULL REFERENCES user(id) ON DELETE CASCADE,
  access_token TEXT,
  refresh_token TEXT,
  id_token TEXT,
  access_token_expires_at INTEGER,
  refresh_token_expires_at INTEGER,
  scope TEXT,
  password TEXT,
  created_at INTEGER NOT NULL DEFAULT (cast(unixepoch('subsecond') * 1000 as integer)),
  updated_at INTEGER NOT NULL DEFAULT (cast(unixepoch('subsecond') * 1000 as integer))
)`,
  `CREATE INDEX IF NOT EXISTS account_user_id_idx ON account(user_id)`,
  `CREATE TABLE IF NOT EXISTS verification (
  id TEXT PRIMARY KEY NOT NULL,
  identifier TEXT NOT NULL,
  value TEXT NOT NULL,
  expires_at INTEGER NOT NULL,
  created_at INTEGER NOT NULL DEFAULT (cast(unixepoch('subsecond') * 1000 as integer)),
  updated_at INTEGER NOT NULL DEFAULT (cast(unixepoch('subsecond') * 1000 as integer))
)`,
  `CREATE TABLE IF NOT EXISTS user_stats (
  user_id TEXT PRIMARY KEY NOT NULL REFERENCES user(id) ON DELETE CASCADE,
  current_streak INTEGER NOT NULL DEFAULT 0,
  best_streak INTEGER NOT NULL DEFAULT 0,
  total_score INTEGER NOT NULL DEFAULT 0,
  puzzles_solved INTEGER NOT NULL DEFAULT 0,
  last_play_date TEXT,
  updated_at INTEGER NOT NULL DEFAULT (cast(unixepoch('subsecond') * 1000 as integer))
)`,
  `CREATE TABLE IF NOT EXISTS friendship (
  id TEXT PRIMARY KEY NOT NULL,
  requester_id TEXT NOT NULL REFERENCES user(id) ON DELETE CASCADE,
  addressee_id TEXT NOT NULL REFERENCES user(id) ON DELETE CASCADE,
  status TEXT NOT NULL DEFAULT 'pending',
  created_at INTEGER NOT NULL DEFAULT (cast(unixepoch('subsecond') * 1000 as integer))
)`,
  `CREATE UNIQUE INDEX IF NOT EXISTS friendship_pair_idx ON friendship(requester_id, addressee_id)`,
  `CREATE INDEX IF NOT EXISTS friendship_addressee_idx ON friendship(addressee_id)`,
  `CREATE TABLE IF NOT EXISTS play_result (
  id TEXT PRIMARY KEY NOT NULL,
  user_id TEXT NOT NULL REFERENCES user(id) ON DELETE CASCADE,
  puzzle_type TEXT NOT NULL,
  difficulty TEXT NOT NULL,
  date_key TEXT NOT NULL,
  score INTEGER NOT NULL,
  won INTEGER NOT NULL,
  meta_json TEXT,
  created_at INTEGER NOT NULL DEFAULT (cast(unixepoch('subsecond') * 1000 as integer))
)`,
  `CREATE UNIQUE INDEX IF NOT EXISTS play_once_per_day_idx ON play_result(user_id, puzzle_type, difficulty, date_key)`,
  `CREATE INDEX IF NOT EXISTS play_leaderboard_idx ON play_result(date_key, puzzle_type, difficulty)`,
];

function createDbClient() {
  const url = process.env.DATABASE_URL ?? "file:./data/inkday.db";
  const authToken = process.env.DATABASE_AUTH_TOKEN;

  if (url.startsWith("libsql://") || url.startsWith("https://")) {
    return {
      label: url,
      client: createClient({ url, authToken: authToken || undefined }),
    };
  }

  const filePath = url.startsWith("file:") ? url.slice("file:".length) : url;
  const resolved = path.isAbsolute(filePath)
    ? filePath
    : path.resolve(process.cwd(), filePath);
  fs.mkdirSync(path.dirname(resolved), { recursive: true });
  return {
    label: resolved,
    client: createClient({ url: `file:${resolved}` }),
  };
}

const { label, client } = createDbClient();

for (const statement of statements) {
  await client.execute(statement);
}

console.log(`Migrated database: ${label}`);
