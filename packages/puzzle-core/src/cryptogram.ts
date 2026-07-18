import type { Difficulty } from "./types";
import { dayIndex, hashSeed, pickIndex } from "./types";
import { normalizeWord } from "./words";

export type CryptogramPuzzle = {
  title: string;
  /**
   * Legacy cipher fields retained for stable puzzle identity / seeding.
   * The play UI no longer shows ciphertext — players fill blanks directly.
   */
  ciphertext: string;
  /** Plaintext answer (letters only for check, spaces allowed in submit) */
  plaintext: string;
  /** Letter → substitute mapping used to encode (internal) */
  mapping: Record<string, string>;
  /** Plaintext letters already revealed as hints */
  revealed: string[];
  theme: string;
  /** Semantic clue that narrows the phrase without directly revealing it */
  clue: string;
  maxAttempts: number;
  hint: string;
};

/** One letter cell in the blank pattern (space separators are not cells). */
export type CryptogramSlot = {
  index: number;
  letter: string;
  revealed: boolean;
};

type PhrasePack = { phrase: string; theme: string; clue: string };

const EASY: PhrasePack[] = [
  { phrase: "time flies", theme: "Idiom", clue: "What time seems to do when you are having fun." },
  { phrase: "open doors", theme: "Opportunity", clue: "New chances can do this for you." },
  { phrase: "bright mind", theme: "Thought", clue: "A description of someone intelligent and quick-thinking." },
  { phrase: "quiet night", theme: "Evening", clue: "A peaceful period after sunset." },
  { phrase: "fresh start", theme: "Beginnings", clue: "A chance to begin again without past mistakes." },
  { phrase: "clear water", theme: "Nature", clue: "Water transparent enough to see through." },
  { phrase: "golden hour", theme: "Light", clue: "The warm period shortly after sunrise or before sunset." },
  { phrase: "brave heart", theme: "Courage", clue: "A courageous spirit described in two words." },
];

const MEDIUM: PhrasePack[] = [
  { phrase: "knowledge is power", theme: "Proverb", clue: "Learning gives a person strength and influence." },
  { phrase: "patience wins races", theme: "Virtue", clue: "Staying calm and persistent can beat speed." },
  { phrase: "stars guide sailors", theme: "Navigation", clue: "Before GPS, people at sea used the night sky to find their way." },
  { phrase: "silence holds secrets", theme: "Mystery", clue: "What remains unspoken can preserve hidden truths." },
  { phrase: "rivers carve stone", theme: "Nature", clue: "Flowing water slowly shapes even hard rock." },
  { phrase: "hope outlasts fear", theme: "Spirit", clue: "Optimism can remain after anxiety fades." },
  { phrase: "maps hide treasure", theme: "Adventure", clue: "A pirate may conceal riches behind clues on a chart." },
  { phrase: "books open worlds", theme: "Reading", clue: "Reading lets the imagination visit entirely new places." },
];

const HARD: PhrasePack[] = [
  { phrase: "curiosity unlocks hidden doors", theme: "Discovery", clue: "Asking questions reveals opportunities others overlook." },
  { phrase: "wisdom grows from quiet mistakes", theme: "Learning", clue: "Good judgment develops by reflecting on errors." },
  { phrase: "courage is fear that kept walking", theme: "Bravery", clue: "Being brave means continuing despite being afraid." },
  { phrase: "shadows lengthen when the sun sets", theme: "Evening", clue: "Low evening light stretches dark shapes across the ground." },
  { phrase: "every puzzle leaves a small map", theme: "Meta", clue: "Each solved challenge provides directions toward something larger." },
  { phrase: "truth wears many borrowed masks", theme: "Philosophy", clue: "Reality may appear disguised by different perspectives." },
];

const PACKS: Record<Difficulty, PhrasePack[]> = {
  easy: EASY,
  medium: MEDIUM,
  hard: HARD,
  obscure: HARD,
  impossible: HARD,
};

const ATTEMPTS: Record<Difficulty, number> = {
  easy: 6,
  medium: 5,
  hard: 4,
  obscure: 4,
  impossible: 3,
};

const REVEAL_COUNT: Record<Difficulty, number> = {
  easy: 4,
  medium: 4,
  hard: 3,
  obscure: 2,
  impossible: 1,
};

const ALPHABET = "abcdefghijklmnopqrstuvwxyz";

