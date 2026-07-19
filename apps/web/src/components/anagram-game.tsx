"use client";

import { useMemo, useRef, useState } from "react";
import type { Difficulty, ScoreBreakdown } from "@daily-puzzle/puzzle-core";
import {
  checkAnagramAnswer,
  getAnagramPuzzle,
  todayKey,
} from "@daily-puzzle/puzzle-core";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { markBoardPlayed } from "@/lib/played-boards";
import { caseFileClearLabel, submitMonthlyFromGame, forfeitMonthlyFromGame, type MonthlyPlayContext, dismissMonthlySlotNotes } from "@/lib/monthly-submit";
import { PlayTimer, formatDuration, usePlayTimer } from "@/components/play-timer";
import {
  PlayResultsCard,
  type PlayRanks,
} from "@/components/play-results-card";
import { DifficultyLabel } from "@/components/difficulty-label";
import { ShowAnswerPanel } from "@/components/show-answer-panel";
import { CoinConsumableBar } from "@/components/coin-consumable-bar";
import { emitCoinBalance } from "@/components/coin-balance-chip";

type Props = {
  difficulty: Difficulty;
  dateKey?: string;
  alreadyPlayed?: { score: number; won: boolean } | null;
  signedIn: boolean;
  monthly?: MonthlyPlayContext | null;
};

