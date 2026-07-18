import type { Difficulty } from "./types";
import { dailyRotationIndex } from "./types";
import { ALL_WORDS, WORDS_5, WORDS_6, WORDS_7 } from "./words";
import {
  WORDLE_CATEGORIES,
  WORDLE_HARD_ANSWERS,
  WORDLE_OBSCURE_ANSWERS,
  getObscureDefinition,
  parseWordleCategory,
  sanitizeWordPool,
  type WordleCategoryId,
} from "./wordle-lexicon";

export type LetterMark = "correct" | "present" | "absent";

export type WordleConfig = {
  wordLength: number;
  maxGuesses: number;
  answer: string;
  allowedGuesses: string[];
  /** Optional player-facing warning (Obscure / surprise themes). */
  warning?: string;
  /** Definition shown after clear (Obscure boards). */
  definition?: string;
  /** Visual theme key for the client. */
  theme?: "default" | "obscure" | "surprise";
  categoryId?: WordleCategoryId;
  categoryTitle?: string;
  categoryTagline?: string;
};

const EASY_WORDS = WORDS_5;
const MEDIUM_WORDS = WORDS_6;

const BY_DIFFICULTY: Record<Difficulty, string[]> = {
  easy: EASY_WORDS,
  medium: MEDIUM_WORDS,
  hard: WORDLE_HARD_ANSWERS,
  obscure: WORDLE_OBSCURE_ANSWERS,
  /** Same rare pool as hard, fewer guesses — unlock gate. */
  impossible: WORDLE_HARD_ANSWERS,
};

const GUESS_LIMIT: Record<Difficulty, number> = {
  easy: 6,
  medium: 6,
  hard: 5,
  obscure: 6,
  impossible: 4,
};

function dictionaryForLength(length: number): string[] {
  return [...ALL_WORDS].filter((w) => w.length === length);
}

export type WordleConfigOpts = {
  category?: string | null;
};

export function getWordleConfig(
  dateKey: string,
  difficulty: Difficulty,
  opts: WordleConfigOpts = {},
): WordleConfig {
  const categoryId = parseWordleCategory(opts.category);

  if (categoryId) {
    const category = WORDLE_CATEGORIES[categoryId];
    const pool = sanitizeWordPool(category.answers, 5);
    const answer =
      pool[dailyRotationIndex(dateKey, pool.length, "wordle-cat", categoryId)]!;
    const dict = dictionaryForLength(answer.length);
    return {
      wordLength: answer.length,
      maxGuesses: GUESS_LIMIT[category.difficulty],
      answer,
      allowedGuesses: Array.from(new Set([answer, ...pool, ...dict])),
      theme: "surprise",
      categoryId,
      categoryTitle: category.title,
      categoryTagline: category.tagline,
      warning: `Surprise theme: ${category.title}. ${category.tagline}`,
    };
  }

  const expectedLen =
    difficulty === "easy" || difficulty === "obscure"
      ? 5
      : difficulty === "medium"
        ? 6
        : 7;
  const pool = sanitizeWordPool(BY_DIFFICULTY[difficulty], expectedLen);
  const answerPool =
    pool.length > 0
      ? pool
      : BY_DIFFICULTY[difficulty].map((w) => w.toLowerCase());

  const answer =
    answerPool[
      dailyRotationIndex(dateKey, answerPool.length, "wordle", difficulty)
    ]!;
  const dict = dictionaryForLength(answer.length);
  const allowed = Array.from(
    new Set([answer, ...answerPool, ...WORDS_5, ...WORDS_6, ...WORDS_7, ...dict]),
  );

  const config: WordleConfig = {
    wordLength: answer.length,
    maxGuesses: GUESS_LIMIT[difficulty],
    answer,
    allowedGuesses: allowed,
    theme: difficulty === "obscure" ? "obscure" : "default",
  };

  if (difficulty === "obscure") {
    config.warning = "Do you even know that word? ;)";
    config.definition = getObscureDefinition(answer);
  }

  return config;
}

export function normalizeGuess(guess: string): string {
  return guess.trim().toLowerCase().replace(/[^a-z]/g, "");
}

export function evaluateGuess(answer: string, guess: string): LetterMark[] {
  const a = answer.toLowerCase().split("");
  const g = guess.toLowerCase().split("");
  if (a.length !== g.length) {
    throw new Error("Guess length mismatch");
  }

  const marks: LetterMark[] = Array(g.length).fill("absent");
  const remaining: Record<string, number> = {};

  for (let i = 0; i < a.length; i++) {
    if (g[i] === a[i]) {
      marks[i] = "correct";
    } else {
      const ch = a[i]!;
      remaining[ch] = (remaining[ch] ?? 0) + 1;
    }
  }

  for (let i = 0; i < g.length; i++) {
    if (marks[i] === "correct") continue;
    const ch = g[i]!;
    if ((remaining[ch] ?? 0) > 0) {
      marks[i] = "present";
      remaining[ch]! -= 1;
    }
  }

  return marks;
}

export function isValidWordleGuess(
  guess: string,
  config: WordleConfig,
): { ok: true; guess: string } | { ok: false; reason: string } {
  const normalized = normalizeGuess(guess);
  if (normalized.length !== config.wordLength) {
    return { ok: false, reason: `Need a ${config.wordLength}-letter word.` };
  }
  if (!/^[a-z]+$/.test(normalized)) {
    return { ok: false, reason: "Letters only." };
  }
  const allowed = new Set(config.allowedGuesses.map((w) => w.toLowerCase()));
  if (!allowed.has(normalized)) {
    return { ok: false, reason: "Not in the dictionary." };
  }
  return { ok: true, guess: normalized };
}
