"use client";

import { useMemo, useState } from "react";
import type { Difficulty, ScoreBreakdown } from "@daily-puzzle/puzzle-core";
import {
  DIFFICULTY_LABELS,
  checkCryptogramAnswer,
  cryptogramHintDisplay,
  getCryptogramPuzzle,
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

type Props = {
  difficulty: Difficulty;
  dateKey?: string;
  alreadyPlayed?: { score: number; won: boolean } | null;
  signedIn: boolean;
  monthly?: MonthlyPlayContext | null;
};

export function CryptogramGame({
  difficulty,
  dateKey = todayKey(),
  alreadyPlayed,
  signedIn,
  monthly = null,
}: Props) {
  const router = useRouter();
  const puzzle = useMemo(
    () => getCryptogramPuzzle(dateKey, difficulty),
    [dateKey, difficulty],
  );
  const hintLine = useMemo(() => cryptogramHintDisplay(puzzle), [puzzle]);

  const [guess, setGuess] = useState("");
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

  async function finish(opts: { won: boolean; attemptsUsed: number; answer: string }) {
    const elapsedMs = timer.freeze();
    if (!monthly) markBoardPlayed(dateKey, "cryptogram", difficulty);
    const timeLabel = formatDuration(elapsedMs);

    if (monthly) {
      if (!opts.won) {
        setDone(true);
        setResults({ won: false, elapsedMs, answer: puzzle.plaintext });
        setStatus(`Out of attempts (${timeLabel}).`);
        return;
      }
      if (!signedIn) {
        setDone(true);
        setResults({ won: true, elapsedMs, answer: puzzle.plaintext });
        setStatus("Decoded! Sign in to save Case File progress.");
        return;
      }
      setSubmitting(true);
      try {
        const mres = await submitMonthlyFromGame(monthly, {
          answer: opts.answer,
          elapsedMs,
        });
        if (!mres.ok) {
          setStatus(mres.data.error ?? "Could not save");
          return;
        }
        setDone(true);
        setResults({ won: true, elapsedMs, score: mres.data.score, answer: puzzle.plaintext });
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
      setResults({ won: opts.won, elapsedMs, answer: puzzle.plaintext });
      setStatus(
        opts.won
          ? `Decoded in ${timeLabel}! Sign in to save.`
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
          puzzleType: "cryptogram",
          difficulty,
          dateKey,
          answer: opts.answer,
          attemptsUsed: opts.attemptsUsed,
          elapsedMs,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setStatus(data.error ?? "Could not save");
        return;
      }
      setDone(true);
      setResults({
        won: opts.won,
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

  function submit() {
    if (done || submitting) return;
    if (!guess.trim()) {
      setStatus("Enter the decoded phrase.");
      return;
    }
    const nextAttempts = attempts + 1;
    setAttempts(nextAttempts);
    const verdict = checkCryptogramAnswer(puzzle, guess);

    if (verdict.correct) {
      void finish({ won: true, attemptsUsed: nextAttempts, answer: guess });
      return;
    }

    if (nextAttempts >= puzzle.maxAttempts) {
      void finish({ won: false, attemptsUsed: nextAttempts, answer: guess });
      return;
    }

    setStatus(
      `Not the phrase · ${puzzle.maxAttempts - nextAttempts} attempt${
        puzzle.maxAttempts - nextAttempts === 1 ? "" : "s"
      } left`,
    );
  }

  return (
    <div className="mx-auto max-w-lg animate-rise">
      <div className="mb-6 flex items-end justify-between gap-4">
        <div>
          <p className="text-xs uppercase tracking-[0.22em] text-ember">
            Cryptogram · {DIFFICULTY_LABELS[difficulty]}
          </p>
          <h1 className="mt-1 font-[family-name:var(--font-display)] text-3xl font-bold">
            {puzzle.title}
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

      <p className="mb-4 text-sm text-fog">{puzzle.hint}</p>

      <div className="rounded-xl border border-[var(--line)] bg-panel/60 px-5 py-6">
        <p className="text-xs uppercase tracking-wider text-fog">Ciphertext</p>
        <p className="mt-2 font-mono text-xl tracking-wide">{puzzle.ciphertext}</p>
        {puzzle.revealed.length > 0 && (
          <>
            <p className="mt-5 text-xs uppercase tracking-wider text-fog">
              With letter hints
            </p>
            <p className="mt-2 font-mono text-lg tracking-wide text-ember">
              {hintLine}
            </p>
            <p className="mt-2 text-xs text-fog">
              Revealed plaintext letters:{" "}
              {puzzle.revealed.map((l) => l.toUpperCase()).join(", ")}
            </p>
          </>
        )}
      </div>

      {!done && (
        <div className="mt-6 space-y-3">
          <textarea
            value={guess}
            onChange={(e) => setGuess(e.target.value)}
            rows={3}
            className="w-full rounded-lg border border-[var(--line)] bg-ink-2 px-3 py-3 outline-none ring-ember/40 focus:ring-2"
            placeholder="Type the decoded phrase…"
            disabled={submitting}
          />
          <button
            type="button"
            onClick={submit}
            className="rounded-lg bg-ember px-4 py-2.5 font-semibold text-on-ember hover:bg-ember-deep"
          >
            Check phrase
          </button>
        </div>
      )}

      {status && (
        <p className="mt-4 rounded-lg border border-[var(--line)] bg-panel/60 px-4 py-3 text-sm">
          {status}
        </p>
      )}

      {results && (
        <div className="mt-4">
          <PlayResultsCard {...results} />
        </div>
      )}
    </div>
  );
}
