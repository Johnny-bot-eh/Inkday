import type { Difficulty } from "./types";
import { weekStartKey, monthStartKey } from "./types";
import {
  SEASONS,
  seasonAdeptAchievementId,
  type SeasonId,
} from "./seasons";

export type AchievementId =
  | "gumshoe_trainee"
  | "filing_cabinet_hero"
  | "sherlock"
  | "spreadsheet_suspect"
  | "cross_reference_cactus"
  | "einstein"
  | "puzzle_tourist"
  | "halfway_there"
  | "triple_digits"
  | "puzzle_master"
  | "speed_demon"
  | "perfectionist"
  | "night_owl"
  | "three_day_wonder"
  | "weeklong_wanderer"
  | "monthlong_marathon"
  | "legend"
  | "weekly_champion"
  | "challenge_victor"
  | "seasonal_starter"
  | "seasonal_regular"
  | "season_devotee"
  | "ink_blot_connoisseur"
  | "word_dabbler"
  | "word_regular"
  | "lexicon_legend"
  | "scramble_scout"
  | "cipher_clerk"
  | "vertical_thinker"
  | "rung_runner"
  | "case_file_clerk"
  | "case_file_veteran"
  | "hard_boiled"
  | "well_rounded"
  | `season_${string}_adept`;

export type AchievementDef = {
  id: AchievementId;
  title: string;
  description: string;
  /**
   * Visible once this achievement is earned (or always if omitted).
   * Already-earned achievements are always shown.
   */
  revealAfter?: AchievementId;
  /** Completely invisible until earned — quirky secrets */
  secretUntilEarned?: boolean;
};

