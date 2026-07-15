import {
  checkEscapeAnswer,
  checkLogicAnswer,
  checkPath,
  evaluateGuess,
  getEscapeRoom,
  getLogicPuzzle,
  getPathPuzzle,
  getWordleConfig,
  isValidWordleGuess,
  scoreEscape,
  scoreLogic,
  scorePath,
  scoreWordle,
  timeBonus,
  todayKey,
  type Difficulty,
  type PathCoord,
  type PuzzleType,
} from "@daily-puzzle/puzzle-core";
import { getExistingPlay, submitPlay } from "@/lib/game-service";
import { getSession } from "@/lib/session";
import { NextResponse } from "next/server";

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
const DIFFS: Difficulty[] = ["easy", "medium", "hard"];

function clampElapsed(ms: unknown): number | undefined {
  if (typeof ms !== "number" || !Number.isFinite(ms) || ms < 0) return undefined;
  return Math.min(ms, 1000 * 60 * 60 * 6);
}

export async function POST(req: Request) {
  const session = await getSession();
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = (await req.json()) as Body;
  const dateKey = body.dateKey ?? todayKey();
  const { puzzleType, difficulty } = body;
  const elapsedMs = clampElapsed(body.elapsedMs);
  const speed = timeBonus(elapsedMs);

  if (
    !puzzleType ||
    !difficulty ||
    !TYPES.includes(puzzleType) ||
    !DIFFS.includes(difficulty)
  ) {
    return NextResponse.json({ error: "Invalid payload" }, { status: 400 });
  }

  const existing = await getExistingPlay({
    userId: session.user.id,
    puzzleType,
    difficulty,
    dateKey,
  });
  if (existing) {
    return NextResponse.json(
      { error: "Already played", play: existing },
      { status: 409 },
    );
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
    const score = won ? base + speed : 0;

    const result = await submitPlay({
      userId: session.user.id,
      puzzleType,
      difficulty,
      dateKey,
      score,
      won,
      meta: { guessesUsed: guesses.length, elapsedMs, timeBonus: speed },
    });

    return NextResponse.json({
      ...result,
      answer: config.answer,
      score,
      won,
      elapsedMs,
      timeBonus: won ? speed : 0,
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
    const score = verdict.correct ? base + speed : 0;

    const result = await submitPlay({
      userId: session.user.id,
      puzzleType,
      difficulty,
      dateKey,
      score,
      won: verdict.correct,
      meta: { attemptsUsed, elapsedMs, timeBonus: speed },
    });

    return NextResponse.json({
      ...result,
      score,
      won: verdict.correct,
      answer: room.answer,
      elapsedMs,
      timeBonus: verdict.correct ? speed : 0,
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
    const score = base + speed;
    const result = await submitPlay({
      userId: session.user.id,
      puzzleType,
      difficulty,
      dateKey,
      score,
      won: true,
      meta: { pathLength: body.path.length, elapsedMs, timeBonus: speed },
    });
    return NextResponse.json({
      ...result,
      score,
      won: true,
      elapsedMs,
      timeBonus: speed,
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
  const score = verdict.correct ? base + speed : 0;

  const result = await submitPlay({
    userId: session.user.id,
    puzzleType,
    difficulty,
    dateKey,
    score,
    won: verdict.correct,
    meta: { answer: body.answer, elapsedMs, timeBonus: speed },
  });

  return NextResponse.json({
    ...result,
    score,
    won: verdict.correct,
    answer: puzzle.answer,
    solution: puzzle.solution,
    elapsedMs,
    timeBonus: verdict.correct ? speed : 0,
  });
}
