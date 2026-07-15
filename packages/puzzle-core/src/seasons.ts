import type { DailyChallenge, Difficulty, PuzzleType } from "./types";
import { todayKey } from "./types";

export type SeasonId =
  | "murder-mysteries"
  | "space-exploration"
  | "ancient-civilizations"
  | "halloween-detective"
  | "christmas-crimes";

export type SeasonDef = {
  id: SeasonId;
  title: string;
  shortLabel: string;
  tagline: string;
  /** Accent used on home banner CSS variable */
  accent: string;
  /** Recurring UTC calendar window (inclusive), month 1–12 */
  range: {
    startMonth: number;
    startDay: number;
    endMonth: number;
    endDay: number;
  };
  /** Limited boards live only while the season is active */
  challenges: DailyChallenge[];
  /** Wins of season-tagged puzzles needed for the season adept badge */
  adeptWins: number;
};

function seasonHref(
  puzzleType: PuzzleType,
  difficulty: Difficulty,
  seasonId: SeasonId,
): string {
  return `/play/${puzzleType}/${difficulty}?season=${seasonId}`;
}

export const SEASONS: SeasonDef[] = [
  {
    id: "murder-mysteries",
    title: "Murder Mysteries Month",
    shortLabel: "Noir",
    tagline: "January is for dossiers, alibis, and locked studies.",
    accent: "#c45c4a",
    range: { startMonth: 1, startDay: 1, endMonth: 1, endDay: 31 },
    adeptWins: 10,
    challenges: [
      {
        id: "murder-case",
        title: "The Closed Library",
        difficultyLabel: "Hard",
        puzzleType: "escape",
        difficulty: "hard",
        href: seasonHref("escape", "hard", "murder-mysteries"),
      },
      {
        id: "murder-grid",
        title: "Who Held the Key?",
        difficultyLabel: "Medium",
        puzzleType: "logic",
        difficulty: "medium",
        href: seasonHref("logic", "medium", "murder-mysteries"),
      },
      {
        id: "murder-path",
        title: "Alley After Midnight",
        difficultyLabel: "Hard",
        puzzleType: "path",
        difficulty: "hard",
        href: seasonHref("path", "hard", "murder-mysteries"),
      },
    ],
  },
  {
    id: "ancient-civilizations",
    title: "Ancient Civilizations Month",
    shortLabel: "Ruins",
    tagline: "March digs through temples, glyphs, and lost maps.",
    accent: "#c9a227",
    range: { startMonth: 3, startDay: 1, endMonth: 3, endDay: 31 },
    adeptWins: 10,
    challenges: [
      {
        id: "ancient-vault",
        title: "Temple Seal",
        difficultyLabel: "Hard",
        puzzleType: "escape",
        difficulty: "hard",
        href: seasonHref("escape", "hard", "ancient-civilizations"),
      },
      {
        id: "ancient-grid",
        title: "Dynasty Deduction",
        difficultyLabel: "Hard",
        puzzleType: "logic",
        difficulty: "hard",
        href: seasonHref("logic", "hard", "ancient-civilizations"),
      },
      {
        id: "ancient-path",
        title: "Catacomb Trail",
        difficultyLabel: "Medium",
        puzzleType: "path",
        difficulty: "medium",
        href: seasonHref("path", "medium", "ancient-civilizations"),
      },
    ],
  },
  {
    id: "space-exploration",
    title: "Space Exploration Month",
    shortLabel: "Orbit",
    tagline: "July stretches into star charts, airlocks, and orbital codes.",
    accent: "#5b8def",
    range: { startMonth: 7, startDay: 1, endMonth: 7, endDay: 31 },
    adeptWins: 10,
    challenges: [
      {
        id: "space-airlock",
        title: "Airlock Cipher",
        difficultyLabel: "Hard",
        puzzleType: "escape",
        difficulty: "hard",
        href: seasonHref("escape", "hard", "space-exploration"),
      },
      {
        id: "space-grid",
        title: "Crew Roster",
        difficultyLabel: "Medium",
        puzzleType: "logic",
        difficulty: "medium",
        href: seasonHref("logic", "medium", "space-exploration"),
      },
      {
        id: "space-path",
        title: "Debris Field",
        difficultyLabel: "Hard",
        puzzleType: "path",
        difficulty: "hard",
        href: seasonHref("path", "hard", "space-exploration"),
      },
    ],
  },
  {
    id: "halloween-detective",
    title: "Halloween Detective Week",
    shortLabel: "Haunt",
    tagline: "Late October: fog, porch lights, and one last case before dawn.",
    accent: "#e07a2f",
    range: { startMonth: 10, startDay: 24, endMonth: 11, endDay: 1 },
    adeptWins: 7,
    challenges: [
      {
        id: "halloween-manor",
        title: "Manor on Hollow Row",
        difficultyLabel: "Hard",
        puzzleType: "escape",
        difficulty: "hard",
        href: seasonHref("escape", "hard", "halloween-detective"),
      },
      {
        id: "halloween-grid",
        title: "Costume Alias",
        difficultyLabel: "Hard",
        puzzleType: "logic",
        difficulty: "hard",
        href: seasonHref("logic", "hard", "halloween-detective"),
      },
      {
        id: "halloween-path",
        title: "Pumpkin Patch Maze",
        difficultyLabel: "Medium",
        puzzleType: "path",
        difficulty: "medium",
        href: seasonHref("path", "medium", "halloween-detective"),
      },
    ],
  },
  {
    id: "christmas-crimes",
    title: "Christmas Crimes",
    shortLabel: "Yule",
    tagline: "December: stolen ornaments, sealed parcels, and fireplace codes.",
    accent: "#2f9e7b",
    range: { startMonth: 12, startDay: 1, endMonth: 12, endDay: 26 },
    adeptWins: 10,
    challenges: [
      {
        id: "yule-safe",
        title: "Gift Wrap Safe",
        difficultyLabel: "Hard",
        puzzleType: "escape",
        difficulty: "hard",
        href: seasonHref("escape", "hard", "christmas-crimes"),
      },
      {
        id: "yule-grid",
        title: "Who Took the Tinsel?",
        difficultyLabel: "Medium",
        puzzleType: "logic",
        difficulty: "medium",
        href: seasonHref("logic", "medium", "christmas-crimes"),
      },
      {
        id: "yule-path",
        title: "Rooftop Route",
        difficultyLabel: "Hard",
        puzzleType: "path",
        difficulty: "hard",
        href: seasonHref("path", "hard", "christmas-crimes"),
      },
    ],
  },
];

