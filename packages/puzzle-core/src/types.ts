export type Difficulty = "easy" | "medium" | "hard" | "impossible";
export type PuzzleType = "wordle" | "escape" | "logic" | "path";

export const DIFFICULTIES: Difficulty[] = ["easy", "medium", "hard"];
export const ALL_DIFFICULTIES: Difficulty[] = [
  "easy",
  "medium",
  "hard",
  "impossible",
];
export const PUZZLE_TYPES: PuzzleType[] = ["wordle", "escape", "logic", "path"];

export const DIFFICULTY_LABELS: Record<Difficulty, string> = {
  easy: "Easy",
  medium: "Medium",
  hard: "Hard",
  impossible: "Impossible",
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

/** Monday (UTC) of the week containing `date`, as YYYY-MM-DD */
export function weekStartKey(date = new Date()): string {
  const y = date.getUTCFullYear();
  const m = date.getUTCMonth();
  const d = date.getUTCDate();
  const day = date.getUTCDay(); // 0 = Sun … 6 = Sat
  const mondayOffset = day === 0 ? -6 : 1 - day;
  return todayKey(new Date(Date.UTC(y, m, d + mondayOffset)));
}

/** First day of the UTC month containing `date`, as YYYY-MM-DD */
export function monthStartKey(date = new Date()): string {
  return todayKey(
    new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), 1)),
  );
}

/** Milliseconds until the next UTC midnight */
export function msUntilNextUtcMidnight(now = new Date()): number {
  const next = Date.UTC(
    now.getUTCFullYear(),
    now.getUTCMonth(),
    now.getUTCDate() + 1,
  );
  return Math.max(0, next - now.getTime());
}

export type LeaderboardPeriod = "day" | "week" | "month";

export function periodRange(
  period: LeaderboardPeriod,
  date = new Date(),
): { startKey: string; endKey: string; rangeLabel: string } {
  const endKey = todayKey(date);
  if (period === "day") {
    return { startKey: endKey, endKey, rangeLabel: endKey };
  }
  if (period === "week") {
    const startKey = weekStartKey(date);
    return { startKey, endKey, rangeLabel: `Week of ${startKey}` };
  }
  const startKey = monthStartKey(date);
  const monthName = date.toLocaleString("en-US", {
    month: "long",
    year: "numeric",
    timeZone: "UTC",
  });
  return { startKey, endKey, rangeLabel: monthName };
}

export type DailyChallenge = {
  id: string;
  title: string;
  /** Shown under the title, e.g. Hard / Medium / Unknown */
  difficultyLabel: string;
  puzzleType: PuzzleType;
  difficulty: Difficulty;
  href: string;
};

/** Curated featured boards for the home “Today’s Challenges” strip */
export const TODAYS_CHALLENGES: DailyChallenge[] = [
  {
    id: "daily-detective",
    title: "Daily Detective",
    difficultyLabel: "Hard",
    puzzleType: "escape",
    difficulty: "hard",
    href: "/play/escape/hard",
  },
  {
    id: "daily-logic",
    title: "Daily Logic",
    difficultyLabel: "Medium",
    puzzleType: "logic",
    difficulty: "medium",
    href: "/play/logic/medium",
  },
  {
    id: "daily-word",
    title: "Daily Word Puzzle",
    difficultyLabel: "Easy",
    puzzleType: "wordle",
    difficulty: "easy",
    href: "/play/wordle/easy",
  },
  {
    id: "daily-mystery",
    title: "Daily Mystery Puzzle",
    difficultyLabel: "Unknown",
    puzzleType: "path",
    difficulty: "hard",
    href: "/play/path/hard",
  },
];

/** Extra boards unlocked by the Hidden Challenges achievement (7-day streak) */
export const HIDDEN_CHALLENGES: DailyChallenge[] = [
  {
    id: "hidden-cipher",
    title: "Cipher Night",
    difficultyLabel: "Hard",
    puzzleType: "escape",
    difficulty: "hard",
    href: "/play/escape/hard?pack=exclusive",
  },
  {
    id: "hidden-labyrinth",
    title: "Midnight Labyrinth",
    difficultyLabel: "Hard",
    puzzleType: "path",
    difficulty: "hard",
    href: "/play/path/hard",
  },
  {
    id: "hidden-deduction",
    title: "Shadow Case",
    difficultyLabel: "Hard",
    puzzleType: "logic",
    difficulty: "hard",
    href: "/play/logic/hard",
  },
];

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
