import type { Difficulty } from "./types";
import { dayIndex, hashSeed, pickIndex } from "./types";
import { normalizeWord } from "./words";

export type CryptogramPuzzle = {
  title: string;
  /** Ciphertext shown to the player (letters + punctuation/spaces preserved) */
  ciphertext: string;
  /** Plaintext answer (letters only for check, spaces allowed in submit) */
  plaintext: string;
  /** Letter → substitute mapping used to encode */
  mapping: Record<string, string>;
  /** Plaintext letters already revealed as hints */
  revealed: string[];
  maxAttempts: number;
  hint: string;
};

type PhrasePack = { phrase: string; theme: string };

const EASY: PhrasePack[] = [
  { phrase: "time flies", theme: "Idiom" },
  { phrase: "open doors", theme: "Opportunity" },
  { phrase: "bright mind", theme: "Thought" },
  { phrase: "quiet night", theme: "Evening" },
  { phrase: "fresh start", theme: "Beginnings" },
  { phrase: "clear water", theme: "Nature" },
  { phrase: "golden hour", theme: "Light" },
  { phrase: "brave heart", theme: "Courage" },
];

const MEDIUM: PhrasePack[] = [
  { phrase: "knowledge is power", theme: "Proverb" },
  { phrase: "patience wins races", theme: "Virtue" },
  { phrase: "stars guide sailors", theme: "Navigation" },
  { phrase: "silence holds secrets", theme: "Mystery" },
  { phrase: "rivers carve stone", theme: "Nature" },
  { phrase: "hope outlasts fear", theme: "Spirit" },
  { phrase: "maps hide treasure", theme: "Adventure" },
  { phrase: "books open worlds", theme: "Reading" },
];

const HARD: PhrasePack[] = [
  { phrase: "curiosity unlocks hidden doors", theme: "Discovery" },
  { phrase: "wisdom grows from quiet mistakes", theme: "Learning" },
  { phrase: "courage is fear that kept walking", theme: "Bravery" },
  { phrase: "shadows lengthen when the sun sets", theme: "Evening" },
  { phrase: "every puzzle leaves a small map", theme: "Meta" },
  { phrase: "truth wears many borrowed masks", theme: "Philosophy" },
];

const PACKS: Record<Difficulty, PhrasePack[]> = {
  easy: EASY,
  medium: MEDIUM,
  hard: HARD,
  impossible: HARD,
};

const ATTEMPTS: Record<Difficulty, number> = {
  easy: 6,
  medium: 5,
  hard: 4,
  impossible: 3,
};

const REVEAL_COUNT: Record<Difficulty, number> = {
  easy: 3,
  medium: 2,
  hard: 1,
  impossible: 0,
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
    maxAttempts: ATTEMPTS[difficulty],
    hint:
      difficulty === "easy"
        ? "Substitution cipher. A few letters are given; decode the phrase."
        : difficulty === "medium"
          ? "Each letter stands for another. Pattern-spot short words."
          : "Sparse reveals. Frequency and word shapes matter.",
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

/** Apply known plaintext letters onto ciphertext for UI hints */
export function cryptogramHintDisplay(puzzle: CryptogramPuzzle): string {
  const reverse: Record<string, string> = {};
  for (const [plain, cipher] of Object.entries(puzzle.mapping)) {
    reverse[cipher] = plain;
  }
  const revealedSet = new Set(puzzle.revealed);
  return puzzle.ciphertext
    .split("")
    .map((ch) => {
      const lower = ch.toLowerCase();
      if (lower < "a" || lower > "z") return ch;
      const plain = reverse[lower];
      if (plain && revealedSet.has(plain)) {
        return ch === lower ? plain : plain.toUpperCase();
      }
      return ch;
    })
    .join("");
}
