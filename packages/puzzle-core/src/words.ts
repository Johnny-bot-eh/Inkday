/** Shared dictionaries for word puzzle types. */

import {
  GUESS_WORDS_4,
  GUESS_WORDS_5,
  GUESS_WORDS_6,
  GUESS_WORDS_7,
} from "./guess-dictionary";

/** Curated answer pools (daily boards pick from these). */
export const WORDS_4 = [
  "able", "bake", "card", "door", "echo", "farm", "glow", "hand", "iron",
  "jump", "kite", "lamp", "moon", "nest", "open", "path", "quiz", "rain",
  "safe", "tide", "unit", "vase", "wave", "yarn", "zone", "cold", "warm",
  "fire", "wind", "leaf", "rock", "star", "hope", "song", "dark", "gold",
];

export const WORDS_5 = [
  "crane", "flame", "grape", "spice", "ocean", "plant", "sugar", "brave",
  "cloud", "sword", "charm", "glass", "light", "mango", "pearl", "river",
  "shine", "storm", "table", "unity", "vivid", "whale", "zebra", "bloom",
  "angel", "bread", "chess", "dream", "earth", "frost", "green", "heart",
  "ivory", "jelly", "lemon", "magic", "night", "olive", "piano", "queen",
];

export const WORDS_6 = [
  "planet", "bridge", "castle", "forest", "guitar", "hammer", "island",
  "jungle", "kitten", "ladder", "magnet", "nectar", "oracle", "puzzle",
  "quartz", "rocket", "silver", "tunnel", "velvet", "window", "yellow",
  "beacon", "candle", "dragon", "engine", "falcon", "garden", "harbor",
  "insect", "jacket", "knight", "legend", "marble", "oxygen", "voyage",
];

export const WORDS_7 = [
  "alchemy", "cipher", "destiny", "eclipse", "freedom", "glacier",
  "harmony", "insight", "journey", "kindred", "liberty", "mystery", "network",
  "ovation", "phoenix", "quantum", "radiant", "silence", "triumph",
  "cascade", "diamond", "emerald", "fantasy", "gallery", "horizon", "justice",
];

/** Extra intermediates used by curated word ladders */
const LADDER_EXTRA = [
  "cord", "card", "ward", "have", "lave", "held", "hold", "vast", "vest",
  "care", "hard", "load", "goad", "cave", "save", "dank", "boor", "book",
  "rook", "rock", "rick", "fore", "fort", "foot", "hoot", "floor", "flood",
  "blood", "brood", "broad", "blank", "blink", "clink", "chink", "chine",
  "whine", "right", "sears", "stars", "stare", "spare", "spire", "gross",
  "groan", "grown", "warm", "love", "band", "life", "soon", "free", "west",
  "hand", "gold", "safe", "dawn", "rich", "heat", "bread", "white", "light",
  "smile", "green", "cold", "hate", "heat", "live", "moon", "tree", "east",
  "cane", "word", "lead", "cage", "dark", "poor", "fire", "flour", "black",
  "night", "tears", "grass", "bunny", "pants",
];

/** Flat set for wordle / ladder / anagram guess validation */
export const ALL_WORDS = new Set(
  [
    ...WORDS_4,
    ...WORDS_5,
    ...WORDS_6,
    ...WORDS_7,
    ...LADDER_EXTRA,
    ...GUESS_WORDS_4,
    ...GUESS_WORDS_5,
    ...GUESS_WORDS_6,
    ...GUESS_WORDS_7,
  ].map((w) => w.toLowerCase()),
);

export function normalizeWord(input: string): string {
  return input.trim().toLowerCase().replace(/[^a-z]/g, "");
}

export function scrambleWord(word: string, seed: number): string {
  const chars = word.split("");
  let s = seed >>> 0;
  for (let i = chars.length - 1; i > 0; i--) {
    s = (Math.imul(s, 1664525) + 1013904223) >>> 0;
    const j = s % (i + 1);
    const tmp = chars[i]!;
    chars[i] = chars[j]!;
    chars[j] = tmp;
  }
  const out = chars.join("");
  // Avoid accidentally returning the original
  if (out === word && chars.length > 1) {
    const a = chars[0]!;
    chars[0] = chars[1]!;
    chars[1] = a;
    return chars.join("");
  }
  return out;
}

export function isAnagramOf(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  const counts: Record<string, number> = {};
  for (const ch of a) counts[ch] = (counts[ch] ?? 0) + 1;
  for (const ch of b) {
    if (!counts[ch]) return false;
    counts[ch]! -= 1;
  }
  return true;
}

export function oneLetterDiff(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  let diffs = 0;
  for (let i = 0; i < a.length; i++) {
    if (a[i] !== b[i]) diffs += 1;
    if (diffs > 1) return false;
  }
  return diffs === 1;
}