function buildCipherMapping(seed: number): Record<string, string> {
  const letters = ALPHABET.split("");
  let s = seed >>> 0;
  for (let i = letters.length - 1; i > 0; i--) {
    s = (Math.imul(s, 1664525) + 1013904223) >>> 0;
    const j = s % (i + 1);
    const tmp = letters[i]!;
    letters[i] = letters[j]!;
    letters[j] = tmp;
  }
  // Ensure no letter maps to itself when possible
  for (let i = 0; i < 26; i++) {
    if (letters[i] === ALPHABET[i]) {
      const swap = (i + 1) % 26;
      const tmp = letters[i]!;
      letters[i] = letters[swap]!;
      letters[swap] = tmp;
    }
  }
  const mapping: Record<string, string> = {};
  for (let i = 0; i < 26; i++) {
    mapping[ALPHABET[i]!] = letters[i]!;
  }
  return mapping;
}

function encodePhrase(phrase: string, mapping: Record<string, string>): string {
  return phrase
    .split("")
    .map((ch) => {
      const lower = ch.toLowerCase();
      if (lower >= "a" && lower <= "z") {
        const enc = mapping[lower]!;
        return ch === lower ? enc : enc.toUpperCase();
      }
      return ch;
    })
    .join("");
}

function uniqueLetters(phrase: string): string[] {
  const seen = new Set<string>();
  const out: string[] = [];
  for (const ch of phrase.toLowerCase()) {
    if (ch >= "a" && ch <= "z" && !seen.has(ch)) {
      seen.add(ch);
      out.push(ch);
    }
  }
  return out;
}

export function getCryptogramPuzzle(
  dateKey: string,
  difficulty: Difficulty,
): CryptogramPuzzle {
  const packs = PACKS[difficulty];
  const seed = hashSeed("cryptogram", dateKey, difficulty, dayIndex(dateKey));
  const pack = packs[pickIndex(seed, packs.length)]!;
  const mapping = buildCipherMapping(seed ^ 0x85ebca6b);
  const ciphertext = encodePhrase(pack.phrase, mapping);
  const letters = uniqueLetters(pack.phrase);
  const revealN = Math.min(REVEAL_COUNT[difficulty], letters.length);
  const revealed: string[] = [];
  let s = seed >>> 0;
  const pool = [...letters];
  for (let i = 0; i < revealN; i++) {
    s = (Math.imul(s, 1664525) + 1013904223) >>> 0;
    const idx = s % pool.length;
    revealed.push(pool.splice(idx, 1)[0]!);
  }

  return {
    title: `Cryptogram · ${pack.theme}`,
    ciphertext,
    plaintext: pack.phrase,
    mapping,
    revealed,
    theme: pack.theme,
    clue: pack.clue,
    maxAttempts: ATTEMPTS[difficulty],
    hint:
      difficulty === "easy"
        ? "Use the theme and clue. Fill each blank — given letters stay put."
        : difficulty === "medium"
          ? "Read the clue, then complete the phrase in the blanks."
          : "Sparse letters are given. Word lengths and the clue carry the rest.",
  };
}

/** Normalize for comparison: lowercase letters only (ignore spaces/punct). */
export function normalizeCryptogramAnswer(input: string): string {
  return normalizeWord(input);
}

export function checkCryptogramAnswer(
  puzzle: CryptogramPuzzle,
  guess: string,
): { correct: boolean } {
  const target = normalizeCryptogramAnswer(puzzle.plaintext);
  const got = normalizeCryptogramAnswer(guess);
  return { correct: got === target };
}

/** Letter slots for interactive blank filling (skips spaces/punctuation). */
export function cryptogramSlots(puzzle: CryptogramPuzzle): CryptogramSlot[] {
  const revealedSet = new Set(puzzle.revealed.map((ch) => ch.toLowerCase()));
  const slots: CryptogramSlot[] = [];
  let index = 0;
  for (const ch of puzzle.plaintext) {
    const lower = ch.toLowerCase();
    if (lower < "a" || lower > "z") continue;
    slots.push({
      index,
      letter: lower,
      revealed: revealedSet.has(lower),
    });
    index += 1;
  }
  return slots;
}

/**
 * Aesthetic blank pattern, e.g. `_ l _ _ r     w _ t _ r`
 * Letters spaced within words; wider gaps between words.
 */
export function cryptogramHintDisplay(puzzle: CryptogramPuzzle): string {
  const revealedSet = new Set(puzzle.revealed.map((ch) => ch.toLowerCase()));
  const words = puzzle.plaintext.trim().split(/\s+/);
  return words
    .map((word) =>
      word
        .split("")
        .map((ch) => {
          const lower = ch.toLowerCase();
          if (lower < "a" || lower > "z") return ch;
          return revealedSet.has(lower) ? lower : "_";
        })
        .join(" "),
    )
    .join("     ");
}
