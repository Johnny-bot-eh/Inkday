import {
  checkAcrosticAnswers,
  checkAcrosticMessage,
  checkAnagramAnswer,
  checkCryptogramAnswer,
  checkEscapeAnswer,
  checkLogicAnswer,
  checkWordLadder,
  evaluateGuess,
  getAcrosticPuzzle,
  getAnagramPuzzle,
  getCryptogramPuzzle,
  getEscapeRoom,
  getLogicPuzzle,
  getWordLadderPuzzle,
  getWordleConfig,
  isPerfectAcrostic,
  isPerfectAnagram,
  isPerfectCryptogram,
  isPerfectEscape,
  isPerfectLogic,
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
  elapsedMs?: number;
  /** Skip / forfeit — allow loss without exhausting base attempts */
  forfeit?: boolean;
};

const TYPES: PuzzleType[] = [
  "wordle",
  "escape",
  "logic",
  "anagram",
  "cryptogram",
  "acrostic",
  "wordladder",
];
const DIFFS: Difficulty[] = ["easy", "medium", "hard", "obscure", "impossible"];
/** Coin “extra attempt” consumables may push a few past the base max of 3. */
const ATTEMPT_BONUS_SLACK = 5;
const LOGIC_BASE_ATTEMPTS = 3;

function clampAttemptsUsed(
  raw: number | undefined,
  baseMax: number,
): number {
  const n = typeof raw === "number" && Number.isFinite(raw) ? raw : 1;
  return Math.min(Math.max(1, Math.floor(n)), baseMax + ATTEMPT_BONUS_SLACK);
}

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
    const attemptsUsed = clampAttemptsUsed(
      body.attemptsUsed,
      room.maxAttempts,
    );
    if (!body.code && !body.forfeit) {
      return NextResponse.json({ error: "Missing code" }, { status: 400 });
    }

    const verdict = body.code
      ? checkEscapeAnswer(room, body.code)
      : { correct: false };
    const won = body.forfeit ? false : verdict.correct;
    const failedOut =
      !won && (Boolean(body.forfeit) || attemptsUsed >= room.maxAttempts);
    if (!won && !failedOut) {
      return NextResponse.json(
        { error: "Incorrect code", remaining: room.maxAttempts - attemptsUsed },
        { status: 400 },
      );
    }

    const base = scoreEscape({
      difficulty,
      correct: won,
      attemptsUsed,
      maxAttempts: room.maxAttempts,
    });
    const scoreBreakdown = buildBreakdown({
      won,
      difficulty,
      base,
      elapsedMs,
      isPerfect: won && isPerfectEscape(attemptsUsed),
      seasonActive: Boolean(seasonId),
      plusActive,
    });

    return finish({
      scoreBreakdown,
      won,
      meta: { attemptsUsed, forfeit: Boolean(body.forfeit) },
      extra: { answer: room.answer, explanation: room.explanation },
    });
  }

  if (puzzleType === "anagram") {
    const puzzle = getAnagramPuzzle(dateKey, difficulty);
    const attemptsUsed = clampAttemptsUsed(
      body.attemptsUsed,
      puzzle.maxAttempts,
    );
    if (!body.answer && !body.forfeit) {
      return NextResponse.json({ error: "Missing answer" }, { status: 400 });
    }
    const verdict = body.answer
      ? checkAnagramAnswer(puzzle, body.answer)
      : { correct: false, normalized: "" };
    const won = body.forfeit ? false : verdict.correct;
    const failedOut =
      !won && (Boolean(body.forfeit) || attemptsUsed >= puzzle.maxAttempts);
    if (!won && !failedOut) {
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
      correct: won,
      attemptsUsed,
      maxAttempts: puzzle.maxAttempts,
    });
    const scoreBreakdown = buildBreakdown({
      won,
      difficulty,
      base,
      elapsedMs,
      isPerfect: won && isPerfectAnagram(attemptsUsed),
      seasonActive: Boolean(seasonId),
      plusActive,
    });
    return finish({
      scoreBreakdown,
      won,
      meta: { attemptsUsed, forfeit: Boolean(body.forfeit) },
      extra: { answer: puzzle.answer },
    });
  }

  if (puzzleType === "cryptogram") {
    const puzzle = getCryptogramPuzzle(dateKey, difficulty);
    const attemptsUsed = clampAttemptsUsed(
      body.attemptsUsed,
      puzzle.maxAttempts,
    );
    if (!body.answer && !body.forfeit) {
      return NextResponse.json({ error: "Missing answer" }, { status: 400 });
    }
    const verdict = body.answer
      ? checkCryptogramAnswer(puzzle, body.answer)
      : { correct: false };
    const won = body.forfeit ? false : verdict.correct;
    const failedOut =
      !won && (Boolean(body.forfeit) || attemptsUsed >= puzzle.maxAttempts);
    if (!won && !failedOut) {
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
      correct: won,
      attemptsUsed,
      maxAttempts: puzzle.maxAttempts,
    });
    const scoreBreakdown = buildBreakdown({
      won,
      difficulty,
      base,
      elapsedMs,
      isPerfect: won && isPerfectCryptogram(attemptsUsed),
      seasonActive: Boolean(seasonId),
      plusActive,
    });
    return finish({
      scoreBreakdown,
      won,
      meta: { attemptsUsed, forfeit: Boolean(body.forfeit) },
      extra: { answer: puzzle.plaintext },
    });
  }

  if (puzzleType === "acrostic") {
    const puzzle = getAcrosticPuzzle(dateKey, difficulty);
    const attemptsUsed = clampAttemptsUsed(
      body.attemptsUsed,
      puzzle.maxAttempts,
    );
    const byMessage =
      body.answer && !body.forfeit
        ? checkAcrosticMessage(puzzle, body.answer)
        : { correct: false };
    const byClues =
      !body.forfeit && body.guesses && Array.isArray(body.guesses)
        ? checkAcrosticAnswers(puzzle, body.guesses)
        : { correct: false, solved: [] as boolean[] };
    const won = body.forfeit ? false : byMessage.correct || byClues.correct;
    const failedOut =
      !won && (Boolean(body.forfeit) || attemptsUsed >= puzzle.maxAttempts);
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
      meta: { attemptsUsed, forfeit: Boolean(body.forfeit) },
      extra: { answer: puzzle.message, answers: puzzle.answers },
    });
  }

  if (puzzleType === "wordladder") {
    const puzzle = getWordLadderPuzzle(dateKey, difficulty);
    const guesses = body.guesses ?? [];
    const verdict = checkWordLadder(puzzle, guesses);
    const stepsUsed = Math.max(0, guesses.length - 1);
    const wrongTries = clampAttemptsUsed(
      body.attemptsUsed,
      LOGIC_BASE_ATTEMPTS,
    );
    const reachedEnd =
      guesses.length > 0 &&
      guesses[guesses.length - 1]!.toLowerCase() === puzzle.end;
    const won = body.forfeit ? false : verdict.ok;
    const exhausted =
      !won &&
      (Boolean(body.forfeit) ||
        stepsUsed >= puzzle.maxSteps ||
        wrongTries >= LOGIC_BASE_ATTEMPTS);
    if (!won && !exhausted && !reachedEnd) {
      return NextResponse.json(
        { error: verdict.ok ? "Incomplete ladder" : verdict.reason },
        { status: 400 },
      );
    }
    if (!won && reachedEnd && !verdict.ok && !body.forfeit) {
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
      meta: {
        stepsUsed,
        wrongTries,
        forfeit: Boolean(body.forfeit),
      },
      extra: { answer: puzzle.solution.join(" → ") },
    });
  }

  const puzzle = getLogicPuzzle(
    dateKey,
    difficulty,
    premiumBoard ? "plus" : seasonId,
  );
  const attemptsUsed = clampAttemptsUsed(
    body.attemptsUsed,
    LOGIC_BASE_ATTEMPTS,
  );
  if (!body.answer && !body.forfeit) {
    return NextResponse.json({ error: "Missing answer" }, { status: 400 });
  }
  const verdict = body.answer
    ? checkLogicAnswer(puzzle, body.answer)
    : { correct: false };
  const won = body.forfeit ? false : verdict.correct;
  const failedOut =
    !won &&
    (Boolean(body.forfeit) || attemptsUsed >= LOGIC_BASE_ATTEMPTS);
  if (!won && !failedOut) {
    return NextResponse.json(
      {
        error: "Incorrect",
        remaining: LOGIC_BASE_ATTEMPTS - attemptsUsed,
      },
      { status: 400 },
    );
  }
  const base = scoreLogic({
    difficulty,
    correct: won,
  });
  const scoreBreakdown = buildBreakdown({
    won,
    difficulty,
    base,
    elapsedMs,
    isPerfect: isPerfectLogic(won),
    seasonActive: Boolean(seasonId),
    plusActive,
  });

  return finish({
    scoreBreakdown,
    won,
    meta: {
      answer: body.answer ?? null,
      attemptsUsed,
      forfeit: Boolean(body.forfeit),
    },
    extra: {
      answer: puzzle.answer,
      solution: puzzle.solution,
      explanation: puzzle.explanation,
    },
  });
}
