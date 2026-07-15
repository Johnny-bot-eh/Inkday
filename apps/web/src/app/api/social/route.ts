import {
  getFriendIds,
  getLeaderboard,
  listFriendships,
  requestFriendByEmail,
  respondFriend,
} from "@/lib/game-service";
import { getSession } from "@/lib/session";
import { todayKey } from "@daily-puzzle/puzzle-core";
import { NextResponse } from "next/server";

export async function GET(req: Request) {
  const session = await getSession();
  const { searchParams } = new URL(req.url);
  const view = searchParams.get("view") ?? "friends";

  if (view === "leaderboard") {
    const dateKey = searchParams.get("date") ?? todayKey();
    const scope = searchParams.get("scope") ?? "global";
    const puzzleType = searchParams.get("type") as
      | "wordle"
      | "escape"
      | "logic"
      | "path"
      | null;
    const difficulty = searchParams.get("difficulty") as
      | "easy"
      | "medium"
      | "hard"
      | null;

    let userIds: string[] | undefined;
    if (scope === "friends") {
      if (!session?.user) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
      }
      const friends = await getFriendIds(session.user.id);
      userIds = [...friends, session.user.id];
    }

    const rows = await getLeaderboard({
      dateKey,
      puzzleType: puzzleType ?? undefined,
      difficulty: difficulty ?? undefined,
      userIds,
    });
    return NextResponse.json({ rows, dateKey, scope });
  }

  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const friendships = await listFriendships(session.user.id);
  return NextResponse.json({ friendships });
}

export async function POST(req: Request) {
  const session = await getSession();
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = (await req.json()) as {
    action: "request" | "respond";
    email?: string;
    friendshipId?: string;
    accept?: boolean;
  };

  if (body.action === "request") {
    if (!body.email) {
      return NextResponse.json({ error: "Email required" }, { status: 400 });
    }
    const result = await requestFriendByEmail(session.user.id, body.email);
    if (!result.ok) {
      return NextResponse.json({ error: result.reason }, { status: 400 });
    }
    return NextResponse.json(result);
  }

  if (body.action === "respond") {
    if (!body.friendshipId || body.accept === undefined) {
      return NextResponse.json({ error: "Invalid payload" }, { status: 400 });
    }
    const result = await respondFriend(
      session.user.id,
      body.friendshipId,
      body.accept,
    );
    if (!result.ok) {
      return NextResponse.json({ error: result.reason }, { status: 400 });
    }
    return NextResponse.json(result);
  }

  return NextResponse.json({ error: "Unknown action" }, { status: 400 });
}
