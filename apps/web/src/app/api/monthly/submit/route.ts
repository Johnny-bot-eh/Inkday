import {
  BASE_POINTS,
  checkAcrosticMessage,
  checkAnagramAnswer,
  checkCryptogramAnswer,
  checkEscapeAnswer,
  checkLogicAnswer,
  checkMonthlyOnlyAnswer,
  checkWordLadder,
  evaluateGuess,
  getAcrosticPuzzle,
  getAnagramPuzzle,
  getCryptogramPuzzle,
  getEscapeRoom,
  getLogicPuzzle,
  getMonthlyCollection,
  getMonthlyOnlyPuzzle,
  getMonthlySlot,
  getWordLadderPuzzle,
  getWordleConfig,
  isMonthlyOnlyType,
  isValidWordleGuess,
  timedClearBreakdown,
  type Difficulty,
  type MonthlyPuzzleType,
  type ScoreBreakdown,
} from "@daily-puzzle/puzzle-core";
import {
  getMonthlyCompletion,
  listMonthlyCompletions,
  submitMonthlyClear,
  submitMonthlyForfeit,
  type MonthlyForfeitOutcome,
} from "@/lib/game-service";
import { getSession } from "@/lib/session";
import { NextResponse } from "next/server";

type Body = {
  collectionId: string;
  slotIndex: number;
  /** Existing engines */
  guesses?: string[];
  code?: string;
  answer?: string;
  choiceIndex?: number;
  sequence?: string[];
  elapsedMs?: number;
  /** Permanently close the slot without a clear (skip or out of attempts). */
  forfeit?: boolean;
  outcome?: MonthlyForfeitOutcome;
};

function clampElapsed(ms: unknown): number | undefined {
  if (typeof ms !== "number" || !Number.isFinite(ms) || ms < 0) return undefined;
  return Math.min(ms, 1000 * 60 * 60 * 6);
}

function verifyExisting(
  type: MonthlyPuzzleType,
  seedKey: string,
  difficulty: Difficulty,
  body: Body,
): { won: boolean; reason?: string } {
  switch (type) {
    case "wordle": {
      const config = getWordleConfig(seedKey, difficulty);
      const guesses = body.guesses ?? [];
      if (guesses.length === 0) return { won: false, reason: "Missing guesses" };
      for (const g of guesses) {
        const valid = isValidWordleGuess(g, config);
        if (!valid.ok) return { won: false, reason: valid.reason };
        evaluateGuess(config.answer, g);
      }
      const last = guesses[guesses.length - 1]!.toLowerCase();
      return { won: last === config.answer };
    }
    case "escape": {
      const room = getEscapeRoom(seedKey, difficulty, "standard", null);
      if (!body.code) return { won: false, reason: "Missing code" };
      return { won: checkEscapeAnswer(room, body.code).correct };
    }
    case "logic": {
      const puzzle = getLogicPuzzle(seedKey, difficulty, null);
      if (!body.answer) return { won: false, reason: "Missing answer" };
      return { won: checkLogicAnswer(puzzle, body.answer).correct };
    }
    case "anagram": {
      const puzzle = getAnagramPuzzle(seedKey, difficulty);
      if (!body.answer) return { won: false, reason: "Missing answer" };
      return { won: checkAnagramAnswer(puzzle, body.answer).correct };
    }
    case "cryptogram": {
      const puzzle = getCryptogramPuzzle(seedKey, difficulty);
      if (!body.answer) return { won: false, reason: "Missing answer" };
      return { won: checkCryptogramAnswer(puzzle, body.answer).correct };
    }
    case "acrostic": {
      const puzzle = getAcrosticPuzzle(seedKey, difficulty);
      if (!body.answer) return { won: false, reason: "Missing answer" };
      return { won: checkAcrosticMessage(puzzle, body.answer).correct };
    }
    case "wordladder": {
      const puzzle = getWordLadderPuzzle(seedKey, difficulty);
      const guesses = body.guesses ?? [];
      const verdict = checkWordLadder(puzzle, guesses);
      return { won: verdict.ok, reason: verdict.ok ? undefined : verdict.reason };
    }
    default:
      return { won: false, reason: "Unknown type" };
  }
}

