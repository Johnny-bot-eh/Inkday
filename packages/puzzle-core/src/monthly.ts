import type { Difficulty } from "./types";
import { BASE_POINTS } from "./scoring";
import { dayIndex, hashSeed, monthStartKey, todayKey } from "./types";
import {
  getMonthlyOnlyPuzzle,
  type MonthlyOnlyType,
} from "./monthly-puzzles";

/** Existing daily engines reused inside the Case File. */
export type MonthlyExistingType =
  | "wordle"
  | "escape"
  | "logic"
  | "anagram"
  | "cryptogram"
  | "acrostic"
  | "wordladder";

export type MonthlyPuzzleType = MonthlyExistingType | MonthlyOnlyType;

/**
 * Legacy pool token kept only so Case File shuffles stay stable.
 * Remapped to wordladder when slots are built.
 */
type MonthlyPoolType = MonthlyPuzzleType | "path";

export const MONTHLY_SLOT_COUNT = 60;
export const MONTHLY_EASY_COUNT = 20;
export const MONTHLY_MEDIUM_COUNT = 25;
export const MONTHLY_HARD_COUNT = 15;

export type MonthlyMilestoneId =
  | "junior"
  | "investigator"
  | "master"
  | "legendary";

export type MonthlyMilestoneDef = {
  id: MonthlyMilestoneId;
  title: string;
  threshold: number;
  bonusPoints: number;
  badgeTitle: string;
};

export const MONTHLY_MILESTONES: MonthlyMilestoneDef[] = [
  {
    id: "junior",
    title: "Junior Detective",
    threshold: 15,
    bonusPoints: 500,
    badgeTitle: "Junior Detective",
  },
  {
    id: "investigator",
    title: "Investigator",
    threshold: 30,
    bonusPoints: 1500,
    badgeTitle: "Investigator",
  },
  {
    id: "master",
    title: "Master Detective",
    threshold: 45,
    bonusPoints: 3000,
    badgeTitle: "Master Detective",
  },
  {
    id: "legendary",
    title: "Legendary Detective",
    threshold: 60,
    bonusPoints: 10_000,
    badgeTitle: "Legendary Detective",
  },
];

export type MonthlySlot = {
  index: number;
  puzzleType: MonthlyPuzzleType;
  difficulty: Difficulty;
  label: string;
  seedKey: string;
  points: number;
};

export type MonthlyCollection = {
  id: string;
  year: number;
  month: number;
  title: string;
  tagline: string;
  accent: string;
  /** Inclusive last UTC day of the month as YYYY-MM-DD */
  endsOn: string;
  daysLeft: number;
  puzzles: MonthlySlot[];
};

type MonthTheme = {
  title: string;
  tagline: string;
  accent: string;
};

const MONTH_THEMES: Record<number, MonthTheme> = {
  1: {
    title: "The Frost Ledger",
    tagline: "January’s cases freeze mid-sentence.",
    accent: "#7eb6c9",
  },
  2: {
    title: "The Velvet Cipher",
    tagline: "February hides notes in soft places.",
    accent: "#c45c8a",
  },
  3: {
    title: "The Glyph Garden",
    tagline: "March digs up symbols under moss.",
    accent: "#c9a227",
  },
  4: {
    title: "The Rainglass File",
    tagline: "April’s evidence runs when you look away.",
    accent: "#5b9e8a",
  },
  5: {
    title: "The Bloom Alibi",
    tagline: "May smells like cut flowers and excuses.",
    accent: "#d47a9c",
  },
  6: {
    title: "The Solstice Vault",
    tagline: "June locks stretch with the longest day.",
    accent: "#e0a84a",
  },
  7: {
    title: "The Vanishing Artifact",
    tagline: "July’s prize left only star charts behind.",
    accent: "#5b8def",
  },
  8: {
    title: "The Heatwave Brief",
    tagline: "August melts wax seals and patience.",
    accent: "#e07a3a",
  },
  9: {
    title: "The Harvest Mask",
    tagline: "September wears someone else’s face.",
    accent: "#b8860b",
  },
  10: {
    title: "The Hollow Case",
    tagline: "October answers only after dark.",
    accent: "#e07a2f",
  },
  11: {
    title: "The Fog Index",
    tagline: "November files go missing between pages.",
    accent: "#8a9aab",
  },
  12: {
    title: "The Ember Parcel",
    tagline: "December wraps secrets in ribbon.",
    accent: "#2f9e7b",
  },
};

const TYPE_POOL: MonthlyPoolType[] = [
  "wordle",
  "escape",
  "logic",
  "path",
  "anagram",
  "cryptogram",
  "acrostic",
  "wordladder",
  "riddle",
  "trivia",
  "mathlogic",
  "memory",
  "pattern",
  "deduction",
];

export const MONTHLY_TYPE_LABELS: Record<MonthlyPuzzleType, string> = {
  wordle: "Word Puzzle",
  escape: "Mini Escape",
  logic: "Logic Grid",
  anagram: "Anagram",
  cryptogram: "Cryptogram",
  acrostic: "Acrostic",
  wordladder: "Word Ladder",
  riddle: "Riddle",
  trivia: "Trivia",
  mathlogic: "Number Logic",
  memory: "Memory",
  pattern: "Pattern",
  deduction: "Deduction",
};

function resolveMonthlyPoolType(type: MonthlyPoolType): MonthlyPuzzleType {
  return type === "path" ? "wordladder" : type;
}

