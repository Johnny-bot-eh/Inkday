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
      enum: [
        "wordle",
        "escape",
        "logic",
        "path",
        "anagram",
        "cryptogram",
        "acrostic",
        "wordladder",
      ],
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
      enum: [
        "wordle",
        "escape",
        "logic",
        "path",
        "detective",
        "anagram",
        "cryptogram",
        "acrostic",
        "wordladder",
      ],
    }).notNull(),
    difficulty: text("difficulty", {
      enum: ["easy", "medium", "hard", "impossible"],
    }).notNull(),
    dateKey: text("date_key").notNull(),
    /** Empty string for standard dailies; season slug for limited-time boards */
    seasonId: text("season_id").notNull().default(""),
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
      t.seasonId,
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

/** Inkday Plus membership (Stripe-ready; source can be promo/manual for now). */
export const userPremium = sqliteTable("user_premium", {
  userId: text("user_id")
    .primaryKey()
    .references(() => user.id, { onDelete: "cascade" }),
  tier: text("tier", { enum: ["plus"] })
    .notNull()
    .default("plus"),
  status: text("status", {
    enum: ["active", "canceled", "expired"],
  })
    .notNull()
    .default("active"),
  source: text("source", {
    enum: ["promo", "manual", "stripe"],
  })
    .notNull()
    .default("promo"),
  startsAt: integer("starts_at", { mode: "timestamp_ms" })
    .notNull()
    .default(sql`(cast(unixepoch('subsecond') * 1000 as integer))`),
  /** null = no fixed expiry */
  endsAt: integer("ends_at", { mode: "timestamp_ms" }),
  streakFreezeUsedWeek: text("streak_freeze_used_week"),
  updatedAt: integer("updated_at", { mode: "timestamp_ms" })
    .notNull()
    .default(sql`(cast(unixepoch('subsecond') * 1000 as integer))`),
});

/** Per-user email / reminder preferences for future delivery jobs. */
export const notificationPref = sqliteTable("notification_pref", {
  userId: text("user_id")
    .primaryKey()
    .references(() => user.id, { onDelete: "cascade" }),
  emailEnabled: integer("email_enabled", { mode: "boolean" })
    .notNull()
    .default(true),
  dailyReminder: integer("daily_reminder", { mode: "boolean" })
    .notNull()
    .default(true),
  streakAtRisk: integer("streak_at_risk", { mode: "boolean" })
    .notNull()
    .default(true),
  friendChallenge: integer("friend_challenge", { mode: "boolean" })
    .notNull()
    .default(true),
  tournamentResult: integer("tournament_result", { mode: "boolean" })
    .notNull()
    .default(true),
  seasonStart: integer("season_start", { mode: "boolean" })
    .notNull()
    .default(true),
  /** Preferred UTC hour 0–23 for daily digests */
  reminderHourUtc: integer("reminder_hour_utc").notNull().default(14),
  updatedAt: integer("updated_at", { mode: "timestamp_ms" })
    .notNull()
    .default(sql`(cast(unixepoch('subsecond') * 1000 as integer))`),
});

/**
 * Outbox for future email/push delivery (cron drains this).
 * Status: pending → sent | failed | canceled
 */
