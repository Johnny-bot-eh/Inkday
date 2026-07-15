import type { Difficulty } from "./types";
import { dayIndex, hashSeed, pickIndex } from "./types";

export type LetterMark = "correct" | "present" | "absent";

export type WordleConfig = {
  wordLength: number;
  maxGuesses: number;
  answer: string;
  allowedGuesses: string[];
};

const EASY_WORDS = [
  "crane", "flame", "grape", "spice", "ocean", "plant", "sugar", "brave",
  "cloud", "sword", "charm", "glass", "light", "mango", "pearl", "river",
  "shine", "storm", "table", "unity", "vivid", "whale", "zebra", "bloom",
];

const MEDIUM_WORDS = [
  "planet", "bridge", "castle", "forest", "guitar", "hammer", "island",
  "jungle", "kitten", "ladder", "magnet", "nectar", "oracle", "puzzle",
  "quartz", "rocket", "silver", "tunnel", "velvet", "window", "yellow",
];

const HARD_WORDS = [
  "alchemy", "beacon", "cipher", "destiny", "eclipse", "freedom", "glacier",
  "harmony", "insight", "journey", "kindred", "liberty", "mystery", "network",
  "ovation", "phoenix", "quantum", "radiant", "silence", "triumph", "voyage",
];

const BY_DIFFICULTY: Record<Difficulty, string[]> = {
  easy: EASY_WORDS,
  medium: MEDIUM_WORDS,
  hard: HARD_WORDS,
};

const GUESS_LIMIT: Record<Difficulty, number> = {
  easy: 6,
  medium: 6,
  hard: 5,
};

export function getWordleConfig(
  dateKey: string,
  difficulty: Difficulty,
): WordleConfig {
  const pool = BY_DIFFICULTY[difficulty];
  const seed = hashSeed("wordle", dateKey, difficulty, dayIndex(dateKey));
  const answer = pool[pickIndex(seed, pool.length)]!;
  return {
    wordLength: answer.length,
    maxGuesses: GUESS_LIMIT[difficulty],
    answer,
    allowedGuesses: pool,
  };
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
  // Accept dictionary pool + answer; also allow any alphabetic guess of right length for playability
  if (!/^[a-z]+$/.test(normalized)) {
    return { ok: false, reason: "Letters only." };
  }
  return { ok: true, guess: normalized };
}
