import type {
  Difficulty,
  LeaderboardPeriod,
  PuzzleType,
} from "@daily-puzzle/puzzle-core";
import {
  ACHIEVEMENTS,
  UNLOCKS,
  WEEKLY_TOURNAMENT_BADGES,
  WEEKLY_TOURNAMENT_BONUS,
  DEFAULT_NOTIFICATION_PREFS,
  collectionIdForDate,
  evaluateAchievements,
  evaluateUnlocks,
  getMonthlyCollection,
  isAchievementVisible,
  isNightOwlClear,
  isPremiumActive,
  isSpeedClear,
  isUnlockVisible,
  isWeekComplete,
  legendaryBadgeId,
  milestonesForProgress,
  nextMonthlyStreak,
  nextStreak,
  nextWeeklyStreak,
  periodRange,
  previousWeekStartKey,
  unlockRequiredForDifficulty,
  weekStartKey,
  todayKey,
  type MonthlyMilestoneDef,
  type NotificationPrefView,
  type PremiumStatusView,
  type ProgressCounters,
} from "@daily-puzzle/puzzle-core";
import {
  friendChallenge,
  friendship,
  getDb,
  monthlyBadge,
  monthlyCompletion,
  monthlyMilestone,
  notificationOutbox,
  notificationPref,
  playResult,
  tournamentAward,
  user,
  userAchievement,
  userPremium,
  userStats,
  userUnlock,
} from "@daily-puzzle/db";
import { and, desc, eq, gte, inArray, lte, or, sql } from "drizzle-orm";
import { randomUUID } from "node:crypto";

export async function ensureUserStats(userId: string) {
  const db = getDb();
  const existing = await db.query.userStats.findFirst({
    where: eq(userStats.userId, userId),
  });
  if (existing) return existing;
  await db.insert(userStats).values({ userId });
  return (
    (await db.query.userStats.findFirst({
      where: eq(userStats.userId, userId),
    })) ?? null
  );
}

export async function getExistingPlay(opts: {
  userId: string;
  puzzleType: PuzzleType;
  difficulty: Difficulty;
  dateKey: string;
  seasonId?: string | null;
}) {
  const db = getDb();
  const seasonId = opts.seasonId ?? "";
  return db.query.playResult.findFirst({
    where: and(
      eq(playResult.userId, opts.userId),
      eq(playResult.puzzleType, opts.puzzleType),
      eq(playResult.difficulty, opts.difficulty),
      eq(playResult.dateKey, opts.dateKey),
      eq(playResult.seasonId, seasonId),
    ),
  });
}

/** All of a user's plays for one calendar day (one query — avoids home-page Turso storms). */
export async function listPlaysForDate(userId: string, dateKey: string) {
  const db = getDb();
  return db.query.playResult.findMany({
    where: and(
      eq(playResult.userId, userId),
      eq(playResult.dateKey, dateKey),
    ),
  });
}

export async function submitPlay(opts: {
  userId: string;
  puzzleType: PuzzleType;
  difficulty: Difficulty;
  dateKey: string;
  score: number;
  won: boolean;
  seasonId?: string | null;
  meta?: Record<string, unknown>;
}) {
  const db = getDb();
  const seasonId = opts.seasonId ?? "";
  const existing = await getExistingPlay({
    userId: opts.userId,
    puzzleType: opts.puzzleType,
    difficulty: opts.difficulty,
    dateKey: opts.dateKey,
    seasonId,
  });
  if (existing) {
    return { ok: false as const, reason: "already_played" as const, play: existing };
  }

  const requiredUnlock = unlockRequiredForDifficulty(opts.difficulty);
  if (requiredUnlock) {
    const unlocked = await userHasUnlock(opts.userId, requiredUnlock);
    if (!unlocked) {
      return { ok: false as const, reason: "locked" as const };
    }
  }

  const playId = randomUUID();
  await db.insert(playResult).values({
    id: playId,
    userId: opts.userId,
    puzzleType: opts.puzzleType,
    difficulty: opts.difficulty,
    dateKey: opts.dateKey,
    seasonId,
    score: opts.score,
    won: opts.won,
    metaJson: opts.meta
      ? JSON.stringify({
          ...opts.meta,
          ...(seasonId ? { seasonId } : {}),
        })
      : seasonId
        ? JSON.stringify({ seasonId })
        : null,
  });

  const stats = await ensureUserStats(opts.userId);
  const streak = nextStreak({
    previousStreak: stats?.currentStreak ?? 0,
    previousDate: stats?.lastPlayDate ?? null,
    playDate: opts.dateKey,
    won: opts.won,
  });
  const bestStreak = Math.max(stats?.bestStreak ?? 0, streak);

  const weekly = nextWeeklyStreak({
    previousStreak: stats?.weeklyStreak ?? 0,
    lastWinWeekStart: stats?.lastWinWeekStart ?? null,
    playDate: opts.dateKey,
    won: opts.won,
  });
  const monthly = nextMonthlyStreak({
    previousStreak: stats?.monthlyStreak ?? 0,
    lastWinMonthStart: stats?.lastWinMonthStart ?? null,
    playDate: opts.dateKey,
    won: opts.won,
  });
  const bestWeeklyStreak = Math.max(
    stats?.bestWeeklyStreak ?? 0,
    weekly.streak,
  );
  const bestMonthlyStreak = Math.max(
    stats?.bestMonthlyStreak ?? 0,
    monthly.streak,
  );

  const totalScore = (stats?.totalScore ?? 0) + opts.score;
  const puzzlesSolved = (stats?.puzzlesSolved ?? 0) + (opts.won ? 1 : 0);

  await db
    .insert(userStats)
    .values({
      userId: opts.userId,
      currentStreak: streak,
      bestStreak,
      weeklyStreak: weekly.streak,
      bestWeeklyStreak,
      monthlyStreak: monthly.streak,
      bestMonthlyStreak,
      lastWinWeekStart: weekly.weekStart,
      lastWinMonthStart: monthly.monthStart,
      totalScore,
      puzzlesSolved,
      lastPlayDate: opts.dateKey,
    })
    .onConflictDoUpdate({
      target: userStats.userId,
      set: {
        currentStreak: streak,
        bestStreak,
        weeklyStreak: weekly.streak,
        bestWeeklyStreak,
        monthlyStreak: monthly.streak,
        bestMonthlyStreak,
        lastWinWeekStart: weekly.weekStart,
        lastWinMonthStart: monthly.monthStart,
        totalScore,
        puzzlesSolved,
        lastPlayDate: opts.dateKey,
        updatedAt: new Date(),
      },
    });

  const progress = await syncProgression(opts.userId, {
    dailyStreak: streak,
    bestDailyStreak: bestStreak,
    weeklyStreak: weekly.streak,
    monthlyStreak: monthly.streak,
  });

  const challengeUpdate = await applyChallengeScore({
    userId: opts.userId,
    puzzleType: opts.puzzleType,
    difficulty: opts.difficulty,
    dateKey: opts.dateKey,
    score: opts.score,
  });

  // Re-sync if a challenge win may unlock Challenge Victor
  let finalAchievements = progress.newAchievements;
  let finalUnlocks = progress.newUnlocks;
  if (challengeUpdate?.wonChallenge) {
    const again = await syncProgression(opts.userId, {
      dailyStreak: streak,
      bestDailyStreak: bestStreak,
      weeklyStreak: weekly.streak,
      monthlyStreak: monthly.streak,
    });
    finalAchievements = again.newAchievements;
    finalUnlocks = again.newUnlocks;
  }

  const play = await db.query.playResult.findFirst({
    where: eq(playResult.id, playId),
  });

  const { grantPlayWinCoins } = await import("@/lib/coin-service");
  const coins = await grantPlayWinCoins({
    userId: opts.userId,
    playId,
    won: opts.won,
    streak,
    dateKey: opts.dateKey,
    achievementIds: finalAchievements.map((a) => a.id),
  });

  return {
    ok: true as const,
    play,
    streak,
    bestStreak,
    weeklyStreak: weekly.streak,
    monthlyStreak: monthly.streak,
    totalScore,
    newAchievements: finalAchievements,
    newUnlocks: finalUnlocks,
    challenge: challengeUpdate,
    coinsEarned: coins.coinsEarned,
    coinBalance: coins.coinBalance,
  };
}

