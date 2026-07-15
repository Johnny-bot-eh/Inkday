import type { Difficulty, PuzzleType } from "@daily-puzzle/puzzle-core";
import { nextStreak } from "@daily-puzzle/puzzle-core";
import {
  friendship,
  getDb,
  playResult,
  user,
  userStats,
} from "@daily-puzzle/db";
import { and, desc, eq, inArray, or, sql } from "drizzle-orm";
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
}) {
  const db = getDb();
  return db.query.playResult.findFirst({
    where: and(
      eq(playResult.userId, opts.userId),
      eq(playResult.puzzleType, opts.puzzleType),
      eq(playResult.difficulty, opts.difficulty),
      eq(playResult.dateKey, opts.dateKey),
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
  meta?: Record<string, unknown>;
}) {
  const db = getDb();
  const existing = await getExistingPlay(opts);
  if (existing) {
    return { ok: false as const, reason: "already_played" as const, play: existing };
  }

  const playId = randomUUID();
  await db.insert(playResult).values({
    id: playId,
    userId: opts.userId,
    puzzleType: opts.puzzleType,
    difficulty: opts.difficulty,
    dateKey: opts.dateKey,
    score: opts.score,
    won: opts.won,
    metaJson: opts.meta ? JSON.stringify(opts.meta) : null,
  });

  const stats = await ensureUserStats(opts.userId);
  const streak = nextStreak({
    previousStreak: stats?.currentStreak ?? 0,
    previousDate: stats?.lastPlayDate ?? null,
    playDate: opts.dateKey,
    won: opts.won,
  });
  const bestStreak = Math.max(stats?.bestStreak ?? 0, streak);
  const totalScore = (stats?.totalScore ?? 0) + opts.score;
  const puzzlesSolved = (stats?.puzzlesSolved ?? 0) + (opts.won ? 1 : 0);

  await db
    .insert(userStats)
    .values({
      userId: opts.userId,
      currentStreak: streak,
      bestStreak,
      totalScore,
      puzzlesSolved,
      lastPlayDate: opts.dateKey,
    })
    .onConflictDoUpdate({
      target: userStats.userId,
      set: {
        currentStreak: streak,
        bestStreak,
        totalScore,
        puzzlesSolved,
        lastPlayDate: opts.dateKey,
        updatedAt: new Date(),
      },
    });

  const play = await db.query.playResult.findFirst({
    where: eq(playResult.id, playId),
  });

  return {
    ok: true as const,
    play,
    streak,
    bestStreak,
    totalScore,
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
  dateKey: string;
  puzzleType?: PuzzleType;
  difficulty?: Difficulty;
  userIds?: string[];
  limit?: number;
}) {
  const db = getDb();
  const limit = opts.limit ?? 25;

  const conditions = [eq(playResult.dateKey, opts.dateKey)];
  if (opts.puzzleType) {
    conditions.push(eq(playResult.puzzleType, opts.puzzleType));
  }
  if (opts.difficulty) {
    conditions.push(eq(playResult.difficulty, opts.difficulty));
  }
  if (opts.userIds) {
    if (opts.userIds.length === 0) return [];
    conditions.push(inArray(playResult.userId, opts.userIds));
  }

  return db
    .select({
      userId: playResult.userId,
      name: user.name,
      displayName: user.displayName,
      dayScore: sql<number>`sum(${playResult.score})`.mapWith(Number),
      wins: sql<number>`sum(case when ${playResult.won} then 1 else 0 end)`.mapWith(
        Number,
      ),
    })
    .from(playResult)
    .innerJoin(user, eq(user.id, playResult.userId))
    .where(and(...conditions))
    .groupBy(playResult.userId, user.name, user.displayName)
    .orderBy(desc(sql`sum(${playResult.score})`))
    .limit(limit);
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

export async function getProfile(userId: string) {
  const db = getDb();
  const [profileUser, stats, recent] = await Promise.all([
    db.query.user.findFirst({ where: eq(user.id, userId) }),
    ensureUserStats(userId),
    db.query.playResult.findMany({
      where: eq(playResult.userId, userId),
      orderBy: [desc(playResult.createdAt)],
      limit: 12,
    }),
  ]);
  return { user: profileUser, stats, recent };
}
