import {
  COIN_EARN,
  PLUS_MONTHLY_STIPEND,
  applyPlusCoinBonus,
  getShopItem,
  isConsumableItemId,
  isPremiumActive,
  monthlyMilestoneCoins,
  monthStartKey,
  todayKey,
  type ConsumableItemId,
} from "@daily-puzzle/puzzle-core";
import {
  coinDailyLogin,
  coinInventory,
  coinLedger,
  coinStreakClaim,
  coinWallet,
  getDb,
  userPremium,
  userStats,
} from "@daily-puzzle/db";
import { and, desc, eq } from "drizzle-orm";
import { randomUUID } from "node:crypto";

async function userIsPlus(userId: string): Promise<boolean> {
  const db = getDb();
  const row = await db.query.userPremium.findFirst({
    where: eq(userPremium.userId, userId),
  });
  if (!row) return false;
  return isPremiumActive({
    status: row.status,
    endsAt: row.endsAt,
  });
}

async function loadStats(userId: string) {
  const db = getDb();
  return db.query.userStats.findFirst({
    where: eq(userStats.userId, userId),
  });
}

export async function ensureCoinWallet(userId: string) {
  const db = getDb();
  const existing = await db.query.coinWallet.findFirst({
    where: eq(coinWallet.userId, userId),
  });
  if (existing) return existing;
  await db.insert(coinWallet).values({ userId, balance: 0 });
  return (
    (await db.query.coinWallet.findFirst({
      where: eq(coinWallet.userId, userId),
    })) ?? { userId, balance: 0, updatedAt: new Date() }
  );
}

export async function getCoinBalance(userId: string): Promise<number> {
  const wallet = await ensureCoinWallet(userId);
  return wallet.balance;
}

export async function listCoinLedger(
  userId: string,
  opts?: { limit?: number; offset?: number },
) {
  const db = getDb();
  const limit = opts?.limit ?? 40;
  const offset = opts?.offset ?? 0;
  return db.query.coinLedger.findMany({
    where: eq(coinLedger.userId, userId),
    orderBy: [desc(coinLedger.createdAt)],
    limit,
    offset,
  });
}

export async function listCoinInventory(userId: string) {
  const db = getDb();
  return db.query.coinInventory.findMany({
    where: eq(coinInventory.userId, userId),
  });
}

export async function getInventoryQty(
  userId: string,
  itemId: string,
): Promise<number> {
  const db = getDb();
  const row = await db.query.coinInventory.findFirst({
    where: and(
      eq(coinInventory.userId, userId),
      eq(coinInventory.itemId, itemId),
    ),
  });
  return row?.qty ?? 0;
}

/**
 * Idempotent coin grant via unique (userId, reason, refType, refId).
 */
export async function grantCoins(opts: {
  userId: string;
  delta: number;
  reason: string;
  refType: string;
  refId: string;
  /** When true, skip Plus multiplier (already applied). */
  raw?: boolean;
}) {
  if (opts.delta === 0) {
    const balance = await getCoinBalance(opts.userId);
    return { ok: true as const, granted: 0, balance, duplicate: false };
  }

  let delta = opts.delta;
  if (!opts.raw && delta > 0) {
    const isPlus = await userIsPlus(opts.userId);
    delta = applyPlusCoinBonus(delta, isPlus);
  }

  const db = getDb();
  await ensureCoinWallet(opts.userId);

  const existing = await db.query.coinLedger.findFirst({
    where: and(
      eq(coinLedger.userId, opts.userId),
      eq(coinLedger.reason, opts.reason),
      eq(coinLedger.refType, opts.refType),
      eq(coinLedger.refId, opts.refId),
    ),
  });
  if (existing) {
    return {
      ok: true as const,
      granted: 0,
      balance: existing.balanceAfter,
      duplicate: true,
    };
  }

  const wallet = await ensureCoinWallet(opts.userId);
  const next = wallet.balance + delta;
  if (next < 0) {
    return {
      ok: false as const,
      reason: "insufficient" as const,
      balance: wallet.balance,
    };
  }

  try {
    await db.insert(coinLedger).values({
      id: randomUUID(),
      userId: opts.userId,
      delta,
      balanceAfter: next,
      reason: opts.reason,
      refType: opts.refType,
      refId: opts.refId,
    });
  } catch {
    const again = await db.query.coinLedger.findFirst({
      where: and(
        eq(coinLedger.userId, opts.userId),
        eq(coinLedger.reason, opts.reason),
        eq(coinLedger.refType, opts.refType),
        eq(coinLedger.refId, opts.refId),
      ),
    });
    if (again) {
      return {
        ok: true as const,
        granted: 0,
        balance: again.balanceAfter,
        duplicate: true,
      };
    }
    throw new Error("coin_ledger_insert_failed");
  }

  await db
    .update(coinWallet)
    .set({ balance: next, updatedAt: new Date() })
    .where(eq(coinWallet.userId, opts.userId));

  return {
    ok: true as const,
    granted: delta,
    balance: next,
    duplicate: false,
  };
}