export async function userHasUnlock(userId: string, unlockId: string) {
  const db = getDb();
  const row = await db.query.userUnlock.findFirst({
    where: and(
      eq(userUnlock.userId, userId),
      eq(userUnlock.unlockId, unlockId),
    ),
  });
  return Boolean(row);
}

export async function getUserUnlockIds(userId: string): Promise<string[]> {
  const db = getDb();
  const rows = await db
    .select({ unlockId: userUnlock.unlockId })
    .from(userUnlock)
    .where(eq(userUnlock.userId, userId));
  return rows.map((r) => r.unlockId);
}

export async function getUserAchievementIds(userId: string): Promise<string[]> {
  const db = getDb();
  const rows = await db
    .select({ achievementId: userAchievement.achievementId })
    .from(userAchievement)
    .where(eq(userAchievement.userId, userId));
  return rows.map((r) => r.achievementId);
}

async function buildProgressCounters(
  userId: string,
  streakOverlay?: Partial<ProgressCounters>,
): Promise<ProgressCounters> {
  const db = getDb();
  const [stats, wins, challengeWinRows, champRows] = await Promise.all([
    ensureUserStats(userId),
    db
      .select({
        puzzleType: playResult.puzzleType,
        seasonId: playResult.seasonId,
        metaJson: playResult.metaJson,
        createdAt: playResult.createdAt,
      })
      .from(playResult)
      .where(and(eq(playResult.userId, userId), eq(playResult.won, true))),
    db
      .select({ id: friendChallenge.id })
      .from(friendChallenge)
      .where(
        and(
          eq(friendChallenge.winnerId, userId),
          eq(friendChallenge.status, "completed"),
        ),
      ),
    db
      .select({ id: tournamentAward.id })
      .from(tournamentAward)
      .where(
        and(eq(tournamentAward.userId, userId), eq(tournamentAward.place, 1)),
      ),
  ]);

  let escapeWins = 0;
  let logicWins = 0;
  let speedClears = 0;
  let perfectClears = 0;
  let escapePerfectClears = 0;
  let nightOwlClears = 0;
  let seasonWins = 0;
  const seasonWinsById: Partial<Record<string, number>> = {};

  for (const play of wins) {
    if (play.puzzleType === "escape") escapeWins += 1;
    if (play.puzzleType === "logic") logicWins += 1;
    if (play.createdAt && isNightOwlClear(new Date(play.createdAt))) {
      nightOwlClears += 1;
    }

    let seasonId = play.seasonId || "";
    if (!play.metaJson) {
      if (seasonId) {
        seasonWins += 1;
        seasonWinsById[seasonId] = (seasonWinsById[seasonId] ?? 0) + 1;
      }
      continue;
    }
    try {
      const meta = JSON.parse(play.metaJson) as {
        elapsedMs?: number;
        breakdown?: { perfectBonus?: number };
        seasonId?: string;
      };
      if (isSpeedClear(meta.elapsedMs)) speedClears += 1;
      const wasPerfect = (meta.breakdown?.perfectBonus ?? 0) > 0;
      if (wasPerfect) {
        perfectClears += 1;
        if (play.puzzleType === "escape") escapePerfectClears += 1;
      }
      if (!seasonId && meta.seasonId) seasonId = meta.seasonId;
    } catch {
      /* ignore */
    }
    if (seasonId) {
      seasonWins += 1;
      seasonWinsById[seasonId] = (seasonWinsById[seasonId] ?? 0) + 1;
    }
  }

  return {
    escapeWins,
    logicWins,
    totalWins: wins.length,
    speedClears,
    perfectClears,
    escapePerfectClears,
    nightOwlClears,
    dailyStreak: streakOverlay?.dailyStreak ?? stats?.currentStreak ?? 0,
    weeklyStreak: streakOverlay?.weeklyStreak ?? stats?.weeklyStreak ?? 0,
    monthlyStreak: streakOverlay?.monthlyStreak ?? stats?.monthlyStreak ?? 0,
    bestDailyStreak: streakOverlay?.bestDailyStreak ?? stats?.bestStreak ?? 0,
    challengeWins: challengeWinRows.length,
    weeklyChampionships: champRows.length,
    seasonWins,
    seasonWinsById: seasonWinsById as ProgressCounters["seasonWinsById"],
  };
}

