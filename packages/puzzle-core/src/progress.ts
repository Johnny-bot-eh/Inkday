import type { Difficulty, PuzzleType } from "./types";
import { weekStartKey, monthStartKey } from "./types";
import {
  SEASONS,
  seasonAdeptAchievementId,
  type SeasonId,
} from "./seasons";

export type AchievementId =
  | "sherlock"
  | "einstein"
  | "puzzle_master"
  | "speed_demon"
  | "perfectionist"
  | "night_owl"
  | "legend"
  | "weekly_champion"
  | "challenge_victor"
  | "seasonal_starter"
  | "seasonal_regular"
  | "season_devotee"
  | `season_${string}_adept`;

export type AchievementDef = {
  id: AchievementId;
  title: string;
  description: string;
};

export const ACHIEVEMENTS: AchievementDef[] = [
  {
    id: "sherlock",
    title: "Sherlock",
    description: "Solve 50 detective (Escape Room) puzzles.",
  },
  {
    id: "einstein",
    title: "Einstein",
    description: "Solve 100 logic grid puzzles.",
  },
  {
    id: "puzzle_master",
    title: "Puzzle Master",
    description: "Complete 500 puzzles.",
  },
  {
    id: "speed_demon",
    title: "Speed Demon",
    description: "Clear 25 puzzles in under 2 minutes.",
  },
  {
    id: "perfectionist",
    title: "Perfectionist",
    description: "Earn 50 perfect clears.",
  },
  {
    id: "night_owl",
    title: "Night Owl",
    description: "Complete 10 puzzles after midnight UTC.",
  },
  {
    id: "legend",
    title: "Legend",
    description: "Reach a 365-day daily streak.",
  },
  {
    id: "weekly_champion",
    title: "Weekly Champion",
    description: "Finish #1 in a weekly tournament (global or friends).",
  },
  {
    id: "challenge_victor",
    title: "Challenge Victor",
    description: "Win 10 friend puzzle challenges.",
  },
  {
    id: "seasonal_starter",
    title: "Seasonal Starter",
    description: "Clear your first limited-time seasonal puzzle.",
  },
  {
    id: "seasonal_regular",
    title: "Seasonal Regular",
    description: "Clear 5 seasonal event puzzles.",
  },
  {
    id: "season_devotee",
    title: "Season Devotee",
    description: "Clear 15 seasonal event puzzles.",
  },
  ...SEASONS.map((season) => ({
    id: seasonAdeptAchievementId(season.id) as AchievementId,
    title: `${season.shortLabel} Adept`,
    description: `Clear ${season.adeptWins} ${season.title} boards during the event.`,
  })),
];

/** Bonus points for finishing a weekly tournament 1st / 2nd / 3rd */
export const WEEKLY_TOURNAMENT_BONUS = [150, 75, 40] as const;

export const WEEKLY_TOURNAMENT_BADGES = [
  "Gold Crown",
  "Silver Laurel",
  "Bronze Seal",
] as const;

/** Previous UTC week Monday key (for settlement once the week has closed). */
export function previousWeekStartKey(date = new Date()): string {
  const current = weekStartKey(date);
  const [y, m, d] = current.split("-").map(Number);
  return weekStartKey(new Date(Date.UTC(y!, m! - 1, d! - 7)));
}

/** True when `weekStart` is strictly before the current UTC week (week is complete). */
export function isWeekComplete(weekStart: string, now = new Date()): boolean {
  return weekStart < weekStartKey(now);
}

export type UnlockId =
  | "exclusive_cases"
  | "hidden_challenges"
  | "impossible_mode";

export type UnlockDef = {
  id: UnlockId;
  title: string;
  description: string;
};

export const UNLOCKS: UnlockDef[] = [
  {
    id: "exclusive_cases",
    title: "Exclusive Cases",
    description: "Solve 50 detective puzzles to unlock exclusive Escape Room cases.",
  },
  {
    id: "hidden_challenges",
    title: "Hidden Challenges",
    description: "Hold a 7-day streak to unlock hidden daily challenges.",
  },
  {
    id: "impossible_mode",
    title: "Impossible Mode",
    description: "Solve 100 puzzles to unlock Impossible difficulty.",
  },
];

export type ProgressCounters = {
  escapeWins: number;
  logicWins: number;
  totalWins: number;
  speedClears: number;
  perfectClears: number;
  nightOwlClears: number;
  dailyStreak: number;
  weeklyStreak: number;
  monthlyStreak: number;
  bestDailyStreak: number;
  challengeWins: number;
  weeklyChampionships: number;
  seasonWins: number;
  seasonWinsById: Partial<Record<SeasonId, number>>;
};