export async function spendCoins(opts: {
  userId: string;
  amount: number;
  reason: string;
  refType: string;
  refId: string;
}) {
  if (opts.amount <= 0) {
    return { ok: false as const, reason: "invalid" as const };
  }
  return grantCoins({
    userId: opts.userId,
    delta: -opts.amount,
    reason: opts.reason,
    refType: opts.refType,
    refId: opts.refId,
    raw: true,
  });
}

async function addInventory(userId: string, itemId: string, qty = 1) {
  const db = getDb();
  const existing = await db.query.coinInventory.findFirst({
    where: and(
      eq(coinInventory.userId, userId),
      eq(coinInventory.itemId, itemId),
    ),
  });
  if (existing) {
    await db
      .update(coinInventory)
      .set({ qty: existing.qty + qty })
      .where(eq(coinInventory.id, existing.id));
    return existing.qty + qty;
  }
  await db.insert(coinInventory).values({
    id: randomUUID(),
    userId,
    itemId,
    qty,
  });
  return qty;
}

async function consumeInventory(
  userId: string,
  itemId: string,
  qty = 1,
): Promise<boolean> {
  const db = getDb();
  const existing = await db.query.coinInventory.findFirst({
    where: and(
      eq(coinInventory.userId, userId),
      eq(coinInventory.itemId, itemId),
    ),
  });
  if (!existing || existing.qty < qty) return false;
  const next = existing.qty - qty;
  if (next <= 0) {
    await db.delete(coinInventory).where(eq(coinInventory.id, existing.id));
  } else {
    await db
      .update(coinInventory)
      .set({ qty: next })
      .where(eq(coinInventory.id, existing.id));
  }
  return true;
}

export async function buyShopItem(userId: string, itemId: string) {
  const item = getShopItem(itemId);
  if (!item || item.comingSoon || item.price <= 0) {
    return { ok: false as const, reason: "unavailable" as const };
  }
  if (item.plusOnly) {
    const isPlus = await userIsPlus(userId);
    if (!isPlus) {
      return { ok: false as const, reason: "plus_required" as const };
    }
  }

  if (item.effect === "streak_restore") {
    return restoreStreakWithCoins(userId);
  }

  const spend = await spendCoins({
    userId,
    amount: item.price,
    reason: "shop_buy",
    refType: "shop_item",
    refId: `${itemId}:${randomUUID()}`,
  });
  if (!spend.ok) {
    return {
      ok: false as const,
      reason: spend.reason ?? "insufficient",
      balance: "balance" in spend ? spend.balance : undefined,
    };
  }

  const qty = await addInventory(userId, itemId, 1);
  return {
    ok: true as const,
    itemId,
    qty,
    balance: spend.balance,
    spent: item.price,
  };
}

export async function useConsumable(
  userId: string,
  itemId: ConsumableItemId,
  refId: string,
) {
  if (!isConsumableItemId(itemId)) {
    return { ok: false as const, reason: "invalid" as const };
  }
  const ok = await consumeInventory(userId, itemId, 1);
  if (!ok) {
    return { ok: false as const, reason: "none" as const };
  }
  return {
    ok: true as const,
    itemId,
    qtyLeft: await getInventoryQty(userId, itemId),
  };
}

