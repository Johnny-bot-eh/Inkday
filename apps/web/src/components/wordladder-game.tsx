"use client";

import { useMemo, useState } from "react";
import type { Difficulty, ScoreBreakdown } from "@daily-puzzle/puzzle-core";
import {
  checkWordLadder,
  getWordLadderPuzzle,
  isKnownLadderWord,
  nextWordLadderStep,
  todayKey,
} from "@daily-puzzle/puzzle-core";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { markBoardPlayed } from "@/lib/played-boards";
import { forfeitMonthlyFromGame, submitMonthlyFromGame, type MonthlyPlayContext } from "@/lib/monthly-submit";
import { PlayTimer, formatDuration, usePlayTimer } from "@/components/play-timer";
import {
  PlayResultsCard,
  type PlayRanks,
} from "@/components/play-results-card";
import { CoinConsumableBar } from "@/components/coin-consumable-bar";
import { DifficultyLabel } from "@/components/difficulty-label";
import { ShowAnswerPanel } from "@/components/show-answer-panel";

type Props = {
  difficulty: Difficulty;
  dateKey?: string;
  alreadyPlayed?: { score: number; won: boolean } | null;
  signedIn: boolean;
  monthly?: MonthlyPlayContext | null;
};

export function WordLadderGame({
  difficulty,
  dateKey = todayKey(),
  alreadyPlayed,
  signedIn,
  monthly = null,
}: Props) {
  const router = useRouter();
  const puzzle = useMemo(
    () => getWordLadderPuzzle(dateKey, difficulty),
    [dateKey, difficulty],
  );

  const [chain, setChain] = useState<string[]>([puzzle.start]);
  const [current, setCurrent] = useState("");
  const [bonusSteps, setBonusSteps] = useState(0);
  const [coinHint, setCoinHint] = useState<string | null>(null);
  const [done, setDone] = useState(Boolean(alreadyPlayed));
  const [status, setStatus] = useState<string | null>(
    alreadyPlayed
      ? `Already logged today · ${alreadyPlayed.score} pts`
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

  const timer = usePlayTimer({
    running: !done && !alreadyPlayed,
    resetKey: `${dateKey}-${difficulty}`,
  });

  const stepsUsed = Math.max(0, chain.length - 1);
  const maxSteps = puzzle.maxSteps + bonusSteps;
  const nextStep = nextWordLadderStep(puzzle, chain.length);

  async function finish(
    finalChain: string[],
    won: boolean,
    opts: { outcome?: "skipped" | "failed" } = {},
  ) {
    const elapsedMs = timer.freeze();
    if (!monthly) markBoardPlayed(dateKey, "wordladder", difficulty);
    const timeLabel = formatDuration(elapsedMs);

    if (won) {
      // Give immediate feedback; persistence can finish in the background.
      setDone(true);
      setStatus(
        signedIn
          ? "Correct! Saving your score…"
          : `Ladder complete in ${timeLabel}!`,
      );
    }

    if (monthly) {
      if (!won) {
        const outcome = opts.outcome ?? "failed";
        if (!signedIn) {
          setDone(true);
          setResults({
            won: false,
            outcomeLabel: outcome === "skipped" ? "Skipped" : "Out of attempts",
            elapsedMs,
            answer: puzzle.solution.join(" → "),
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
            guesses: finalChain,
            elapsedMs,
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
            answer: puzzle.solution.join(" → "),
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
        setResults({ won: true, elapsedMs });
        setStatus("Ladder complete! Sign in to save Case File progress.");
        return;
      }
      setSubmitting(true);
      try {
        const mres = await submitMonthlyFromGame(monthly, {
          guesses: finalChain,
          elapsedMs,
        });
        if (!mres.ok) {
          setStatus(mres.data.error ?? "Could not save");
          return;
        }
        setDone(true);
        setResults({ won: true, elapsedMs, score: mres.data.score });
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
      setResults({
        won,
        elapsedMs,
        answer: puzzle.solution.join(" → "),
      });
      setStatus(
        won
          ? `Ladder complete in ${timeLabel}! Sign in to save.`
          : `Could not finish (${timeLabel}).`,
      );
      return;
    }

    setSubmitting(true);
    try {
      const res = await fetch("/api/play/submit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          puzzleType: "wordladder",
          difficulty,
          dateKey,
          guesses: finalChain,
          elapsedMs,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setStatus(
          won
            ? `Correct — ${data.error ?? "score could not be saved"}.`
            : (data.error ?? "Could not save"),
        );
        return;
      }
      setResults({
        won,
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
        accountXp: data.accountXp,
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

  function addStep() {
    if (done || submitting) return;
    const word = current.toLowerCase().replace(/[^a-z]/g, "");
    if (!word) {
      setStatus("Enter a word.");
      return;
    }
    if (word.length !== puzzle.start.length) {
      setStatus(`Need a ${puzzle.start.length}-letter word.`);
      return;
    }

    const prev = chain[chain.length - 1]!;
    let diffs = 0;
    for (let i = 0; i < prev.length; i++) {
      if (prev[i] !== word[i]) diffs += 1;
    }
    if (diffs !== 1) {
      setStatus("Change exactly one letter.");
      return;
    }

    if (!isKnownLadderWord(word)) {
      setStatus("Not in the dictionary.");
      return;
    }

    if (!nextStep) {
      setStatus("The ladder is already complete.");
      return;
    }

    if (word !== nextStep.word) {
      setStatus(`Not the intended next word. Hint: ${nextStep.hint}`);
      return;
    }

    const next = [...chain, word];
    const nextSteps = next.length - 1;

    if (word === puzzle.end) {
      const verdict = checkWordLadder(puzzle, next);
      if (!verdict.ok) {
        setStatus(verdict.reason);
        return;
      }
      setChain(next);
      setCurrent("");
      void finish(next, true);
      return;
    }

    setChain(next);
    setCurrent("");
    setStatus(null);

    if (nextSteps >= maxSteps) {
      setDone(true);
      void finish(next, false);
    }
  }

  function undo() {
    if (done || chain.length <= 1) return;
    setChain(chain.slice(0, -1));
    setStatus(null);
  }

  return (
    <div className="mx-auto max-w-lg animate-rise">
      <div className="mb-6 flex items-end justify-between gap-4">
        <div>
          <p className="text-xs uppercase tracking-[0.22em] text-ember">
            <Link
              href="/#wordladder-puzzles"
              className="transition-colors hover:text-paper hover:underline"
            >
              Word Ladder
            </Link>{" "}
            · <DifficultyLabel difficulty={difficulty} />
          </p>
          <h1 className="mt-1 font-[family-name:var(--font-display)] text-3xl font-bold tracking-wide">
            {puzzle.start.toUpperCase()} →{" "}
            {done || alreadyPlayed
              ? puzzle.end.toUpperCase()
              : "·".repeat(puzzle.end.length)}
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
      <p className="mb-4 text-xs text-fog">
        Steps used {stepsUsed} / {maxSteps}
      </p>

      {!done && nextStep && (
        <div className="mb-4 rounded-xl border border-ember/35 bg-ember/10 px-4 py-3">
          <p className="text-xs uppercase tracking-[0.18em] text-ember">
            Hint for step {nextStep.step}
          </p>
          <p className="mt-1 text-sm text-paper">{nextStep.hint}</p>
        </div>
      )}

      <ol className="space-y-2">
        {chain.map((word, i) => (
          <li
            key={`${word}-${i}`}
            className={[
              "flex items-center gap-3 rounded-lg border bg-panel/60 px-4 py-2 font-mono text-lg uppercase tracking-widest transition",
              i === chain.length - 1
                ? "animate-rise border-ember/50"
                : "border-[var(--line)]",
              done && i === chain.length - 1 && "border-mint/50 bg-mint/10",
            ]
              .filter(Boolean)
              .join(" ")}
          >
            <span className="w-6 text-xs text-fog">{i + 1}</span>
            {word}
          </li>
        ))}
      </ol>

      {!done && (
        <div className="mt-6 flex flex-wrap gap-2">
          <input
            value={current}
            onChange={(e) =>
              setCurrent(
                e.target.value
                  .toLowerCase()
                  .replace(/[^a-z]/g, "")
                  .slice(0, puzzle.start.length),
              )
            }
            onKeyDown={(e) => {
              if (e.key === "Enter") addStep();
            }}
            className="min-w-[12rem] flex-1 rounded-lg border border-[var(--line)] bg-ink-2 px-3 py-3 uppercase tracking-[0.3em] outline-none ring-ember/40 focus:ring-2"
            placeholder={"·".repeat(puzzle.start.length)}
            autoFocus
            disabled={submitting}
          />
          <button
            type="button"
            onClick={addStep}
            className="rounded-lg bg-ember px-4 font-semibold text-on-ember hover:bg-ember-deep"
          >
            Add step
          </button>
          <button
            type="button"
            onClick={undo}
            className="rounded-lg border border-[var(--line)] px-4 text-fog hover:text-paper"
          >
            Undo
          </button>
        </div>
      )}

      {!done && !alreadyPlayed && (
        <CoinConsumableBar
          signedIn={signedIn}
          disabled={submitting}
          onHint={() => {
            if (!nextStep) {
              setCoinHint("No further steps — you’re at the end.");
              return;
            }
            const prev = chain[chain.length - 1]!;
            const next = nextStep.word;
            let changeAt = 0;
            for (let i = 0; i < prev.length; i++) {
              if (prev[i] !== next[i]) {
                changeAt = i;
                break;
              }
            }
            const ordinals = [
              "first",
              "second",
              "third",
              "fourth",
              "fifth",
              "sixth",
              "seventh",
            ];
            const ordinal =
              ordinals[changeAt] ?? `letter ${changeAt + 1}`;
            setCoinHint(
              `Extra hint: change the ${ordinal} letter. The next word starts with “${next[0]!.toUpperCase()}”.`,
            );
          }}
          onExtraAttempt={() => setBonusSteps((n) => n + 1)}
          onSkip={() => {
            if (!monthly) setDone(true);
            void finish(chain, false, { outcome: "skipped" });
          }}
        />
      )}

      {coinHint && !done && (
        <p className="mt-2 text-sm text-mint">{coinHint}</p>
      )}

      {status && (
        <p className="mt-4 rounded-lg border border-[var(--line)] bg-panel/60 px-4 py-3 text-sm">
          {status}
        </p>
      )}
      <ShowAnswerPanel
        available={Boolean(alreadyPlayed)}
        answer={puzzle.solution.map((w) => w.toUpperCase()).join(" → ")}
      />

      {results && (
        <div className="mt-4 animate-rise">
          <PlayResultsCard {...results} />
        </div>
      )}
    </div>
  );
}
