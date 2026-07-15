import { enqueueDailyReminders } from "@/lib/game-service";
import { NextResponse } from "next/server";

/**
 * Cron entrypoint for reminder outbox.
 * Protect with CRON_SECRET (Authorization: Bearer … or ?secret=).
 * Does not send email yet — only queues pending outbox rows.
 */
export async function GET(req: Request) {
  const secret = process.env.CRON_SECRET;
  if (!secret) {
    return NextResponse.json(
      { error: "CRON_SECRET is not configured" },
      { status: 503 },
    );
  }
  const url = new URL(req.url);
  const auth = req.headers.get("authorization") ?? "";
  const bearer = auth.startsWith("Bearer ") ? auth.slice(7) : "";
  const querySecret = url.searchParams.get("secret") ?? "";
  if (bearer !== secret && querySecret !== secret) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const hourParam = url.searchParams.get("hour");
  const hourUtc =
    hourParam != null && hourParam !== ""
      ? Number(hourParam)
      : undefined;
  const result = await enqueueDailyReminders({
    hourUtc: Number.isFinite(hourUtc) ? hourUtc : undefined,
  });
  return NextResponse.json({
    ok: true,
    ...result,
    note: "Outbox queued. Wire an email provider to drain pending rows.",
  });
}
