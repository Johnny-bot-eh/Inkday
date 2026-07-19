import {
  getShopItem,
  isDecorationItemId,
  isHabitatDecorItemId,
} from "@daily-puzzle/puzzle-core";
import { getDb, getLibsqlClient, gardenPlacement, user, userGift } from "@daily-puzzle/db";
import { and, desc, eq, inArray, sql } from "drizzle-orm";
import { randomUUID } from "node:crypto";
import {
  MAX_COIN_GIFT,
  MIN_COIN_GIFT,
} from "@/lib/friend-gift-constants";
import {
  consumeInventory,
  grantCoins,
  grantInventoryItem,
  listCoinInventory,
  spendCoins,
} from "@/lib/coin-service";
import { areFriends } from "@/lib/game-service";

export { MAX_COIN_GIFT, MIN_COIN_GIFT } from "@/lib/friend-gift-constants";

const USER_GIFT_CREATE_SQL = `CREATE TABLE IF NOT EXISTS user_gift (
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
)`;

let userGiftTableReady: Promise<void> | null = null;

export async function ensureUserGiftTable() {
  if (!userGiftTableReady) {
    userGiftTableReady = (async () => {
      const client = getLibsqlClient();
      await client.execute(USER_GIFT_CREATE_SQL);
      await client.execute(
        `CREATE INDEX IF NOT EXISTS user_gift_recipient_status_idx ON user_gift(recipient_id, status)`,
      );
      await client.execute(
        `CREATE INDEX IF NOT EXISTS user_gift_sender_idx ON user_gift(sender_id)`,
      );
    })();
  }
  await userGiftTableReady;
}

export type PendingFriendGift = {
  id: string;
  kind: "coins" | "decoration";
  coins: number;
  itemId: string | null;
  itemTitle: string | null;
  message: string | null;
  createdAt: string;
  sender: {
    id: string;
    name: string;
    equippedAvatarId: string | null;
    equippedAccessoryId: string | null;
  };
};

export type SendableDecor = {
  itemId: string;
  title: string;
  qty: number;
};

export async function countPendingGifts(userId: string): Promise<number> {
  await ensureUserGiftTable();
  const db = getDb();
  const rows = await db
    .select({ count: sql<number>`count(*)`.mapWith(Number) })
    .from(userGift)
    .where(
      and(eq(userGift.recipientId, userId), eq(userGift.status, "pending")),
    );
  return rows[0]?.count ?? 0;
}

export async function listSendableDecor(userId: string): Promise<SendableDecor[]> {
  const inventory = await listCoinInventory(userId);
  const db = getDb();
  let placements: Array<{ itemId: string }> = [];
  try {
    placements = await db.query.gardenPlacement.findMany({
      where: eq(gardenPlacement.userId, userId),
      columns: { itemId: true },
    });
  } catch {
    placements = [];
  }

  const placedCounts = new Map<string, number>();
  for (const p of placements) {
    if (isHabitatDecorItemId(p.itemId)) continue;
    placedCounts.set(p.itemId, (placedCounts.get(p.itemId) ?? 0) + 1);
  }

  return inventory
    .filter(
      (row) =>
        isDecorationItemId(row.itemId) &&
        !isHabitatDecorItemId(row.itemId) &&
        row.qty > 0,
    )
    .map((row) => {
      const placed = placedCounts.get(row.itemId) ?? 0;
      const remaining = Math.max(0, row.qty - placed);
      return {
        itemId: row.itemId,
        title: getShopItem(row.itemId)?.title ?? row.itemId,
        qty: remaining,
      };
    })
    .filter((row) => row.qty > 0);
}

export async function listPendingGifts(
  userId: string,
): Promise<PendingFriendGift[]> {
  await ensureUserGiftTable();
  const db = getDb();
  const rows = await db.query.userGift.findMany({
    where: and(
      eq(userGift.recipientId, userId),
      eq(userGift.status, "pending"),
    ),
    orderBy: [desc(userGift.createdAt)],
    limit: 50,
  });

  if (rows.length === 0) return [];

  const senderIds = [...new Set(rows.map((r) => r.senderId))];
  const senders = await db
    .select({
      id: user.id,
      name: user.name,
      displayName: user.displayName,
      equippedAvatarId: user.equippedAvatarId,
      equippedAccessoryId: user.equippedAccessoryId,
    })
    .from(user)
    .where(inArray(user.id, senderIds));

  const byId = new Map(senders.map((s) => [s.id, s]));

  return rows.map((row) => {
    const sender = byId.get(row.senderId);
    return {
      id: row.id,
      kind: row.kind as "coins" | "decoration",
      coins: row.coins,
      itemId: row.itemId,
      itemTitle: row.itemId
        ? (getShopItem(row.itemId)?.title ?? row.itemId)
        : null,
      message: row.message,
      createdAt: row.createdAt.toISOString(),
      sender: {
        id: row.senderId,
        name: sender?.displayName?.trim() || sender?.name || "Friend",
        equippedAvatarId: sender?.equippedAvatarId ?? null,
        equippedAccessoryId: sender?.equippedAccessoryId ?? null,
      },
    };
  });
}

export async function sendFriendGift(opts: {
  senderId: string;
  recipientId: string;
  kind: "coins" | "decoration";
  coins?: number;
  itemId?: string;
  message?: string;
}): Promise<
  | { ok: true; giftId: string; xpEarned: number; accountXp: number }
  | { ok: false; reason: string }
