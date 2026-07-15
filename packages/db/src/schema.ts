import { relations, sql } from "drizzle-orm";
import { index, integer, sqliteTable, text, uniqueIndex } from "drizzle-orm/sqlite-core";

export const user = sqliteTable("user", {
  id: text("id").primaryKey(),
  name: text("name").notNull(),
  email: text("email").notNull().unique(),
  emailVerified: integer("email_verified", { mode: "boolean" })
    .notNull()
    .default(false),
  image: text("image"),
  displayName: text("display_name"),
  createdAt: integer("created_at", { mode: "timestamp_ms" })
    .notNull()
    .default(sql`(cast(unixepoch('subsecond') * 1000 as integer))`),
  updatedAt: integer("updated_at", { mode: "timestamp_ms" })
    .notNull()
    .default(sql`(cast(unixepoch('subsecond') * 1000 as integer))`),
});

export const session = sqliteTable(
  "session",
  {
    id: text("id").primaryKey(),
    expiresAt: integer("expires_at", { mode: "timestamp_ms" }).notNull(),
    token: text("token").notNull().unique(),
    createdAt: integer("created_at", { mode: "timestamp_ms" })
      .notNull()
      .default(sql`(cast(unixepoch('subsecond') * 1000 as integer))`),
    updatedAt: integer("updated_at", { mode: "timestamp_ms" })
      .notNull()
      .default(sql`(cast(unixepoch('subsecond') * 1000 as integer))`),
    ipAddress: text("ip_address"),
    userAgent: text("user_agent"),
    userId: text("user_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
  },
  (t) => [index("session_user_id_idx").on(t.userId)],
);

export const account = sqliteTable(
  "account",
  {
    id: text("id").primaryKey(),
    accountId: text("account_id").notNull(),
    providerId: text("provider_id").notNull(),
    userId: text("user_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    accessToken: text("access_token"),
    refreshToken: text("refresh_token"),
    idToken: text("id_token"),
    accessTokenExpiresAt: integer("access_token_expires_at", {
      mode: "timestamp_ms",
    }),
    refreshTokenExpiresAt: integer("refresh_token_expires_at", {
      mode: "timestamp_ms",
    }),
    scope: text("scope"),
    password: text("password"),
    createdAt: integer("created_at", { mode: "timestamp_ms" })
      .notNull()
      .default(sql`(cast(unixepoch('subsecond') * 1000 as integer))`),
    updatedAt: integer("updated_at", { mode: "timestamp_ms" })
      .notNull()
      .default(sql`(cast(unixepoch('subsecond') * 1000 as integer))`),
  },
  (t) => [index("account_user_id_idx").on(t.userId)],
);

export const verification = sqliteTable("verification", {
  id: text("id").primaryKey(),
  identifier: text("identifier").notNull(),
  value: text("value").notNull(),
  expiresAt: integer("expires_at", { mode: "timestamp_ms" }).notNull(),
  createdAt: integer("created_at", { mode: "timestamp_ms" })
    .notNull()
    .default(sql`(cast(unixepoch('subsecond') * 1000 as integer))`),
  updatedAt: integer("updated_at", { mode: "timestamp_ms" })
    .notNull()
    .default(sql`(cast(unixepoch('subsecond') * 1000 as integer))`),
});

export const userStats = sqliteTable("user_stats", {
  userId: text("user_id")
    .primaryKey()
    .references(() => user.id, { onDelete: "cascade" }),
  currentStreak: integer("current_streak").notNull().default(0),
  bestStreak: integer("best_streak").notNull().default(0),
  weeklyStreak: integer("weekly_streak").notNull().default(0),
  bestWeeklyStreak: integer("best_weekly_streak").notNull().default(0),
  monthlyStreak: integer("monthly_streak").notNull().default(0),
  bestMonthlyStreak: integer("best_monthly_streak").notNull().default(0),
  lastWinWeekStart: text("last_win_week_start"),
  lastWinMonthStart: text("last_win_month_start"),
  totalScore: integer("total_score").notNull().default(0),
  puzzlesSolved: integer("puzzles_solved").notNull().default(0),
  challengeWins: integer("challenge_wins").notNull().default(0),
  lastPlayDate: text("last_play_date"),
  updatedAt: integer("updated_at", { mode: "timestamp_ms" })
    .notNull()
    .default(sql`(cast(unixepoch('subsecond') * 1000 as integer))`),
});

export const userAchievement = sqliteTable(
  "user_achievement",
  {
    id: text("id").primaryKey(),
    userId: text("user_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    achievementId: text("achievement_id").notNull(),
    earnedAt: integer("earned_at", { mode: "timestamp_ms" })
      .notNull()
      .default(sql`(cast(unixepoch('subsecond') * 1000 as integer))`),
  },
  (t) => [
    uniqueIndex("user_achievement_unique_idx").on(t.userId, t.achievementId),
    index("user_achievement_user_idx").on(t.userId),
  ],
);

export const userUnlock = sqliteTable(
  "user_unlock",
  {
    id: text("id").primaryKey(),
    userId: text("user_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    unlockId: text("unlock_id").notNull(),
    unlockedAt: integer("unlocked_at", { mode: "timestamp_ms" })
      .notNull()
      .default(sql`(cast(unixepoch('subsecond') * 1000 as integer))`),
  },
  (t) => [
    uniqueIndex("user_unlock_unique_idx").on(t.userId, t.unlockId),
    index("user_unlock_user_idx").on(t.userId),
  ],
);

export const friendChallenge = sqliteTable(
  "friend_challenge",
  {
    id: text("id").primaryKey(),
    challengerId: text("challenger_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    opponentId: text("opponent_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    puzzleType: text("puzzle_type", {
      enum: ["wordle", "escape", "logic", "path"],
    }).notNull(),
    difficulty: text("difficulty", {
      enum: ["easy", "medium", "hard", "impossible"],
    }).notNull(),
    dateKey: text("date_key").notNull(),
    status: text("status", {
      enum: ["pending", "active", "completed", "declined", "expired"],
    })
      .notNull()
      .default("pending"),
    challengerScore: integer("challenger_score"),
    opponentScore: integer("opponent_score"),
    winnerId: text("winner_id").references(() => user.id, {
      onDelete: "set null",
    }),
    createdAt: integer("created_at", { mode: "timestamp_ms" })
      .notNull()
      .default(sql`(cast(unixepoch('subsecond') * 1000 as integer))`),
  },
  (t) => [
    index("friend_challenge_challenger_idx").on(t.challengerId),
    index("friend_challenge_opponent_idx").on(t.opponentId),
    index("friend_challenge_date_idx").on(t.dateKey),
  ],
);

export const tournamentAward = sqliteTable(
  "tournament_award",
  {
    id: text("id").primaryKey(),
    weekStart: text("week_start").notNull(),
    scope: text("scope", { enum: ["global", "friends"] }).notNull(),
    userId: text("user_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    place: integer("place").notNull(),
    bonusPoints: integer("bonus_points").notNull().default(0),
    badge: text("badge").notNull(),
    awardedAt: integer("awarded_at", { mode: "timestamp_ms" })
      .notNull()
      .default(sql`(cast(unixepoch('subsecond') * 1000 as integer))`),
  },
  (t) => [
    uniqueIndex("tournament_award_unique_idx").on(
      t.weekStart,
      t.scope,
      t.userId,
    ),
    index("tournament_award_user_idx").on(t.userId),
    index("tournament_award_week_idx").on(t.weekStart, t.scope),
  ],
);

export const friendship = sqliteTable(
  "friendship",
  {
    id: text("id").primaryKey(),
    requesterId: text("requester_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    addresseeId: text("addressee_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    status: text("status", {
      enum: ["pending", "accepted", "declined"],
    })
      .notNull()
      .default("pending"),
    createdAt: integer("created_at", { mode: "timestamp_ms" })
      .notNull()
      .default(sql`(cast(unixepoch('subsecond') * 1000 as integer))`),
  },
  (t) => [
    uniqueIndex("friendship_pair_idx").on(t.requesterId, t.addresseeId),
    index("friendship_addressee_idx").on(t.addresseeId),
  ],
);

export const playResult = sqliteTable(
  "play_result",
  {
    id: text("id").primaryKey(),
    userId: text("user_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    puzzleType: text("puzzle_type", {
      enum: ["wordle", "escape", "logic", "path", "detective"],
    }).notNull(),
    difficulty: text("difficulty", {
      enum: ["easy", "medium", "hard", "impossible"],
    }).notNull(),
    dateKey: text("date_key").notNull(),
    score: integer("score").notNull(),
    won: integer("won", { mode: "boolean" }).notNull(),
    metaJson: text("meta_json"),
    createdAt: integer("created_at", { mode: "timestamp_ms" })
      .notNull()
      .default(sql`(cast(unixepoch('subsecond') * 1000 as integer))`),
  },
  (t) => [
    uniqueIndex("play_once_per_day_idx").on(
      t.userId,
      t.puzzleType,
      t.difficulty,
      t.dateKey,
    ),
    index("play_leaderboard_idx").on(t.dateKey, t.puzzleType, t.difficulty),
  ],
);

export const userRelations = relations(user, ({ one, many }) => ({
  stats: one(userStats, {
    fields: [user.id],
    references: [userStats.userId],
  }),
  plays: many(playResult),
  achievements: many(userAchievement),
  unlocks: many(userUnlock),
  tournamentAwards: many(tournamentAward),
}));

export const userStatsRelations = relations(userStats, ({ one }) => ({
  user: one(user, {
    fields: [userStats.userId],
    references: [user.id],
  }),
}));

export const playResultRelations = relations(playResult, ({ one }) => ({
  user: one(user, {
    fields: [playResult.userId],
    references: [user.id],
  }),
}));

export const friendshipRelations = relations(friendship, ({ one }) => ({
  requester: one(user, {
    fields: [friendship.requesterId],
    references: [user.id],
    relationName: "friendship_requester",
  }),
  addressee: one(user, {
    fields: [friendship.addresseeId],
    references: [user.id],
    relationName: "friendship_addressee",
  }),
}));

export const userAchievementRelations = relations(userAchievement, ({ one }) => ({
  user: one(user, {
    fields: [userAchievement.userId],
    references: [user.id],
  }),
}));

export const userUnlockRelations = relations(userUnlock, ({ one }) => ({
  user: one(user, {
    fields: [userUnlock.userId],
    references: [user.id],
  }),
}));

export const friendChallengeRelations = relations(friendChallenge, ({ one }) => ({
  challenger: one(user, {
    fields: [friendChallenge.challengerId],
    references: [user.id],
    relationName: "challenge_challenger",
  }),
  opponent: one(user, {
    fields: [friendChallenge.opponentId],
    references: [user.id],
    relationName: "challenge_opponent",
  }),
}));

export const tournamentAwardRelations = relations(tournamentAward, ({ one }) => ({
  user: one(user, {
    fields: [tournamentAward.userId],
    references: [user.id],
  }),
}));

export const schema = {
  user,
  session,
  account,
  verification,
  userStats,
  friendship,
  playResult,
  userAchievement,
  userUnlock,
  friendChallenge,
  tournamentAward,
  userRelations,
  userStatsRelations,
  playResultRelations,
  friendshipRelations,
  userAchievementRelations,
  userUnlockRelations,
  friendChallengeRelations,
  tournamentAwardRelations,
};