const SEASON_BY_ID = new Map(SEASONS.map((s) => [s.id, s]));

export function getSeason(id: string | null | undefined): SeasonDef | null {
  if (!id) return null;
  return SEASON_BY_ID.get(id as SeasonId) ?? null;
}

function monthDayValue(month: number, day: number): number {
  return month * 100 + day;
}

export function isDateInSeasonRange(
  dateKey: string,
  range: SeasonDef["range"],
): boolean {
  const parts = dateKey.split("-").map(Number);
  const month = parts[1];
  const day = parts[2];
  if (!month || !day) return false;
  const md = monthDayValue(month, day);
  const start = monthDayValue(range.startMonth, range.startDay);
  const end = monthDayValue(range.endMonth, range.endDay);
  if (start <= end) return md >= start && md <= end;
  // Window wraps the year (e.g. Dec → Jan)
  return md >= start || md <= end;
}

export function getActiveSeason(date = new Date()): SeasonDef | null {
  const key = todayKey(date);
  return SEASONS.find((s) => isDateInSeasonRange(key, s.range)) ?? null;
}

/** Next season that has not started yet this UTC year (or wraps to next year). */
export function getUpcomingSeason(date = new Date()): SeasonDef | null {
  const key = todayKey(date);
  const [, month, day] = key.split("-").map(Number);
  const md = monthDayValue(month!, day!);

  const upcoming = SEASONS.map((season) => {
    const start = monthDayValue(season.range.startMonth, season.range.startDay);
    let delta = start - md;
    if (delta <= 0) delta += 365; // rough year wrap for sorting
    return { season, delta };
  }).sort((a, b) => a.delta - b.delta);

  return upcoming[0]?.season ?? null;
}

export function seasonEndDateKey(season: SeasonDef, now = new Date()): string {
  const year = now.getUTCFullYear();
  const start = monthDayValue(season.range.startMonth, season.range.startDay);
  const end = monthDayValue(season.range.endMonth, season.range.endDay);
  const md = monthDayValue(now.getUTCMonth() + 1, now.getUTCDate());

  let endYear = year;
  if (start > end) {
    // wraps year: if we're in the Jan side, end is this year; if Dec side, end is next year
    if (md <= end) endYear = year;
    else endYear = year + 1;
  }

  const m = String(season.range.endMonth).padStart(2, "0");
  const d = String(season.range.endDay).padStart(2, "0");
  return `${endYear}-${m}-${d}`;
}

export function msUntilSeasonEnd(season: SeasonDef, now = new Date()): number {
  const endKey = seasonEndDateKey(season, now);
  const endMs = Date.parse(`${endKey}T23:59:59.999Z`);
  return Math.max(0, endMs - now.getTime());
}

export function normalizeSeasonId(
  raw: string | null | undefined,
): SeasonId | null {
  if (!raw) return null;
  return getSeason(raw) ? (raw as SeasonId) : null;
}

export function isSeasonActiveOn(
  seasonId: string,
  dateKey = todayKey(),
): boolean {
  const season = getSeason(seasonId);
  if (!season) return false;
  return isDateInSeasonRange(dateKey, season.range);
}

export function playMapKey(
  puzzleType: PuzzleType,
  difficulty: Difficulty,
  seasonId: string | null | undefined = "",
): string {
  const season = seasonId || "";
  return season
    ? `${puzzleType}:${difficulty}:${season}`
    : `${puzzleType}:${difficulty}`;
}

/** Flat list of season-scoped achievement defs (adept badges). */
export function seasonAdeptAchievementId(seasonId: SeasonId): string {
  return `season_${seasonId.replace(/-/g, "_")}_adept`;
}