async function syncProgression(
  userId: string,
  streakOverlay?: Partial<ProgressCounters>,
) {
  const db = getDb();
  const [counters, earned, unlocked] = await Promise.all([
    buildProgressCounters(userId, streakOverlay),
    getUserAchievementIds(userId),
    getUserUnlockIds(userId),
  ]);

  const earnedSet = new Set(earned);
  const unlockedSet = new Set(unlocked);
  const newAchievementIds = evaluateAchievements(counters, earnedSet);
  const newUnlockIds = evaluateUnlocks(counters, unlockedSet);

  for (const achievementId of newAchievementIds) {
    await db.insert(userAchievement).values({
      id: randomUUID(),
      userId,
      achievementId,
    });
  }
  for (const unlockId of newUnlockIds) {
    await db.insert(userUnlock).values({
      id: randomUUID(),
      userId,
      unlockId,
    });
  }

  return {
    counters,
    newAchievements: ACHIEVEMENTS.filter((a) =>
      newAchievementIds.includes(a.id),
    ),
    newUnlocks: UNLOCKS.filter((u) => newUnlockIds.includes(u.id)),
    achievementIds: [...earnedSet, ...newAchievementIds],
    unlockIds: [...unlockedSet, ...newUnlockIds],
  };
}

export async function getFriendIds(userId: string): Promise<string[]> {
  const db = getDb();
  const rows = await db
    .select()
    .from(friendship)
    .where(
      and(
        eq(friendship.status, "accepted"),
        or(
          eq(friendship.requesterId, userId),
          eq(friendship.addresseeId, userId),
        ),
      ),
    );

  return rows.map((row) =>
    row.requesterId === userId ? row.addresseeId : row.requesterId,
  );
}

export async function getLeaderboard(opts: {
  dateKey?: string;
  period?: LeaderboardPeriod;
  puzzleType?: PuzzleType;
  difficulty?: Difficulty;
  userIds?: string[];
  limit?: number;
}) {
  const db = getDb();
  const limit = opts.limit ?? 25;
  const period = opts.period ?? "day";
  const anchor = opts.dateKey
    ? new Date(`${opts.dateKey}T12:00:00.000Z`)
    : new Date();
  const { startKey, endKey, rangeLabel } = periodRange(period, anchor);

  const conditions =
    period === "day"
      ? [eq(playResult.dateKey, endKey)]
      : [
          gte(playResult.dateKey, startKey),
          lte(playResult.dateKey, endKey),
        ];

  if (opts.puzzleType) {
    conditions.push(eq(playResult.puzzleType, opts.puzzleType));
  }
  if (opts.difficulty) {
    conditions.push(eq(playResult.difficulty, opts.difficulty));
  }
  if (opts.userIds) {
    if (opts.userIds.length === 0) {
      return { rows: [], dateKey: endKey, period, rangeLabel, startKey, endKey };
    }
    conditions.push(inArray(playResult.userId, opts.userIds));
  }

  const rows = await db
    .select({
      userId: playResult.userId,
      name: user.name,
      displayName: user.displayName,
      equippedAvatarId: user.equippedAvatarId,
      dayScore: sql<number>`sum(${playResult.score})`.mapWith(Number),
      wins: sql<number>`sum(case when ${playResult.won} then 1 else 0 end)`.mapWith(
        Number,
      ),
    })
    .from(playResult)
    .innerJoin(user, eq(user.id, playResult.userId))
    .where(and(...conditions))
    .groupBy(
      playResult.userId,
      user.name,
      user.displayName,
      user.equippedAvatarId,
    )
    .orderBy(desc(sql`sum(${playResult.score})`))
    .limit(limit);

  return { rows, dateKey: endKey, period, rangeLabel, startKey, endKey };
}

export async function listFriendships(userId: string) {
  const db = getDb();
  const rows = await db
    .select()
    .from(friendship)
    .where(
      or(
        eq(friendship.requesterId, userId),
        eq(friendship.addresseeId, userId),
      ),
    );

  const otherIds = [
    ...new Set(
      rows.map((r) =>
        r.requesterId === userId ? r.addresseeId : r.requesterId,
      ),
    ),
  ];

  const people =
    otherIds.length === 0
      ? []
      : await db.select().from(user).where(inArray(user.id, otherIds));

  const byId = new Map(people.map((p) => [p.id, p]));

  return rows.map((row) => {
    const otherId =
      row.requesterId === userId ? row.addresseeId : row.requesterId;
    return {
      ...row,
      other: byId.get(otherId) ?? null,
      incoming: row.addresseeId === userId,
    };
  });
}

export async function requestFriendByEmail(userId: string, email: string) {
  const db = getDb();
  const target = await db.query.user.findFirst({
    where: eq(user.email, email.trim().toLowerCase()),
  });
  if (!target) return { ok: false as const, reason: "not_found" as const };
  if (target.id === userId) return { ok: false as const, reason: "self" as const };

  const existing = await db.query.friendship.findFirst({
    where: or(
      and(
        eq(friendship.requesterId, userId),
        eq(friendship.addresseeId, target.id),
      ),
      and(
        eq(friendship.requesterId, target.id),
        eq(friendship.addresseeId, userId),
      ),
    ),
  });
  if (existing) {
    return { ok: false as const, reason: "exists" as const };
  }

  const id = randomUUID();
  await db.insert(friendship).values({
    id,
    requesterId: userId,
    addresseeId: target.id,
    status: "pending",
  });
  return { ok: true as const, id };
}

/** Public preview for `/invite/[userId]` landing pages. */
export async function getInvitePreview(inviterId: string) {
  const db = getDb();
  const inviter = await db.query.user.findFirst({
    where: eq(user.id, inviterId),
  });
  if (!inviter) return null;
  return {
    id: inviter.id,
    name: inviter.displayName?.trim() || inviter.name,
  };
}

/**
 * Accept a share-link invite: auto-friends the inviter and claimer.
 * Safe to call repeatedly (idempotent when already friends).
 */
