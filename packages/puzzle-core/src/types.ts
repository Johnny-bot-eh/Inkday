export type Difficulty = "easy" | "medium" | "hard";
export type PuzzleType = "wordle" | "escape" | "logic" | "path";

export const DIFFICULTIES: Difficulty[] = ["easy", "medium", "hard"];
export const PUZZLE_TYPES: PuzzleType[] = ["wordle", "escape", "logic", "path"];

export const DIFFICULTY_LABELS: Record<Difficulty, string> = {
  easy: "Easy",
  medium: "Medium",
  hard: "Hard",
};

/** Word Daily is always the medium board for the day. */
export const WORD_DAILY_DIFFICULTY: Difficulty = "medium";

export const EXTRA_WORDLE_DIFFICULTIES: Difficulty[] = ["easy", "hard"];

export const PUZZLE_LABELS: Record<PuzzleType, string> = {
  wordle: "Word puzzles",
  escape: "Escape Room",
  logic: "Logic Grid",
  path: "Path Puzzle",
};

export function wordleTitle(difficulty: Difficulty): string {
  return difficulty === WORD_DAILY_DIFFICULTY ? "Word Daily" : "Word Extra";
}

export function todayKey(date = new Date()): string {
  return date.toISOString().slice(0, 10);
}

/** Stable daily index from YYYY-MM-DD */
export function dayIndex(dateKey: string): number {
  const [y, m, d] = dateKey.split("-").map(Number);
  const utc = Date.UTC(y, m - 1, d);
  return Math.floor(utc / 86_400_000);
}

export function hashSeed(...parts: (string | number)[]): number {
  let h = 2166136261;
  const input = parts.join("|");
  for (let i = 0; i < input.length; i++) {
    h ^= input.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

export function pickIndex(seed: number, length: number): number {
  return length === 0 ? 0 : seed % length;
}
