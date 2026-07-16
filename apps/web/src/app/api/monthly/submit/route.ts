import {
  BASE_POINTS,
  checkAcrosticMessage,
  checkAnagramAnswer,
  checkCryptogramAnswer,
  checkEscapeAnswer,
  checkLogicAnswer,
  checkMonthlyOnlyAnswer,
  checkPath,
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
  getPathPuzzle,
  getWordLadderPuzzle,
  getWordleConfig,
  isMonthlyOnlyType,
  isValidWordleGuess,
  type Difficulty,
  type MonthlyPuzzleType,
  type PathCoord,
} from "@daily-puzzle/puzzle-core";
import {
  getMonthlyCompletion,
  listMonthlyCompletions,
  submitMonthlyClear,
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
  path?: PathCoord[];
  choiceIndex?: number;
  sequence?: string[];
  elapsedMs?: number;
};

function scoreFor(difficulty: Difficulty, won: boolean): number {
  return won ? BASE_POINTS[difficulty] : 0;
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
    case "path": {
      const puzzle = getPathPuzzle(seedKey, difficulty, null);
      if (!body.path) return { won: false, reason: "Missing path" };
      const verdict = checkPath(puzzle, body.path);
      return { won: verdict.ok, reason: verdict.ok ? undefined : verdict.reason };
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
  if (existing?.won) {
    const completions = await listMonthlyCompletions(
      session.user.id,
      collectionId,
    );
    return NextResponse.json({
      alreadyCleared: true,
      score: existing.score,
      cleared: completions.length,
      total: collection.puzzles.length,
      newMilestones: [],
      newBadges: [],
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

  const score = scoreFor(slot.difficulty, true);
  const result = await submitMonthlyClear({
    userId: session.user.id,
    collectionId,
    slotIndex,
    puzzleType: slot.puzzleType,
    difficulty: slot.difficulty,
    score,
    won: true,
    meta: { elapsedMs: body.elapsedMs },
  });

  if (!result.ok) {
    return NextResponse.json({ error: result.reason }, { status: 400 });
  }

  return NextResponse.json({
    score: result.score,
    cleared: result.cleared,
    total: collection.puzzles.length,
    alreadyCleared: result.alreadyCleared,
    newMilestones: result.newMilestones,
    newBadges: result.newBadges,
    totalBonus: result.totalBonus,
    coinsEarned: result.coinsEarned,
    coinBalance: result.coinBalance,
  });
}