export async function claimFriendInvite(claimerId: string, inviterId: string) {
  if (!inviterId || claimerId === inviterId) {
    return { ok: false as const, reason: "self" as const };
  }
  const db = getDb();
  const inviter = await db.query.user.findFirst({
    where: eq(user.id, inviterId),
  });
  if (!inviter) return { ok: false as const, reason: "not_found" as const };

  const existing = await db.query.friendship.findFirst({
    where: or(
      and(
        eq(friendship.requesterId, inviterId),
        eq(friendship.addresseeId, claimerId),
      ),
      and(
        eq(friendship.requesterId, claimerId),
        eq(friendship.addresseeId, inviterId),
      ),
    ),
  });

  if (existing) {
    if (existing.status === "accepted") {
      return { ok: true as const, already: true as const };
    }
    await db
      .update(friendship)
      .set({ status: "accepted" })
      .where(eq(friendship.id, existing.id));
    return { ok: true as const, already: false as const };
  }

  await db.insert(friendship).values({
    id: randomUUID(),
    requesterId: inviterId,
    addresseeId: claimerId,
    status: "accepted",
  });
  return { ok: true as const, already: false as const };
}

export async function respondFriend(
  userId: string,
  friendshipId: string,
  accept: boolean,
) {
  const db = getDb();
  const row = await db.query.friendship.findFirst({
    where: eq(friendship.id, friendshipId),
  });
  if (!row || row.addresseeId !== userId) {
    return { ok: false as const, reason: "forbidden" as const };
  }
  await db
    .update(friendship)
    .set({ status: accept ? "accepted" : "declined" })
    .where(eq(friendship.id, friendshipId));
  return { ok: true as const };
}

export async function getPlayRanks(opts: {
  userId: string;
  dateKey: string;
}): Promise<{
  friends: {
    rank: number | null;
    total: number;
    top: Array<{ userId: string; name: string; score: number }>;
  };
  global: {
    rank: number | null;
    total: number;
  };
}> {
  const friendIds = await getFriendIds(opts.userId);
  const friendBoard = await getLeaderboard({
    dateKey: opts.dateKey,
    period: "day",
    userIds: [...friendIds, opts.userId],
    limit: 100,
  });
  const globalBoard = await getLeaderboard({
    dateKey: opts.dateKey,
    period: "day",
    limit: 500,
  });

  const friendIndex = friendBoard.rows.findIndex((r) => r.userId === opts.userId);
  const globalIndex = globalBoard.rows.findIndex((r) => r.userId === opts.userId);

  return {
    friends: {
      rank: friendIndex >= 0 ? friendIndex + 1 : null,
      total: friendBoard.rows.length,
      top: friendBoard.rows.slice(0, 3).map((r) => ({
        userId: r.userId,
        name: r.displayName || r.name,
        score: r.dayScore,
      })),
    },
    global: {
      rank: globalIndex >= 0 ? globalIndex + 1 : null,
      total: globalBoard.rows.length,
    },
  };
}

export async function getProfile(userId: string) {
  const db = getDb();
  const [profileUser, stats, recent, allWins, friendships, achievementIds, unlockIds] =
    await Promise.all([
      db.query.user.findFirst({ where: eq(user.id, userId) }),
      ensureUserStats(userId),
      db.query.playResult.findMany({
        where: eq(playResult.userId, userId),
        orderBy: [desc(playResult.createdAt)],
        limit: 12,
      }),
      db
        .select({
          puzzleType: playResult.puzzleType,
          metaJson: playResult.metaJson,
        })
        .from(playResult)
        .where(and(eq(playResult.userId, userId), eq(playResult.won, true))),
      listFriendships(userId),
      getUserAchievementIds(userId),
      getUserUnlockIds(userId),
    ]);

  let totalElapsed = 0;
  let timedPlays = 0;
  const typeCounts = new Map<string, number>();

  for (const play of allWins) {
    typeCounts.set(
      play.puzzleType,
      (typeCounts.get(play.puzzleType) ?? 0) + 1,
    );
    if (!play.metaJson) continue;
    try {
      const meta = JSON.parse(play.metaJson) as { elapsedMs?: number };
      if (typeof meta.elapsedMs === "number" && meta.elapsedMs >= 0) {
        totalElapsed += meta.elapsedMs;
        timedPlays += 1;
      }
    } catch {
      /* ignore bad meta */
    }
  }

  let favoriteCategory: string | null = null;
  let favoriteCount = 0;
  for (const [type, count] of typeCounts) {
    if (count > favoriteCount) {
      favoriteCategory = type;
      favoriteCount = count;
    }
  }

  const acceptedFriends = friendships
    .filter((f) => f.status === "accepted" && f.other)
    .map((f) => ({
      id: f.other!.id,
      name: f.other!.displayName || f.other!.name,
      equippedAvatarId: f.other!.equippedAvatarId ?? null,
    }));

  const earned = new Set(achievementIds);
  const unlocked = new Set(unlockIds);
  const [premium, notifications] = await Promise.all([
    getPremiumStatus(userId),
    ensureNotificationPrefs(userId),
  ]);

  const { getEquippedAvatar, listOwnedAvatarIds } = await import(
    "@/lib/coin-service"
  );
  const [equippedAvatarId, ownedAvatarIds] = await Promise.all([
    getEquippedAvatar(userId),
    listOwnedAvatarIds(userId),
  ]);

  return {
    user: profileUser,
    stats,
    recent,
    premium,
    notifications,
    equippedAvatarId,
    ownedAvatarIds,
    insights: {
      averageCompletionMs:
        timedPlays > 0 ? Math.round(totalElapsed / timedPlays) : null,
      favoriteCategory,
      favoriteCount,
      friends: acceptedFriends,
      achievements: ACHIEVEMENTS.filter((a) =>
        isAchievementVisible(a, earned),
      ).map((a) => ({
        ...a,
        earned: earned.has(a.id),
      })),
      unlocks: UNLOCKS.filter((u) =>
        isUnlockVisible(u, earned, unlocked),
      ).map((u) => ({
        ...u,
        unlocked: unlocked.has(u.id),
      })),
      unlockIds,
    },
  };
}

