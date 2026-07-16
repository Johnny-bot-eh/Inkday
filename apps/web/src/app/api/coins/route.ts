import {
  claimDailyLogin,
  claimPlusMonthlyStipend,
  getCoinBalance,
  hasClaimedDailyLogin,
  listCoinInventory,
  listCoinLedger,
} from "@/lib/coin-service";
import { getSession } from "@/lib/session";
import { NextResponse } from "next/server";

export async function GET(req: Request) {
  const session = await getSession();
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const userId = session.user.id;
  const { searchParams } = new URL(req.url);
  const view = searchParams.get("view") ?? "summary";

  if (view === "history") {
    const limit = Math.min(Number(searchParams.get("limit") ?? 40), 100);
    const offset = Number(searchParams.get("offset") ?? 0);
    const rows = await listCoinLedger(userId, { limit, offset });
    return NextResponse.json({
      balance: await getCoinBalance(userId),
      rows,
    });
  }

  if (view === "inventory") {
    const items = await listCoinInventory(userId);
    return NextResponse.json({
      balance: await getCoinBalance(userId),
      items,
    });
  }

  const [balance, loginClaimed, inventory] = await Promise.all([
    getCoinBalance(userId),
    hasClaimedDailyLogin(userId),
    listCoinInventory(userId),
  ]);

  return NextResponse.json({
    balance,
    dailyLoginClaimed: loginClaimed,
    inventory,
  });
}

export async function POST(req: Request) {
  const session = await getSession();
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const body = (await req.json()) as {
    action?: "daily_login" | "plus_stipend";
  };

  if (body.action === "daily_login") {
    const result = await claimDailyLogin(session.user.id);
    if (!result.ok) {
      return NextResponse.json({ error: result.reason }, { status: 400 });
    }
    return NextResponse.json(result);
  }

  if (body.action === "plus_stipend") {
    const result = await claimPlusMonthlyStipend(session.user.id);
    if (!result.ok) {
      return NextResponse.json({ error: result.reason }, { status: 400 });
    }
    return NextResponse.json(result);
  }

  return NextResponse.json({ error: "Unknown action" }, { status: 400 });
}
