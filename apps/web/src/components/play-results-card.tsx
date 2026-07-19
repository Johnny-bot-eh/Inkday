"use client";

import { useEffect } from "react";
import Link from "next/link";
import { formatDuration } from "@/components/play-timer";
import {
  timeBonusScheduleLabel,
  timeBonusTierHint,
  type ScoreBreakdown,
} from "@daily-puzzle/puzzle-core";
import { emitAccountXp } from "@/components/account-xp-chip";

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
  /** Override the Cleared / Not solved heading (e.g. Out of attempts, Skipped). */
  outcomeLabel?: string | null;
  elapsedMs?: number | null;
  score?: number;
  streak?: number;
  breakdown?: ScoreBreakdown | null;
  ranks?: PlayRanks | null;
  answer?: string | null;
  definition?: string | null;
  explanation?: string | null;
  solutionItems?: Array<{ label: string; answer: string }>;
  newAchievements?: ProgressToast[];
  newUnlocks?: ProgressToast[];
  coinsEarned?: number | null;
  coinBalance?: number | null;
  xpEarned?: number | null;
  accountXp?: number | null;
  accountLevel?: number | null;
  petLevel?: number | null;
  petStage?: string | null;
  happinessGain?: number | null;
};

export function PlayResultsCard({
  won,
  outcomeLabel,
  elapsedMs,
  score,
  streak,
  breakdown,
  ranks,
  answer,
  definition,
  explanation,
  solutionItems,
  newAchievements,
  newUnlocks,
  coinsEarned,
  coinBalance,
  xpEarned,
  accountXp,
  accountLevel,
  petLevel,
  petStage,
  happinessGain,
}: Props) {
  useEffect(() => {
    if (typeof accountXp === "number") {
      emitAccountXp({ accountXp });
      return;
    }
    if (typeof accountLevel === "number") {
      emitAccountXp({ level: accountLevel });
    }
  }, [accountXp, accountLevel]);

  const heading =
    outcomeLabel?.trim() || (won ? "Cleared" : "Not solved");

  return (
    <div
      className={[
        "space-y-4 rounded-2xl border p-5",
        won
          ? "border-mint/45 bg-mint/10"
          : "border-danger/45 bg-danger/10",
      ].join(" ")}
    >
      <div>
        <p
          className={[
            "text-xs uppercase tracking-[0.2em]",
            won ? "text-mint" : "text-danger",
          ].join(" ")}
        >
          {heading}
        </p>
        {!won && (
          <p className="mt-2 text-sm text-fog">
            You did not clear this puzzle. The solution is shown below so you
            can learn the logic.
          </p>
        )}
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
        {typeof coinsEarned === "number" && coinsEarned > 0 && (
          <p className="mt-1 text-sm text-mint">
            +{coinsEarned} Ink Coins
            {typeof coinBalance === "number" ? ` · balance ${coinBalance}` : ""}
          </p>
        )}
        {typeof xpEarned === "number" && xpEarned > 0 && (
          <p className="mt-1 text-sm text-ember">
            +{xpEarned} XP
            {typeof accountLevel === "number"
              ? ` · account lv ${accountLevel}`
              : ""}
            {typeof petLevel === "number"
              ? ` · pet lv ${petLevel}${petStage ? ` (${petStage})` : ""}`
              : ""}
          </p>
        )}
        {typeof happinessGain === "number" && happinessGain > 0 && (
          <p className="mt-1 text-sm text-fog">
            +{happinessGain} pet happiness{" "}
            <Link href="/companion" className="text-ember hover:underline">
              Visit garden →
            </Link>
          </p>
        )}
      </div>

      {answer ? (
        <div
          className={[
            "rounded-xl border px-4 py-4",
            won
              ? "border-ember/40 bg-ember/15"
              : "border-[var(--line)] bg-ink-2/70",
          ].join(" ")}
        >
          <p
            className={[
              "text-xs uppercase tracking-[0.2em]",
              won ? "text-ember" : "text-fog",
            ].join(" ")}
          >
            {won ? "Answer" : "Solution"}
          </p>
          <p className="mt-2 overflow-visible pb-1 font-[family-name:var(--font-display)] text-2xl font-bold leading-[1.35] tracking-wide text-paper sm:text-3xl">
            {answer}
          </p>
          {definition ? (
            <p className="mt-3 text-sm leading-relaxed text-fog">{definition}</p>
          ) : null}
        </div>
      ) : null}

      {explanation ? (
        <div className="rounded-xl border border-[var(--line)] bg-ink-2/60 px-4 py-4">
          <p className="text-xs uppercase tracking-[0.2em] text-fog">
            How it works
          </p>
          <p className="mt-2 text-sm leading-relaxed text-paper">{explanation}</p>
        </div>
      ) : null}

      {solutionItems && solutionItems.length > 0 ? (
        <div className="rounded-xl border border-[var(--line)] bg-ink-2/60 px-4 py-4">
          <p className="text-xs uppercase tracking-[0.2em] text-fog">
            Word solutions
          </p>
          <ol className="mt-3 space-y-2">
            {solutionItems.map((item, index) => (
              <li
                key={`${index}-${item.answer}`}
                className="flex items-start justify-between gap-4 text-sm"
              >
                <span className="text-fog">
                  {index + 1}. {item.label}
                </span>
                <span className="font-semibold uppercase tracking-wide text-paper">
                  {item.answer}
                </span>
              </li>
            ))}
          </ol>
        </div>
      ) : null}

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
        <div className="space-y-2">
          <div className="grid grid-cols-2 gap-2 text-xs text-fog sm:grid-cols-3">
            <Bonus label="Base" value={breakdown.base} />
            <Bonus
              label="Speed"
              value={breakdown.timeBonus}
              hint={timeBonusTierHint(elapsedMs)}
            />
            <Bonus label="Perfect" value={breakdown.perfectBonus} />
            {(breakdown.seasonBonus ?? 0) > 0 && (
              <Bonus label="Season" value={breakdown.seasonBonus} />
            )}
            {(breakdown.plusBonus ?? 0) > 0 && (
              <Bonus label="Plus" value={breakdown.plusBonus} />
            )}
          </div>
          <p className="text-[11px] leading-relaxed text-fog/80">
            Speed adds score points (not Ink Coins) for faster clears:{" "}
            {timeBonusScheduleLabel()}. After 8 minutes, Speed is +0.
          </p>
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

function Bonus({
  label,
  value,
  hint,
}: {
  label: string;
  value: number;
  hint?: string;
}) {
  return (
    <div className="rounded-lg border border-[var(--line)] bg-ink-2/60 px-3 py-2">
      <div className="uppercase tracking-wider">{label}</div>
      <div className="mt-0.5 font-semibold text-paper">+{value}</div>
      {hint ? <div className="mt-0.5 text-[10px] text-fog/80">{hint}</div> : null}
    </div>
  );
}
