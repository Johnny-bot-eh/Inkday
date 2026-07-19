"use client";

import { useMemo, useRef, useState } from "react";
import type { Difficulty, LetterMark } from "@daily-puzzle/puzzle-core";
import {
  evaluateGuess,
  getWordleConfig,
  isValidWordleGuess,
  todayKey,
  wordleTitle,
} from "@daily-puzzle/puzzle-core";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { markBoardPlayed } from "@/lib/played-boards";
import { caseFileClearLabel, forfeitMonthlyFromGame, submitMonthlyFromGame, type MonthlyPlayContext } from "@/lib/monthly-submit";
import { PlayTimer, formatDuration, usePlayTimer } from "@/components/play-timer";
import {
  PlayResultsCard,
  type PlayRanks,
} from "@/components/play-results-card";
import { DifficultyLabel } from "@/components/difficulty-label";
import { ShowAnswerPanel } from "@/components/show-answer-panel";
import { CoinConsumableBar } from "@/components/coin-consumable-bar";
import { emitCoinBalance } from "@/components/coin-balance-chip";
import type { ScoreBreakdown } from "@daily-puzzle/puzzle-core";

type Props = {
  difficulty: Difficulty;
  dateKey?: string;
  alreadyPlayed?: { score: number; won: boolean } | null;
  signedIn: boolean;
  monthly?: MonthlyPlayContext | null;
  category?: string | null;
  seasonId?: string | null;
};

