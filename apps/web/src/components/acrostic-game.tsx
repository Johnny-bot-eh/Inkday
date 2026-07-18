"use client";

import { useMemo, useState } from "react";
import type { Difficulty, ScoreBreakdown } from "@daily-puzzle/puzzle-core";
import {
  DIFFICULTY_LABELS,
  checkAcrosticAnswers,
  checkAcrosticMessage,
  getAcrosticPuzzle,
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

export function AcrosticGame({
  difficulty,
  dateKey = todayKey(),
  alreadyPlayed,
  signedIn,
  monthly = null,
}: Props) {
  const router = useRouter();
  const puzzle = useMemo(
    () => getAcrosticPuzzle(dateKey, difficulty),
    [dateKey, difficulty],
  );

  const [answers, setAnswers] = useState(() =>
    puzzle.clues.map(() => ""),
  );
  const [message, setMessage] = useState("");
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
    coinsEarned?: number | null;
    coinBalance?: number | null;
    xpEarned?: number | null;
    accountLevel?: number | null;
    petLevel?: number | null;
    petStage?: string | null;
    happinessGain?: number | null;
  } | null>(null);

  const timer = usePlayTimer({
    running: !done && !alreadyPlayed,
    resetKey: `${dateKey}-${difficulty}`,
  });

  const initialPreview = answers
    .map((a) => (a.trim() ? a.trim()[0]!.toUpperCase() : "·"))
    .join(" ");

  async function finish(opts: {
    won: boolean;
    attemptsUsed: number;
    answer: string;
    clueAnswers?: string[];
  }) {
    const elapsedMs = timer.freeze();
    if (!monthly) markBoardPlayed(dateKey, "acrostic", difficulty);
    const timeLabel = formatDuration(elapsedMs);

    if (monthly) {
      if (!opts.won) {
        setDone(true);
        setResults({ won: false, elapsedMs, answer: puzzle.message });
        setStatus(`Out of attempts (${timeLabel}).`);
        return;
      }
      if (!signedIn) {
        setDone(true);
        setResults({ won: true, elapsedMs, answer: puzzle.message });
        setStatus("Solved! Sign in to save Case File progress.");
        return;
      }
      setSubmitting(true);
      try {
        const mres = await submitMonthlyFromGame(monthly, {
          answer: opts.answer,
          guesses: opts.clueAnswers,
          elapsedMs,
        });
        if (!mres.ok) {
          setStatus(mres.data.error ?? "Could not save");
          return;
        }
        setDone(true);
        setResults({ won: true, elapsedMs, score: mres.data.score, answer: puzzle.message });
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
      setResults({ won: opts.won, elapsedMs, answer: puzzle.message });
      setStatus(
        opts.won
          ? `Message found in ${timeLabel}! Sign in to save.`
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
          puzzleType: "acrostic",
          difficulty,
          dateKey,
          answer: opts.answer,
          guesses: opts.clueAnswers,
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
        coinsEarned: data.coinsEarned,
        coinBalance: data.coinBalance,
        xpEarned: data.xpEarned,
        accountLevel: data.accountLevel,
        petLevel: data.petLevel,
        petStage: data.petStage,
        happinessGain: data.happinessGain,
      });
      setStatus(null);
      router.refresh();
    } catch {
      setStatus("Network error saving result");
    } finally {
      setSubmitting(false);
    }
  }

  function trySubmit() {
    if (done || submitting) return;
    const nextAttempts = attempts + 1;
    setAttempts(nextAttempts);

    const byMessage = checkAcrosticMessage(puzzle, message);
    const byClues = checkAcrosticAnswers(puzzle, answers);
    const won = byMessage.correct || byClues.correct;

    if (won) {
      void finish({
        won: true,
        attemptsUsed: nextAttempts,
        answer: byMessage.correct
          ? message
          : puzzle.message,
        clueAnswers: answers,
      });
      return;
    }

    if (nextAttempts >= puzzle.maxAttempts) {
      void finish({
        won: false,
        attemptsUsed: nextAttempts,
        answer: message || answers.join(","),
        clueAnswers: answers,
      });
      return;
    }

    setStatus(
      `Not yet · ${puzzle.maxAttempts - nextAttempts} attempt${
        puzzle.maxAttempts - nextAttempts === 1 ? "" : "s"
      } left`,
    );
  }

  return (
    <div className="mx-auto max-w-lg animate-rise">
      <div className="mb-6 flex items-end justify-between gap-4">
        <div>
          <p className="text-xs uppercase tracking-[0.22em] text-ember">
            <Link
              href="/#acrostic-puzzles"
              className="transition-colors hover:text-paper hover:underline"
            >
              Acrostic
            </Link>{" "}
            · {DIFFICULTY_LABELS[difficulty]}
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

      <p className="mb-2 text-sm text-fog">{puzzle.prompt}</p>
      <p className="mb-6 text-xs text-fog">{puzzle.hint}</p>

      <div className="mb-6 rounded-xl border border-ember/30 bg-ember/10 px-4 py-3 text-center">
        <p className="text-xs uppercase tracking-wider text-fog">
          Hidden message
        </p>
        <p className="mt-1 font-[family-name:var(--font-display)] text-2xl font-bold tracking-[0.2em]">
          {initialPreview}
        </p>
        <p className="mt-1 text-xs text-fog">
          {puzzle.message.length} letters from clue initials
        </p>
      </div>

      <div className="space-y-4">
        {puzzle.clues.map((clue, i) => (
          <label key={clue.id} className="block">
            <span className="text-sm text-fog">
              {i + 1}. {clue.clue}{" "}
              <span className="text-fog/70">({clue.length})</span>
            </span>
            <input
              value={answers[i] ?? ""}
              disabled={done || submitting}
              onChange={(e) => {
                const next = [...answers];
                next[i] = e.target.value
                  .toLowerCase()
                  .replace(/[^a-z]/g, "")
                  .slice(0, clue.length);
                setAnswers(next);
              }}
              className="mt-1 w-full rounded-lg border border-[var(--line)] bg-ink-2 px-3 py-2 uppercase tracking-wider outline-none ring-ember/40 focus:ring-2"
              placeholder={"·".repeat(clue.length)}
            />
          </label>
        ))}
      </div>

      {!done && (
        <div className="mt-6 space-y-3">
          <label className="block">
            <span className="text-sm text-fog">
              Or enter the hidden message directly
            </span>
            <input
              value={message}
              onChange={(e) =>
                setMessage(
                  e.target.value
                    .toLowerCase()
                    .replace(/[^a-z]/g, "")
                    .slice(0, puzzle.message.length),
                )
              }
              className="mt-1 w-full rounded-lg border border-[var(--line)] bg-ink-2 px-3 py-2 uppercase tracking-[0.25em] outline-none ring-ember/40 focus:ring-2"
              placeholder={"·".repeat(puzzle.message.length)}
              disabled={submitting}
            />
          </label>
          <button
            type="button"
            onClick={trySubmit}
            className="rounded-lg bg-ember px-4 py-2.5 font-semibold text-on-ember hover:bg-ember-deep"
          >
            Check solution
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
          <PlayResultsCard
            {...results}
            solutionItems={puzzle.clues.map((clue, index) => ({
              label: clue.clue,
              answer: puzzle.answers[index]!,
            }))}
          />
        </div>
      )}
    </div>
  );
}