/** Buy-and-use in one step when inventory is empty. */
export async function buyAndUseConsumable(
  userId: string,
  itemId: ConsumableItemId,
  refId: string,
) {
  const qty = await getInventoryQty(userId, itemId);
  if (qty > 0) {
    return useConsumable(userId, itemId, refId);
  }
  const buy = await buyShopItem(userId, itemId);
  if (!buy.ok) return buy;
  return useConsumable(userId, itemId, refId);
}

export async function hasClaimedDailyLogin(
  userId: string,
  dateKey = todayKey(),
) {
  const db = getDb();
  const row = await db.query.coinDailyLogin.findFirst({
    where: and(
      eq(coinDailyLogin.userId, userId),
      eq(coinDailyLogin.dateKey, dateKey),
    ),
  });
  return Boolean(row);
}

export async function claimDailyLogin(userId: string) {
  const dateKey = todayKey();
  const db = getDb();
  const existing = await db.query.coinDailyLogin.findFirst({
    where: and(
      eq(coinDailyLogin.userId, userId),
      eq(coinDailyLogin.dateKey, dateKey),
    ),
  });
  if (existing) {
    return {
      ok: true as const,
      already: true as const,
      coins: 0,
      balance: await getCoinBalance(userId),
      dateKey,
    };
  }

  const grant = await grantCoins({
    userId,
    delta: COIN_EARN.dailyLogin,
    reason: "daily_login",
    refType: "date",
    refId: dateKey,
  });
  if (!grant.ok) {
    return { ok: false as const, reason: "grant_failed" as const };
  }

  try {
    await db.insert(coinDailyLogin).values({
      id: randomUUID(),
      userId,
      dateKey,
      coins: grant.granted,
    });
  } catch {
    // Unique race — still fine
  }

  return {
    ok: true as const,
    already: false as const,
    coins: grant.granted,
    balance: grant.balance,
    dateKey,
  };
}

export async function claimPlusMonthlyStipend(userId: string) {
  const isPlus = await userIsPlus(userId);
  if (!isPlus) {
    return { ok: false as const, reason: "not_premium" as const };
  }
  const monthKey = monthStartKey(new Date());
  const grant = await grantCoins({
    userId,
    delta: PLUS_MONTHLY_STIPEND,
    reason: "plus_stipend",
    refType: "month",
    refId: monthKey,
    raw: true,
  });
  if (!grant.ok) {
    return { ok: false as const, reason: "grant_failed" as const };
  }
  return {
    ok: true as const,
    already: grant.duplicate,
    coins: grant.granted,
    balance: grant.balance,
    monthKey,
  };
}

export async function maybeClaimStreakCoins(
  userId: string,
  streak: number,
  dateKey: string,
) {
  if (streak < 7) {
    return { granted: 0, balance: await getCoinBalance(userId) };
  }
  // Claim once per reaching a multiple of 7 ending on this date
  if (streak % 7 !== 0) {
    return { granted: 0, balance: await getCoinBalance(userId) };
  }

  const db = getDb();
  const existing = await db.query.coinStreakClaim.findFirst({
    where: and(
      eq(coinStreakClaim.userId, userId),
      eq(coinStreakClaim.streakLength, streak),
      eq(coinStreakClaim.anchorDate, dateKey),
    ),
  });
  if (existing) {
    return { granted: 0, balance: await getCoinBalance(userId) };
  }

  const grant = await grantCoins({
    userId,
    delta: COIN_EARN.streak7,
    reason: "streak_7",
    refType: "streak",
    refId: `${streak}:${dateKey}`,
  });

  if (grant.ok && grant.granted > 0) {
    try {
      await db.insert(coinStreakClaim).values({
        id: randomUUID(),
        userId,
        streakLength: streak,
        anchorDate: dateKey,
        coins: grant.granted,
      });
    } catch {
      // race
    }
  }

  return {
    granted: grant.ok ? grant.granted : 0,
    balance: grant.ok ? grant.balance : await getCoinBalance(userId),
  };
}

