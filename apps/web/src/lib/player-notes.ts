/** Device-local scratch notes scoped to one daily board or Case File slot. */

import { collectionIdForDate, todayKey } from "@daily-puzzle/puzzle-core";

export const PLAYER_NOTES_PREFIX = "inkday-notes:v2:";
const NOTES_DONE_PREFIX = "inkday-notes-done:v2:";
export const PLAYER_NOTES_EVENT = "inkday-notes-change";

function boardScopeKey(
  puzzleType: string,
  difficulty: string,
  seasonId: string | null | undefined = "",
): string {
  const season = seasonId || "";
  return season
    ? `${puzzleType}:${difficulty}:${season}`
    : `${puzzleType}:${difficulty}`;
}

export function playerNotesDailyKey(
  dateKey: string,
  puzzleType: string,
  difficulty: string,
  seasonId: string | null | undefined = "",
): string {
  return `${PLAYER_NOTES_PREFIX}daily:${dateKey}:${boardScopeKey(puzzleType, difficulty, seasonId)}`;
}

export function playerNotesMonthlyKey(
  collectionId: string,
  slotIndex: number,
): string {
  return `${PLAYER_NOTES_PREFIX}monthly:${collectionId}:${slotIndex}`;
}

export function emitPlayerNotesChange(): void {
  if (typeof window === "undefined") return;
  window.dispatchEvent(new Event(PLAYER_NOTES_EVENT));
}

export function readPlayerNotes(storageKey: string): string {
  if (typeof window === "undefined") return "";
  try {
    return window.localStorage.getItem(storageKey) ?? "";
  } catch {
    return "";
  }
}

export function writePlayerNotes(storageKey: string, value: string): void {
  if (typeof window === "undefined") return;
  try {
    if (value.trim()) {
      window.localStorage.setItem(storageKey, value);
    } else {
      window.localStorage.removeItem(storageKey);
    }
  } catch {
    /* quota / private mode */
  }
  emitPlayerNotesChange();
}

export function clearPlayerNotes(storageKey: string): void {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.removeItem(storageKey);
    window.localStorage.setItem(NOTES_DONE_PREFIX + storageKey, "1");
  } catch {
    /* ignore */
  }
  emitPlayerNotesChange();
}

export function arePlayerNotesClosed(storageKey: string): boolean {
  if (typeof window === "undefined") return false;
  try {
    return window.localStorage.getItem(NOTES_DONE_PREFIX + storageKey) === "1";
  } catch {
    return false;
  }
}

/** Clear notes when a daily board is finished (win, lose, or skip). */
export function clearDailyPlayerNotes(
  dateKey: string,
  puzzleType: string,
  difficulty: string,
  seasonId: string | null | undefined = "",
): void {
  clearPlayerNotes(
    playerNotesDailyKey(dateKey, puzzleType, difficulty, seasonId),
  );
}

/** Clear notes when a Case File slot is resolved. */
export function clearMonthlyPlayerNotes(
  collectionId: string,
  slotIndex: number,
): void {
  clearPlayerNotes(playerNotesMonthlyKey(collectionId, slotIndex));
}

/**
 * Drop notes (and done markers) that belong to a previous UTC day or
 * a previous month’s Case File so nothing carries across dailies.
 */
export function pruneStalePlayerNotes(
  activeDateKey: string = todayKey(),
  activeCollectionId: string = collectionIdForDate(),
): void {
  if (typeof window === "undefined") return;
  try {
    const remove: string[] = [];
    for (let i = 0; i < window.localStorage.length; i++) {
      const key = window.localStorage.key(i);
      if (!key) continue;

      const isNotes =
        key.startsWith(PLAYER_NOTES_PREFIX) ||
        key.startsWith("inkday-notes:v1:");
      const isDone = key.startsWith(NOTES_DONE_PREFIX);
      if (!isNotes && !isDone) continue;

      const body = isDone
        ? key.slice(NOTES_DONE_PREFIX.length)
        : key.startsWith(PLAYER_NOTES_PREFIX)
          ? key.slice(PLAYER_NOTES_PREFIX.length)
          : key.slice("inkday-notes:v1:".length);

      if (body.startsWith("daily:")) {
        const datePart = body.slice("daily:".length).split(":")[0] ?? "";
        if (datePart && datePart !== activeDateKey) remove.push(key);
        continue;
      }

      if (body.startsWith("monthly:")) {
        const collectionPart =
          body.slice("monthly:".length).split(":")[0] ?? "";
        if (collectionPart && collectionPart !== activeCollectionId) {
          remove.push(key);
        }
        continue;
      }

      // Legacy v1 keys (date:pathname:…) — keep only today’s date prefix.
      if (key.startsWith("inkday-notes:v1:")) {
        if (!body.startsWith(activeDateKey) && body !== "case") {
          remove.push(key);
        } else if (body.startsWith("case")) {
          remove.push(key);
        }
      }
    }
    for (const key of remove) window.localStorage.removeItem(key);
    if (remove.length > 0) emitPlayerNotesChange();
  } catch {
    /* ignore */
  }
}

export function subscribePlayerNotes(onStoreChange: () => void): () => void {
  window.addEventListener(PLAYER_NOTES_EVENT, onStoreChange);
  window.addEventListener("storage", onStoreChange);
  window.addEventListener("inkday-played", onStoreChange);
  return () => {
    window.removeEventListener(PLAYER_NOTES_EVENT, onStoreChange);
    window.removeEventListener("storage", onStoreChange);
    window.removeEventListener("inkday-played", onStoreChange);
  };
}

/** Map a play/monthly URL to the notes storage key for the active board. */
export function playerNotesKeyFromLocation(
  pathname: string,
  search: string,
): string | null {
  const monthly = pathname.match(/^\/monthly\/(\d+)(?:\/|$)/);
  if (monthly) {
    const slotIndex = Number(monthly[1]);
    if (!Number.isInteger(slotIndex)) return null;
    return playerNotesMonthlyKey(collectionIdForDate(), slotIndex);
  }

  const daily = pathname.match(/^\/play\/([^/]+)\/([^/]+)/);
  if (!daily) return null;

  const puzzleType = daily[1]!;
  const difficulty = daily[2]!;
  const params = new URLSearchParams(search);
  const pack = params.get("pack");
  const seasonId =
    pack === "premium"
      ? "plus"
      : (params.get("season") ?? params.get("seasonId") ?? "");

  return playerNotesDailyKey(todayKey(), puzzleType, difficulty, seasonId);
}