async function areFriends(a: string, b: string): Promise<boolean> {
  const ids = await getFriendIds(a);
  return ids.includes(b);
}

export async function createFriendChallenge(opts: {
  challengerId: string;
  opponentId: string;
  puzzleType: PuzzleType;
  difficulty: Difficulty;
  dateKey: string;
}) {
  if (opts.challengerId === opts.opponentId) {
    return { ok: false as const, reason: "self" as const };
  }
  if (!(await areFriends(opts.challengerId, opts.opponentId))) {
    return { ok: false as const, reason: "not_friends" as const };
  }

  const db = getDb();
  const existing = await db.query.friendChallenge.findFirst({
    where: and(
      eq(friendChallenge.dateKey, opts.dateKey),
      eq(friendChallenge.puzzleType, opts.puzzleType),
      eq(friendChallenge.difficulty, opts.difficulty),
      or(
        and(
          eq(friendChallenge.challengerId, opts.challengerId),
          eq(friendChallenge.opponentId, opts.opponentId),
        ),
        and(
          eq(friendChallenge.challengerId, opts.opponentId),
          eq(friendChallenge.opponentId, opts.challengerId),
        ),
      ),
      inArray(friendChallenge.status, ["pending", "active"]),
    ),
  });
  if (existing) {
    return { ok: false as const, reason: "exists" as const };
  }

  const id = randomUUID();
  await db.insert(friendChallenge).values({
    id,
    challengerId: opts.challengerId,
    opponentId: opts.opponentId,
    puzzleType: opts.puzzleType,
    difficulty: opts.difficulty,
    dateKey: opts.dateKey,
    status: "pending",
  });
  return { ok: true as const, id };
}

export async function respondFriendChallenge(
  userId: string,
  challengeId: string,
  accept: boolean,
) {
  const db = getDb();
  const row = await db.query.friendChallenge.findFirst({
    where: eq(friendChallenge.id, challengeId),
  });
  if (!row || row.opponentId !== userId || row.status !== "pending") {
    return { ok: false as const, reason: "forbidden" as const };
  }
  await db
    .update(friendChallenge)
    .set({ status: accept ? "active" : "declined" })
    .where(eq(friendChallenge.id, challengeId));
  return { ok: true as const };
}

export async function listFriendChallenges(userId: string) {
  const db = getDb();
  const rows = await db
    .select()
    .from(friendChallenge)
    .where(
      or(
        eq(friendChallenge.challengerId, userId),
        eq(friendChallenge.opponentId, userId),
      ),
    )
    .orderBy(desc(friendChallenge.createdAt))
    .limit(40);

  const otherIds = [
    ...new Set(
      rows.map((r) =>
        r.challengerId === userId ? r.opponentId : r.challengerId,
      ),
    ),
  ];
  const people =
    otherIds.length === 0
      ? []
      : await db.select().from(user).where(inArray(user.id, otherIds));
  const byId = new Map(people.map((p) => [p.id, p]));

  return rows.map((row) => {
    const otherId =
      row.challengerId === userId ? row.opponentId : row.challengerId;
    const other = byId.get(otherId);
    return {
      ...row,
      incoming: row.opponentId === userId,
      other: other
        ? {
            id: other.id,
            name: other.displayName || other.name,
          }
        : null,
      href: `/play/${row.puzzleType}/${row.difficulty}`,
    };
  });
}

async function applyChallengeScore(opts: {
  userId: string;
  puzzleType: PuzzleType;
  difficulty: Difficulty;
  dateKey: string;
  score: number;
}) {
  const db = getDb();
  const rows = await db
    .select()
    .from(friendChallenge)
    .where(
      and(
        eq(friendChallenge.dateKey, opts.dateKey),
        eq(friendChallenge.puzzleType, opts.puzzleType),
        eq(friendChallenge.difficulty, opts.difficulty),
        inArray(friendChallenge.status, ["pending", "active"]),
        or(
          eq(friendChallenge.challengerId, opts.userId),
          eq(friendChallenge.opponentId, opts.userId),
        ),
      ),
    );

  if (rows.length === 0) return null;

  let wonChallenge = false;
  let completed: (typeof rows)[number] | null = null;

  for (const row of rows) {
    const isChallenger = row.challengerId === opts.userId;
    const patch = isChallenger
      ? { challengerScore: opts.score, status: "active" as const }
      : { opponentScore: opts.score, status: "active" as const };

    const challengerScore = isChallenger
      ? opts.score
      : row.challengerScore;
    const opponentScore = isChallenger ? row.opponentScore : opts.score;

    if (
      typeof challengerScore === "number" &&
      typeof opponentScore === "number"
    ) {
      let winnerId: string | null = null;
      if (challengerScore > opponentScore) winnerId = row.challengerId;
      else if (opponentScore > challengerScore) winnerId = row.opponentId;

      await db
        .update(friendChallenge)
        .set({
          challengerScore,
          opponentScore,
          winnerId,
          status: "completed",
        })
        .where(eq(friendChallenge.id, row.id));

      if (winnerId) {
        await db
          .update(userStats)
          .set({
            challengeWins: sql`${userStats.challengeWins} + 1`,
            updatedAt: new Date(),
          })
          .where(eq(userStats.userId, winnerId));
        if (winnerId === opts.userId) wonChallenge = true;
      }
      completed = {
        ...row,
        challengerScore,
        opponentScore,
        winnerId,
        status: "completed",
      };
    } else {
      await db
        .update(friendChallenge)
        .set(patch)
        .where(eq(friendChallenge.id, row.id));
    }
  }

  return {
    wonChallenge,
    completed: completed
      ? {
          id: completed.id,
          winnerId: completed.winnerId,
          challengerScore: completed.challengerScore,
          opponentScore: completed.opponentScore,
        }
      : null,
  };
}

/**
 * Settle the previous UTC week once: award global top 3 bonuses + badges.
 * Friends-circle #1 for the calling user is also awarded if applicable.
 */
