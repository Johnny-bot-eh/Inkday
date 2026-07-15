"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import {
  isBoardPlayedLocally,
  playBoardKey,
} from "@/lib/played-boards";

type Props = {
  href: string;
  title: string;
  /** Shown when not completed */
  openSubtitle: string;
  /** Shown when completed (server knows the score) */
  doneSubtitle: string;
  puzzleType: string;
  difficulty: string;
  dateKey: string;
  seasonId?: string | null;
  /** Server-known completion for this board identity */
  serverDone: boolean;
  featured?: boolean;
};

/**
 * Marks a board done using server plays OR local same-day completion,
 * so the same puzzle type+difficulty stays gray in every section.
 */
export function ChallengePlayRow({
  href,
  title,
  openSubtitle,
  doneSubtitle,
  puzzleType,
  difficulty,
  dateKey,
  seasonId = "",
  serverDone,
  featured,
}: Props) {
  const key = playBoardKey(puzzleType, difficulty, seasonId);
  const [localDone, setLocalDone] = useState(false);

  useEffect(() => {
    function sync() {
      setLocalDone(
        isBoardPlayedLocally(dateKey, puzzleType, difficulty, seasonId),
      );
    }
    sync();
    function onPlayed(e: Event) {
      const detail = (e as CustomEvent<{ dateKey: string; key: string }>).detail;
      if (detail?.dateKey === dateKey && detail.key === key) sync();
      else if (!detail) sync();
    }
    window.addEventListener("inkday-played", onPlayed);
    window.addEventListener("storage", onPlayed);
    return () => {
      window.removeEventListener("inkday-played", onPlayed);
      window.removeEventListener("storage", onPlayed);
    };
  }, [dateKey, puzzleType, difficulty, seasonId, key]);

  const done = serverDone || localDone;
  const subtitle = done ? doneSubtitle : openSubtitle;

  return (
    <Link
      href={href}
      className={[
        "flex items-center justify-between rounded-xl border px-4 py-3 transition",
        done
          ? "border-[var(--line)] bg-[var(--line)]/25 opacity-70 hover:opacity-90 hover:bg-[var(--line)]/35"
          : featured
            ? "border-ember/35 bg-ember/10 hover:border-ember/40 hover:bg-panel"
            : "border-[var(--line)] bg-panel/60 hover:border-ember/40 hover:bg-panel",
      ].join(" ")}
    >
      <div>
        <div className={["font-semibold", done ? "text-fog" : ""].join(" ")}>
          {title}
        </div>
        <div className="text-xs text-fog">{subtitle}</div>
      </div>
      <span className={done ? "text-fog" : "text-ember"}>
        {done ? "Done" : "Play →"}
      </span>
    </Link>
  );
}
