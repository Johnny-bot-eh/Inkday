import type { Difficulty } from "./types";
import { dayIndex, hashSeed, pickIndex } from "./types";
import { ALL_WORDS, normalizeWord, oneLetterDiff } from "./words";

export type WordLadderPuzzle = {
  title: string;
  start: string;
  end: string;
  /** Reference chain including start and end */
  solution: string[];
  /** One semantic hint per transition in the reference chain. */
  stepHints: string[];
  /** Max letter-changes allowed (excluding the start word) */
  maxSteps: number;
  hint: string;
};

type Ladder = { start: string; end: string; chain: string[] };

const WORD_HINTS: Record<string, string> = {
  band: "A group of musicians, or a strip worn around something.",
  beach: "A sandy or pebbly shore.",
  blank: "Empty; containing no writing.",
  blink: "To quickly close and open your eyes.",
  blood: "The red fluid circulating through the body.",
  book: "A bound collection of written pages.",
  boor: "A rude or insensitive person.",
  bread: "A baked food made from flour.",
  broad: "Wide from side to side.",
  brood: "A group of young birds, or to worry gloomily.",
  card: "A small stiff piece of paper used for messages or games.",
  care: "Concern or attentive protection.",
  cave: "A natural underground chamber.",
  cease: "To stop or come to an end.",
  chase: "To pursue something.",
  chine: "A backbone or a narrow ridge.",
  chink: "A narrow crack or opening.",
  chore: "A routine task or household job.",
  chose: "Past tense of choose.",
  clink: "A short, sharp metallic sound.",
  cold: "Having a low temperature.",
  cord: "A length of rope or strong string.",
  darn: "To mend fabric with thread.",
  dawn: "The first light of day.",
  floor: "The surface you walk on inside a room.",
  flood: "An overflow of water onto normally dry land.",
  free: "Not confined, controlled, or costing money.",
  goad: "To provoke or urge someone into action.",
  gold: "A precious yellow metal.",
  hand: "The body part at the end of your arm.",
  hard: "Firm, solid, or difficult.",
  hare: "A fast-running animal related to a rabbit.",
  have: "To possess or own.",
  head: "The upper part of the body.",
  heat: "High temperature or warmth.",
  held: "Past tense of hold.",
  herd: "A group of grazing animals.",
  hire: "To employ someone for payment.",
  hold: "To grasp or keep in your hands.",
  lave: "An old verb meaning to wash or bathe.",
  life: "The state of being alive.",
  light: "Visible illumination; the opposite of darkness.",
  load: "Something carried, or to place cargo aboard.",
  love: "Deep affection.",
  peace: "Freedom from conflict.",
  peach: "A soft, fuzzy stone fruit.",
  pease: "An old collective word for peas.",
  rich: "Having abundant wealth or resources.",
  rick: "A stack of hay or straw.",
  right: "Correct, or the direction opposite left.",
  rock: "A solid mineral mass.",
  rook: "A black bird, or a chess piece.",
  safe: "Protected from danger.",
  save: "To rescue or preserve.",
  sears: "Burns or scorches the surface.",
  smile: "A pleased expression made with the mouth.",
  soon: "In a short time.",
  stale: "No longer fresh.",
  stare: "To look fixedly for a long time.",
  stars: "Bright celestial points seen at night.",
  stile: "Steps that allow people over a fence.",
  vast: "Extremely large.",
  vest: "A sleeveless garment.",
  ward: "A hospital division or a person under guardianship.",
  warm: "Moderately hot.",
  west: "The compass direction where the sun sets.",
  whine: "A long, high-pitched complaining sound.",
  white: "The lightest color.",
};

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
    if (!WORD_HINTS[b]) {
      throw new Error(`Ladder step missing hint: ${b}`);
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
    stepHints: ladder.chain.slice(1).map((word) => WORD_HINTS[word]!),
    maxSteps: optimalSteps,
    hint:
      difficulty === "easy"
        ? "Change one letter each step. Use the clue to find the intended next word."
        : "Every step changes exactly one letter. Each clue has one intended answer.",
  };
}

export function nextWordLadderStep(
  puzzle: WordLadderPuzzle,
  completedWords: number,
): { word: string; hint: string; step: number } | null {
  if (completedWords < 1 || completedWords >= puzzle.solution.length) {
    return null;
  }
  return {
    word: puzzle.solution[completedWords]!,
    hint: puzzle.stepHints[completedWords - 1]!,
    step: completedWords,
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
  if (changes !== puzzle.maxSteps) {
    return {
      ok: false,
      reason: `Use the intended ${puzzle.maxSteps}-step ladder.`,
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
    if (next !== puzzle.solution[i]) {
      return {
        ok: false,
        reason: `Step ${i}: that is not the word described by the hint.`,
      };
    }
  }
  return { ok: true };
}

export function isKnownLadderWord(word: string): boolean {
  return ALL_WORDS.has(normalizeWord(word));
}
