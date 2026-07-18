import {
  COIN_SPEND,
  SHOP_ITEMS,
  isConsumableItemId,
} from "@daily-puzzle/puzzle-core";
import {
  buyAndUseConsumable,
  buyShopItem,
  claimAndEquipAvatar,
  equipAvatar,
  getCoinBalance,
  getEquippedAvatar,
  listCoinInventory,
  listOwnedAvatarIds,
  restoreStreakWithCoins,
  useConsumable,
} from "@/lib/coin-service";
import { getAccountLevel } from "@/lib/pet-service";
import { getSession } from "@/lib/session";
import { NextResponse } from "next/server";

function catalogEntry(
  item: (typeof SHOP_ITEMS)[number],
  accountLevel: number | null,
) {
  const isPlusClaim = Boolean(item.plusOnly && item.price === 0 && !item.comingSoon);
  const levelLocked =
    typeof item.requiredLevel === "number" &&
    accountLevel != null &&
    accountLevel < item.requiredLevel;
  const available =
    !item.comingSoon &&
    !item.free &&
    !levelLocked &&
    (item.price > 0 || isPlusClaim);
  return {
    ...item,
    available,
    levelLocked,
    requiredLevel: item.requiredLevel ?? 1,
  };
}

export async function GET() {
  const session = await getSession();
  let accountLevel: number | null = null;
  if (session?.user) {
    try {
      accountLevel = await getAccountLevel(session.user.id);
    } catch {
      accountLevel = 1;
    }
  }
  const catalog = SHOP_ITEMS.map((item) => catalogEntry(item, accountLevel));

  if (!session?.user) {
    return NextResponse.json({
      catalog,
      prices: COIN_SPEND,
      balance: null,
      inventory: [],
      equippedAvatarId: null,
      ownedAvatarIds: [],
      accountLevel: null,
    });
  }

  const [balance, inventory, equippedAvatarId, ownedAvatarIds] =
    await Promise.all([
      getCoinBalance(session.user.id),
      listCoinInventory(session.user.id),
      getEquippedAvatar(session.user.id),
      listOwnedAvatarIds(session.user.id),
    ]);

  return NextResponse.json({
    catalog,
    prices: COIN_SPEND,
    balance,
    inventory,
    equippedAvatarId,
    ownedAvatarIds,
    accountLevel,
  });
}

export async function POST(req: Request) {
  const session = await getSession();
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const userId = session.user.id;
  const body = (await req.json()) as {
    action?:
      | "buy"
      | "use"
      | "buy_and_use"
      | "restore_streak"
      | "equip_avatar"
      | "claim_equip_avatar";
    itemId?: string;
    avatarId?: string;
    refId?: string;
  };

  if (body.action === "equip_avatar") {
    const avatarId = body.avatarId ?? body.itemId;
    if (!avatarId) {
      return NextResponse.json({ error: "avatarId required" }, { status: 400 });
    }
    const result = await equipAvatar(userId, avatarId);
    if (!result.ok) {
      return NextResponse.json({ error: result.reason }, { status: 400 });
    }
    return NextResponse.json(result);
  }

  if (body.action === "claim_equip_avatar") {
    const avatarId = body.avatarId ?? body.itemId;
    if (!avatarId) {
      return NextResponse.json({ error: "avatarId required" }, { status: 400 });
    }
    const result = await claimAndEquipAvatar(userId, avatarId);
    if (!result.ok) {
      return NextResponse.json({ error: result.reason }, { status: 400 });
    }
    return NextResponse.json(result);
  }

  if (body.action === "restore_streak" || body.itemId === "streak_restore") {
    const result = await restoreStreakWithCoins(userId);
    if (!result.ok) {
      return NextResponse.json({ error: result.reason }, { status: 400 });
    }
    return NextResponse.json(result);
  }

  if (body.action === "buy") {
    if (!body.itemId) {
      return NextResponse.json({ error: "itemId required" }, { status: 400 });
    }
    const result = await buyShopItem(userId, body.itemId);
    if (!result.ok) {
      return NextResponse.json({ error: result.reason }, { status: 400 });
    }
    return NextResponse.json(result);
  }

  if (body.action === "use" || body.action === "buy_and_use") {
    if (!body.itemId || !isConsumableItemId(body.itemId)) {
      return NextResponse.json({ error: "Invalid consumable" }, { status: 400 });
    }
    const refId = body.refId ?? `${body.itemId}:${Date.now()}`;
    const result =
      body.action === "buy_and_use"
        ? await buyAndUseConsumable(userId, body.itemId, refId)
        : await useConsumable(userId, body.itemId, refId);
    if (!result.ok) {
      return NextResponse.json({ error: result.reason }, { status: 400 });
    }
    return NextResponse.json(result);
  }

  return NextResponse.json({ error: "Unknown action" }, { status: 400 });
}
