"use client";

import { useEffect, useMemo, useRef, useState } from "react";
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
import { caseFileClearLabel, forfeitMonthlyFromGame, submitMonthlyFromGame, type MonthlyPlayContext, dismissMonthlySlotNotes } from "@/lib/monthly-submit";
import { PlayTimer, formatDuration, usePlayTimer } from "@/components/play-timer";
import {
  PlayResultsCard,
  type PlayRanks,
} from "@/components/play-results-card";
import { CoinConsumableBar } from "@/components/coin-consumable-bar";
import { DifficultyLabel } from "@/components/difficulty-label";
import { ShowAnswerPanel } from "@/components/show-answer-panel";

const LETTER_ORDINALS = [
  "first",
  "second",
  "third",
  "fourth",
  "fifth",
  "sixth",
  "seventh",
] as const;

function letterOrdinal(index: number): string {
  return LETTER_ORDINALS[index] ?? `letter ${index + 1}`;
}

/** Paid rungs beyond the free step clue — each purchase unlocks the next. */
function wordLadderPaidHints(
  prev: string,
  next: string,
): string[] {
  let changeAt = 0;
  for (let i = 0; i < prev.length; i++) {
    if (prev[i] !== next[i]) {
      changeAt = i;
      break;
    }
  }
  const ordinal = letterOrdinal(changeAt);
  const from = prev[changeAt]!.toUpperCase();
  const to = next[changeAt]!.toUpperCase();
  return [
    `Change the ${ordinal} letter of ${prev.toUpperCase()}.`,
    `Change that ${ordinal} letter from “${from}” to “${to}”.`,
    `The next word is ${next.toUpperCase()}.`,
  ];
}

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
  const [wrongTries, setWrongTries] = useState(0);
  const [bonusTries, setBonusTries] = useState(0);
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
  const maxWrongTries = 3 + bonusTries;
  const nextStep = nextWordLadderStep(puzzle, chain.length);
  const prevWord = chain[chain.length - 1]!;
  const paidHintLadder = useMemo(
    () =>
      nextStep ? wordLadderPaidHints(prevWord, nextStep.word) : [],
    [nextStep, prevWord],
  );

  // New ladder step → fresh paid-hint ladder (don't carry prior-step spoilers).
  useEffect(() => {
    hintStepRef.current = 0;
    setUnlockedHints([]);
  }, [nextStep?.step, nextStep?.word]);

  function applyPaidHint() {
    const n = hintStepRef.current;
    if (n >= paidHintLadder.length) return;
    const next = paidHintLadder[n]!;
    hintStepRef.current = n + 1;
    setUnlockedHints((prev) => [...prev, next]);
  }

  async function finish(
    finalChain: string[],
    won: boolean,
    opts: { outcome?: "skipped" | "failed"; attemptsUsed?: number } = {},
  ) {
    const elapsedMs = timer.freeze();
    if (!monthly) markBoardPlayed(dateKey, "wordladder", difficulty);
    const timeLabel = formatDuration(elapsedMs);
    const attemptsUsed = Math.max(
      1,
      opts.attemptsUsed ?? (won ? 1 : Math.max(wrongTries, maxWrongTries)),
    );

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
          dismissMonthlySlotNotes(monthly);
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
        dismissMonthlySlotNotes(monthly);
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
        setResults({ won: true, elapsedMs, score: mres.data.score, breakdown: mres.data.breakdown });
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
        won,
        outcomeLabel: won
          ? undefined
          : opts.outcome === "skipped"
            ? "Skipped"
            : "Out of attempts",
        elapsedMs,
        answer: puzzle.solution.join(" → "),
      });
      setStatus(
        won
          ? `Ladder complete in ${timeLabel}! Sign in to save.`
          : opts.outcome === "skipped"
            ? `Skipped (${timeLabel}).`
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
          puzzleType: "wordladder",
          difficulty,
          dateKey,
          guesses: finalChain,
          attemptsUsed,
          forfeit: !won,
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
      setDone(true);
      setResults({
        won,
        outcomeLabel: won
          ? undefined
          : opts.outcome === "skipped"
            ? "Skipped"
            : "Out of attempts",
        elapsedMs: data.elapsedMs ?? elapsedMs,
        score: data.score,
        streak: data.streak,
        breakdown: data.breakdown,
        ranks: data.ranks,
        answer: data.answer ?? puzzle.solution.join(" → "),
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
      const nextWrong = wrongTries + 1;
      setWrongTries(nextWrong);
      setCurrent("");
      if (nextWrong >= maxWrongTries) {
        void finish(chain, false, {
          outcome: "failed",
          attemptsUsed: nextWrong,
        });
        return;
      }
      setStatus(
        `Not quite · ${maxWrongTries - nextWrong} attempt${
          maxWrongTries - nextWrong === 1 ? "" : "s"
        } left. Hint: ${nextStep.hint}`,
      );
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
      void finish(next, false, { outcome: "failed" });
    }
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
        Steps used {stepsUsed} / {maxSteps} · Attempts {wrongTries}/
        {maxWrongTries}
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
        </div>
      )}

      {!done && !alreadyPlayed && (
        <CoinConsumableBar
          signedIn={signedIn}
          disabled={submitting}
          canUseHint={
            Boolean(nextStep) && unlockedHints.length < paidHintLadder.length
          }
          onHint={applyPaidHint}
          onExtraAttempt={() => {
            setBonusSteps((n) => n + 1);
            setBonusTries((n) => n + 1);
          }}
          onSkip={() => {
            void finish(chain, false, {
              outcome: "skipped",
              attemptsUsed: Math.max(1, wrongTries),
            });
          }}
        />
      )}

      {unlockedHints.length > 0 && !done && (
        <ul className="mt-3 space-y-1.5 text-sm text-mint">
          {unlockedHints.map((hint, i) => (
            <li key={`ladder-hint-${i}`}>
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
