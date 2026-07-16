import type { Difficulty } from "./types";
import { dayIndex, hashSeed, pickIndex } from "./types";
import { ALL_WORDS, normalizeWord, oneLetterDiff } from "./words";

export type WordLadderPuzzle = {
  title: string;
  start: string;
  end: string;
  /** Reference chain including start and end */
  solution: string[];
  /** Max letter-changes allowed (excluding the start word) */
  maxSteps: number;
  hint: string;
};

type Ladder = { start: string; end: string; chain: string[] };

const EASY: Ladder[] = [
  { start: "cold", end: "warm", chain: ["cold", "cord", "card", "ward", "warm"] },
  { start: "hate", end: "love", chain: ["hate", "have", "lave", "love"] },
  { start: "heat", end: "cold", chain: ["heat", "head", "held", "hold", "cold"] },
  { start: "hand", end: "band", chain: ["hand", "band"] },
  { start: "live", end: "life", chain: ["live", "life"] },
  { start: "moon", end: "soon", chain: ["moon", "soon"] },
  { start: "tree", end: "free", chain: ["tree", "free"] },
  { start: "east", end: "west", chain: ["east", "vast", "vest", "west"] },
];

const MEDIUM: Ladder[] = [
  { start: "cane", end: "hand", chain: ["cane", "care", "card", "hard", "hand"] },
  {
    start: "word",
    end: "gold",
    chain: ["word", "ward", "hard", "card", "cord", "cold", "gold"],
  },
  { start: "lead", end: "gold", chain: ["lead", "load", "goad", "gold"] },
  { start: "cage", end: "safe", chain: ["cage", "cave", "save", "safe"] },
  { start: "dark", end: "dawn", chain: ["dark", "darn", "dawn"] },
  {
    start: "poor",
    end: "rich",
    chain: ["poor", "boor", "book", "rook", "rock", "rick", "rich"],
  },
  {
    start: "fire",
    end: "heat",
    chain: ["fire", "hire", "hare", "hard", "herd", "head", "heat"],
  },
];

const HARD: Ladder[] = [
  {
    start: "flour",
    end: "bread",
    chain: ["flour", "floor", "flood", "blood", "brood", "broad", "bread"],
  },
  {
    start: "black",
    end: "white",
    chain: [
      "black",
      "blank",
      "blink",
      "clink",
      "chink",
      "chine",
      "whine",
      "white",
    ],
  },
  {
    start: "night",
    end: "light",
    chain: ["night", "right", "light"],
  },
  {
    start: "tears",
    end: "smile",
    chain: ["tears", "sears", "stars", "stare", "stale", "stile", "smile"],
  },
  {
    start: "shore",
    end: "beach",
    chain: [
      "shore",
      "chore",
      "chose",
      "chase",
      "cease",
      "pease",
      "peace",
      "peach",
      "beach",
    ],
  },
];

function assertLadder(ladder: Ladder) {
  const { chain, start, end } = ladder;
  if (chain[0] !== start || chain[chain.length - 1] !== end) {
    throw new Error(`Ladder endpoints mismatch: ${start}→${end}`);
  }
  for (let i = 1; i < chain.length; i++) {
    const a = chain[i - 1]!;
    const b = chain[i]!;
    if (!oneLetterDiff(a, b)) {
      throw new Error(`Ladder step invalid: ${a} → ${b}`);
    }
  }
}

for (const set of [EASY, MEDIUM, HARD]) {
  for (const ladder of set) assertLadder(ladder);
}

const BY_DIFFICULTY: Record<Difficulty, Ladder[]> = {
  easy: EASY,
  medium: MEDIUM,
  hard: HARD,
  obscure: HARD,
  impossible: HARD,
};

const STEP_PAD: Record<Difficulty, number> = {
  easy: 3,
  medium: 2,
  hard: 2,
  obscure: 2,
  impossible: 1,
};

export function getWordLadderPuzzle(
  dateKey: string,
  difficulty: Difficulty,
): WordLadderPuzzle {
  const ladders = BY_DIFFICULTY[difficulty];
  const seed = hashSeed("wordladder", dateKey, difficulty, dayIndex(dateKey));
  const ladder = ladders[pickIndex(seed, ladders.length)]!;
  const optimalSteps = ladder.chain.length - 1;
  return {
    title: "Word Ladder",
    start: ladder.start,
    end: ladder.end,
    solution: ladder.chain,
    maxSteps: optimalSteps + STEP_PAD[difficulty],
    hint:
      difficulty === "easy"
        ? "Change one letter each step. Reach the end word."
        : "Every step changes exactly one letter. Reach the target.",
  };
}

export function checkWordLadder(
  puzzle: WordLadderPuzzle,
  steps: string[],
): { ok: true } | { ok: false; reason: string } {
  if (!Array.isArray(steps) || steps.length === 0) {
    return { ok: false, reason: "Enter at least one step." };
  }
  const normalized = steps.map(normalizeWord);
  if (normalized.some((w) => !w)) {
    return { ok: false, reason: "Letters only." };
  }
  if (normalized[0] !== puzzle.start) {
    return { ok: false, reason: `Start from ${puzzle.start.toUpperCase()}.` };
  }
  if (normalized[normalized.length - 1] !== puzzle.end) {
    return { ok: false, reason: `Must end on ${puzzle.end.toUpperCase()}.` };
  }
  const changes = normalized.length - 1;
  if (changes > puzzle.maxSteps) {
    return {
      ok: false,
      reason: `Too many steps (max ${puzzle.maxSteps}).`,
    };
  }
  for (let i = 1; i < normalized.length; i++) {
    const prev = normalized[i - 1]!;
    const next = normalized[i]!;
    if (prev.length !== next.length) {
      return { ok: false, reason: "Keep the same word length." };
    }
    if (!oneLetterDiff(prev, next)) {
      return {
        ok: false,
        reason: `${prev.toUpperCase()} → ${next.toUpperCase()} changes more than one letter.`,
      };
    }
    if (!ALL_WORDS.has(next)) {
      return {
        ok: false,
        reason: `${next.toUpperCase()} is not in the dictionary.`,
      };
    }
  }
  return { ok: true };
}

export function isKnownLadderWord(word: string): boolean {
  return ALL_WORDS.has(normalizeWord(word));
}
