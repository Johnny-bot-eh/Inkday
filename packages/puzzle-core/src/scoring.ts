import type { Difficulty } from "./types";

/** Base points by difficulty before bonuses/penalties */
export const BASE_POINTS: Record<Difficulty, number> = {
  easy: 100,
  medium: 150,
  hard: 220,
};

export function scoreWordle(opts: {
  difficulty: Difficulty;
  guessesUsed: number;
  maxGuesses: number;
  solved: boolean;
}): number {
  if (!opts.solved) return 0;
  const remaining = Math.max(0, opts.maxGuesses - opts.guessesUsed);
  const efficiencyBonus = remaining * 15;
  return BASE_POINTS[opts.difficulty] + efficiencyBonus;
}

export function scoreEscape(opts: {
  difficulty: Difficulty;
  correct: boolean;
  attemptsUsed: number;
  maxAttempts: number;
}): number {
  if (!opts.correct) return 0;
  const remaining = Math.max(0, opts.maxAttempts - opts.attemptsUsed);
  return BASE_POINTS[opts.difficulty] + remaining * 25;
}

export function scoreLogic(opts: {
  difficulty: Difficulty;
  correct: boolean;
}): number {
  if (!opts.correct) return 0;
  return BASE_POINTS[opts.difficulty] + 40;
}

export function scorePath(opts: {
  difficulty: Difficulty;
  correct: boolean;
  pathLength: number;
  optimalHint?: number;
}): number {
  if (!opts.correct) return 0;
  const efficiency =
    opts.optimalHint && opts.pathLength > 0
      ? Math.max(0, 30 - Math.max(0, opts.pathLength - opts.optimalHint) * 3)
      : 20;
  return BASE_POINTS[opts.difficulty] + efficiency;
}

/** Speed bonus from elapsed solve time (ms). Caps out quickly so casual play still scores. */
export function timeBonus(elapsedMs: number | undefined | null): number {
  if (elapsedMs == null || elapsedMs < 0) return 0;
  const sec = elapsedMs / 1000;
  if (sec <= 30) return 50;
  if (sec <= 60) return 35;
  if (sec <= 120) return 20;
  if (sec <= 180) return 10;
  return 0;
}

export type StreakUpdate = {
  previousStreak: number;
  previousDate: string | null;
  playDate: string;
  won: boolean;
};

/**
 * Daily win streak.
 * - Win on a new consecutive day → +1
 * - Loss as the first play after a gap / next day → resets to 0
 * - Same-day loss after an earlier win does not wipe the streak
 */
export function nextStreak(update: StreakUpdate): number {
  if (!update.previousDate) {
    return update.won ? 1 : 0;
  }

  const prev = Date.parse(`${update.previousDate}T00:00:00Z`);
  const curr = Date.parse(`${update.playDate}T00:00:00Z`);
  const dayDiff = Math.round((curr - prev) / 86_400_000);

  if (dayDiff === 0) {
    if (update.won) return Math.max(1, update.previousStreak);
    return update.previousStreak;
  }

  if (dayDiff === 1) {
    return update.won ? update.previousStreak + 1 : 0;
  }

  return update.won ? 1 : 0;
}