export function WordleGame({
  difficulty,
  dateKey = todayKey(),
  alreadyPlayed,
  signedIn,
  monthly = null,
  category = null,
  seasonId = null,
}: Props) {
  const router = useRouter();
  const config = useMemo(
    () => getWordleConfig(dateKey, difficulty, { category }),
    [dateKey, difficulty, category],
  );

  const obscureTheme = config.theme === "obscure";
  const surpriseTheme = config.theme === "surprise";

  const [guesses, setGuesses] = useState<string[]>([]);
  const [marks, setMarks] = useState<LetterMark[][]>([]);
  const [current, setCurrent] = useState("");
  const [status, setStatus] = useState<string | null>(
    alreadyPlayed
      ? monthly
        ? alreadyPlayed.won
          ? `Already cleared · ${alreadyPlayed.score} pts`
          : "This Case File slot is closed."
        : `Already logged today · ${alreadyPlayed.score} pts`
      : null,
  );
  const [done, setDone] = useState(Boolean(alreadyPlayed));
  const [submitting, setSubmitting] = useState(false);
  const [revealAnswer, setRevealAnswer] = useState<string | null>(null);
  const [bonusGuesses, setBonusGuesses] = useState(0);
  const [unlockedHints, setUnlockedHints] = useState<string[]>([]);
  const hintedPositionsRef = useRef<Set<number>>(new Set());
  const [results, setResults] = useState<{
    won: boolean;
    outcomeLabel?: string | null;
    elapsedMs?: number;
    score?: number;
    streak?: number;
    breakdown?: ScoreBreakdown | null;
    ranks?: PlayRanks | null;
    answer?: string | null;
    definition?: string | null;
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

  const maxGuesses = config.maxGuesses + bonusGuesses;

  const timer = usePlayTimer({
    running: !done && !alreadyPlayed,
    resetKey: `${dateKey}-${difficulty}-${category ?? ""}`,
  });

  function greenPositions(rows: LetterMark[][]): Set<number> {
    const known = new Set<number>();
    for (const row of rows) {
      row.forEach((mark, i) => {
        if (mark === "correct") known.add(i);
      });
    }
    return known;
  }

  function nextHintablePosition(rows: LetterMark[][]): number | null {
    const known = greenPositions(rows);
    for (let i = 0; i < config.wordLength; i++) {
      if (known.has(i) || hintedPositionsRef.current.has(i)) continue;
      return i;
    }
    return null;
  }

  const canUseWordleHint = nextHintablePosition(marks) !== null;

  function applyWordleHint() {
    const index = nextHintablePosition(marks);
    if (index === null) return;
    hintedPositionsRef.current.add(index);
    const letter = config.answer[index]!.toUpperCase();
    setUnlockedHints((prev) => [
      ...prev,
      `Letter ${index + 1} is “${letter}”.`,
    ]);
  }

  function submitGuess() {
    if (done) return;
    const valid = isValidWordleGuess(current, config);
    if (!valid.ok) {
      setStatus(valid.reason);
      return;
    }
    const nextGuesses = [...guesses, valid.guess];
    const nextMarks = [...marks, evaluateGuess(config.answer, valid.guess)];
    setGuesses(nextGuesses);
    setMarks(nextMarks);
    setCurrent("");

    const won = valid.guess === config.answer;
    const exhausted = nextGuesses.length >= maxGuesses;
    if (won || exhausted) {
      setDone(true);
      void finish(nextGuesses, won);
    } else {
      setStatus(null);
    }
  }

  function undoGuess() {
    if (done || guesses.length === 0 || submitting) return;
    setGuesses((prev) => prev.slice(0, -1));
    setMarks((prev) => prev.slice(0, -1));
    setStatus(null);
  }

  async function finish(
    finalGuesses: string[],
    won: boolean,
    opts: { outcome?: "skipped" | "failed" } = {},
  ) {
    const elapsedMs = timer.freeze();
    if (!monthly) markBoardPlayed(dateKey, "wordle", difficulty, seasonId);
    const timeLabel = formatDuration(elapsedMs);

    if (monthly) {
      if (!won) {
        const outcome = opts.outcome ?? "failed";
        if (!signedIn) {
          setDone(true);
          setRevealAnswer(config.answer);
          setResults({
            won: false,
            outcomeLabel: outcome === "skipped" ? "Skipped" : "Out of attempts",
            elapsedMs,
            answer: config.answer,
            definition: config.definition,
          });
          setStatus(
            outcome === "skipped"
              ? `Skipped (${timeLabel}).`
              : `Out of guesses (${timeLabel}).`,
          );
          return;
        }
        setSubmitting(true);
        try {
          const mres = await forfeitMonthlyFromGame(monthly, outcome, {
            guesses: finalGuesses,
            elapsedMs,
          });
          if (!mres.ok) {
            setStatus(mres.data.error ?? "Could not save");
            return;
          }
          setDone(true);
          setRevealAnswer(config.answer);
          setResults({
            won: false,
            outcomeLabel: outcome === "skipped" ? "Skipped" : "Out of attempts",
            elapsedMs,
            answer: config.answer,
            definition: config.definition,
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
        setRevealAnswer(config.answer);
        setResults({ won: true, elapsedMs, answer: config.answer, definition: config.definition });
        setStatus(`Solved! Sign in to save Case File progress.`);
        return;
      }
      setSubmitting(true);
      try {
        const mres = await submitMonthlyFromGame(monthly, {
          guesses: finalGuesses,
          elapsedMs,
        });
        if (!mres.ok) {
          setStatus(mres.data.error ?? "Could not save");
          return;
        }
        setRevealAnswer(config.answer);
        setResults({
          won: true,
          elapsedMs,
          score: mres.data.score,
          breakdown: mres.data.breakdown,
          answer: config.answer,
          definition: config.definition,
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
      setRevealAnswer(config.answer);
      setResults({
        won,
        elapsedMs,
        answer: config.answer,
        definition: config.definition,
      });
      setStatus(
        won
          ? `Solved in ${timeLabel}! Sign in to save your score.`
          : `Out of guesses (${timeLabel}).`,
      );
      return;
    }

    setSubmitting(true);
    try {
      const res = await fetch("/api/play/submit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          puzzleType: "wordle",
          difficulty,
          dateKey,
          guesses: finalGuesses,
          elapsedMs,
          forfeit: !won,
          ...(category ? { category } : {}),
          ...(seasonId && !category ? { seasonId } : {}),
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setStatus(data.error ?? "Could not save");
        if (data.answer) setRevealAnswer(data.answer);
        return;
      }
      setRevealAnswer(data.answer);
      setResults({
        won,
        elapsedMs: data.elapsedMs ?? elapsedMs,
        score: data.score,
        streak: data.streak,
        breakdown: data.breakdown,
        ranks: data.ranks,
        answer: data.answer,
        definition: data.definition ?? config.definition,
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
      if (typeof data.coinBalance === "number") {
        emitCoinBalance(data.coinBalance);
      }
      setStatus(null);
      router.refresh();
    } catch {
      setStatus("Network error saving result");
    } finally {
      setSubmitting(false);
    }
  }

  const rows = Array.from({ length: maxGuesses }, (_, i) => {
    if (guesses[i]) {
      return { letters: guesses[i]!.split(""), marks: marks[i]! };
    }
    if (i === guesses.length && !done) {
      const letters = current
        .padEnd(config.wordLength, " ")
        .slice(0, config.wordLength)
        .split("");
      return { letters, marks: null };
    }
    return {
      letters: Array(config.wordLength).fill(""),
      marks: null as LetterMark[] | null,
    };
  });

  return (
    <div
      className={[
        "mx-auto max-w-lg animate-rise",
        obscureTheme && "rounded-2xl border border-red-950/80 bg-[#0a0608] p-4 shadow-[0_0_40px_rgba(80,0,20,0.35)] sm:p-6",
        surpriseTheme && "rounded-2xl border border-ember/40 bg-ember/5 p-4 sm:p-6",
      ]
        .filter(Boolean)
        .join(" ")}
    >
      <div className="mb-6 flex items-end justify-between gap-4">
        <div>
          <p
            className={[
              "text-xs uppercase tracking-[0.22em]",
              obscureTheme ? "text-red-400" : "text-ember",
            ].join(" ")}
          >
            <Link
              href="/#word-puzzles"
              className="transition-colors hover:text-paper hover:underline"
            >
              {config.categoryTitle
                ? `Surprise · ${config.categoryTitle}`
                : wordleTitle(difficulty)}
            </Link>
            {!config.categoryTitle && <> · <DifficultyLabel difficulty={difficulty} /></>}
          </p>
          <h1
            className={[
              "mt-1 font-[family-name:var(--font-display)] text-3xl font-bold",
              obscureTheme && "text-red-100",
            ]
              .filter(Boolean)
              .join(" ")}
          >
            {config.categoryTitle
              ? config.categoryTitle
              : `${config.wordLength}-letter ${
                  wordleTitle(difficulty) === "Word Daily" ? "day" : "board"
                }`}
          </h1>
          {config.warning ? (
            <p
              className={[
                "mt-2 text-sm",
                obscureTheme ? "text-red-300/90" : "text-fog",
              ].join(" ")}
            >
              {config.warning}
            </p>
          ) : null}
          {config.categoryTagline && !config.warning ? (
            <p className="mt-2 text-sm text-fog">{config.categoryTagline}</p>
          ) : null}
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

      <div className="space-y-2">
        {rows.map((row, ri) => (
          <div
            key={ri}
            className="grid gap-2"
            style={{
              gridTemplateColumns: `repeat(${config.wordLength}, minmax(0, 1fr))`,
            }}
          >
            {row.letters.map((ch, ci) => {
              const mark = row.marks?.[ci];
              return (
                <div
                  key={ci}
                  className={[
                    "flex aspect-square items-center justify-center rounded-md border text-xl font-bold uppercase",
                    mark
                      ? "tile-flip border-transparent text-paper"
                      : "border-[var(--line)] bg-panel/50",
                    mark === "correct" && "bg-correct",
                    mark === "present" && "bg-present text-on-ember",
                    mark === "absent" && "bg-absent text-fog",
                    !mark && ch.trim() && "border-ember/50",
                  ]
                    .filter(Boolean)
                    .join(" ")}
                >
                  {ch.trim()}
                </div>
              );
            })}
          </div>
        ))}
      </div>

      {!done && (
        <div className="mt-6 flex gap-2">
          <input
            value={current}
            onChange={(e) =>
              setCurrent(
                e.target.value
                  .toLowerCase()
                  .replace(/[^a-z]/g, "")
                  .slice(0, config.wordLength),
              )
            }
            onKeyDown={(e) => {
              if (e.key === "Enter") submitGuess();
            }}
            className="flex-1 rounded-lg border border-[var(--line)] bg-ink-2 px-3 py-3 uppercase tracking-[0.3em] outline-none ring-ember/40 focus:ring-2"
            placeholder={"·".repeat(config.wordLength)}
            autoFocus
            disabled={submitting}
          />
          <button
            type="button"
            onClick={submitGuess}
            className="rounded-lg bg-ember px-4 font-semibold text-on-ember hover:bg-ember-deep"
          >
            Guess
          </button>
          <button
            type="button"
            onClick={undoGuess}
            disabled={guesses.length === 0 || submitting}
            className="rounded-lg border border-[var(--line)] px-4 text-fog hover:text-paper disabled:opacity-40"
          >
            Undo
          </button>
        </div>
      )}

      {!done && !alreadyPlayed && (
        <CoinConsumableBar
          signedIn={signedIn}
          disabled={submitting}
          canUseHint={canUseWordleHint}
          onHint={applyWordleHint}
          onExtraAttempt={() => setBonusGuesses((n) => n + 1)}
          onSkip={() => {
            if (!monthly) setDone(true);
            void finish(guesses, false, { outcome: "skipped" });
          }}
        />
      )}

      {unlockedHints.length > 0 && !done && (
        <ul className="mt-2 space-y-1 text-sm text-mint">
          {unlockedHints.map((hint, i) => (
            <li key={`wordle-hint-${i}`}>
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

      {revealAnswer && done && !results ? (
        <div className="mt-4 rounded-xl border border-ember/40 bg-ember/15 px-4 py-4">
          <p className="text-xs uppercase tracking-[0.2em] text-ember">Answer</p>
          <p className="mt-2 font-[family-name:var(--font-display)] text-2xl font-bold tracking-wide text-paper sm:text-3xl">
            {revealAnswer}
          </p>
        </div>
      ) : null}
      <ShowAnswerPanel
        available={Boolean(alreadyPlayed)}
        answer={config.answer.toUpperCase()}
        detail={config.definition}
      />

      {results && (
        <div className="mt-4">
          <PlayResultsCard {...results} />
        </div>
      )}
    </div>
  );
}
