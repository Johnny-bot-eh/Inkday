import {
  claimFriendInvite,
  createFriendChallenge,
  getFriendIds,
  getLeaderboard,
  listFriendChallenges,
  listFriendships,
  listTournamentAwards,
  requestFriendByEmail,
  respondFriend,
  respondFriendChallenge,
  settleWeeklyTournaments,
} from "@/lib/game-service";
import {
  claimFriendGift,
  countPendingGifts,
  declineFriendGift,
  listPendingGifts,
  listSendableDecor,
  sendFriendGift,
} from "@/lib/friend-gift-service";
import { getFriendGardenSnapshot } from "@/lib/pet-service";
import { getSession } from "@/lib/session";
import {
  todayKey,
  type Difficulty,
  type LeaderboardPeriod,
  type PuzzleType,
} from "@daily-puzzle/puzzle-core";
import { NextResponse } from "next/server";

const PERIODS = new Set<LeaderboardPeriod>(["day", "week", "month"]);
const PUZZLE_TYPES = new Set<PuzzleType>([
  "wordle",
  "escape",
  "logic",
  "anagram",
  "cryptogram",
  "acrostic",
  "wordladder",
]);
const DIFFICULTIES = new Set<Difficulty>([
  "easy",
  "medium",
  "hard",
  "obscure",
  "impossible",
]);

export async function GET(req: Request) {
  const session = await getSession();
  const { searchParams } = new URL(req.url);
  const view = searchParams.get("view") ?? "friends";

  if (view === "leaderboard") {
    const dateKey = searchParams.get("date") ?? todayKey();
    const scope = searchParams.get("scope") ?? "global";
    const periodParam = searchParams.get("period") ?? "day";
    const period: LeaderboardPeriod = PERIODS.has(
      periodParam as LeaderboardPeriod,
    )
      ? (periodParam as LeaderboardPeriod)
      : "day";

    const typeParam = searchParams.get("type");
    const puzzleType =
      typeParam && PUZZLE_TYPES.has(typeParam as PuzzleType)
        ? (typeParam as PuzzleType)
        : undefined;

    const difficultyParam = searchParams.get("difficulty");
    const difficulty =
      difficultyParam && DIFFICULTIES.has(difficultyParam as Difficulty)
        ? (difficultyParam as Difficulty)
        : undefined;

    let userIds: string[] | undefined;
    if (scope === "friends") {
      if (!session?.user) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
      }
      const friends = await getFriendIds(session.user.id);
      userIds = [...friends, session.user.id];
    }

    const settlement = await settleWeeklyTournaments({
      forUserId: session?.user?.id,
    });

    const board = await getLeaderboard({
      dateKey,
      period,
      puzzleType,
      difficulty,
      userIds,
    });

    const myAwards = session?.user
      ? await listTournamentAwards(session.user.id)
      : [];

    return NextResponse.json({
      ...board,
      scope,
      tournament: settlement,
      myAwards: myAwards.slice(0, 5),
    });
  }

  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  if (view === "challenges") {
    const challenges = await listFriendChallenges(session.user.id);
    return NextResponse.json({ challenges });
  }

  if (view === "gifts") {
    const gifts = await listPendingGifts(session.user.id);
    return NextResponse.json({ gifts });
  }

  if (view === "sendable_decor") {
    const decor = await listSendableDecor(session.user.id);
    return NextResponse.json({ decor });
  }

  if (view === "garden") {
    const friendId = searchParams.get("userId");
    if (!friendId) {
      return NextResponse.json({ error: "userId required" }, { status: 400 });
    }
    const result = await getFriendGardenSnapshot(session.user.id, friendId);
    if (!result.ok) {
      return NextResponse.json({ error: result.reason }, { status: 403 });
    }
    return NextResponse.json(result);
  }

  const [friendships, challenges, pendingGiftsCount] = await Promise.all([
    listFriendships(session.user.id),
    listFriendChallenges(session.user.id),
    countPendingGifts(session.user.id),
  ]);
  return NextResponse.json({ friendships, challenges, pendingGiftsCount });
}

export async function POST(req: Request) {
  const session = await getSession();
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = (await req.json()) as {
    action:
      | "request"
      | "respond"
      | "challenge"
      | "challenge_respond"
      | "claim_invite"
      | "send_gift"
      | "claim_gift"
      | "decline_gift";
    email?: string;
    friendshipId?: string;
    accept?: boolean;
    opponentId?: string;
    puzzleType?: PuzzleType;
    difficulty?: Difficulty;
    dateKey?: string;
    challengeId?: string;
    inviterId?: string;
    recipientId?: string;
    kind?: "coins" | "decoration";
    coins?: number;
    itemId?: string;
    message?: string;
    giftId?: string;
  };

  if (body.action === "claim_invite") {
    if (!body.inviterId) {
      return NextResponse.json({ error: "Invite required" }, { status: 400 });
    }
    const result = await claimFriendInvite(session.user.id, body.inviterId);
    if (!result.ok) {
      return NextResponse.json({ error: result.reason }, { status: 400 });
    }
    return NextResponse.json(result);
  }

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

  if (body.action === "challenge") {
    if (
      !body.opponentId ||
      !body.puzzleType ||
      !body.difficulty ||
      !PUZZLE_TYPES.has(body.puzzleType) ||
      !DIFFICULTIES.has(body.difficulty)
    ) {
      return NextResponse.json({ error: "Invalid challenge" }, { status: 400 });
    }
    const result = await createFriendChallenge({
      challengerId: session.user.id,
      opponentId: body.opponentId,
      puzzleType: body.puzzleType,
      difficulty: body.difficulty,
      dateKey: body.dateKey ?? todayKey(),
    });
    if (!result.ok) {
      return NextResponse.json({ error: result.reason }, { status: 400 });
    }
    return NextResponse.json(result);
  }

  if (body.action === "challenge_respond") {
    if (!body.challengeId || body.accept === undefined) {
      return NextResponse.json({ error: "Invalid payload" }, { status: 400 });
    }
    const result = await respondFriendChallenge(
      session.user.id,
      body.challengeId,
      body.accept,
    );
    if (!result.ok) {
      return NextResponse.json({ error: result.reason }, { status: 400 });
    }
    return NextResponse.json(result);
  }

  if (body.action === "send_gift") {
    if (!body.recipientId || !body.kind) {
      return NextResponse.json({ error: "Invalid gift" }, { status: 400 });
    }
    const result = await sendFriendGift({
      senderId: session.user.id,
      recipientId: body.recipientId,
      kind: body.kind,
      coins: body.coins,
      itemId: body.itemId,
      message: body.message,
    });
    if (!result.ok) {
      return NextResponse.json({ error: result.reason }, { status: 400 });
    }
    return NextResponse.json(result);
  }

  if (body.action === "claim_gift") {
    if (!body.giftId) {
      return NextResponse.json({ error: "giftId required" }, { status: 400 });
    }
    const result = await claimFriendGift(session.user.id, body.giftId);
    if (!result.ok) {
      return NextResponse.json({ error: result.reason }, { status: 400 });
    }
    return NextResponse.json(result);
  }

  if (body.action === "decline_gift") {
    if (!body.giftId) {
      return NextResponse.json({ error: "giftId required" }, { status: 400 });
    }
    const result = await declineFriendGift(session.user.id, body.giftId);
    if (!result.ok) {
      return NextResponse.json({ error: result.reason }, { status: 400 });
    }
    return NextResponse.json(result);
  }

  return NextResponse.json({ error: "Unknown action" }, { status: 400 });
}
