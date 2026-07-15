import type { Difficulty } from "./types";

/** Base points by difficulty before bonuses */
export const BASE_POINTS: Record<Difficulty, number> = {
  easy: 50,
  medium: 100,
  hard: 200,
  impossible: 400,
};

/** Awarded when a clear meets “perfect” criteria for that puzzle type */
export const PERFECT_BONUS = 25;

/**
 * Reserved for when optional hints are available and unused.
 * Currently always 0 — puzzles don’t offer optional hints yet.
 */
export function noHintsBonus(_unusedHints = true): number {
  return 0;
}

export function perfectBonus(isPerfect: boolean): number {
  return isPerfect ? PERFECT_BONUS : 0;
}

/**
 * Stub for week-completion bonuses (e.g. cleared all featured dailies).
 * Wired later with tournament / season jobs.
 */
export function weeklyBonus(_opts?: { clearedFeatured?: boolean }): number {
  return 0;
}

/**
 * Stub for month-completion bonuses.
 */
export function monthlyBonus(_opts?: { clearedFeatured?: boolean }): number {
  return 0;
}

export type ScoreBreakdown = {
  base: number;
  timeBonus: number;
  perfectBonus: number;
  noHintsBonus: number;
  weeklyBonus: number;
  monthlyBonus: number;
  total: number;
};

export function sumScore(parts: Omit<ScoreBreakdown, "total">): ScoreBreakdown {
  const total =
    parts.base +
    parts.timeBonus +
    parts.perfectBonus +
    parts.noHintsBonus +
    parts.weeklyBonus +
    parts.monthlyBonus;
  return { ...parts, total };
}

export function scoreWordle(opts: {
  difficulty: Difficulty;
  guessesUsed: number;
  maxGuesses: number;
  solved: boolean;
}): number {
  if (!opts.solved) return 0;
  const remaining = Math.max(0, opts.maxGuesses - opts.guessesUsed);
  const efficiencyBonus = remaining * 10;
  return BASE_POINTS[opts.difficulty] + efficiencyBonus;
}

/** Perfect wordle: solved in at most 2 guesses */
export function isPerfectWordle(guessesUsed: number): boolean {
  return guessesUsed > 0 && guessesUsed <= 2;
}

export function scoreEscape(opts: {
  difficulty: Difficulty;
  correct: boolean;
  attemptsUsed: number;
  maxAttempts: number;
}): number {
  if (!opts.correct) return 0;
  const remaining = Math.max(0, opts.maxAttempts - opts.attemptsUsed);
  return BASE_POINTS[opts.difficulty] + remaining * 15;
}

export function isPerfectEscape(attemptsUsed: number): boolean {
  return attemptsUsed === 1;
}

export function scoreLogic(opts: {
  difficulty: Difficulty;
  correct: boolean;
}): number {
  if (!opts.correct) return 0;
  return BASE_POINTS[opts.difficulty] + 20;
}

/** Logic has no partials yet — any correct solve is perfect */
export function isPerfectLogic(correct: boolean): boolean {
  return correct;
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
      ? Math.max(0, 20 - Math.max(0, opts.pathLength - opts.optimalHint) * 2)
      : 15;
  return BASE_POINTS[opts.difficulty] + efficiency;
}

export function isPerfectPath(opts: {
  pathLength: number;
  optimalHint?: number;
}): boolean {
  if (opts.optimalHint == null) return opts.pathLength > 0;
  return opts.pathLength > 0 && opts.pathLength <= opts.optimalHint;
}

/** Speed bonus from elapsed solve time (ms). */
export function timeBonus(elapsedMs: number | undefined | null): number {
  if (elapsedMs == null || elapsedMs < 0) return 0;
  const sec = elapsedMs / 1000;
  if (sec <= 30) return 40;
  if (sec <= 60) return 30;
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
