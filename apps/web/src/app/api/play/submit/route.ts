import {
  checkEscapeAnswer,
  checkLogicAnswer,
  checkPath,
  evaluateGuess,
  getEscapeRoom,
  getLogicPuzzle,
  getPathPuzzle,
  getWordleConfig,
  isPerfectEscape,
  isPerfectLogic,
  isPerfectPath,
  isPerfectWordle,
  isValidWordleGuess,
  noHintsBonus,
  perfectBonus,
  scoreEscape,
  scoreLogic,
  scorePath,
  scoreWordle,
  sumScore,
  timeBonus,
  todayKey,
  weeklyBonus,
  monthlyBonus,
  type Difficulty,
  type PathCoord,
  type PuzzleType,
  type ScoreBreakdown,
} from "@daily-puzzle/puzzle-core";
import {
  getExistingPlay,
  getPlayRanks,
  submitPlay,
  userHasUnlock,
} from "@/lib/game-service";
import { getSession } from "@/lib/session";
import { NextResponse } from "next/server";
import { unlockRequiredForDifficulty } from "@daily-puzzle/puzzle-core";

type Body = {
  puzzleType: PuzzleType;
  difficulty: Difficulty;
  dateKey?: string;
  guesses?: string[];
  code?: string;
  attemptsUsed?: number;
  answer?: string;
  path?: PathCoord[];
  elapsedMs?: number;
};

const TYPES: PuzzleType[] = ["wordle", "escape", "logic", "path"];
const DIFFS: Difficulty[] = ["easy", "medium", "hard", "impossible"];

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
}): ScoreBreakdown {
  if (!opts.won) {
    return sumScore({
      base: 0,
      timeBonus: 0,
      perfectBonus: 0,
      noHintsBonus: 0,
      weeklyBonus: 0,
      monthlyBonus: 0,
    });
  }
  return sumScore({
    base: opts.base,
    timeBonus: timeBonus(opts.elapsedMs),
    perfectBonus: perfectBonus(opts.isPerfect),
    noHintsBonus: noHintsBonus(true),
    weeklyBonus: weeklyBonus(),
    monthlyBonus: monthlyBonus(),
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
      score: opts.scoreBreakdown.total,
      won: opts.won,
      meta: {
        ...opts.meta,
        elapsedMs,
        breakdown: opts.scoreBreakdown,
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
    const config = getWordleConfig(dateKey, difficulty);
    const guesses = body.guesses ?? [];
    if (guesses.length === 0 || guesses.length > config.maxGuesses) {
      return NextResponse.json({ error: "Invalid guesses" }, { status: 400 });
    }

    for (const g of guesses) {
      const valid = isValidWordleGuess(g, config);
      if (!valid.ok) {
        return NextResponse.json({ error: valid.reason }, { status: 400 });
      }
    }

    const last = guesses[guesses.length - 1]!.toLowerCase();
    const won = last === config.answer;
    const exhausted = guesses.length >= config.maxGuesses;
    if (!won && !exhausted) {
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
    });

    return finish({
      scoreBreakdown,
      won,
      meta: { guessesUsed: guesses.length },
      extra: { answer: config.answer },
    });
  }

  if (puzzleType === "escape") {
    const room = getEscapeRoom(dateKey, difficulty);
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
    });

    return finish({
      scoreBreakdown,
      won: verdict.correct,
      meta: { attemptsUsed },
      extra: { answer: room.answer },
    });
  }

  if (puzzleType === "path") {
    const puzzle = getPathPuzzle(dateKey, difficulty);
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
    });
    return finish({
      scoreBreakdown,
      won: true,
      meta: { pathLength: body.path.length },
    });
  }

  const puzzle = getLogicPuzzle(dateKey, difficulty);
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
  });

  return finish({
    scoreBreakdown,
    won: verdict.correct,
    meta: { answer: body.answer },
    extra: {
      answer: puzzle.answer,
      solution: puzzle.solution,
    },
  });
}
