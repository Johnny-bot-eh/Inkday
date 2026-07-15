/** Client-side board completion for the current UTC day (guests + instant UI sync). */

const STORAGE_PREFIX = "inkday-played:";

export function playBoardKey(
  puzzleType: string,
  difficulty: string,
  seasonId: string | null | undefined = "",
): string {
  const season = seasonId || "";
  return season
    ? `${puzzleType}:${difficulty}:${season}`
    : `${puzzleType}:${difficulty}`;
}

export function readPlayedKeys(dateKey: string): Set<string> {
  if (typeof window === "undefined") return new Set();
  try {
    const raw = window.localStorage.getItem(STORAGE_PREFIX + dateKey);
    if (!raw) return new Set();
    const parsed = JSON.parse(raw) as unknown;
    if (!Array.isArray(parsed)) return new Set();
    return new Set(parsed.filter((k): k is string => typeof k === "string"));
  } catch {
    return new Set();
  }
}

export function markBoardPlayed(
  dateKey: string,
  puzzleType: string,
  difficulty: string,
  seasonId: string | null | undefined = "",
): void {
  if (typeof window === "undefined") return;
  const key = playBoardKey(puzzleType, difficulty, seasonId);
  try {
    const next = readPlayedKeys(dateKey);
    next.add(key);
    window.localStorage.setItem(
      STORAGE_PREFIX + dateKey,
      JSON.stringify([...next]),
    );
    window.dispatchEvent(
      new CustomEvent("inkday-played", { detail: { dateKey, key } }),
    );
  } catch {
    /* quota / private mode */
  }
}

export function isBoardPlayedLocally(
  dateKey: string,
  puzzleType: string,
  difficulty: string,
  seasonId: string | null | undefined = "",
): boolean {
  return readPlayedKeys(dateKey).has(
    playBoardKey(puzzleType, difficulty, seasonId),
  );
}
