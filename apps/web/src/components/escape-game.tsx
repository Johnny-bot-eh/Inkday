"use client";

import { useMemo, useState } from "react";
import type { Difficulty } from "@daily-puzzle/puzzle-core";
import {
  DIFFICULTY_LABELS,
  checkEscapeAnswer,
  getEscapeRoom,
  todayKey,
} from "@daily-puzzle/puzzle-core";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { markBoardPlayed } from "@/lib/played-boards";
import { submitMonthlyFromGame, type MonthlyPlayContext } from "@/lib/monthly-submit";
import { PlayTimer, formatDuration, usePlayTimer } from "@/components/play-timer";
import {
  PlayResultsCard,
  type PlayRanks,
} from "@/components/play-results-card";
import type { ScoreBreakdown } from "@daily-puzzle/puzzle-core";

type Props = {
  difficulty: Difficulty;
  dateKey?: string;
  alreadyPlayed?: { score: number; won: boolean } | null;
  signedIn: boolean;
  monthly?: MonthlyPlayContext | null;
  pack?: "standard" | "exclusive" | "premium";
  seasonId?: string | null;
};

export function EscapeGame({
  difficulty,
  dateKey = todayKey(),
  alreadyPlayed,
  signedIn,
  monthly = null,
  pack = "standard",
  seasonId = null,
}: Props) {
  const router = useRouter();
  const room = useMemo(
    () => getEscapeRoom(dateKey, difficulty, pack, seasonId),
    [dateKey, difficulty, pack, seasonId],
  );

  const [code, setCode] = useState("");
  const [attempts, setAttempts] = useState(0);
  const [done, setDone] = useState(Boolean(alreadyPlayed));
  const [status, setStatus] = useState<string | null>(
    alreadyPlayed
      ? `Already logged today · ${alreadyPlayed.score} pts`
      : null,
  );
  const [submitting, setSubmitting] = useState(false);
  const [results, setResults] = useState<{
    won: boolean;
    elapsedMs?: number;
    score?: number;
    streak?: number;
    breakdown?: ScoreBreakdown | null;
    ranks?: PlayRanks | null;
    answer?: string | null;
    newAchievements?: Array<{ title: string; description: string }>;
    newUnlocks?: Array<{ title: string; description: string }>;
  } | null>(null);
  const timer = usePlayTimer({
    running: !done && !alreadyPlayed,
    resetKey: `${dateKey}-${difficulty}`,
  });

  async function finish(opts: { won: boolean; attemptsUsed: number; code: string }) {
    const elapsedMs = timer.freeze();
    if (!monthly) markBoardPlayed(dateKey, "escape", difficulty, pack === "premium" ? "plus" : seasonId);
    const timeLabel = formatDuration(elapsedMs);

    if (monthly) {
      if (!opts.won) {
        setDone(true);
        setResults({ won: false, elapsedMs, answer: room.answer });
        setStatus(`Out of attempts (${timeLabel}).`);
        return;
      }
      if (!signedIn) {
        setDone(true);
        setResults({ won: true, elapsedMs, answer: room.answer });
        setStatus("Unlocked! Sign in to save Case File progress.");
        return;
      }
      setSubmitting(true);
      try {
        const mres = await submitMonthlyFromGame(monthly, {
          code: opts.code,
          elapsedMs,
        });
        if (!mres.ok) {
          setStatus(mres.data.error ?? "Could not save");
          return;
        }
        setDone(true);
        setResults({ won: true, elapsedMs, score: mres.data.score, answer: room.answer });
        setStatus(
          mres.data.totalBonus
            ? `Case File · ${mres.data.score} pts · bonus +${mres.data.totalBonus}`
            : `Case File · ${mres.data.score} pts`,
        );
        router.refresh();
      } catch {
        setStatus("Network error saving result");
      } finally {
        setSubmitting(false);
      }
      return;
    }

    if (!signedIn) {
      setDone(true);
      setResults({
        won: opts.won,
        elapsedMs,
        answer: room.answer,
      });
      setStatus(
        opts.won
          ? `Unlocked in ${timeLabel}! Sign in to save.`
          : `Out of attempts (${timeLabel}).`,
      );
      return;
    }

    setSubmitting(true);
    try {
      const res = await fetch("/api/play/submit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          puzzleType: "escape",
          difficulty,
          dateKey,
          code: opts.code,
          attemptsUsed: opts.attemptsUsed,
          elapsedMs,
          seasonId: seasonId || undefined,
          premium: pack === "premium" || undefined,
        }),
      });
      const data = await res.json();
      if (!res.ok && res.status !== 400) {
        setStatus(data.error ?? "Could not save");
        return;
      }
      if (!res.ok) {
        setStatus(data.error ?? "Incorrect");
        return;
      }
      setDone(true);
      setResults({
        won: Boolean(data.won),
        elapsedMs: data.elapsedMs ?? elapsedMs,
        score: data.score,
        streak: data.streak,
        breakdown: data.breakdown,
        ranks: data.ranks,
        answer: data.answer,
        newAchievements: data.newAchievements,
        newUnlocks: data.newUnlocks,
      });
      setStatus(null);
      router.refresh();
    } catch {
      setStatus("Network error saving result");
    } finally {
      setSubmitting(false);
    }
  }

  async function tryCode() {
    if (done || submitting) return;
    const nextAttempts = attempts + 1;
    setAttempts(nextAttempts);
    const verdict = checkEscapeAnswer(room, code);

    if (verdict.correct) {
      setDone(true);
      await finish({ won: true, attemptsUsed: nextAttempts, code });
      return;
    }

    if (nextAttempts >= room.maxAttempts) {
      setDone(true);
      await finish({ won: false, attemptsUsed: nextAttempts, code });
      return;
    }

    setStatus(
      `Not quite. ${room.maxAttempts - nextAttempts} attempt${
        room.maxAttempts - nextAttempts === 1 ? "" : "s"
      } left.`,
    );
  }

  return (
    <div className="mx-auto max-w-2xl animate-rise space-y-6">
      <div className="flex items-end justify-between gap-4">
        <div>
          <p className="text-xs uppercase tracking-[0.22em] text-ember">
            Escape Room · {DIFFICULTY_LABELS[difficulty]}
          </p>
          <h1 className="mt-1 font-[family-name:var(--font-display)] text-3xl font-bold">
            {room.title}
          </h1>
        </div>
        <div className="flex flex-col items-end gap-2">
          <Link href="/" className="text-sm text-fog hover:text-paper">
            ← Today
          </Link>
          {!alreadyPlayed && (
            <PlayTimer formatted={timer.formatted} stopped={done} />
          )}
        </div>
      </div>

      <p className="rounded-2xl border border-[var(--line)] bg-panel/60 p-5 leading-relaxed">
        {room.briefing}
      </p>

      <section className="space-y-3">
        <h2 className="font-[family-name:var(--font-display)] text-xl font-bold">
          Evidence
        </h2>
        {room.clues.map((clue) => (
          <div
            key={clue.id}
            className="rounded-xl border border-[var(--line)] bg-ink-2/80 p-4"
          >
            <div className="text-xs uppercase tracking-wider text-ember">
              {clue.label}
            </div>
            <p className="mt-2 text-sm leading-relaxed">{clue.text}</p>
          </div>
        ))}
      </section>

      <section className="rounded-2xl border border-[var(--line)] bg-panel/50 p-5">
        <p className="font-semibold">{room.prompt}</p>
        <p className="mt-1 text-xs text-fog">
          Attempts {attempts}/{room.maxAttempts}
        </p>
        {!done && (
          <div className="mt-4 flex flex-col gap-2 sm:flex-row">
            <input
              value={code}
              onChange={(e) => setCode(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") void tryCode();
              }}
              placeholder={room.placeholder}
              className="flex-1 rounded-lg border border-[var(--line)] bg-ink-2 px-3 py-3 tracking-[0.35em] outline-none ring-ember/40 focus:ring-2"
              autoFocus
              disabled={submitting}
            />
            <button
              type="button"
              onClick={() => void tryCode()}
              disabled={!code.trim() || submitting}
              className="rounded-lg bg-ember px-5 py-3 font-semibold text-on-ember hover:bg-ember-deep disabled:opacity-50"
            >
              Try code
            </button>
          </div>
        )}
      </section>

      {status && (
        <p className="rounded-xl border border-[var(--line)] bg-panel/70 px-4 py-3 text-sm">
          {status}
        </p>
      )}

      {results && <PlayResultsCard {...results} />}
    </div>
  );
}