export const ACHIEVEMENTS: AchievementDef[] = [
  // Escape ladder
  {
    id: "gumshoe_trainee",
    title: "Gumshoe Trainee",
    description: "Crack 10 Escape Room cases. The lobby badge still smells like toner.",
  },
  {
    id: "filing_cabinet_hero",
    title: "Filing Cabinet Hero",
    description: "Solve 25 detective puzzles. Someone has to alphabetize the confessions.",
    revealAfter: "gumshoe_trainee",
  },
  {
    id: "sherlock",
    title: "Sherlock",
    description: "Solve 50 detective puzzles. The pipe is metaphorical. Probably.",
    revealAfter: "filing_cabinet_hero",
  },
  // Logic ladder
  {
    id: "spreadsheet_suspect",
    title: "Spreadsheet Suspect",
    description: "Clear 15 logic grids. Columns never confess first.",
  },
  {
    id: "cross_reference_cactus",
    title: "Cross-Reference Cactus",
    description: "Clear 50 logic puzzles. Spiky, but oddly satisfying.",
    revealAfter: "spreadsheet_suspect",
  },
  {
    id: "einstein",
    title: "Einstein",
    description: "Solve 100 logic grids. Relativity optional; consistency mandatory.",
    revealAfter: "cross_reference_cactus",
  },
  // Volume ladder → Impossible
  {
    id: "puzzle_tourist",
    title: "Puzzle Tourist",
    description: "Complete 25 puzzles. Take photos. Don’t touch the velvet rope.",
  },
  {
    id: "halfway_there",
    title: "Halfway There",
    description: "Complete 50 puzzles. The gift shop is a lie; keep solving.",
    revealAfter: "puzzle_tourist",
  },
  {
    id: "triple_digits",
    title: "Triple Digits",
    description: "Complete 100 puzzles. Round numbers taste better with coffee.",
    revealAfter: "halfway_there",
  },
  {
    id: "puzzle_master",
    title: "Puzzle Master",
    description: "Complete 500 puzzles. We ran out of adjectives. Here’s a title.",
    revealAfter: "triple_digits",
  },
  // Streak ladder
  {
    id: "three_day_wonder",
    title: "Three-Day Wonder",
    description: "Hold a 3-day daily streak. Momentum looks good on you.",
  },
  {
    id: "weeklong_wanderer",
    title: "Weeklong Wanderer",
    description: "Hold a 7-day streak. The hallway lights stay on for you now.",
    revealAfter: "three_day_wonder",
  },
  {
    id: "monthlong_marathon",
    title: "Monthlong Marathon",
    description: "Hold a 30-day streak. Your calendar has adopted you.",
    revealAfter: "weeklong_wanderer",
  },
  {
    id: "legend",
    title: "Legend",
    description: "Reach a 365-day daily streak. Calendar printers fear you.",
    revealAfter: "monthlong_marathon",
  },
  // Word Daily ladder
  {
    id: "word_dabbler",
    title: "Word Dabbler",
    description: "Clear 10 Word Daily boards. Five letters never felt so long.",
  },
  {
    id: "word_regular",
    title: "Word Regular",
    description: "Clear 25 Word Daily boards. The keyboard knows your walk.",
    revealAfter: "word_dabbler",
  },
  {
    id: "lexicon_legend",
    title: "Lexicon Legend",
    description: "Clear 50 Word Daily boards. Dictionaries leave fan mail.",
    revealAfter: "word_regular",
  },
  // Extra word games
  {
    id: "scramble_scout",
    title: "Scramble Scout",
    description: "Solve 15 anagrams. Letters report for duty in new uniforms.",
  },
  {
    id: "cipher_clerk",
    title: "Cipher Clerk",
    description: "Solve 15 cryptograms. Substitution never looked so tidy.",
  },
  {
    id: "vertical_thinker",
    title: "Vertical Thinker",
    description: "Solve 15 acrostics. Down the side, up the prestige.",
  },
  {
    id: "rung_runner",
    title: "Rung Runner",
    description: "Solve 15 word ladders. One letter at a time, somehow.",
  },
  // Case File + hard clears
  {
    id: "case_file_clerk",
    title: "Case File Clerk",
    description: "Clear 10 Monthly Case File puzzles. Stamp, file, smirk.",
  },
  {
    id: "case_file_veteran",
    title: "Case File Veteran",
    description: "Clear 30 Monthly Case File puzzles. The archive nods back.",
    revealAfter: "case_file_clerk",
  },
  {
    id: "hard_boiled",
    title: "Hard-Boiled",
    description: "Clear 25 Hard or Obscure boards. Soft modes fear you.",
  },
  {
    id: "well_rounded",
    title: "Well-Rounded",
    description:
      "Win at least one of every live puzzle type. No favorites, only range.",
  },
  // Seasonal ladder
  {
    id: "seasonal_starter",
    title: "Seasonal Starter",
    description: "Clear your first limited-time seasonal puzzle.",
  },
  {
    id: "seasonal_regular",
    title: "Seasonal Regular",
    description: "Clear 5 seasonal event puzzles. You know where the coats go.",
    revealAfter: "seasonal_starter",
  },
  {
    id: "season_devotee",
    title: "Season Devotee",
    description: "Clear 15 seasonal event puzzles. The mascot waves back now.",
    revealAfter: "seasonal_regular",
  },
  ...SEASONS.map((season) => ({
    id: seasonAdeptAchievementId(season.id) as AchievementId,
    title: `${season.shortLabel} Adept`,
    description: `Clear ${season.adeptWins} ${season.title} boards during the event.`,
    revealAfter: "seasonal_regular" as AchievementId,
  })),
  // Quirky secrets — invisible until earned
  {
    id: "speed_demon",
    title: "Speed Demon",
    description: "Clear 25 puzzles in under 2 minutes. Blurs in the margins.",
    secretUntilEarned: true,
  },
  {
    id: "perfectionist",
    title: "Perfectionist",
    description: "Earn 50 perfect clears. Eraser sales plummeted.",
    secretUntilEarned: true,
  },
  {
    id: "night_owl",
    title: "Night Owl",
    description: "Complete 10 puzzles after midnight UTC. The janitor knows your name.",
    secretUntilEarned: true,
  },
  {
    id: "challenge_victor",
    title: "Challenge Victor",
    description: "Win 10 friend puzzle challenges. Sportsmanship optional; wins aren’t.",
    secretUntilEarned: true,
  },
  {
    id: "weekly_champion",
    title: "Weekly Champion",
    description: "Finish #1 in a weekly tournament. Temporary immortality.",
    secretUntilEarned: true,
  },
  {
    id: "ink_blot_connoisseur",
    title: "Ink-Blot Connoisseur",
    description:
      "Earn 10 perfect Escape clears. You taste toner notes of oak and suspicion.",
    secretUntilEarned: true,
  },
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
  /** Shown after this achievement is earned (or when the unlock itself is owned). */
  revealAfter?: AchievementId;
  secretUntilEarned?: boolean;
};

