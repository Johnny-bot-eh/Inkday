"use client";

import Link from "next/link";
import { formatDuration } from "@/components/play-timer";
import type { ScoreBreakdown } from "@daily-puzzle/puzzle-core";

export type PlayRanks = {
  friends: {
    rank: number | null;
    total: number;
    top: Array<{ userId: string; name: string; score: number }>;
  };
  global: {
    rank: number | null;
    total: number;
  };
};

type ProgressToast = {
  title: string;
  description: string;
};

type Props = {
  won: boolean;
  elapsedMs?: number | null;
  score?: number;
  streak?: number;
  breakdown?: ScoreBreakdown | null;
  ranks?: PlayRanks | null;
  answer?: string | null;
  newAchievements?: ProgressToast[];
  newUnlocks?: ProgressToast[];
};

export function PlayResultsCard({
  won,
  elapsedMs,
  score,
  streak,
  breakdown,
  ranks,
  answer,
  newAchievements,
  newUnlocks,
}: Props) {
  return (
    <div className="space-y-4 rounded-2xl border border-[var(--line)] bg-panel/70 p-5">
      <div>
        <p className="text-xs uppercase tracking-[0.2em] text-ember">
          {won ? "Cleared" : "Finished"}
        </p>
        {typeof elapsedMs === "number" && (
          <p className="mt-2 font-[family-name:var(--font-display)] text-2xl font-bold">
            Your time:{" "}
            <span className="text-paper">{formatDuration(elapsedMs)}</span>
          </p>
        )}
        {won && typeof score === "number" && (
          <p className="mt-1 text-sm text-fog">
            {score} pts
            {typeof streak === "number" ? ` · streak ${streak}` : ""}
          </p>
        )}
        {!won && answer && (
          <p className="mt-1 text-sm text-fog">Answer was {answer}</p>
        )}
      </div>

      {((newAchievements && newAchievements.length > 0) ||
        (newUnlocks && newUnlocks.length > 0)) && (
        <div className="space-y-2 rounded-xl border border-ember/30 bg-ember/10 px-4 py-3">
          <p className="text-xs uppercase tracking-wider text-ember">Unlocked</p>
          {newAchievements?.map((a) => (
            <div key={a.title}>
              <div className="font-semibold">{a.title}</div>
              <div className="text-xs text-fog">{a.description}</div>
            </div>
          ))}
          {newUnlocks?.map((u) => (
            <div key={u.title}>
              <div className="font-semibold">{u.title}</div>
              <div className="text-xs text-fog">{u.description}</div>
            </div>
          ))}
        </div>
      )}

      {won && breakdown && (
        <div className="grid grid-cols-2 gap-2 text-xs text-fog sm:grid-cols-3">
          <Bonus label="Base" value={breakdown.base} />
          <Bonus label="Speed" value={breakdown.timeBonus} />
          <Bonus label="Perfect" value={breakdown.perfectBonus} />
          {(breakdown.seasonBonus ?? 0) > 0 && (
            <Bonus label="Season" value={breakdown.seasonBonus} />
          )}
        </div>
      )}

      {ranks && (
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <h3 className="text-sm font-semibold text-paper">Friends ranking</h3>
            {ranks.friends.top.length === 0 ? (
              <p className="mt-2 text-sm text-fog">
                No friend scores yet.{" "}
                <Link href="/friends" className="text-ember hover:underline">
                  Add friends
                </Link>
              </p>
            ) : (
              <ol className="mt-2 space-y-1 text-sm">
                {ranks.friends.top.map((row, i) => (
                  <li key={row.userId} className="flex justify-between gap-2">
                    <span>
                      #{i + 1} {row.name}
                    </span>
                    <span className="tabular-nums text-fog">{row.score}</span>
                  </li>
                ))}
              </ol>
            )}
            {ranks.friends.rank != null && (
              <p className="mt-2 text-xs text-fog">
                You’re #{ranks.friends.rank} of {ranks.friends.total} today
              </p>
            )}
          </div>
          <div>
            <h3 className="text-sm font-semibold text-paper">Global ranking</h3>
            <p className="mt-2 font-[family-name:var(--font-display)] text-3xl font-bold text-ember">
              {ranks.global.rank != null ? `#${ranks.global.rank}` : "—"}
            </p>
            <p className="mt-1 text-xs text-fog">
              {ranks.global.total > 0
                ? `of ${ranks.global.total} players today`
                : "Be the first on the board"}
            </p>
            <Link
              href="/leaderboard"
              className="mt-2 inline-block text-sm text-ember hover:underline"
            >
              Full leaderboards →
            </Link>
          </div>
        </div>
      )}
    </div>
  );
}

function Bonus({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-lg border border-[var(--line)] bg-ink-2/60 px-3 py-2">
      <div className="uppercase tracking-wider">{label}</div>
      <div className="mt-0.5 font-semibold text-paper">+{value}</div>
    </div>
  );
}
