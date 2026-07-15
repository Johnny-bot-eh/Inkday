import { notFound } from "next/navigation";
import {
  ALL_DIFFICULTIES,
  getSeason,
  isSeasonActiveOn,
  normalizeSeasonId,
  unlockRequiredForDifficulty,
  type Difficulty,
  type PuzzleType,
  todayKey,
} from "@daily-puzzle/puzzle-core";
import {
  getExistingPlay,
  userHasUnlock,
} from "@/lib/game-service";
import { getSession } from "@/lib/session";

export async function loadPlayPage(opts: {
  puzzleType: PuzzleType;
  difficultyRaw: string;
  seasonRaw?: string | null;
}) {
  if (!ALL_DIFFICULTIES.includes(opts.difficultyRaw as Difficulty)) {
    notFound();
  }
  const difficulty = opts.difficultyRaw as Difficulty;
  const session = await getSession();
  const dateKey = todayKey();
  const seasonId = normalizeSeasonId(opts.seasonRaw);

  if (opts.seasonRaw && !seasonId) {
    notFound();
  }
  if (seasonId && !isSeasonActiveOn(seasonId, dateKey)) {
    const season = getSeason(seasonId);
    return {
      difficulty,
      dateKey,
      seasonId,
      signedIn: Boolean(session?.user),
      locked: true as const,
      lockReason: `${season?.title ?? "This season"} isn’t live right now.`,
      alreadyPlayed: null,
    };
  }

  const required = unlockRequiredForDifficulty(difficulty);
  if (required) {
    if (!session?.user) {
      return {
        difficulty,
        dateKey,
        seasonId,
        signedIn: false,
        locked: true as const,
        lockReason:
          "Sign in and solve 100 puzzles to unlock Impossible difficulty.",
        alreadyPlayed: null,
      };
    }
    const unlocked = await userHasUnlock(session.user.id, required);
    if (!unlocked) {
      return {
        difficulty,
        dateKey,
        seasonId,
        signedIn: true,
        locked: true as const,
        lockReason:
          "Impossible mode unlocks after 100 completed puzzles.",
        alreadyPlayed: null,
      };
    }
  }

  const existing = session?.user
    ? await getExistingPlay({
        userId: session.user.id,
        puzzleType: opts.puzzleType,
        difficulty,
        dateKey,
        seasonId,
      })
    : null;

  return {
    difficulty,
    dateKey,
    seasonId,
    signedIn: Boolean(session?.user),
    locked: false as const,
    lockReason: null,
    alreadyPlayed: existing
      ? { score: existing.score, won: existing.won }
      : null,
  };
}
