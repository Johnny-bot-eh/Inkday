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
  equipped_avatar_id TEXT,
  equipped_accessory_id TEXT,
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
  weekly_streak INTEGER NOT NULL DEFAULT 0,
  best_weekly_streak INTEGER NOT NULL DEFAULT 0,
  monthly_streak INTEGER NOT NULL DEFAULT 0,
  best_monthly_streak INTEGER NOT NULL DEFAULT 0,
  last_win_week_start TEXT,
  last_win_month_start TEXT,
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
  season_id TEXT NOT NULL DEFAULT '',
  score INTEGER NOT NULL,
  won INTEGER NOT NULL,
  meta_json TEXT,
  created_at INTEGER NOT NULL DEFAULT (cast(unixepoch('subsecond') * 1000 as integer))
)`,
  `CREATE UNIQUE INDEX IF NOT EXISTS play_once_per_day_idx ON play_result(user_id, puzzle_type, difficulty, date_key, season_id)`,
  `CREATE INDEX IF NOT EXISTS play_leaderboard_idx ON play_result(date_key, puzzle_type, difficulty)`,
  `CREATE TABLE IF NOT EXISTS user_achievement (
  id TEXT PRIMARY KEY NOT NULL,
  user_id TEXT NOT NULL REFERENCES user(id) ON DELETE CASCADE,
  achievement_id TEXT NOT NULL,
  earned_at INTEGER NOT NULL DEFAULT (cast(unixepoch('subsecond') * 1000 as integer))
)`,
  `CREATE UNIQUE INDEX IF NOT EXISTS user_achievement_unique_idx ON user_achievement(user_id, achievement_id)`,
  `CREATE INDEX IF NOT EXISTS user_achievement_user_idx ON user_achievement(user_id)`,
  `CREATE TABLE IF NOT EXISTS user_unlock (
  id TEXT PRIMARY KEY NOT NULL,
  user_id TEXT NOT NULL REFERENCES user(id) ON DELETE CASCADE,
  unlock_id TEXT NOT NULL,
  unlocked_at INTEGER NOT NULL DEFAULT (cast(unixepoch('subsecond') * 1000 as integer))
)`,
  `CREATE UNIQUE INDEX IF NOT EXISTS user_unlock_unique_idx ON user_unlock(user_id, unlock_id)`,
  `CREATE INDEX IF NOT EXISTS user_unlock_user_idx ON user_unlock(user_id)`,
  `CREATE TABLE IF NOT EXISTS friend_challenge (
  id TEXT PRIMARY KEY NOT NULL,
  challenger_id TEXT NOT NULL REFERENCES user(id) ON DELETE CASCADE,
  opponent_id TEXT NOT NULL REFERENCES user(id) ON DELETE CASCADE,
  puzzle_type TEXT NOT NULL,
  difficulty TEXT NOT NULL,
  date_key TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending',
  challenger_score INTEGER,
  opponent_score INTEGER,
  winner_id TEXT REFERENCES user(id) ON DELETE SET NULL,
  created_at INTEGER NOT NULL DEFAULT (cast(unixepoch('subsecond') * 1000 as integer))
)`,
  `CREATE INDEX IF NOT EXISTS friend_challenge_challenger_idx ON friend_challenge(challenger_id)`,
  `CREATE INDEX IF NOT EXISTS friend_challenge_opponent_idx ON friend_challenge(opponent_id)`,
  `CREATE INDEX IF NOT EXISTS friend_challenge_date_idx ON friend_challenge(date_key)`,
  `CREATE TABLE IF NOT EXISTS tournament_award (
  id TEXT PRIMARY KEY NOT NULL,
  week_start TEXT NOT NULL,
  scope TEXT NOT NULL,
  user_id TEXT NOT NULL REFERENCES user(id) ON DELETE CASCADE,
  place INTEGER NOT NULL,
  bonus_points INTEGER NOT NULL DEFAULT 0,
  badge TEXT NOT NULL,
  awarded_at INTEGER NOT NULL DEFAULT (cast(unixepoch('subsecond') * 1000 as integer))
)`,
  `CREATE UNIQUE INDEX IF NOT EXISTS tournament_award_unique_idx ON tournament_award(week_start, scope, user_id)`,
  `CREATE INDEX IF NOT EXISTS tournament_award_user_idx ON tournament_award(user_id)`,
  `CREATE INDEX IF NOT EXISTS tournament_award_week_idx ON tournament_award(week_start, scope)`,
  `CREATE TABLE IF NOT EXISTS user_premium (
  user_id TEXT PRIMARY KEY NOT NULL REFERENCES user(id) ON DELETE CASCADE,
  tier TEXT NOT NULL DEFAULT 'plus',
  status TEXT NOT NULL DEFAULT 'active',
  source TEXT NOT NULL DEFAULT 'promo',
  starts_at INTEGER NOT NULL DEFAULT (cast(unixepoch('subsecond') * 1000 as integer)),
  ends_at INTEGER,
  streak_freeze_used_week TEXT,
  updated_at INTEGER NOT NULL DEFAULT (cast(unixepoch('subsecond') * 1000 as integer))
)`,
  `CREATE TABLE IF NOT EXISTS notification_pref (
  user_id TEXT PRIMARY KEY NOT NULL REFERENCES user(id) ON DELETE CASCADE,
  email_enabled INTEGER NOT NULL DEFAULT 1,
  daily_reminder INTEGER NOT NULL DEFAULT 1,
  streak_at_risk INTEGER NOT NULL DEFAULT 1,
  friend_challenge INTEGER NOT NULL DEFAULT 1,
  tournament_result INTEGER NOT NULL DEFAULT 1,
  season_start INTEGER NOT NULL DEFAULT 1,
  reminder_hour_utc INTEGER NOT NULL DEFAULT 14,
  updated_at INTEGER NOT NULL DEFAULT (cast(unixepoch('subsecond') * 1000 as integer))
)`,
  `CREATE TABLE IF NOT EXISTS notification_outbox (
  id TEXT PRIMARY KEY NOT NULL,
  user_id TEXT NOT NULL REFERENCES user(id) ON DELETE CASCADE,
  kind TEXT NOT NULL,
  payload_json TEXT,
  scheduled_for INTEGER NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending',
  created_at INTEGER NOT NULL DEFAULT (cast(unixepoch('subsecond') * 1000 as integer)),
  sent_at INTEGER
)`,
  `CREATE INDEX IF NOT EXISTS notification_outbox_pending_idx ON notification_outbox(status, scheduled_for)`,
  `CREATE INDEX IF NOT EXISTS notification_outbox_user_idx ON notification_outbox(user_id)`,
  `CREATE TABLE IF NOT EXISTS monthly_completion (
  id TEXT PRIMARY KEY NOT NULL,
  user_id TEXT NOT NULL REFERENCES user(id) ON DELETE CASCADE,
  collection_id TEXT NOT NULL,
  slot_index INTEGER NOT NULL,
  puzzle_type TEXT NOT NULL,
  difficulty TEXT NOT NULL,
  score INTEGER NOT NULL,
  won INTEGER NOT NULL,
  meta_json TEXT,
  completed_at INTEGER NOT NULL DEFAULT (cast(unixepoch('subsecond') * 1000 as integer))
)`,
  `CREATE UNIQUE INDEX IF NOT EXISTS monthly_completion_unique_idx ON monthly_completion(user_id, collection_id, slot_index)`,
  `CREATE INDEX IF NOT EXISTS monthly_completion_user_collection_idx ON monthly_completion(user_id, collection_id)`,
  `CREATE TABLE IF NOT EXISTS monthly_milestone (
  id TEXT PRIMARY KEY NOT NULL,
  user_id TEXT NOT NULL REFERENCES user(id) ON DELETE CASCADE,
  collection_id TEXT NOT NULL,
  milestone_id TEXT NOT NULL,
  bonus_points INTEGER NOT NULL,
  awarded_at INTEGER NOT NULL DEFAULT (cast(unixepoch('subsecond') * 1000 as integer))
)`,
  `CREATE UNIQUE INDEX IF NOT EXISTS monthly_milestone_unique_idx ON monthly_milestone(user_id, collection_id, milestone_id)`,
  `CREATE INDEX IF NOT EXISTS monthly_milestone_user_idx ON monthly_milestone(user_id)`,
  `CREATE TABLE IF NOT EXISTS monthly_badge (
  id TEXT PRIMARY KEY NOT NULL,
  user_id TEXT NOT NULL REFERENCES user(id) ON DELETE CASCADE,
  collection_id TEXT NOT NULL,
  badge_id TEXT NOT NULL,
  title TEXT NOT NULL,
  awarded_at INTEGER NOT NULL DEFAULT (cast(unixepoch('subsecond') * 1000 as integer))
)`,
  `CREATE UNIQUE INDEX IF NOT EXISTS monthly_badge_unique_idx ON monthly_badge(user_id, collection_id, badge_id)`,
  `CREATE INDEX IF NOT EXISTS monthly_badge_user_idx ON monthly_badge(user_id)`,
  `CREATE TABLE IF NOT EXISTS coin_wallet (
  user_id TEXT PRIMARY KEY NOT NULL REFERENCES user(id) ON DELETE CASCADE,
  balance INTEGER NOT NULL DEFAULT 0,
  updated_at INTEGER NOT NULL DEFAULT (cast(unixepoch('subsecond') * 1000 as integer))
)`,
  `CREATE TABLE IF NOT EXISTS coin_ledger (
  id TEXT PRIMARY KEY NOT NULL,
  user_id TEXT NOT NULL REFERENCES user(id) ON DELETE CASCADE,
  delta INTEGER NOT NULL,
  balance_after INTEGER NOT NULL,
  reason TEXT NOT NULL,
  ref_type TEXT NOT NULL,
  ref_id TEXT NOT NULL,
  created_at INTEGER NOT NULL DEFAULT (cast(unixepoch('subsecond') * 1000 as integer))
)`,
  `CREATE UNIQUE INDEX IF NOT EXISTS coin_ledger_unique_idx ON coin_ledger(user_id, reason, ref_type, ref_id)`,
  `CREATE INDEX IF NOT EXISTS coin_ledger_user_idx ON coin_ledger(user_id)`,
  `CREATE INDEX IF NOT EXISTS coin_ledger_created_idx ON coin_ledger(user_id, created_at)`,
  `CREATE TABLE IF NOT EXISTS coin_inventory (
  id TEXT PRIMARY KEY NOT NULL,
  user_id TEXT NOT NULL REFERENCES user(id) ON DELETE CASCADE,
  item_id TEXT NOT NULL,
  qty INTEGER NOT NULL DEFAULT 1,
  acquired_at INTEGER NOT NULL DEFAULT (cast(unixepoch('subsecond') * 1000 as integer))
)`,
  `CREATE UNIQUE INDEX IF NOT EXISTS coin_inventory_unique_idx ON coin_inventory(user_id, item_id)`,
  `CREATE INDEX IF NOT EXISTS coin_inventory_user_idx ON coin_inventory(user_id)`,
  `CREATE TABLE IF NOT EXISTS coin_daily_login (
  id TEXT PRIMARY KEY NOT NULL,
  user_id TEXT NOT NULL REFERENCES user(id) ON DELETE CASCADE,
  date_key TEXT NOT NULL,
  coins INTEGER NOT NULL,
  claimed_at INTEGER NOT NULL DEFAULT (cast(unixepoch('subsecond') * 1000 as integer))
)`,
  `CREATE UNIQUE INDEX IF NOT EXISTS coin_daily_login_unique_idx ON coin_daily_login(user_id, date_key)`,
  `CREATE INDEX IF NOT EXISTS coin_daily_login_user_idx ON coin_daily_login(user_id)`,
  `CREATE TABLE IF NOT EXISTS coin_streak_claim (
  id TEXT PRIMARY KEY NOT NULL,
  user_id TEXT NOT NULL REFERENCES user(id) ON DELETE CASCADE,
  streak_length INTEGER NOT NULL,
  anchor_date TEXT NOT NULL,
  coins INTEGER NOT NULL,
  claimed_at INTEGER NOT NULL DEFAULT (cast(unixepoch('subsecond') * 1000 as integer))
)`,
  `CREATE UNIQUE INDEX IF NOT EXISTS coin_streak_claim_unique_idx ON coin_streak_claim(user_id, streak_length, anchor_date)`,
  `CREATE INDEX IF NOT EXISTS coin_streak_claim_user_idx ON coin_streak_claim(user_id)`,
  `CREATE TABLE IF NOT EXISTS user_progression (
  user_id TEXT PRIMARY KEY NOT NULL REFERENCES user(id) ON DELETE CASCADE,
  account_xp INTEGER NOT NULL DEFAULT 0,
  active_pet_id TEXT,
  starter_claimed INTEGER NOT NULL DEFAULT 0,
  backfilled INTEGER NOT NULL DEFAULT 0,
  updated_at INTEGER NOT NULL DEFAULT (cast(unixepoch('subsecond') * 1000 as integer))
)`,
  `CREATE TABLE IF NOT EXISTS user_pet (
  id TEXT PRIMARY KEY NOT NULL,
  user_id TEXT NOT NULL REFERENCES user(id) ON DELETE CASCADE,
  species_id TEXT NOT NULL,
  personality_id TEXT NOT NULL,
  name TEXT,
  pet_xp INTEGER NOT NULL DEFAULT 0,
  happiness_base INTEGER NOT NULL DEFAULT 0,
  happiness_updated_at INTEGER NOT NULL DEFAULT (cast(unixepoch('subsecond') * 1000 as integer)),
  last_pet_date TEXT,
  last_feed_date TEXT,
  last_puzzle_happy_date TEXT,
  created_at INTEGER NOT NULL DEFAULT (cast(unixepoch('subsecond') * 1000 as integer)),
  updated_at INTEGER NOT NULL DEFAULT (cast(unixepoch('subsecond') * 1000 as integer))
)`,
  `CREATE INDEX IF NOT EXISTS user_pet_user_idx ON user_pet(user_id)`,
  `CREATE INDEX IF NOT EXISTS user_pet_species_idx ON user_pet(user_id, species_id)`,
  `CREATE TABLE IF NOT EXISTS progression_event (
  id TEXT PRIMARY KEY NOT NULL,
  user_id TEXT NOT NULL REFERENCES user(id) ON DELETE CASCADE,
  pet_id TEXT,
  kind TEXT NOT NULL,
  amount INTEGER NOT NULL DEFAULT 0,
  source_type TEXT NOT NULL,
  source_id TEXT NOT NULL,
  meta_json TEXT,
  created_at INTEGER NOT NULL DEFAULT (cast(unixepoch('subsecond') * 1000 as integer))
)`,
  `CREATE UNIQUE INDEX IF NOT EXISTS progression_event_unique_idx ON progression_event(user_id, kind, source_type, source_id)`,
  `CREATE INDEX IF NOT EXISTS progression_event_user_idx ON progression_event(user_id)`,
  `CREATE INDEX IF NOT EXISTS progression_event_pet_idx ON progression_event(pet_id)`,
  `CREATE TABLE IF NOT EXISTS pet_gift (
  id TEXT PRIMARY KEY NOT NULL,
  user_id TEXT NOT NULL REFERENCES user(id) ON DELETE CASCADE,
  pet_id TEXT NOT NULL,
  date_key TEXT NOT NULL,
  gift_kind TEXT NOT NULL,
  coins INTEGER NOT NULL DEFAULT 0,
  item_id TEXT,
  claimed INTEGER NOT NULL DEFAULT 0,
  created_at INTEGER NOT NULL DEFAULT (cast(unixepoch('subsecond') * 1000 as integer)),
  claimed_at INTEGER
)`,
  `CREATE UNIQUE INDEX IF NOT EXISTS pet_gift_daily_idx ON pet_gift(pet_id, date_key)`,
  `CREATE INDEX IF NOT EXISTS pet_gift_user_idx ON pet_gift(user_id)`,
  `CREATE TABLE IF NOT EXISTS user_gift (
  id TEXT PRIMARY KEY NOT NULL,
  sender_id TEXT NOT NULL REFERENCES user(id) ON DELETE CASCADE,
  recipient_id TEXT NOT NULL REFERENCES user(id) ON DELETE CASCADE,
  kind TEXT NOT NULL,
  coins INTEGER NOT NULL DEFAULT 0,
  item_id TEXT,
  status TEXT NOT NULL DEFAULT 'pending',
  message TEXT,
  created_at INTEGER NOT NULL DEFAULT (cast(unixepoch('subsecond') * 1000 as integer)),
  claimed_at INTEGER
)`,
  `CREATE INDEX IF NOT EXISTS user_gift_recipient_status_idx ON user_gift(recipient_id, status)`,
  `CREATE INDEX IF NOT EXISTS user_gift_sender_idx ON user_gift(sender_id)`,
  `CREATE TABLE IF NOT EXISTS garden_placement (
  id TEXT PRIMARY KEY NOT NULL,
  user_id TEXT NOT NULL REFERENCES user(id) ON DELETE CASCADE,
  item_id TEXT NOT NULL,
  x INTEGER NOT NULL DEFAULT 50,
  y INTEGER NOT NULL DEFAULT 60,
  layer TEXT NOT NULL DEFAULT 'middle',
  placed_at INTEGER NOT NULL DEFAULT (cast(unixepoch('subsecond') * 1000 as integer))
)`,
  `CREATE INDEX IF NOT EXISTS garden_placement_user_item_idx ON garden_placement(user_id, item_id)`,
  `CREATE INDEX IF NOT EXISTS garden_placement_user_idx ON garden_placement(user_id)`,
];

/** Additive column migrations — safe to re-run (ignore duplicate-column errors). */
const alters = [
  `ALTER TABLE user_stats ADD COLUMN weekly_streak INTEGER NOT NULL DEFAULT 0`,
  `ALTER TABLE user_stats ADD COLUMN best_weekly_streak INTEGER NOT NULL DEFAULT 0`,
  `ALTER TABLE user_stats ADD COLUMN monthly_streak INTEGER NOT NULL DEFAULT 0`,
  `ALTER TABLE user_stats ADD COLUMN best_monthly_streak INTEGER NOT NULL DEFAULT 0`,
  `ALTER TABLE user_stats ADD COLUMN last_win_week_start TEXT`,
  `ALTER TABLE user_stats ADD COLUMN last_win_month_start TEXT`,
  `ALTER TABLE user_stats ADD COLUMN challenge_wins INTEGER NOT NULL DEFAULT 0`,
  `ALTER TABLE play_result ADD COLUMN season_id TEXT NOT NULL DEFAULT ''`,
  `ALTER TABLE user ADD COLUMN equipped_avatar_id TEXT`,
  `ALTER TABLE user ADD COLUMN equipped_accessory_id TEXT`,
  `ALTER TABLE garden_placement ADD COLUMN x INTEGER NOT NULL DEFAULT 50`,
  `ALTER TABLE garden_placement ADD COLUMN y INTEGER NOT NULL DEFAULT 60`,
  `ALTER TABLE garden_placement ADD COLUMN layer TEXT NOT NULL DEFAULT 'middle'`,
  `ALTER TABLE user_progression ADD COLUMN nest_x INTEGER`,
  `ALTER TABLE user_progression ADD COLUMN nest_y INTEGER`,
];

/** Index rebuilds that must replace older definitions. */
const indexRebuilds = [
  `DROP INDEX IF EXISTS play_once_per_day_idx`,
  `CREATE UNIQUE INDEX IF NOT EXISTS play_once_per_day_idx ON play_result(user_id, puzzle_type, difficulty, date_key, season_id)`,
  `DROP INDEX IF EXISTS garden_placement_cell_idx`,
  // Allow multiple placements of the same decoration item.
  // Drop both old unique and non-unique names, then recreate non-unique.
  `DROP INDEX IF EXISTS garden_placement_item_idx`,
  `DROP INDEX IF EXISTS garden_placement_user_item_idx`,
  `CREATE INDEX IF NOT EXISTS garden_placement_user_item_idx ON garden_placement(user_id, item_id)`,
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

for (const statement of alters) {
  try {
    await client.execute(statement);
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    if (!/duplicate column/i.test(message)) {
      throw err;
    }
  }
}

for (const statement of indexRebuilds) {
  await client.execute(statement);
}

/** Rebuild garden_placement if it still uses the old grid cell_index column. */
try {
  const info = await client.execute(`PRAGMA table_info(garden_placement)`);
  const cols = new Set(
    info.rows.map((row) => {
      const r = row;
      if (r && typeof r === "object" && "name" in r) return String(r.name);
      if (Array.isArray(r)) return String(r[1] ?? "");
      return String(r ?? "");
    }),
  );
  if (cols.has("cell_index") || (cols.size > 0 && !cols.has("x"))) {
    await client.execute(`DROP TABLE IF EXISTS garden_placement_diorama`);
    await client.execute(`CREATE TABLE garden_placement_diorama (
  id TEXT PRIMARY KEY NOT NULL,
  user_id TEXT NOT NULL,
  item_id TEXT NOT NULL,
  x INTEGER NOT NULL DEFAULT 50,
  y INTEGER NOT NULL DEFAULT 60,
  layer TEXT NOT NULL DEFAULT 'middle',
  placed_at INTEGER NOT NULL DEFAULT (cast(unixepoch('subsecond') * 1000 as integer))
)`);
    // Prefer cell_index when present; otherwise keep any existing x/y.
    if (cols.has("cell_index")) {
      await client.execute(`INSERT OR IGNORE INTO garden_placement_diorama
  (id, user_id, item_id, x, y, layer, placed_at)
  SELECT
    id,
    user_id,
    item_id,
    20 + (cell_index % 3) * 28,
    45 + (cell_index / 3) * 16,
    'middle',
    placed_at
  FROM garden_placement`);
    } else {
      await client.execute(`INSERT OR IGNORE INTO garden_placement_diorama
  (id, user_id, item_id, x, y, layer, placed_at)
  SELECT
    id,
    user_id,
    item_id,
    COALESCE(x, 50),
    COALESCE(y, 60),
    COALESCE(layer, 'middle'),
    placed_at
  FROM garden_placement`);
    }
    await client.execute(`DROP TABLE garden_placement`);
    await client.execute(
      `ALTER TABLE garden_placement_diorama RENAME TO garden_placement`,
    );
    await client.execute(`DROP INDEX IF EXISTS garden_placement_item_idx`);
    await client.execute(
      `CREATE INDEX IF NOT EXISTS garden_placement_user_item_idx ON garden_placement(user_id, item_id)`,
    );
    await client.execute(
      `CREATE INDEX IF NOT EXISTS garden_placement_user_idx ON garden_placement(user_id)`,
    );
  }
} catch (err) {
  const message = err instanceof Error ? err.message : String(err);
  // Never fail the whole migrate/build on garden reshape — companion code
  // already degrades if placements can't be read yet.
  console.error("garden_placement diorama migration failed:", message);
}

console.log(`Migrated database: ${label}`);