> {
  await ensureUserGiftTable();

  if (opts.senderId === opts.recipientId) {
    return { ok: false, reason: "self" };
  }
  if (!(await areFriends(opts.senderId, opts.recipientId))) {
    return { ok: false, reason: "not_friends" };
  }

  const db = getDb();
  const recipient = await db.query.user.findFirst({
    where: eq(user.id, opts.recipientId),
  });
  if (!recipient) return { ok: false, reason: "not_found" };

  const giftId = randomUUID();
  const trimmedMessage = opts.message?.trim().slice(0, 140) || null;

  async function finishOk(
    kind: "coins" | "decoration",
    coins: number,
  ): Promise<{ ok: true; giftId: string; xpEarned: number; accountXp: number }> {
    const { grantFriendGiftSendXp, getAccountXpSummary } = await import(
      "@/lib/pet-service"
    );
    const xpEarned = await grantFriendGiftSendXp(
      opts.senderId,
      giftId,
      kind,
      coins,
    );
    const summary = await getAccountXpSummary(opts.senderId);
    return {
      ok: true,
      giftId,
      xpEarned,
      accountXp: summary.accountXp,
    };
  }

  if (opts.kind === "coins") {
    const amount = Math.floor(opts.coins ?? 0);
    if (amount < MIN_COIN_GIFT || amount > MAX_COIN_GIFT) {
      return { ok: false, reason: "invalid_amount" };
    }

    const spend = await spendCoins({
      userId: opts.senderId,
      amount,
      reason: "friend_gift_send",
      refType: "user_gift",
      refId: giftId,
    });
    if (!spend.ok) {
      return { ok: false, reason: spend.reason ?? "insufficient" };
    }

    await db.insert(userGift).values({
      id: giftId,
      senderId: opts.senderId,
      recipientId: opts.recipientId,
      kind: "coins",
      coins: amount,
      message: trimmedMessage,
      status: "pending",
    });

    return finishOk("coins", amount);
  }

  if (opts.kind === "decoration") {
    const itemId = opts.itemId?.trim();
    if (!itemId || !isDecorationItemId(itemId) || isHabitatDecorItemId(itemId)) {
      return { ok: false, reason: "invalid_item" };
    }

    const sendable = await listSendableDecor(opts.senderId);
    const entry = sendable.find((d) => d.itemId === itemId);
    if (!entry || entry.qty < 1) {
      return { ok: false, reason: "not_available" };
    }

    const consumed = await consumeInventory(opts.senderId, itemId, 1);
    if (!consumed) {
      return { ok: false, reason: "not_available" };
    }

    await db.insert(userGift).values({
      id: giftId,
      senderId: opts.senderId,
      recipientId: opts.recipientId,
      kind: "decoration",
      itemId,
      message: trimmedMessage,
      status: "pending",
    });

    return finishOk("decoration", 0);
  }

  return { ok: false, reason: "invalid_kind" };
}

export async function claimFriendGift(
  userId: string,
  giftId: string,
): Promise<
  | { ok: true; kind: "coins" | "decoration"; coins: number; itemId: string | null }
  | { ok: false; reason: string }
> {
  await ensureUserGiftTable();
  const db = getDb();
  const gift = await db.query.userGift.findFirst({
    where: and(eq(userGift.id, giftId), eq(userGift.recipientId, userId)),
  });
  if (!gift) return { ok: false, reason: "not_found" };
  if (gift.status !== "pending") return { ok: false, reason: "not_pending" };

  if (gift.kind === "coins") {
    const grant = await grantCoins({
      userId,
      delta: gift.coins,
      reason: "friend_gift_receive",
      refType: "user_gift",
      refId: gift.id,
      raw: true,
    });
    if (!grant.ok) {
      return { ok: false, reason: grant.reason ?? "grant_failed" };
    }

    await db
      .update(userGift)
      .set({ status: "claimed", claimedAt: new Date() })
      .where(eq(userGift.id, gift.id));

    return {
      ok: true,
      kind: "coins",
      coins: gift.coins,
      itemId: null,
    };
  }

  if (gift.kind === "decoration" && gift.itemId) {
    await grantInventoryItem(userId, gift.itemId, 1);
    await db
      .update(userGift)
      .set({ status: "claimed", claimedAt: new Date() })
      .where(eq(userGift.id, gift.id));

    return {
      ok: true,
      kind: "decoration",
      coins: 0,
      itemId: gift.itemId,
    };
  }

  return { ok: false, reason: "invalid_gift" };
}

export async function declineFriendGift(
  userId: string,
  giftId: string,
): Promise<{ ok: true } | { ok: false; reason: string }> {
  await ensureUserGiftTable();
  const db = getDb();
  const gift = await db.query.userGift.findFirst({
    where: and(eq(userGift.id, giftId), eq(userGift.recipientId, userId)),
  });
  if (!gift) return { ok: false, reason: "not_found" };
  if (gift.status !== "pending") return { ok: false, reason: "not_pending" };

  // Refund sender so declined gifts are not lost.
  if (gift.kind === "coins" && gift.coins > 0) {
    await grantCoins({
      userId: gift.senderId,
      delta: gift.coins,
      reason: "friend_gift_refund",
      refType: "user_gift",
      refId: `${gift.id}:refund`,
      raw: true,
    });
  } else if (gift.kind === "decoration" && gift.itemId) {
    await grantInventoryItem(gift.senderId, gift.itemId, 1);
  }

  await db
    .update(userGift)
    .set({ status: "declined", claimedAt: new Date() })
    .where(eq(userGift.id, gift.id));

  return { ok: true };
}