export async function restoreStreakWithCoins(userId: string) {
  const stats = await loadStats(userId);
  const dateKey = todayKey();
  if (!stats?.lastPlayDate) {
    return { ok: false as const, reason: "no_streak" as const };
  }
  if (stats.lastPlayDate === dateKey) {
    return { ok: false as const, reason: "already_active" as const };
  }

  const yesterday = todayKey(new Date(Date.now() - 86_400_000));
  const dayBefore = todayKey(new Date(Date.now() - 2 * 86_400_000));
  // Eligible if last win was yesterday or day-before (broken within ~48h) and not today
  if (stats.lastPlayDate !== yesterday && stats.lastPlayDate !== dayBefore) {
    return { ok: false as const, reason: "window_closed" as const };
  }
  if (stats.currentStreak <= 0) {
    return { ok: false as const, reason: "no_streak" as const };
  }

  const spend = await spendCoins({
    userId,
    amount: 200,
    reason: "streak_restore",
    refType: "date",
    refId: `${dateKey}:${stats.lastPlayDate}`,
  });
  if (!spend.ok) {
    return {
      ok: false as const,
      reason: "insufficient" as const,
      balance: spend.reason === "insufficient" ? spend.balance : 0,
    };
  }

  const db = getDb();
  // Bridge: set lastPlayDate to yesterday so today's win continues the streak
  await db
    .update(userStats)
    .set({
      lastPlayDate: yesterday,
      updatedAt: new Date(),
    })
    .where(eq(userStats.userId, userId));

  return {
    ok: true as const,
    balance: spend.balance,
    streak: stats.currentStreak,
    lastPlayDate: yesterday,
  };
}

export async function grantPlayWinCoins(opts: {
  userId: string;
  playId: string;
  won: boolean;
  streak: number;
  dateKey: string;
  achievementIds?: string[];
}) {
  let coinsEarned = 0;
  let balance = await getCoinBalance(opts.userId);

  if (opts.won) {
    const win = await grantCoins({
      userId: opts.userId,
      delta: COIN_EARN.dailyWin,
      reason: "daily_win",
      refType: "play_result",
      refId: opts.playId,
    });
    if (win.ok) {
      coinsEarned += win.granted;
      balance = win.balance;
    }

    const streakBonus = await maybeClaimStreakCoins(
      opts.userId,
      opts.streak,
      opts.dateKey,
    );
    coinsEarned += streakBonus.granted;
    balance = streakBonus.balance;
  }

  if (opts.achievementIds?.length) {
    for (const id of opts.achievementIds) {
      const g = await grantCoins({
        userId: opts.userId,
        delta: COIN_EARN.achievement,
        reason: "achievement",
        refType: "achievement",
        refId: id,
      });
      if (g.ok) {
        coinsEarned += g.granted;
        balance = g.balance;
      }
    }
  }

  return { coinsEarned, coinBalance: balance };
}

export async function grantMonthlyClearCoins(opts: {
  userId: string;
  collectionId: string;
  slotIndex: number;
  alreadyCleared: boolean;
  milestoneIds: string[];
  cleared: number;
}) {
  let coinsEarned = 0;
  let balance = await getCoinBalance(opts.userId);

  if (!opts.alreadyCleared) {
    const slot = await grantCoins({
      userId: opts.userId,
      delta: COIN_EARN.monthlySlot,
      reason: "monthly_slot",
      refType: "monthly_completion",
      refId: `${opts.collectionId}:${opts.slotIndex}`,
    });
    if (slot.ok) {
      coinsEarned += slot.granted;
      balance = slot.balance;
    }
  }

  for (const mid of opts.milestoneIds) {
    const amount = monthlyMilestoneCoins(mid);
    if (amount <= 0) continue;
    const g = await grantCoins({
      userId: opts.userId,
      delta: amount,
      reason: "monthly_milestone",
      refType: "monthly_milestone",
      refId: `${opts.collectionId}:${mid}`,
    });
    if (g.ok) {
      coinsEarned += g.granted;
      balance = g.balance;
    }
  }

  if (opts.cleared >= 60 && opts.milestoneIds.includes("legendary")) {
    const fin = await grantCoins({
      userId: opts.userId,
      delta: COIN_EARN.caseFileComplete,
      reason: "case_file_complete",
      refType: "monthly_collection",
      refId: opts.collectionId,
    });
    if (fin.ok) {
      coinsEarned += fin.granted;
      balance = fin.balance;
    }
  }

  return { coinsEarned, coinBalance: balance };
}