export function AnagramGame({
  difficulty,
  dateKey = todayKey(),
  alreadyPlayed,
  signedIn,
  monthly = null,
}: Props) {
  const router = useRouter();
  const puzzle = useMemo(
    () => getAnagramPuzzle(dateKey, difficulty),
    [dateKey, difficulty],
  );

  const [guess, setGuess] = useState("");
  const [attempts, setAttempts] = useState(0);
  const [bonusAttempts, setBonusAttempts] = useState(0);
  const [unlockedHints, setUnlockedHints] = useState<string[]>([]);
  const hintStepRef = useRef(0);
  const [done, setDone] = useState(Boolean(alreadyPlayed));
  const [status, setStatus] = useState<string | null>(
    alreadyPlayed
      ? monthly
        ? alreadyPlayed.won
          ? `Already cleared · ${alreadyPlayed.score} pts`
          : "This Case File slot is closed."
        : `Already logged today · ${alreadyPlayed.score} pts`
      : null,
  );
  const [submitting, setSubmitting] = useState(false);
  const [results, setResults] = useState<{
    won: boolean;
    outcomeLabel?: string | null;
    elapsedMs?: number;
    score?: number;
    streak?: number;
    breakdown?: ScoreBreakdown | null;
    ranks?: PlayRanks | null;
    answer?: string | null;
    newAchievements?: Array<{ title: string; description: string }>;
    newCosmetics?: import("@daily-puzzle/puzzle-core").CosmeticUnlockNotice[];
    newUnlocks?: Array<{ title: string; description: string }>;
    coinsEarned?: number | null;
    coinBalance?: number | null;
    xpEarned?: number | null;
    accountXp?: number | null;
    accountLevel?: number | null;
    petLevel?: number | null;
    petStage?: string | null;
    happinessGain?: number | null;
      } | null>(null);

  const maxAttempts = puzzle.maxAttempts + bonusAttempts;

  const anagramHintLadder = useMemo(() => {
    const ans = puzzle.answer;
    return [
      `Starts with “${ans[0]!.toUpperCase()}”.`,
      `Has ${ans.length} letters.`,
      `Ends with “${ans[ans.length - 1]!.toUpperCase()}”.`,
      puzzle.hint,
    ];
  }, [puzzle.answer, puzzle.hint]);

  function applyAnagramHint() {
    const n = hintStepRef.current;
    if (n >= anagramHintLadder.length) return;
    const next = anagramHintLadder[n]!;
    hintStepRef.current = n + 1;
    setUnlockedHints((prev) => [...prev, next]);
  }

  const timer = usePlayTimer({
    running: !done && !alreadyPlayed,
    resetKey: `${dateKey}-${difficulty}`,
  });

  async function finish(opts: {
    won: boolean;
    attemptsUsed: number;
    answer: string;
    outcome?: "skipped" | "failed";
  }) {
    const elapsedMs = timer.freeze();
    if (!monthly) markBoardPlayed(dateKey, "anagram", difficulty);
    const timeLabel = formatDuration(elapsedMs);

    if (monthly) {
      if (!opts.won) {
        const outcome = opts.outcome ?? "failed";
        if (!signedIn) {
          dismissMonthlySlotNotes(monthly);
          setDone(true);
          setResults({
            won: false,
            outcomeLabel: outcome === "skipped" ? "Skipped" : "Out of attempts",
            elapsedMs,
            answer: puzzle.answer,
          });
          setStatus(
            outcome === "skipped"
              ? `Skipped (${timeLabel}).`
              : `Out of attempts (${timeLabel}).`,
          );
          return;
        }
        setSubmitting(true);
        try {
          const mres = await forfeitMonthlyFromGame(monthly, outcome, {
            elapsedMs,
            answer: opts.answer,
          });
          if (!mres.ok) {
            setStatus(mres.data.error ?? "Could not save");
            return;
          }
          setDone(true);
          setResults({
            won: false,
            outcomeLabel: outcome === "skipped" ? "Skipped" : "Out of attempts",
            elapsedMs,
            answer: puzzle.answer,
          });
          setStatus(
            outcome === "skipped"
              ? `Skipped — this Case File slot is closed (${timeLabel}).`
              : `Out of attempts — this Case File slot is closed (${timeLabel}).`,
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
        dismissMonthlySlotNotes(monthly);
        setDone(true);
        setResults({ won: true, elapsedMs, answer: puzzle.answer });
        setStatus("Solved! Sign in to save Case File progress.");
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
        setResults({
          won: true,
          elapsedMs,
          score: mres.data.score,
          breakdown: mres.data.breakdown,
          newCosmetics: mres.data.newCosmetics,
          answer: puzzle.answer,
          coinsEarned: mres.data.coinsEarned,
          coinBalance: mres.data.coinBalance,
          xpEarned: mres.data.xpEarned,
          accountXp: mres.data.accountXp,
          accountLevel: mres.data.accountLevel,
          petLevel: mres.data.petLevel,
          petStage: mres.data.petStage,
          happinessGain: mres.data.happinessGain,
        });
        if (typeof mres.data.coinBalance === "number") {
          emitCoinBalance(mres.data.coinBalance);
        }
        setStatus(caseFileClearLabel(mres.data));
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
        outcomeLabel: opts.won ? undefined : "Out of attempts",
        elapsedMs,
        answer: puzzle.answer,
      });
      setStatus(
        opts.won
          ? `Cleared in ${timeLabel}! Sign in to save.`
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
          puzzleType: "anagram",
          difficulty,
          dateKey,
          answer: opts.won ? opts.answer : opts.answer || undefined,
          attemptsUsed: Math.max(1, opts.attemptsUsed),
          forfeit: !opts.won,
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
        outcomeLabel: opts.won
          ? undefined
          : opts.outcome === "skipped"
            ? "Skipped"
            : "Out of attempts",
        elapsedMs: data.elapsedMs ?? elapsedMs,
        score: data.score,
        streak: data.streak,
        breakdown: data.breakdown,
        ranks: data.ranks,
        answer: data.answer ?? puzzle.answer,
        newAchievements: data.newAchievements,
        newCosmetics: data.newCosmetics,
        newUnlocks: data.newUnlocks,
        coinsEarned: data.coinsEarned,
        coinBalance: data.coinBalance,
        xpEarned: data.xpEarned,
        accountXp: data.accountXp,
        accountLevel: data.accountLevel,
        petLevel: data.petLevel,
        petStage: data.petStage,
        happinessGain: data.happinessGain,
      });
      if (typeof data.coinBalance === "number") emitCoinBalance(data.coinBalance);
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
    const verdict = checkAnagramAnswer(puzzle, guess);
    // Shape / dictionary failures do not burn an attempt.
    if (!verdict.correct && verdict.reason) {
      setStatus(verdict.reason);
      return;
    }
    const nextAttempts = attempts + 1;
    setAttempts(nextAttempts);

    if (verdict.correct) {
      void finish({
        won: true,
        attemptsUsed: nextAttempts,
        answer: verdict.normalized,
      });
      return;
    }

    if (nextAttempts >= maxAttempts) {
      void finish({
        won: false,
        attemptsUsed: nextAttempts,
        answer: verdict.normalized,
      });
      return;
    }

    setStatus(
      `Not quite · ${maxAttempts - nextAttempts} attempt${
        maxAttempts - nextAttempts === 1 ? "" : "s"
      } left`,
    );
    setGuess("");
  }

  return (
    <div className="mx-auto max-w-lg animate-rise">
      <div className="mb-6 flex items-end justify-between gap-4">
        <div>
          <p className="text-xs uppercase tracking-[0.22em] text-ember">
            <Link
              href="/#anagram-puzzles"
              className="transition-colors hover:text-paper hover:underline"
            >
              Anagrams
            </Link>{" "}
            · <DifficultyLabel difficulty={difficulty} />
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

      <div className="rounded-xl border border-[var(--line)] bg-panel/60 px-6 py-8 text-center">
        <div className="overflow-visible pb-2 font-[family-name:var(--font-display)] text-4xl font-bold uppercase leading-[1.35] tracking-[0.3em] pr-[0.3em]">
          {puzzle.scrambled}
        </div>
        <p className="mt-3 text-xs text-fog">
          {puzzle.answer.length} letters · Attempts {attempts}/{maxAttempts}
        </p>
      </div>

      {!done && (
        <div className="mt-6 flex gap-2">
          <input
            value={guess}
            onChange={(e) =>
              setGuess(
                e.target.value
                  .toLowerCase()
                  .replace(/[^a-z]/g, "")
                  .slice(0, puzzle.answer.length),
              )
            }
            onKeyDown={(e) => {
              if (e.key === "Enter") submit();
            }}
            className="flex-1 rounded-lg border border-[var(--line)] bg-ink-2 px-3 py-3 uppercase tracking-[0.25em] outline-none ring-ember/40 focus:ring-2"
            placeholder={"·".repeat(puzzle.answer.length)}
            autoFocus
            disabled={submitting}
          />
          <button
            type="button"
            onClick={submit}
            className="rounded-lg bg-ember px-4 font-semibold text-on-ember hover:bg-ember-deep"
          >
            Submit
          </button>
        </div>
      )}

      {!done && !alreadyPlayed && (
        <CoinConsumableBar
          signedIn={signedIn}
          disabled={submitting}
          canUseHint={unlockedHints.length < anagramHintLadder.length}
          onHint={applyAnagramHint}
          onExtraAttempt={() => setBonusAttempts((n) => n + 1)}
          onSkip={() => {
            void finish({
              won: false,
              attemptsUsed: Math.max(1, attempts),
              answer: guess.trim() || "",
              outcome: "skipped",
            });
          }}
        />
      )}

      {unlockedHints.length > 0 && !done && (
        <ul className="mt-3 space-y-1.5 text-sm text-mint">
          {unlockedHints.map((hint, i) => (
            <li key={`anagram-hint-${i}`}>
              <span className="text-fog">Hint {i + 1}: </span>
              {hint}
            </li>
          ))}
        </ul>
      )}

      {status && (
        <p className="mt-4 rounded-lg border border-[var(--line)] bg-panel/60 px-4 py-3 text-sm">
          {status}
        </p>
      )}
      <ShowAnswerPanel
        available={Boolean(alreadyPlayed)}
        answer={puzzle.answer.toUpperCase()}
      />

      {results && (
        <div className="mt-4">
          <PlayResultsCard {...results} />
        </div>
      )}
    </div>
  );
}
