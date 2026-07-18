import {
  checkAcrosticAnswers,
  checkAcrosticMessage,
  checkAnagramAnswer,
  checkCryptogramAnswer,
  checkEscapeAnswer,
  checkLogicAnswer,
  checkPath,
  checkWordLadder,
  evaluateGuess,
  getAcrosticPuzzle,
  getAnagramPuzzle,
  getCryptogramPuzzle,
  getEscapeRoom,
  getLogicPuzzle,
  getPathPuzzle,
  getWordLadderPuzzle,
  getWordleConfig,
  isPerfectAcrostic,
  isPerfectAnagram,
  isPerfectCryptogram,
  isPerfectEscape,
  isPerfectLogic,
  isPerfectPath,
  isPerfectWordLadder,
  isPerfectWordle,
  isSeasonActiveOn,
  isValidWordleGuess,
  normalizeSeasonId,
  noHintsBonus,
  parseWordleCategory,
  perfectBonus,
  scoreAcrostic,
  scoreAnagram,
  scoreCryptogram,
  scoreEscape,
  scoreLogic,
  scorePath,
  scoreWordLadder,
  scoreWordle,
  seasonBonus,
  plusBonus,
  sumScore,
  timeBonus,
  todayKey,
  weeklyBonus,
  monthlyBonus,
  wordleCategorySeasonId,
  type Difficulty,
  type PathCoord,
  type PuzzleType,
  type ScoreBreakdown,
  unlockRequiredForDifficulty,
} from "@daily-puzzle/puzzle-core";
import {
  getExistingPlay,
  getPlayRanks,
  submitPlay,
  userHasPremium,
  userHasUnlock,
} from "@/lib/game-service";
import { getSession } from "@/lib/session";
import { NextResponse } from "next/server";

type Body = {
  puzzleType: PuzzleType;
  difficulty: Difficulty;
  dateKey?: string;
  seasonId?: string;
  /** Wordle surprise theme id */
  category?: string;
  premium?: boolean;
  guesses?: string[];
  code?: string;
  attemptsUsed?: number;
  answer?: string;
  path?: PathCoord[];
  elapsedMs?: number;
  /** Skip / forfeit — allow loss without exhausting base attempts */
  forfeit?: boolean;
};

const TYPES: PuzzleType[] = [
  "wordle",
  "escape",
  "logic",
  "path",
  "anagram",
  "cryptogram",
  "acrostic",
  "wordladder",
];
const DIFFS: Difficulty[] = ["easy", "medium", "hard", "obscure", "impossible"];

function clampElapsed(ms: unknown): number | undefined {
  if (typeof ms !== "number" || !Number.isFinite(ms) || ms < 0) return undefined;
  return Math.min(ms, 1000 * 60 * 60 * 6);
}

function buildBreakdown(opts: {
  won: boolean;
  difficulty: Difficulty;
  base: number;
  elapsedMs?: number;
  isPerfect: boolean;
  seasonActive?: boolean;
  plusActive?: boolean;
}): ScoreBreakdown {
  if (!opts.won) {
    return sumScore({
      base: 0,
      timeBonus: 0,
      perfectBonus: 0,
      noHintsBonus: 0,
      weeklyBonus: 0,
      monthlyBonus: 0,
      seasonBonus: 0,
      plusBonus: 0,
    });
  }
  return sumScore({
    base: opts.base,
    timeBonus: timeBonus(opts.elapsedMs),
    perfectBonus: perfectBonus(opts.isPerfect),
    noHintsBonus: noHintsBonus(true),
    weeklyBonus: weeklyBonus(),
    monthlyBonus: monthlyBonus(),
    seasonBonus: seasonBonus(Boolean(opts.seasonActive)),
    plusBonus: plusBonus(Boolean(opts.plusActive)),
  });
}