export async function settleWeeklyTournaments(opts?: {
  forUserId?: string;
}) {
  const weekStart = previousWeekStartKey();
  if (!isWeekComplete(weekStart)) {
    return { settled: false as const, weekStart, awards: [] as const };
  }

  const db = getDb();
  const awards: Array<{
    userId: string;
    place: number;
    badge: string;
    bonusPoints: number;
    scope: "global" | "friends";
  }> = [];

  const existingGlobal = await db.query.tournamentAward.findFirst({
    where: and(
      eq(tournamentAward.weekStart, weekStart),
      eq(tournamentAward.scope, "global"),
    ),
  });

  if (!existingGlobal) {
    const sunday = (() => {
      const [y, m, d] = weekStart.split("-").map(Number);
      return new Date(Date.UTC(y!, m! - 1, d! + 6)).toISOString().slice(0, 10);
    })();

    const top = await db
      .select({
        userId: playResult.userId,
        dayScore: sql<number>`sum(${playResult.score})`.mapWith(Number),
      })
      .from(playResult)
      .where(
        and(
          gte(playResult.dateKey, weekStart),
          lte(playResult.dateKey, sunday),
        ),
      )
      .groupBy(playResult.userId)
      .orderBy(desc(sql`sum(${playResult.score})`))
      .limit(3);

    for (let i = 0; i < top.length; i++) {
      const row = top[i]!;
      const place = i + 1;
      const bonusPoints = WEEKLY_TOURNAMENT_BONUS[i] ?? 0;
      const badge = WEEKLY_TOURNAMENT_BADGES[i] ?? `Place ${place}`;
      await db.insert(tournamentAward).values({
        id: randomUUID(),
        weekStart,
        scope: "global",
        userId: row.userId,
        place,
        bonusPoints,
        badge,
      });
      if (bonusPoints > 0) {
        await ensureUserStats(row.userId);
        await db
          .update(userStats)
          .set({
            totalScore: sql`${userStats.totalScore} + ${bonusPoints}`,
            updatedAt: new Date(),
          })
          .where(eq(userStats.userId, row.userId));
      }
      await syncProgression(row.userId);
      awards.push({
        userId: row.userId,
        place,
        badge,
        bonusPoints,
        scope: "global",
      });
    }
  }

  if (opts?.forUserId) {
    const already = await db.query.tournamentAward.findFirst({
      where: and(
        eq(tournamentAward.weekStart, weekStart),
        eq(tournamentAward.scope, "friends"),
        eq(tournamentAward.userId, opts.forUserId),
      ),
    });
    if (!already) {
      const friendIds = await getFriendIds(opts.forUserId);
      const circle = [...friendIds, opts.forUserId];
      const sunday = (() => {
        const [y, m, d] = weekStart.split("-").map(Number);
        return new Date(Date.UTC(y!, m! - 1, d! + 6)).toISOString().slice(0, 10);
      })();
      const top = await db
        .select({
          userId: playResult.userId,
          dayScore: sql<number>`sum(${playResult.score})`.mapWith(Number),
        })
        .from(playResult)
        .where(
          and(
            gte(playResult.dateKey, weekStart),
            lte(playResult.dateKey, sunday),
            inArray(playResult.userId, circle),
          ),
        )
        .groupBy(playResult.userId)
        .orderBy(desc(sql`sum(${playResult.score})`))
        .limit(3);

      for (let i = 0; i < top.length; i++) {
        const row = top[i]!;
        const place = i + 1;
        // Award each circle member once (unique on week+scope+user).
        const exists = await db.query.tournamentAward.findFirst({
          where: and(
            eq(tournamentAward.weekStart, weekStart),
            eq(tournamentAward.scope, "friends"),
            eq(tournamentAward.userId, row.userId),
          ),
        });
        if (exists) continue;
        const badge = WEEKLY_TOURNAMENT_BADGES[i] ?? `Place ${place}`;
        const friendBonus = WEEKLY_TOURNAMENT_BONUS[i] ?? 0;
        await db.insert(tournamentAward).values({
          id: randomUUID(),
          weekStart,
          scope: "friends",
          userId: row.userId,
          place,
          bonusPoints: friendBonus,
          badge: `Friends ${badge}`,
        });
        if (friendBonus > 0) {
          await ensureUserStats(row.userId);
          await db
            .update(userStats)
            .set({
              totalScore: sql`${userStats.totalScore} + ${friendBonus}`,
              updatedAt: new Date(),
            })
            .where(eq(userStats.userId, row.userId));
        }
        await syncProgression(row.userId);
        if (row.userId === opts.forUserId) {
          awards.push({
            userId: row.userId,
            place,
            badge: `Friends ${badge}`,
            bonusPoints: friendBonus,
            scope: "friends",
          });
        }
      }
    }
  }

  return { settled: true as const, weekStart, awards };
}

export async function listTournamentAwards(userId: string) {
  const db = getDb();
  return db
    .select()
    .from(tournamentAward)
    .where(eq(tournamentAward.userId, userId))
    .orderBy(desc(tournamentAward.awardedAt))
    .limit(20);
}

export async function getCurrentWeekTournamentPreview(opts: {
  userId?: string;
  scope: "global" | "friends";
}) {
  const weekStart = weekStartKey();
  let userIds: string[] | undefined;
  if (opts.scope === "friends") {
    if (!opts.userId) return { weekStart, rows: [] };
    const friends = await getFriendIds(opts.userId);
    userIds = [...friends, opts.userId];
  }
  const board = await getLeaderboard({
    period: "week",
    userIds,
    limit: 10,
  });
  return {
    weekStart,
    rows: board.rows,
    rangeLabel: board.rangeLabel,
  };
}

export async function getPremiumStatus(userId: string): Promise<PremiumStatusView> {
  const db = getDb();
  const row = await db.query.userPremium.findFirst({
    where: eq(userPremium.userId, userId),
  });
  if (!row) {
    return {
      active: false,
      tier: null,
      source: null,
      endsAt: null,
      streakFreezeAvailable: false,
    };
  }
  const active = isPremiumActive({
    status: row.status,
    endsAt: row.endsAt,
  });
  const thisWeek = weekStartKey();
  return {
    active,
    tier: active ? "plus" : null,
    source: row.source,
    endsAt: row.endsAt ? new Date(row.endsAt).toISOString() : null,
    streakFreezeAvailable:
      active && row.streakFreezeUsedWeek !== thisWeek,
  };
}