export const notificationOutbox = sqliteTable(
  "notification_outbox",
  {
    id: text("id").primaryKey(),
    userId: text("user_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    kind: text("kind").notNull(),
    payloadJson: text("payload_json"),
    scheduledFor: integer("scheduled_for", { mode: "timestamp_ms" }).notNull(),
    status: text("status", {
      enum: ["pending", "sent", "failed", "canceled"],
    })
      .notNull()
      .default("pending"),
    createdAt: integer("created_at", { mode: "timestamp_ms" })
      .notNull()
      .default(sql`(cast(unixepoch('subsecond') * 1000 as integer))`),
    sentAt: integer("sent_at", { mode: "timestamp_ms" }),
  },
  (t) => [
    index("notification_outbox_pending_idx").on(t.status, t.scheduledFor),
    index("notification_outbox_user_idx").on(t.userId),
  ],
);

export const userPremiumRelations = relations(userPremium, ({ one }) => ({
  user: one(user, {
    fields: [userPremium.userId],
    references: [user.id],
  }),
}));

export const notificationPrefRelations = relations(notificationPref, ({ one }) => ({
  user: one(user, {
    fields: [notificationPref.userId],
    references: [user.id],
  }),
}));

export const notificationOutboxRelations = relations(
  notificationOutbox,
  ({ one }) => ({
    user: one(user, {
      fields: [notificationOutbox.userId],
      references: [user.id],
    }),
  }),
);

/** Monthly Case File — slot completions (any-order, not day-locked). */
export const monthlyCompletion = sqliteTable(
  "monthly_completion",
  {
    id: text("id").primaryKey(),
    userId: text("user_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    collectionId: text("collection_id").notNull(),
    slotIndex: integer("slot_index").notNull(),
    puzzleType: text("puzzle_type").notNull(),
    difficulty: text("difficulty", {
      enum: ["easy", "medium", "hard", "impossible"],
    }).notNull(),
    score: integer("score").notNull(),
    won: integer("won", { mode: "boolean" }).notNull(),
    metaJson: text("meta_json"),
    completedAt: integer("completed_at", { mode: "timestamp_ms" })
      .notNull()
      .default(sql`(cast(unixepoch('subsecond') * 1000 as integer))`),
  },
  (t) => [
    uniqueIndex("monthly_completion_unique_idx").on(
      t.userId,
      t.collectionId,
      t.slotIndex,
    ),
    index("monthly_completion_user_collection_idx").on(
      t.userId,
      t.collectionId,
    ),
  ],
);

export const monthlyMilestone = sqliteTable(
  "monthly_milestone",
  {
    id: text("id").primaryKey(),
    userId: text("user_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    collectionId: text("collection_id").notNull(),
    milestoneId: text("milestone_id").notNull(),
    bonusPoints: integer("bonus_points").notNull(),
    awardedAt: integer("awarded_at", { mode: "timestamp_ms" })
      .notNull()
      .default(sql`(cast(unixepoch('subsecond') * 1000 as integer))`),
  },
  (t) => [
    uniqueIndex("monthly_milestone_unique_idx").on(
      t.userId,
      t.collectionId,
      t.milestoneId,
    ),
    index("monthly_milestone_user_idx").on(t.userId),
  ],
);

export const monthlyBadge = sqliteTable(
  "monthly_badge",
  {
    id: text("id").primaryKey(),
    userId: text("user_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    collectionId: text("collection_id").notNull(),
    badgeId: text("badge_id").notNull(),
    title: text("title").notNull(),
    awardedAt: integer("awarded_at", { mode: "timestamp_ms" })
      .notNull()
      .default(sql`(cast(unixepoch('subsecond') * 1000 as integer))`),
  },
  (t) => [
    uniqueIndex("monthly_badge_unique_idx").on(
      t.userId,
      t.collectionId,
      t.badgeId,
    ),
    index("monthly_badge_user_idx").on(t.userId),
  ],
);

export const monthlyCompletionRelations = relations(
  monthlyCompletion,
  ({ one }) => ({
    user: one(user, {
      fields: [monthlyCompletion.userId],
      references: [user.id],
    }),
  }),
);

export const monthlyMilestoneRelations = relations(
  monthlyMilestone,
  ({ one }) => ({
    user: one(user, {
      fields: [monthlyMilestone.userId],
      references: [user.id],
    }),
  }),
);

export const monthlyBadgeRelations = relations(monthlyBadge, ({ one }) => ({
  user: one(user, {
    fields: [monthlyBadge.userId],
    references: [user.id],
  }),
}));

/** Ink Coins wallet — denormalized balance. */
export const coinWallet = sqliteTable("coin_wallet", {
  userId: text("user_id")
    .primaryKey()
    .references(() => user.id, { onDelete: "cascade" }),
  balance: integer("balance").notNull().default(0),
  updatedAt: integer("updated_at", { mode: "timestamp_ms" })
    .notNull()
    .default(sql`(cast(unixepoch('subsecond') * 1000 as integer))`),
});

/** Append-only ledger; unique reason/ref prevents double grants. */
export const coinLedger = sqliteTable(
  "coin_ledger",
  {
    id: text("id").primaryKey(),
    userId: text("user_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    delta: integer("delta").notNull(),
    balanceAfter: integer("balance_after").notNull(),
    reason: text("reason").notNull(),
    refType: text("ref_type").notNull(),
    refId: text("ref_id").notNull(),
    createdAt: integer("created_at", { mode: "timestamp_ms" })
      .notNull()
      .default(sql`(cast(unixepoch('subsecond') * 1000 as integer))`),
  },
  (t) => [
    uniqueIndex("coin_ledger_unique_idx").on(
      t.userId,
      t.reason,
      t.refType,
      t.refId,
    ),
    index("coin_ledger_user_idx").on(t.userId),
    index("coin_ledger_created_idx").on(t.userId, t.createdAt),
  ],
);

/** Owned shop / cosmetic / companion items. */
export const coinInventory = sqliteTable(
  "coin_inventory",
  {
    id: text("id").primaryKey(),
    userId: text("user_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    itemId: text("item_id").notNull(),
    qty: integer("qty").notNull().default(1),
    acquiredAt: integer("acquired_at", { mode: "timestamp_ms" })
      .notNull()
      .default(sql`(cast(unixepoch('subsecond') * 1000 as integer))`),
  },
  (t) => [
    uniqueIndex("coin_inventory_unique_idx").on(t.userId, t.itemId),
    index("coin_inventory_user_idx").on(t.userId),
  ],
);

/** UTC daily login claims. */
export const coinDailyLogin = sqliteTable(
  "coin_daily_login",
  {
    id: text("id").primaryKey(),
    userId: text("user_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    dateKey: text("date_key").notNull(),
    coins: integer("coins").notNull(),
    claimedAt: integer("claimed_at", { mode: "timestamp_ms" })
      .notNull()
      .default(sql`(cast(unixepoch('subsecond') * 1000 as integer))`),
  },
  (t) => [
    uniqueIndex("coin_daily_login_unique_idx").on(t.userId, t.dateKey),
    index("coin_daily_login_user_idx").on(t.userId),
  ],
);

/** Streak milestone coin claims (e.g. 7-day). */
export const coinStreakClaim = sqliteTable(
  "coin_streak_claim",
  {
    id: text("id").primaryKey(),
    userId: text("user_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    streakLength: integer("streak_length").notNull(),
    anchorDate: text("anchor_date").notNull(),
    coins: integer("coins").notNull(),
    claimedAt: integer("claimed_at", { mode: "timestamp_ms" })
      .notNull()
      .default(sql`(cast(unixepoch('subsecond') * 1000 as integer))`),
  },
  (t) => [
    uniqueIndex("coin_streak_claim_unique_idx").on(
      t.userId,
      t.streakLength,
      t.anchorDate,
    ),
    index("coin_streak_claim_user_idx").on(t.userId),
  ],
);

export const coinWalletRelations = relations(coinWallet, ({ one }) => ({
  user: one(user, {
    fields: [coinWallet.userId],
    references: [user.id],
  }),
}));

export const coinLedgerRelations = relations(coinLedger, ({ one }) => ({
  user: one(user, {
    fields: [coinLedger.userId],
    references: [user.id],
  }),
}));

export const coinInventoryRelations = relations(coinInventory, ({ one }) => ({
  user: one(user, {
    fields: [coinInventory.userId],
    references: [user.id],
  }),
}));

export const coinDailyLoginRelations = relations(coinDailyLogin, ({ one }) => ({
  user: one(user, {
    fields: [coinDailyLogin.userId],
    references: [user.id],
  }),
}));

export const coinStreakClaimRelations = relations(coinStreakClaim, ({ one }) => ({
  user: one(user, {
    fields: [coinStreakClaim.userId],
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
  userPremium,
  notificationPref,
  notificationOutbox,
  monthlyCompletion,
  monthlyMilestone,
  monthlyBadge,
  coinWallet,
  coinLedger,
  coinInventory,
  coinDailyLogin,
  coinStreakClaim,
  userRelations,
  userStatsRelations,
  playResultRelations,
  friendshipRelations,
  userAchievementRelations,
  userUnlockRelations,
  friendChallengeRelations,
  tournamentAwardRelations,
  userPremiumRelations,
  notificationPrefRelations,
  notificationOutboxRelations,
  monthlyCompletionRelations,
  monthlyMilestoneRelations,
  monthlyBadgeRelations,
  coinWalletRelations,
  coinLedgerRelations,
  coinInventoryRelations,
  coinDailyLoginRelations,
  coinStreakClaimRelations,
};