export async function POST(req: Request) {
  const session = await getSession();
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const userId = session.user.id;

  const body = (await req.json()) as Body;
  const dateKey = body.dateKey ?? todayKey();
  const { puzzleType, difficulty } = body;
  const elapsedMs = clampElapsed(body.elapsedMs);
  const premiumBoard = Boolean(body.premium) || body.seasonId === "plus";
  const categoryId =
    puzzleType === "wordle" ? parseWordleCategory(body.category) : null;
  if (body.category && !categoryId) {
    return NextResponse.json({ error: "Unknown category" }, { status: 400 });
  }
  const seasonId = premiumBoard
    ? null
    : categoryId
      ? wordleCategorySeasonId(categoryId)
      : normalizeSeasonId(body.seasonId);
  const playSeasonId = premiumBoard
    ? "plus"
    : categoryId
      ? wordleCategorySeasonId(categoryId)
      : (seasonId ?? "");

  // Standard dailies must use today's UTC key — blocks forged historical farming.
  if (!premiumBoard && !categoryId && !seasonId && dateKey !== todayKey()) {
    return NextResponse.json(
      { error: "Invalid date for today’s board" },
      { status: 400 },
    );
  }

  if (!premiumBoard && !categoryId && body.seasonId && !seasonId) {
    return NextResponse.json({ error: "Unknown season" }, { status: 400 });
  }
  if (seasonId && !categoryId && !isSeasonActiveOn(seasonId, dateKey)) {
    return NextResponse.json(
      { error: "Season is not active today" },
      { status: 400 },
    );
  }

  if (
    !puzzleType ||
    !difficulty ||
    !TYPES.includes(puzzleType) ||
    !DIFFS.includes(difficulty)
  ) {
    return NextResponse.json({ error: "Invalid payload" }, { status: 400 });
  }

  const existing = await getExistingPlay({
    userId,
    puzzleType,
    difficulty,
    dateKey,
    seasonId: playSeasonId,
  });
  if (existing) {
    const ranks = await getPlayRanks({
      userId,
      dateKey,
    });
    return NextResponse.json(
      { error: "Already played", play: existing, ranks },
      { status: 409 },
    );
  }

  const requiredUnlock = unlockRequiredForDifficulty(difficulty);
  if (requiredUnlock) {
    const ok = await userHasUnlock(userId, requiredUnlock);
    if (!ok) {
      return NextResponse.json(
        { error: "Impossible mode is locked. Solve 100 puzzles to unlock it." },
        { status: 403 },
      );
    }
  }

  const plusActive = await userHasPremium(userId);
  if (premiumBoard && !plusActive) {
    return NextResponse.json(
      { error: "Inkday Plus required for this board." },
      { status: 403 },
    );
  }

  async function finish(opts: {
    scoreBreakdown: ScoreBreakdown;
    won: boolean;
    meta: Record<string, unknown>;
    extra?: Record<string, unknown>;
  }) {
    const result = await submitPlay({
      userId,
      puzzleType,
      difficulty,
      dateKey,
      seasonId: playSeasonId,
      score: opts.scoreBreakdown.total,
      won: opts.won,
      meta: {
        ...opts.meta,
        elapsedMs,
        breakdown: opts.scoreBreakdown,
        ...(playSeasonId ? { seasonId: playSeasonId } : {}),
        ...(premiumBoard ? { premium: true } : {}),
      },
    });
    const ranks = await getPlayRanks({
      userId,
      dateKey,
    });
    return NextResponse.json({
      ...result,
      ...opts.extra,
      score: opts.scoreBreakdown.total,
      won: opts.won,
      elapsedMs,
      breakdown: opts.scoreBreakdown,
      ranks,
      newAchievements: result.ok ? result.newAchievements : [],
      newUnlocks: result.ok ? result.newUnlocks : [],
    });
  }

  if (puzzleType === "wordle") {
    const config = getWordleConfig(dateKey, difficulty, {
      category: categoryId,
    });
    const guesses = body.guesses ?? [];
    // Extra-attempt consumables may push a few guesses past the base max.
    const maxAllowed = config.maxGuesses + 5;
    if (guesses.length > maxAllowed) {
      return NextResponse.json({ error: "Invalid guesses" }, { status: 400 });
    }
    if (guesses.length === 0 && !body.forfeit) {
      return NextResponse.json({ error: "Invalid guesses" }, { status: 400 });
    }

    for (const g of guesses) {
      const valid = isValidWordleGuess(g, config);
      if (!valid.ok) {
        return NextResponse.json({ error: valid.reason }, { status: 400 });
      }
    }

    const last = guesses.length
      ? guesses[guesses.length - 1]!.toLowerCase()
      : "";
    const won = Boolean(last) && last === config.answer;
    // Accept loss when base attempts used, bonus attempts used, or explicit skip/forfeit.
    if (!won && !body.forfeit && guesses.length < config.maxGuesses) {
      return NextResponse.json(
        { error: "Game still in progress" },
        { status: 400 },
      );
    }

    for (const g of guesses) {
      evaluateGuess(config.answer, g);
    }

    const base = scoreWordle({
      difficulty,
      guessesUsed: guesses.length,
      maxGuesses: config.maxGuesses,
      solved: won,
    });
    const scoreBreakdown = buildBreakdown({
      won,
      difficulty,
      base,
      elapsedMs,
      isPerfect: won && isPerfectWordle(guesses.length),
      seasonActive: Boolean(seasonId) && !categoryId,
      plusActive,
    });

    return finish({
      scoreBreakdown,
      won,
      meta: { guessesUsed: guesses.length },
      extra: { answer: config.answer, definition: config.definition },
    });
  }

  if (puzzleType === "escape") {
    const room = getEscapeRoom(
      dateKey,
      difficulty,
      premiumBoard ? "premium" : "standard",
      seasonId,
    );
    const attemptsUsed = Math.min(
      Math.max(1, body.attemptsUsed ?? 1),
      room.maxAttempts,
    );
    if (!body.code) {
      return NextResponse.json({ error: "Missing code" }, { status: 400 });
    }

    const verdict = checkEscapeAnswer(room, body.code);
    const failedOut = !verdict.correct && attemptsUsed >= room.maxAttempts;
    if (!verdict.correct && !failedOut) {
      return NextResponse.json(
        { error: "Incorrect code", remaining: room.maxAttempts - attemptsUsed },
        { status: 400 },
      );
    }

    const base = scoreEscape({
      difficulty,
      correct: verdict.correct,
      attemptsUsed,
      maxAttempts: room.maxAttempts,
    });
    const scoreBreakdown = buildBreakdown({
      won: verdict.correct,
      difficulty,
      base,
      elapsedMs,
      isPerfect: verdict.correct && isPerfectEscape(attemptsUsed),
      seasonActive: Boolean(seasonId),
      plusActive,
    });

    return finish({
      scoreBreakdown,
      won: verdict.correct,
      meta: { attemptsUsed },
      extra: { answer: room.answer, explanation: room.explanation },
    });
  }

  if (puzzleType === "path") {
    const puzzle = getPathPuzzle(dateKey, difficulty, seasonId);
    if (!body.path || !Array.isArray(body.path)) {
      return NextResponse.json({ error: "Missing path" }, { status: 400 });
    }
    const verdict = checkPath(puzzle, body.path);
    if (!verdict.ok) {
      return NextResponse.json({ error: verdict.reason }, { status: 400 });
    }
    const base = scorePath({
      difficulty,
      correct: true,
      pathLength: body.path.length,
    });
    const scoreBreakdown = buildBreakdown({
      won: true,
      difficulty,
      base,
      elapsedMs,
      isPerfect: isPerfectPath({ pathLength: body.path.length }),
      seasonActive: Boolean(seasonId),
      plusActive,
    });
    return finish({
      scoreBreakdown,
      won: true,
      meta: { pathLength: body.path.length },
    });
  }

  if (puzzleType === "anagram") {
    const puzzle = getAnagramPuzzle(dateKey, difficulty);
    const attemptsUsed = Math.min(
      Math.max(1, body.attemptsUsed ?? 1),
      puzzle.maxAttempts,
    );
    if (!body.answer) {
      return NextResponse.json({ error: "Missing answer" }, { status: 400 });
    }
    const verdict = checkAnagramAnswer(puzzle, body.answer);
    const failedOut = !verdict.correct && attemptsUsed >= puzzle.maxAttempts;
    if (!verdict.correct && !failedOut) {
      return NextResponse.json(
        {
          error: "Incorrect",
          remaining: puzzle.maxAttempts - attemptsUsed,
        },
        { status: 400 },
      );
    }
    const base = scoreAnagram({
      difficulty,
      correct: verdict.correct,
      attemptsUsed,
      maxAttempts: puzzle.maxAttempts,
    });
    const scoreBreakdown = buildBreakdown({
      won: verdict.correct,
      difficulty,
      base,
      elapsedMs,
      isPerfect: verdict.correct && isPerfectAnagram(attemptsUsed),
      seasonActive: Boolean(seasonId),
      plusActive,
    });
    return finish({
      scoreBreakdown,
      won: verdict.correct,
      meta: { attemptsUsed },
      extra: { answer: puzzle.answer },
    });
  }

  if (puzzleType === "cryptogram") {
    const puzzle = getCryptogramPuzzle(dateKey, difficulty);
    const attemptsUsed = Math.min(
      Math.max(1, body.attemptsUsed ?? 1),
      puzzle.maxAttempts,
    );
    if (!body.answer) {
      return NextResponse.json({ error: "Missing answer" }, { status: 400 });
    }
    const verdict = checkCryptogramAnswer(puzzle, body.answer);
    const failedOut = !verdict.correct && attemptsUsed >= puzzle.maxAttempts;
    if (!verdict.correct && !failedOut) {
      return NextResponse.json(
        {
          error: "Incorrect",
          remaining: puzzle.maxAttempts - attemptsUsed,
        },
        { status: 400 },
      );
    }
    const base = scoreCryptogram({
      difficulty,
      correct: verdict.correct,
      attemptsUsed,
      maxAttempts: puzzle.maxAttempts,
    });
    const scoreBreakdown = buildBreakdown({
      won: verdict.correct,
      difficulty,
      base,
      elapsedMs,
      isPerfect: verdict.correct && isPerfectCryptogram(attemptsUsed),
      seasonActive: Boolean(seasonId),
      plusActive,
    });
    return finish({
      scoreBreakdown,
      won: verdict.correct,
      meta: { attemptsUsed },
      extra: { answer: puzzle.plaintext },
    });
  }

  if (puzzleType === "acrostic") {
    const puzzle = getAcrosticPuzzle(dateKey, difficulty);
    const attemptsUsed = Math.min(
      Math.max(1, body.attemptsUsed ?? 1),
      puzzle.maxAttempts,
    );
    const byMessage = body.answer
      ? checkAcrosticMessage(puzzle, body.answer)
      : { correct: false };
    const byClues =
      body.guesses && Array.isArray(body.guesses)
        ? checkAcrosticAnswers(puzzle, body.guesses)
        : { correct: false, solved: [] as boolean[] };
    const won = byMessage.correct || byClues.correct;
    const failedOut = !won && attemptsUsed >= puzzle.maxAttempts;
    if (!won && !failedOut) {
      return NextResponse.json(
        {
          error: "Incorrect",
          remaining: puzzle.maxAttempts - attemptsUsed,
        },
        { status: 400 },
      );
    }
    const base = scoreAcrostic({
      difficulty,
      correct: won,
      attemptsUsed,
    });
    const scoreBreakdown = buildBreakdown({
      won,
      difficulty,
      base,
      elapsedMs,
      isPerfect: won && isPerfectAcrostic(attemptsUsed),
      seasonActive: Boolean(seasonId),
      plusActive,
    });
    return finish({
      scoreBreakdown,
      won,
      meta: { attemptsUsed },
      extra: { answer: puzzle.message, answers: puzzle.answers },
    });
  }

  if (puzzleType === "wordladder") {
    const puzzle = getWordLadderPuzzle(dateKey, difficulty);
    const guesses = body.guesses ?? [];
    const verdict = checkWordLadder(puzzle, guesses);
    const stepsUsed = Math.max(0, guesses.length - 1);
    const reachedEnd =
      guesses.length > 0 &&
      guesses[guesses.length - 1]!.toLowerCase() === puzzle.end;
    const won = verdict.ok;
    const exhausted = !won && stepsUsed >= puzzle.maxSteps;
    if (!won && !exhausted && !reachedEnd) {
      return NextResponse.json(
        { error: verdict.ok ? "Incomplete ladder" : verdict.reason },
        { status: 400 },
      );
    }
    if (!won && reachedEnd && !verdict.ok) {
      return NextResponse.json({ error: verdict.reason }, { status: 400 });
    }
    const base = scoreWordLadder({
      difficulty,
      correct: won,
      stepsUsed,
      maxSteps: puzzle.maxSteps,
    });
    const scoreBreakdown = buildBreakdown({
      won,
      difficulty,
      base,
      elapsedMs,
      isPerfect:
        won &&
        isPerfectWordLadder({
          stepsUsed,
          optimalSteps: puzzle.solution.length - 1,
        }),
      seasonActive: Boolean(seasonId),
      plusActive,
    });
    return finish({
      scoreBreakdown,
      won,
      meta: { stepsUsed },
      extra: { answer: puzzle.solution.join(" → ") },
    });
  }

  const puzzle = getLogicPuzzle(
    dateKey,
    difficulty,
    premiumBoard ? "plus" : seasonId,
  );
  if (!body.answer) {
    return NextResponse.json({ error: "Missing answer" }, { status: 400 });
  }
  const verdict = checkLogicAnswer(puzzle, body.answer);
  const base = scoreLogic({
    difficulty,
    correct: verdict.correct,
  });
  const scoreBreakdown = buildBreakdown({
    won: verdict.correct,
    difficulty,
    base,
    elapsedMs,
    isPerfect: isPerfectLogic(verdict.correct),
    seasonActive: Boolean(seasonId),
    plusActive,
  });

  return finish({
    scoreBreakdown,
    won: verdict.correct,
    meta: { answer: body.answer },
    extra: {
      answer: puzzle.answer,
      solution: puzzle.solution,
      explanation: puzzle.explanation,
    },
  });
}
