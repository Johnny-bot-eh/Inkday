import { playMapKey } from "./seasons";
import type { Difficulty, PuzzleType } from "./types";

/** Find today's play for a board that shares the same answer identity. */
export function findPlayForBoard<
  T extends {
    puzzleType: string;
    difficulty: string;
    seasonId?: string | null;
  },
>(
  plays: readonly T[],
  puzzleType: PuzzleType,
  difficulty: Difficulty,
  seasonId: string | null | undefined = "",
): T | undefined {
  const season = seasonId || "";
  return plays.find(
    (play) =>
      play.puzzleType === puzzleType &&
      play.difficulty === difficulty &&
      (play.seasonId || "") === season,
  );
}

export function buildPlayedMap<
  T extends {
    puzzleType: string;
    difficulty: string;
    seasonId?: string | null;
  },
>(plays: readonly T[]): Map<string, T> {
  const map = new Map<string, T>();
  for (const play of plays) {
    const key = playMapKey(
      play.puzzleType as PuzzleType,
      play.difficulty as Difficulty,
      play.seasonId,
    );
    map.set(key, play);
  }
  return map;
}
