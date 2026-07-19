"use client";

import { todayKey } from "@daily-puzzle/puzzle-core";
import { usePathname, useSearchParams } from "next/navigation";
import {
  useCallback,
  useEffect,
  useId,
  useSyncExternalStore,
  type ChangeEvent,
} from "react";
import { isBoardPlayedLocally } from "@/lib/played-boards";
import {
  arePlayerNotesClosed,
  emitPlayerNotesChange,
  playerNotesKeyFromLocation,
  pruneStalePlayerNotes,
  readPlayerNotes,
  subscribePlayerNotes,
  writePlayerNotes,
} from "@/lib/player-notes";

const MINIMIZED_KEY = "inkday-notes:minimized";

function readMinimized(): boolean {
  if (typeof window === "undefined") return true;
  try {
    const raw = window.localStorage.getItem(MINIMIZED_KEY);
    if (raw === null) return true;
    return raw === "1";
  } catch {
    return true;
  }
}

function writeMinimized(minimized: boolean): void {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(MINIMIZED_KEY, minimized ? "1" : "0");
  } catch {
    /* ignore */
  }
  emitPlayerNotesChange();
}

function isPuzzleSurface(pathname: string): boolean {
  if (pathname.startsWith("/play/")) return true;
  return /^\/monthly\/\d+(?:\/|$)/.test(pathname);
}

function dailyBoardClosed(pathname: string, search: string): boolean {
  const daily = pathname.match(/^\/play\/([^/]+)\/([^/]+)/);
  if (!daily) return false;
  const params = new URLSearchParams(search);
  const pack = params.get("pack");
  const seasonId =
    pack === "premium"
      ? "plus"
      : (params.get("season") ?? params.get("seasonId") ?? "");
  return isBoardPlayedLocally(todayKey(), daily[1]!, daily[2]!, seasonId);
}

function NotesIcon({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      width="14"
      height="14"
      viewBox="0 0 16 16"
      fill="none"
      aria-hidden
    >
      <path
        d="M3.5 2.5h6.2L13 5.8V13.5H3.5V2.5Z"
        stroke="currentColor"
        strokeWidth="1.4"
        strokeLinejoin="round"
      />
      <path
        d="M9.5 2.5V6H13"
        stroke="currentColor"
        strokeWidth="1.4"
        strokeLinejoin="round"
      />
      <path
        d="M5.5 8.5h5M5.5 11h3.5"
        stroke="currentColor"
        strokeWidth="1.4"
        strokeLinecap="round"
      />
    </svg>
  );
}

/** Floating scratch pad scoped to the active daily / Case File puzzle only. */
export function PlayerNotesPanel() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  if (!isPuzzleSurface(pathname)) return null;

  const search = searchParams.toString();
  const storageKey = playerNotesKeyFromLocation(pathname, search);
  if (!storageKey) return null;

  return (
    <PlayerNotesPanelInner
      key={storageKey}
      storageKey={storageKey}
      pathname={pathname}
      search={search}
    />
  );
}

function PlayerNotesPanelInner({
  storageKey,
  pathname,
  search,
}: {
  storageKey: string;
  pathname: string;
  search: string;
}) {
  const textareaId = useId();

  useEffect(() => {
    pruneStalePlayerNotes();
  }, []);

  const minimized = useSyncExternalStore(
    subscribePlayerNotes,
    readMinimized,
    () => true,
  );
  const text = useSyncExternalStore(
    subscribePlayerNotes,
    () => readPlayerNotes(storageKey),
    () => "",
  );
  const closed = useSyncExternalStore(
    subscribePlayerNotes,
    () =>
      arePlayerNotesClosed(storageKey) || dailyBoardClosed(pathname, search),
    () => false,
  );

  const onChange = useCallback(
    (e: ChangeEvent<HTMLTextAreaElement>) => {
      writePlayerNotes(storageKey, e.target.value);
    },
    [storageKey],
  );

  function toggleMinimized() {
    writeMinimized(!minimized);
  }

  function clearNotes() {
    writePlayerNotes(storageKey, "");
  }

  // Finished boards do not keep a scratch pad.
  if (closed) return null;

  if (minimized) {
    return (
      <div className="pointer-events-none fixed bottom-4 right-4 z-40 sm:bottom-6 sm:right-6">
        <button
          type="button"
          onClick={toggleMinimized}
          className="pointer-events-auto inline-flex items-center gap-2 rounded-xl border border-[var(--line)] bg-panel/95 px-3 py-2 text-sm font-semibold text-paper shadow-lg backdrop-blur-sm hover:border-ember/40 hover:bg-panel-2"
          aria-expanded={false}
          aria-controls={textareaId}
        >
          <NotesIcon className="text-ember" />
          Notes
          {text.trim() ? (
            <span className="h-2 w-2 rounded-full bg-ember" aria-label="Has notes" />
          ) : null}
        </button>
      </div>
    );
  }

  return (
    <div className="pointer-events-none fixed inset-x-3 bottom-3 z-40 sm:inset-x-auto sm:bottom-6 sm:right-6 sm:w-[22rem]">
      <section
        className="pointer-events-auto overflow-hidden rounded-xl border border-[var(--line)] bg-panel/95 shadow-xl backdrop-blur-sm"
        aria-label="Player notes"
      >
        <header className="flex items-center justify-between gap-2 border-b border-[var(--line)] px-3 py-2">
          <div className="min-w-0">
            <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-ember">
              Scratch pad
            </p>
            <p className="truncate text-xs text-fog">
              This puzzle only · clears when you finish or the daily resets
            </p>
          </div>
          <div className="flex shrink-0 items-center gap-1">
            <button
              type="button"
              onClick={clearNotes}
              disabled={!text}
              className="rounded-lg px-2 py-1 text-xs text-fog hover:bg-white/5 hover:text-paper disabled:opacity-40"
            >
              Clear
            </button>
            <button
              type="button"
              onClick={toggleMinimized}
              className="rounded-lg border border-[var(--line)] px-2 py-1 text-xs font-semibold text-fog hover:bg-white/5 hover:text-paper"
              aria-expanded={true}
              aria-controls={textareaId}
            >
              Minimize
            </button>
          </div>
        </header>
        <label
          htmlFor={textareaId}
          className="absolute h-px w-px overflow-hidden whitespace-nowrap"
          style={{ clip: "rect(0, 0, 0, 0)", clipPath: "inset(50%)" }}
        >
          Notes
        </label>
        <textarea
          id={textareaId}
          value={text}
          onChange={onChange}
          rows={6}
          spellCheck
          placeholder="e.g. has A, W, R, D · ruled out E · yellow on 2…"
          className="block w-full resize-y bg-transparent px-3 py-2.5 text-sm leading-relaxed text-paper placeholder:text-fog/55 focus:outline-none"
        />
      </section>
    </div>
  );
}