export async function userHasPremium(userId: string): Promise<boolean> {
  const status = await getPremiumStatus(userId);
  return status.active;
}

export async function grantPremium(opts: {
  userId: string;
  source: "promo" | "manual" | "stripe";
  /** Days of Plus; omit for open-ended */
  days?: number;
}) {
  const db = getDb();
  const now = new Date();
  const endsAt =
    opts.days != null
      ? new Date(now.getTime() + opts.days * 86_400_000)
      : null;
  const existing = await db.query.userPremium.findFirst({
    where: eq(userPremium.userId, opts.userId),
  });
  if (existing) {
    await db
      .update(userPremium)
      .set({
        status: "active",
        source: opts.source,
        startsAt: now,
        endsAt,
        updatedAt: now,
      })
      .where(eq(userPremium.userId, opts.userId));
  } else {
    await db.insert(userPremium).values({
      userId: opts.userId,
      tier: "plus",
      status: "active",
      source: opts.source,
      startsAt: now,
      endsAt,
    });
  }
  return getPremiumStatus(opts.userId);
}

export async function redeemPremiumPromo(userId: string, code: string) {
  const expected = process.env.PREMIUM_PROMO_CODE?.trim().toLowerCase();
  if (!expected || code.trim().toLowerCase() !== expected) {
    return { ok: false as const, reason: "invalid_code" as const };
  }
  const premium = await grantPremium({
    userId,
    source: "promo",
    days: 30,
  });
  return { ok: true as const, premium };
}

export async function claimStreakFreeze(userId: string) {
  const db = getDb();
  const premium = await getPremiumStatus(userId);
  if (!premium.active) {
    return { ok: false as const, reason: "not_premium" as const };
  }
  if (!premium.streakFreezeAvailable) {
    return { ok: false as const, reason: "already_used" as const };
  }

  const stats = await ensureUserStats(userId);
  const dateKey = todayKey();
  if (stats?.lastPlayDate === dateKey) {
    return { ok: false as const, reason: "already_played_today" as const };
  }

  // Apply freeze: stamp yesterday as last play so the current streak stays bridgeable.
  const yesterday = todayKey(new Date(Date.now() - 86_400_000));
  const thisWeek = weekStartKey();

  await db
    .update(userStats)
    .set({
      lastPlayDate: yesterday,
      updatedAt: new Date(),
    })
    .where(eq(userStats.userId, userId));

  await db
    .update(userPremium)
    .set({
      streakFreezeUsedWeek: thisWeek,
      updatedAt: new Date(),
    })
    .where(eq(userPremium.userId, userId));

  return {
    ok: true as const,
    streak: stats?.currentStreak ?? 0,
    protectedThrough: yesterday,
  };
}

export async function ensureNotificationPrefs(
  userId: string,
): Promise<NotificationPrefView> {
  const db = getDb();
  const existing = await db.query.notificationPref.findFirst({
    where: eq(notificationPref.userId, userId),
  });
  if (existing) {
    return {
      emailEnabled: existing.emailEnabled,
      dailyReminder: existing.dailyReminder,
      streakAtRisk: existing.streakAtRisk,
      friendChallenge: existing.friendChallenge,
      tournamentResult: existing.tournamentResult,
      seasonStart: existing.seasonStart,
      reminderHourUtc: existing.reminderHourUtc,
    };
  }
  await db.insert(notificationPref).values({
    userId,
    ...DEFAULT_NOTIFICATION_PREFS,
  });
  return { ...DEFAULT_NOTIFICATION_PREFS };
}

export async function updateNotificationPrefs(
  userId: string,
  patch: Partial<NotificationPrefView>,
): Promise<NotificationPrefView> {
  await ensureNotificationPrefs(userId);
  const db = getDb();
  const next = {
    emailEnabled: patch.emailEnabled,
    dailyReminder: patch.dailyReminder,
    streakAtRisk: patch.streakAtRisk,
    friendChallenge: patch.friendChallenge,
    tournamentResult: patch.tournamentResult,
    seasonStart: patch.seasonStart,
    reminderHourUtc:
      patch.reminderHourUtc != null
        ? Math.max(0, Math.min(23, Math.floor(patch.reminderHourUtc)))
        : undefined,
    updatedAt: new Date(),
  };
  // Remove undefined keys
  const clean = Object.fromEntries(
    Object.entries(next).filter(([, v]) => v !== undefined),
  );
  await db
    .update(notificationPref)
    .set(clean)
    .where(eq(notificationPref.userId, userId));
  return ensureNotificationPrefs(userId);
}

/**
 * Queue daily-reminder outbox rows for the current UTC hour.
 * Delivery (email/push) is intentionally not wired yet.
 */
export async function enqueueDailyReminders(opts?: { hourUtc?: number }) {
  const hour = opts?.hourUtc ?? new Date().getUTCHours();
  const db = getDb();
  const prefs = await db
    .select({
      userId: notificationPref.userId,
      email: user.email,
    })
    .from(notificationPref)
    .innerJoin(user, eq(user.id, notificationPref.userId))
    .where(
      and(
        eq(notificationPref.emailEnabled, true),
        eq(notificationPref.dailyReminder, true),
        eq(notificationPref.reminderHourUtc, hour),
      ),
    );

  const dateKey = todayKey();
  let queued = 0;
  for (const row of prefs) {
    const played = await db.query.playResult.findFirst({
      where: and(
        eq(playResult.userId, row.userId),
        eq(playResult.dateKey, dateKey),
      ),
    });
    if (played) continue;

    const id = randomUUID();
    await db.insert(notificationOutbox).values({
      id,
      userId: row.userId,
      kind: "daily_reminder",
      payloadJson: JSON.stringify({
        email: row.email,
        dateKey,
        subject: "Today’s Inkday boards are waiting",
      }),
      scheduledFor: new Date(),
      status: "pending",
    });
    queued += 1;
  }
  return { hour, candidates: prefs.length, queued };
}

export async function listMonthlyCompletions(
  userId: string,
  collectionId: string,
) {
  const db = getDb();
  return db.query.monthlyCompletion.findMany({
    where: and(
      eq(monthlyCompletion.userId, userId),
      eq(monthlyCompletion.collectionId, collectionId),
      eq(monthlyCompletion.won, true),
    ),
  });
}

