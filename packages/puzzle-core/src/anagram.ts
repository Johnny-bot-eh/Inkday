import type { Difficulty } from "./types";
import { dailyRotationIndex, hashSeed } from "./types";
import {
  ALL_WORDS,
  WORDS_5,
  WORDS_6,
  WORDS_7,
  isAnagramOf,
  normalizeWord,
  scrambleWord,
} from "./words";

export type AnagramPuzzle = {
  title: string;
  scrambled: string;
  answer: string;
  maxAttempts: number;
  hint: string;
};

const BY_DIFFICULTY: Record<Difficulty, string[]> = {
  easy: WORDS_5,
  medium: WORDS_6,
  hard: WORDS_7,
  obscure: WORDS_7,
  impossible: WORDS_7,
};

const ATTEMPTS: Record<Difficulty, number> = {
  easy: 6,
  medium: 5,
  hard: 4,
  obscure: 4,
  impossible: 3,
};

const HINTS: Record<Difficulty, string> = {
  easy: "Unscramble the letters into a common English word.",
  medium: "Same letters, one real word — no repeats of wrong tries.",
  hard: "Longer scramble. Think of categories: nature, abstract nouns.",
  obscure: "Rare vocabulary scramble. Few attempts.",
  impossible: "Few attempts. Deduce without extra letter cues.",
};

export function getAnagramPuzzle(
  dateKey: string,
  difficulty: Difficulty,
): AnagramPuzzle {
  const pool = [...new Set(BY_DIFFICULTY[difficulty])];
  const answer =
    pool[dailyRotationIndex(dateKey, pool.length, "anagram", difficulty)]!;
  const seed = hashSeed("anagram-scramble", dateKey, difficulty, answer);
  const scrambled = scrambleWord(answer, seed ^ 0x9e3779b9);
  return {
    title: "Daily Anagram",
    scrambled,
    answer,
    maxAttempts: ATTEMPTS[difficulty],
    hint: HINTS[difficulty],
  };
}

export function checkAnagramAnswer(
  puzzle: AnagramPuzzle,
  guess: string,
): { correct: boolean; normalized: string; reason?: string } {
  const normalized = normalizeWord(guess);
  if (!normalized) {
    return { correct: false, normalized, reason: "Enter a word." };
  }
  if (normalized.length !== puzzle.answer.length) {
    return {
      correct: false,
      normalized,
      reason: `Need a ${puzzle.answer.length}-letter word.`,
    };
  }
  if (!ALL_WORDS.has(normalized) && normalized !== puzzle.answer) {
    return { correct: false, normalized, reason: "Not in the dictionary." };
  }
  if (!isAnagramOf(normalized, puzzle.answer)) {
    return {
      correct: false,
      normalized,
      reason: "Must use the same letters.",
    };
  }
  return {
    correct: normalized === puzzle.answer,
    normalized,
  };
}

export function isAnagramGuessShape(
  puzzle: AnagramPuzzle,
  guess: string,
): boolean {
  return isAnagramOf(normalizeWord(guess), puzzle.answer);
}