export async function POST(req: Request) {
  const session = await getSession();
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = (await req.json()) as Body;
  const { collectionId, slotIndex } = body;
  if (!collectionId || typeof slotIndex !== "number") {
    return NextResponse.json({ error: "Invalid payload" }, { status: 400 });
  }

  const collection = getMonthlyCollection(collectionId);
  if (collection.id !== collectionId) {
    return NextResponse.json({ error: "Unknown collection" }, { status: 400 });
  }

  const slot = getMonthlySlot(collectionId, slotIndex);
  if (!slot) {
    return NextResponse.json({ error: "Invalid slot" }, { status: 400 });
  }

  const existing = await getMonthlyCompletion(
    session.user.id,
    collectionId,
    slotIndex,
  );
  if (existing) {
    const completions = await listMonthlyCompletions(
      session.user.id,
      collectionId,
    );
    return NextResponse.json({
      alreadyCleared: existing.won,
      alreadyResolved: true,
      won: existing.won,
      score: existing.score,
      cleared: completions.length,
      total: collection.puzzles.length,
      newMilestones: [],
      newBadges: [],
      newCosmetics: [],
      totalBonus: 0,
    });
  }

  if (body.forfeit) {
    const outcome: MonthlyForfeitOutcome =
      body.outcome === "failed" ? "failed" : "skipped";
    const result = await submitMonthlyForfeit({
      userId: session.user.id,
      collectionId,
      slotIndex,
      puzzleType: slot.puzzleType,
      difficulty: slot.difficulty,
      outcome,
      meta: { elapsedMs: clampElapsed(body.elapsedMs) },
    });
    if (!result.ok) {
      return NextResponse.json({ error: result.reason }, { status: 400 });
    }
    return NextResponse.json({
      forfeited: true,
      alreadyResolved: result.alreadyResolved,
      won: false,
      outcome: result.outcome,
      score: 0,
      cleared: result.cleared,
      total: collection.puzzles.length,
      newMilestones: [],
      newBadges: [],
      newCosmetics: [],
      totalBonus: 0,
    });
  }

  let won = false;
  let failReason: string | undefined;

  if (isMonthlyOnlyType(slot.puzzleType)) {
    const puzzle = getMonthlyOnlyPuzzle(
      slot.puzzleType,
      slot.seedKey,
      slot.difficulty,
    );
    const verdict = checkMonthlyOnlyAnswer(puzzle, {
      answer: body.answer,
      choiceIndex: body.choiceIndex,
      sequence: body.sequence,
    });
    won = verdict.correct;
    if (!won) failReason = "Incorrect";
  } else {
    const verdict = verifyExisting(
      slot.puzzleType,
      slot.seedKey,
      slot.difficulty,
      body,
    );
    won = verdict.won;
    failReason = verdict.reason;
  }

  if (!won) {
    return NextResponse.json(
      { error: failReason ?? "Incorrect" },
      { status: 400 },
    );
  }

  const elapsedMs = clampElapsed(body.elapsedMs);
  const breakdown: ScoreBreakdown = timedClearBreakdown({
    base: BASE_POINTS[slot.difficulty],
    elapsedMs,
  });
  const score = breakdown.total;
  const result = await submitMonthlyClear({
    userId: session.user.id,
    collectionId,
    slotIndex,
    puzzleType: slot.puzzleType,
    difficulty: slot.difficulty,
    score,
    won: true,
    meta: { elapsedMs, breakdown, timeBonus: breakdown.timeBonus },
  });

  if (!result.ok) {
    return NextResponse.json({ error: result.reason }, { status: 400 });
  }

  return NextResponse.json({
    score: result.score,
    timeBonus: breakdown.timeBonus,
    breakdown,
    elapsedMs,
    cleared: result.cleared,
    total: collection.puzzles.length,
    alreadyCleared: result.alreadyCleared,
    newMilestones: result.newMilestones,
    newBadges: result.newBadges,
    newCosmetics: result.newCosmetics ?? [],
    totalBonus: result.totalBonus,
    coinsEarned: result.coinsEarned,
    coinBalance: result.coinBalance,
    xpEarned: "xpEarned" in result ? result.xpEarned : 0,
    accountXp: "accountXp" in result ? result.accountXp : 0,
    accountLevel: "accountLevel" in result ? result.accountLevel : 1,
    petLevel: "petLevel" in result ? result.petLevel : null,
    petStage: "petStage" in result ? result.petStage : null,
    happinessGain: "happinessGain" in result ? result.happinessGain : 0,
  });
}