export const UNLOCKS: UnlockDef[] = [
  {
    id: "exclusive_cases",
    title: "Exclusive Cases",
    description:
      "Solve 50 detective puzzles to unlock exclusive Escape Room case files.",
    revealAfter: "filing_cabinet_hero",
  },
  {
    id: "hidden_challenges",
    title: "Hidden Challenges",
    description: "Hold a 7-day streak to unlock night-only challenge boards.",
    revealAfter: "three_day_wonder",
  },
  {
    id: "impossible_mode",
    title: "Impossible Mode",
    description: "Solve 100 puzzles to unlock Impossible difficulty.",
    revealAfter: "halfway_there",
  },
];

export type ProgressCounters = {
  escapeWins: number;
  logicWins: number;
  wordleWins: number;
  anagramWins: number;
  cryptogramWins: number;
  acrosticWins: number;
  wordladderWins: number;
  hardWins: number;
  monthlyClears: number;
  /** Distinct active puzzle types with at least one win. */
  distinctPuzzleTypes: number;
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
  /** Perfect Escape clears — for quirky secret */
  escapePerfectClears?: number;
};

export function evaluateAchievements(
  counters: ProgressCounters,
  alreadyEarned: ReadonlySet<string>,
): AchievementId[] {
  const next: AchievementId[] = [];
  const check = (id: AchievementId, ok: boolean) => {
    if (ok && !alreadyEarned.has(id)) next.push(id);
  };

  check("gumshoe_trainee", counters.escapeWins >= 10);
  check("filing_cabinet_hero", counters.escapeWins >= 25);
  check("sherlock", counters.escapeWins >= 50);

  check("spreadsheet_suspect", counters.logicWins >= 15);
  check("cross_reference_cactus", counters.logicWins >= 50);
  check("einstein", counters.logicWins >= 100);

  check("puzzle_tourist", counters.totalWins >= 25);
  check("halfway_there", counters.totalWins >= 50);
  check("triple_digits", counters.totalWins >= 100);
  check("puzzle_master", counters.totalWins >= 500);

  check("word_dabbler", counters.wordleWins >= 10);
  check("word_regular", counters.wordleWins >= 25);
  check("lexicon_legend", counters.wordleWins >= 50);
  check("scramble_scout", counters.anagramWins >= 15);
  check("cipher_clerk", counters.cryptogramWins >= 15);
  check("vertical_thinker", counters.acrosticWins >= 15);
  check("rung_runner", counters.wordladderWins >= 15);
  check("case_file_clerk", counters.monthlyClears >= 10);
  check("case_file_veteran", counters.monthlyClears >= 30);
  check("hard_boiled", counters.hardWins >= 25);
  check("well_rounded", counters.distinctPuzzleTypes >= 7);

  check("speed_demon", counters.speedClears >= 25);
  check("perfectionist", counters.perfectClears >= 50);
  check("night_owl", counters.nightOwlClears >= 10);
  check(
    "legend",
    counters.dailyStreak >= 365 || counters.bestDailyStreak >= 365,
  );
  check("three_day_wonder", counters.dailyStreak >= 3 || counters.bestDailyStreak >= 3);
  check(
    "weeklong_wanderer",
    counters.dailyStreak >= 7 || counters.bestDailyStreak >= 7,
  );
  check(
    "monthlong_marathon",
    counters.dailyStreak >= 30 || counters.bestDailyStreak >= 30,
  );
  check("challenge_victor", counters.challengeWins >= 10);
  check("weekly_champion", counters.weeklyChampionships >= 1);
  check("seasonal_starter", counters.seasonWins >= 1);
  check("seasonal_regular", counters.seasonWins >= 5);
  check("season_devotee", counters.seasonWins >= 15);
  check(
    "ink_blot_connoisseur",
    (counters.escapePerfectClears ?? 0) >= 10,
  );

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

/** Whether an achievement should appear in profile / home lists. */
export function isAchievementVisible(
  def: AchievementDef,
  earned: ReadonlySet<string>,
): boolean {
  if (earned.has(def.id)) return true;
  if (def.secretUntilEarned) return false;
  if (def.revealAfter && !earned.has(def.revealAfter)) return false;
  return true;
}

/** Whether an unlock should appear in UI. */
export function isUnlockVisible(
  def: UnlockDef,
  earnedAchievements: ReadonlySet<string>,
  unlocked: ReadonlySet<string>,
): boolean {
  if (unlocked.has(def.id)) return true;
  if (def.secretUntilEarned) return false;
  if (def.revealAfter && !earnedAchievements.has(def.revealAfter)) return false;
  return true;
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
