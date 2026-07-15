import {
  claimStreakFreeze,
  ensureNotificationPrefs,
  getPremiumStatus,
  redeemPremiumPromo,
  updateNotificationPrefs,
} from "@/lib/game-service";
import { getSession } from "@/lib/session";
import { NextResponse } from "next/server";

export async function GET() {
  const session = await getSession();
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const [premium, notifications] = await Promise.all([
    getPremiumStatus(session.user.id),
    ensureNotificationPrefs(session.user.id),
  ]);
  return NextResponse.json({ premium, notifications });
}

export async function POST(req: Request) {
  const session = await getSession();
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const userId = session.user.id;
  const body = (await req.json()) as {
    action?:
      | "update_notifications"
      | "redeem_promo"
      | "claim_streak_freeze";
    code?: string;
    notifications?: Partial<{
      emailEnabled: boolean;
      dailyReminder: boolean;
      streakAtRisk: boolean;
      friendChallenge: boolean;
      tournamentResult: boolean;
      seasonStart: boolean;
      reminderHourUtc: number;
    }>;
  };

  if (body.action === "update_notifications") {
    const notifications = await updateNotificationPrefs(
      userId,
      body.notifications ?? {},
    );
    return NextResponse.json({ notifications });
  }

  if (body.action === "redeem_promo") {
    if (!body.code) {
      return NextResponse.json({ error: "Code required" }, { status: 400 });
    }
    const result = await redeemPremiumPromo(userId, body.code);
    if (!result.ok) {
      return NextResponse.json({ error: "Invalid promo code" }, { status: 400 });
    }
    return NextResponse.json(result);
  }

  if (body.action === "claim_streak_freeze") {
    const result = await claimStreakFreeze(userId);
    if (!result.ok) {
      const messages: Record<string, string> = {
        not_premium: "Inkday Plus required.",
        already_used: "Streak freeze already used this week.",
        already_played_today: "You’ve already played today — freeze not needed.",
      };
      return NextResponse.json(
        { error: messages[result.reason] ?? "Could not claim freeze" },
        { status: 400 },
      );
    }
    return NextResponse.json(result);
  }

  return NextResponse.json({ error: "Unknown action" }, { status: 400 });
}