export async function getMonthlyCompletion(
  userId: string,
  collectionId: string,
  slotIndex: number,
) {
  const db = getDb();
  return db.query.monthlyCompletion.findFirst({
    where: and(
      eq(monthlyCompletion.userId, userId),
      eq(monthlyCompletion.collectionId, collectionId),
      eq(monthlyCompletion.slotIndex, slotIndex),
    ),
  });
}

export async function getMonthlyProgress(userId: string, collectionId?: string) {
  const id = collectionId ?? collectionIdForDate();
  const collection = getMonthlyCollection(id);
  const [completions, milestones, badges] = await Promise.all([
    listMonthlyCompletions(userId, id),
    getDb().query.monthlyMilestone.findMany({
      where: and(
        eq(monthlyMilestone.userId, userId),
        eq(monthlyMilestone.collectionId, id),
      ),
    }),
    getDb().query.monthlyBadge.findMany({
      where: and(
        eq(monthlyBadge.userId, userId),
        eq(monthlyBadge.collectionId, id),
      ),
    }),
  ]);
  const cleared = completions.length;
  return {
    collection,
    cleared,
    completions,
    milestones,
    badges,
    earnedMilestones: milestonesForProgress(cleared),
  };
}

export async function listAllMonthlyBadges(userId: string) {
  const db = getDb();
  return db.query.monthlyBadge.findMany({
    where: eq(monthlyBadge.userId, userId),
    orderBy: [desc(monthlyBadge.awardedAt)],
  });
}

export async function submitMonthlyClear(opts: {
  userId: string;
  collectionId: string;
  slotIndex: number;
  puzzleType: string;
  difficulty: Difficulty;
  score: number;
  won: boolean;
  meta?: Record<string, unknown>;
}): Promise<{
  ok: true;
  alreadyCleared: boolean;
  score: number;
  cleared: number;
  newMilestones: MonthlyMilestoneDef[];
  newBadges: Array<{ badgeId: string; title: string }>;
  totalBonus: number;
  coinsEarned?: number;
  coinBalance?: number;
} | { ok: false; reason: string }> {
  const db = getDb();
  const existing = await getMonthlyCompletion(
    opts.userId,
    opts.collectionId,
    opts.slotIndex,
  );
  if (existing?.won) {
    const completions = await listMonthlyCompletions(
      opts.userId,
      opts.collectionId,
    );
    return {
      ok: true,
      alreadyCleared: true,
      score: existing.score,
      cleared: completions.length,
      newMilestones: [],
      newBadges: [],
      totalBonus: 0,
      coinsEarned: 0,
    };
  }

  if (!opts.won) {
    return { ok: false, reason: "not_won" };
  }

  await ensureUserStats(opts.userId);

  if (existing) {
    await db
      .update(monthlyCompletion)
      .set({
        score: opts.score,
        won: true,
        metaJson: opts.meta ? JSON.stringify(opts.meta) : null,
        puzzleType: opts.puzzleType,
        difficulty: opts.difficulty,
      })
      .where(eq(monthlyCompletion.id, existing.id));
  } else {
    await db.insert(monthlyCompletion).values({
      id: randomUUID(),
      userId: opts.userId,
      collectionId: opts.collectionId,
      slotIndex: opts.slotIndex,
      puzzleType: opts.puzzleType,
      difficulty: opts.difficulty,
      score: opts.score,
      won: true,
      metaJson: opts.meta ? JSON.stringify(opts.meta) : null,
    });
  }

  await db
    .update(userStats)
    .set({
      totalScore: sql`${userStats.totalScore} + ${opts.score}`,
      puzzlesSolved: sql`${userStats.puzzlesSolved} + 1`,
      updatedAt: new Date(),
    })
    .where(eq(userStats.userId, opts.userId));

  const completions = await listMonthlyCompletions(
    opts.userId,
    opts.collectionId,
  );
  const cleared = completions.length;
  const already = await db.query.monthlyMilestone.findMany({
    where: and(
      eq(monthlyMilestone.userId, opts.userId),
      eq(monthlyMilestone.collectionId, opts.collectionId),
    ),
  });
  const alreadyIds = new Set(already.map((m) => m.milestoneId));
  const newlyEarned = milestonesForProgress(cleared).filter(
    (m) => !alreadyIds.has(m.id),
  );

  const newBadges: Array<{ badgeId: string; title: string }> = [];
  let totalBonus = 0;

  for (const milestone of newlyEarned) {
    await db.insert(monthlyMilestone).values({
      id: randomUUID(),
      userId: opts.userId,
      collectionId: opts.collectionId,
      milestoneId: milestone.id,
      bonusPoints: milestone.bonusPoints,
    });
    totalBonus += milestone.bonusPoints;

    const badgeId =
      milestone.id === "legendary"
        ? legendaryBadgeId(opts.collectionId)
        : `${milestone.id}_${opts.collectionId}`;
    const title =
      milestone.id === "legendary"
        ? `${milestone.badgeTitle} · ${opts.collectionId}`
        : milestone.badgeTitle;

    await db.insert(monthlyBadge).values({
      id: randomUUID(),
      userId: opts.userId,
      collectionId: opts.collectionId,
      badgeId,
      title,
    });
    newBadges.push({ badgeId, title });
  }

  if (totalBonus > 0) {
    await db
      .update(userStats)
      .set({
        totalScore: sql`${userStats.totalScore} + ${totalBonus}`,
        updatedAt: new Date(),
      })
      .where(eq(userStats.userId, opts.userId));
  }

  const { grantMonthlyClearCoins } = await import("@/lib/coin-service");
  const coins = await grantMonthlyClearCoins({
    userId: opts.userId,
    collectionId: opts.collectionId,
    slotIndex: opts.slotIndex,
    alreadyCleared: false,
    milestoneIds: newlyEarned.map((m) => m.id),
    cleared,
  });

  return {
    ok: true,
    alreadyCleared: false,
    score: opts.score,
    cleared,
    newMilestones: newlyEarned,
    newBadges,
    totalBonus,
    coinsEarned: coins.coinsEarned,
    coinBalance: coins.coinBalance,
  };
}