export function evaluateAchievements(
  counters: ProgressCounters,
  alreadyEarned: ReadonlySet<string>,
): AchievementId[] {
  const next: AchievementId[] = [];
  const check = (id: AchievementId, ok: boolean) => {
    if (ok && !alreadyEarned.has(id)) next.push(id);
  };

  check("sherlock", counters.escapeWins >= 50);
  check("einstein", counters.logicWins >= 100);
  check("puzzle_master", counters.totalWins >= 500);
  check("speed_demon", counters.speedClears >= 25);
  check("perfectionist", counters.perfectClears >= 50);
  check("night_owl", counters.nightOwlClears >= 10);
  check("legend", counters.dailyStreak >= 365 || counters.bestDailyStreak >= 365);
  check("challenge_victor", counters.challengeWins >= 10);
  check("weekly_champion", counters.weeklyChampionships >= 1);
  check("seasonal_starter", counters.seasonWins >= 1);
  check("seasonal_regular", counters.seasonWins >= 5);
  check("season_devotee", counters.seasonWins >= 15);

  for (const season of SEASONS) {
    const wins = counters.seasonWinsById[season.id] ?? 0;
    check(
      seasonAdeptAchievementId(season.id) as AchievementId,
      wins >= season.adeptWins,
    );
  }
  return next;
}

export function evaluateUnlocks(
  counters: ProgressCounters,
  alreadyUnlocked: ReadonlySet<string>,
): UnlockId[] {
  const next: UnlockId[] = [];
  const check = (id: UnlockId, ok: boolean) => {
    if (ok && !alreadyUnlocked.has(id)) next.push(id);
  };

  check("exclusive_cases", counters.escapeWins >= 50);
  check("hidden_challenges", counters.dailyStreak >= 7);
  check("impossible_mode", counters.totalWins >= 100);
  return next;
}

export function isNightOwlClear(createdAt: Date): boolean {
  const hour = createdAt.getUTCHours();
  return hour >= 0 && hour < 5;
}

export function isSpeedClear(elapsedMs: number | undefined | null): boolean {
  return typeof elapsedMs === "number" && elapsedMs >= 0 && elapsedMs < 120_000;
}

/**
 * Weekly streak: consecutive ISO weeks (Mon–Sun UTC) with at least one win.
 * `lastWinWeekStart` is YYYY-MM-DD Monday key of the last week that counted.
 */
export function nextWeeklyStreak(opts: {
  previousStreak: number;
  lastWinWeekStart: string | null;
  playDate: string;
  won: boolean;
}): { streak: number; weekStart: string } {
  const weekStart = weekStartKey(new Date(`${opts.playDate}T12:00:00.000Z`));
  if (!opts.won) {
    return {
      streak: opts.previousStreak,
      weekStart: opts.lastWinWeekStart ?? weekStart,
    };
  }
  if (!opts.lastWinWeekStart) {
    return { streak: 1, weekStart };
  }
  if (opts.lastWinWeekStart === weekStart) {
    return {
      streak: Math.max(1, opts.previousStreak),
      weekStart,
    };
  }
  const prev = Date.parse(`${opts.lastWinWeekStart}T00:00:00Z`);
  const curr = Date.parse(`${weekStart}T00:00:00Z`);
  const weekDiff = Math.round((curr - prev) / (7 * 86_400_000));
  if (weekDiff === 1) {
    return { streak: opts.previousStreak + 1, weekStart };
  }
  return { streak: 1, weekStart };
}

/**
 * Monthly streak: consecutive UTC months with at least one win.
 */
export function nextMonthlyStreak(opts: {
  previousStreak: number;
  lastWinMonthStart: string | null;
  playDate: string;
  won: boolean;
}): { streak: number; monthStart: string } {
  const monthStart = monthStartKey(new Date(`${opts.playDate}T12:00:00.000Z`));
  if (!opts.won) {
    return {
      streak: opts.previousStreak,
      monthStart: opts.lastWinMonthStart ?? monthStart,
    };
  }
  if (!opts.lastWinMonthStart) {
    return { streak: 1, monthStart };
  }
  if (opts.lastWinMonthStart === monthStart) {
    return {
      streak: Math.max(1, opts.previousStreak),
      monthStart,
    };
  }
  const [py, pm] = opts.lastWinMonthStart.split("-").map(Number);
  const [cy, cm] = monthStart.split("-").map(Number);
  const monthDiff = (cy! - py!) * 12 + (cm! - pm!);
  if (monthDiff === 1) {
    return { streak: opts.previousStreak + 1, monthStart };
  }
  return { streak: 1, monthStart };
}

export function unlockRequiredForDifficulty(
  difficulty: Difficulty,
): UnlockId | null {
  return difficulty === "impossible" ? "impossible_mode" : null;
}

export function exclusiveCaseHref(): string {
  return "/play/escape/hard?pack=exclusive";
}
