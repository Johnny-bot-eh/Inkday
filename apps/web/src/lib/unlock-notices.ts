/** Client-side queue of unlock notices for the home digest (never mid-puzzle). */

import type { CosmeticUnlockNotice } from "@daily-puzzle/puzzle-core";

const QUEUE_KEY = "inkday-unlock-notices:v1";
const SEEN_KEY = "inkday-unlock-seen:v1";
export const UNLOCK_NOTICES_EVENT = "inkday-unlock-notices";

export type QueuedUnlockNotice = CosmeticUnlockNotice & {
  queuedAt: number;
};

/** Stable snapshot for useSyncExternalStore — must not allocate a new [] each read. */
let cachedNotices: QueuedUnlockNotice[] = [];
let cachedRaw: string | null = null;

function emit(): void {
  if (typeof window === "undefined") return;
  window.dispatchEvent(new Event(UNLOCK_NOTICES_EVENT));
}

function readQueueRaw(): string | null {
  if (typeof window === "undefined") return null;
  try {
    return window.localStorage.getItem(QUEUE_KEY);
  } catch {
    return null;
  }
}

function parseQueue(raw: string | null): QueuedUnlockNotice[] {
  if (!raw) return [];
  try {
    const parsed = JSON.parse(raw) as unknown;
    if (!Array.isArray(parsed)) return [];
    return parsed
      .filter(
        (n): n is QueuedUnlockNotice =>
          Boolean(n) &&
          typeof n === "object" &&
          typeof (n as QueuedUnlockNotice).id === "string" &&
          typeof (n as QueuedUnlockNotice).title === "string",
      )
      .sort((a, b) => b.queuedAt - a.queuedAt);
  } catch {
    return [];
  }
}

function readQueue(): QueuedUnlockNotice[] {
  const raw = readQueueRaw();
  if (raw === cachedRaw) return cachedNotices;
  cachedRaw = raw;
  cachedNotices = parseQueue(raw);
  return cachedNotices;
}

function writeQueue(items: QueuedUnlockNotice[]): void {
  if (typeof window === "undefined") return;
  try {
    if (items.length === 0) {
      window.localStorage.removeItem(QUEUE_KEY);
      cachedRaw = null;
      cachedNotices = [];
    } else {
      const raw = JSON.stringify(items);
      window.localStorage.setItem(QUEUE_KEY, raw);
      cachedRaw = raw;
      cachedNotices = [...items].sort((a, b) => b.queuedAt - a.queuedAt);
    }
  } catch {
    /* quota */
  }
  emit();
}

function readSeen(): Set<string> {
  if (typeof window === "undefined") return new Set();
  try {
    const raw = window.localStorage.getItem(SEEN_KEY);
    if (!raw) return new Set();
    const parsed = JSON.parse(raw) as unknown;
    if (!Array.isArray(parsed)) return new Set();
    return new Set(parsed.filter((id): id is string => typeof id === "string"));
  } catch {
    return new Set();
  }
}

function writeSeen(ids: Set<string>): void {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(SEEN_KEY, JSON.stringify([...ids]));
  } catch {
    /* quota */
  }
}

/** Queue cosmetics unlocked after a finished board (results screen / home). */
export function queueUnlockNotices(
  notices: CosmeticUnlockNotice[] | null | undefined,
): void {
  if (!notices || notices.length === 0) return;
  const seen = readSeen();
  const queue = readQueue();
  const byId = new Map(queue.map((n) => [n.id, n]));
  let changed = false;
  for (const notice of notices) {
    if (seen.has(notice.id) || byId.has(notice.id)) continue;
    byId.set(notice.id, { ...notice, queuedAt: Date.now() });
    changed = true;
  }
  if (changed) writeQueue([...byId.values()]);
}

export function listUnlockNotices(): QueuedUnlockNotice[] {
  return readQueue();
}

export function dismissUnlockNotice(id: string): void {
  const seen = readSeen();
  seen.add(id);
  writeSeen(seen);
  writeQueue(readQueue().filter((n) => n.id !== id));
}

export function dismissAllUnlockNotices(): void {
  const seen = readSeen();
  for (const n of readQueue()) seen.add(n.id);
  writeSeen(seen);
  writeQueue([]);
}

export function subscribeUnlockNotices(onChange: () => void): () => void {
  window.addEventListener(UNLOCK_NOTICES_EVENT, onChange);
  window.addEventListener("storage", onChange);
  return () => {
    window.removeEventListener(UNLOCK_NOTICES_EVENT, onChange);
    window.removeEventListener("storage", onChange);
  };
}