function shuffleInPlace<T>(arr: T[], seed: number): T[] {
  let s = seed >>> 0;
  for (let i = arr.length - 1; i > 0; i--) {
    s = (Math.imul(s, 1664525) + 1013904223) >>> 0;
    const j = s % (i + 1);
    const tmp = arr[i]!;
    arr[i] = arr[j]!;
    arr[j] = tmp;
  }
  return arr;
}

export function collectionIdForDate(date = new Date()): string {
  return monthStartKey(date).slice(0, 7); // YYYY-MM
}

export function parseCollectionId(id: string): { year: number; month: number } {
  const [y, m] = id.split("-").map(Number);
  if (!y || !m || m < 1 || m > 12) {
    throw new Error(`Invalid collection id: ${id}`);
  }
  return { year: y, month: m };
}

export function msUntilMonthEnd(collectionId: string, now = new Date()): number {
  const { year, month } = parseCollectionId(collectionId);
  const end = Date.UTC(year, month, 1); // first of next month
  return Math.max(0, end - now.getTime());
}

export function daysLeftInMonth(collectionId: string, now = new Date()): number {
  const ms = msUntilMonthEnd(collectionId, now);
  return Math.max(0, Math.ceil(ms / 86_400_000));
}

export function monthEndsOn(collectionId: string): string {
  const { year, month } = parseCollectionId(collectionId);
  const lastDay = new Date(Date.UTC(year, month, 0)).getUTCDate();
  return `${year}-${String(month).padStart(2, "0")}-${String(lastDay).padStart(2, "0")}`;
}

export function getMonthTheme(month: number): MonthTheme {
  return (
    MONTH_THEMES[month] ?? {
      title: "The Unsigned Docket",
      tagline: "A month without a name still keeps files.",
      accent: "#e07a3a",
    }
  );
}

export function buildMonthlySlots(collectionId: string): MonthlySlot[] {
  const seed = hashSeed("case-file", collectionId);
  const difficulties: Difficulty[] = [
    ...Array(MONTHLY_EASY_COUNT).fill("easy"),
    ...Array(MONTHLY_MEDIUM_COUNT).fill("medium"),
    ...Array(MONTHLY_HARD_COUNT).fill("hard"),
  ];
  shuffleInPlace(difficulties, seed ^ 0x9e3779b9);

  const types: MonthlyPoolType[] = [];
  for (let i = 0; i < MONTHLY_SLOT_COUNT; i++) {
    types.push(TYPE_POOL[i % TYPE_POOL.length]!);
  }
  shuffleInPlace(types, seed ^ 0x85ebca6b);

  return difficulties.map((difficulty, i) => {
    const index = i + 1;
    const puzzleType = resolveMonthlyPoolType(types[i]!);
    return {
      index,
      puzzleType,
      difficulty,
      label: MONTHLY_TYPE_LABELS[puzzleType],
      seedKey: `${collectionId}:${String(index).padStart(2, "0")}`,
      points: BASE_POINTS[difficulty],
    };
  });
}

export function getMonthlyCollection(
  collectionId = collectionIdForDate(),
  now = new Date(),
): MonthlyCollection {
  const { year, month } = parseCollectionId(collectionId);
  const theme = getMonthTheme(month);
  return {
    id: collectionId,
    year,
    month,
    title: `Monthly Case File: ${theme.title}`,
    tagline: theme.tagline,
    accent: theme.accent,
    endsOn: monthEndsOn(collectionId),
    daysLeft: daysLeftInMonth(collectionId, now),
    puzzles: buildMonthlySlots(collectionId),
  };
}

export function getMonthlySlot(
  collectionId: string,
  slotIndex: number,
): MonthlySlot | null {
  if (slotIndex < 1 || slotIndex > MONTHLY_SLOT_COUNT) return null;
  return buildMonthlySlots(collectionId).find((p) => p.index === slotIndex) ?? null;
}

export function isMonthlyOnlyType(
  type: MonthlyPuzzleType,
): type is MonthlyOnlyType {
  return (
    type === "riddle" ||
    type === "trivia" ||
    type === "mathlogic" ||
    type === "memory" ||
    type === "pattern" ||
    type === "deduction"
  );
}

export function loadMonthlyPuzzlePayload(
  slot: MonthlySlot,
): { kind: "only"; puzzle: ReturnType<typeof getMonthlyOnlyPuzzle> } | {
  kind: "existing";
  puzzleType: MonthlyExistingType;
  seedKey: string;
  difficulty: Difficulty;
} {
  if (isMonthlyOnlyType(slot.puzzleType)) {
    return {
      kind: "only",
      puzzle: getMonthlyOnlyPuzzle(slot.puzzleType, slot.seedKey, slot.difficulty),
    };
  }
  return {
    kind: "existing",
    puzzleType: slot.puzzleType,
    seedKey: slot.seedKey,
    difficulty: slot.difficulty,
  };
}

export function milestonesForProgress(cleared: number): MonthlyMilestoneDef[] {
  return MONTHLY_MILESTONES.filter((m) => cleared >= m.threshold);
}

export function legendaryBadgeId(collectionId: string): string {
  return `legendary_${collectionId.replace("-", "_")}`;
}

/** Stable day-ish index unused externally but keeps seeds distinct from dailies. */
export function monthlyDayProxy(seedKey: string): number {
  return dayIndex(todayKey()) ^ hashSeed(seedKey);
}
