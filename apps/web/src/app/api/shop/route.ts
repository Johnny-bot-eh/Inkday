import {
  COIN_SPEND,
  SHOP_ITEMS,
  isConsumableItemId,
} from "@daily-puzzle/puzzle-core";
import {
  buyAndUseConsumable,
  buyShopItem,
  getCoinBalance,
  listCoinInventory,
  restoreStreakWithCoins,
  useConsumable,
} from "@/lib/coin-service";
import { getSession } from "@/lib/session";
import { NextResponse } from "next/server";

export async function GET() {
  const session = await getSession();
  const catalog = SHOP_ITEMS.map((item) => ({
    ...item,
    available: !item.comingSoon && item.price > 0,
  }));

  if (!session?.user) {
    return NextResponse.json({
      catalog,
      prices: COIN_SPEND,
      balance: null,
      inventory: [],
    });
  }

  const [balance, inventory] = await Promise.all([
    getCoinBalance(session.user.id),
    listCoinInventory(session.user.id),
  ]);

  return NextResponse.json({
    catalog,
    prices: COIN_SPEND,
    balance,
    inventory,
  });
}

export async function POST(req: Request) {
  const session = await getSession();
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const userId = session.user.id;
  const body = (await req.json()) as {
    action?: "buy" | "use" | "buy_and_use" | "restore_streak";
    itemId?: string;
    refId?: string;
  };

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
