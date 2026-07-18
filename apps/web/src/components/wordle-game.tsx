"use client";

import { useMemo, useState } from "react";
import type { Difficulty, LetterMark } from "@daily-puzzle/puzzle-core";
import {
  DIFFICULTY_LABELS,
  evaluateGuess,
  getWordleConfig,
  isValidWordleGuess,
  todayKey,
  wordleTitle,
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
      ? `Already logged today · ${alreadyPlayed.score} pts`
      : null,
  );
  const [done, setDone] = useState(Boolean(alreadyPlayed));
  const [submitting, setSubmitting] = useState(false);
  const [revealAnswer, setRevealAnswer] = useState<string | null>(null);
  const [bonusGuesses, setBonusGuesses] = useState(0);
  const [hintText, setHintText] = useState<string | null>(null);
  const [results, setResults] = useState<{
    won: boolean;
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
  } | null>(null);

  const maxGuesses = config.maxGuesses + bonusGuesses;

  const timer = usePlayTimer({
    running: !done && !alreadyPlayed,
    resetKey: `${dateKey}-${difficulty}-${category ?? ""}`,
  });

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

  async function finish(finalGuesses: string[], won: boolean) {
    const elapsedMs = timer.freeze();
    if (!monthly) markBoardPlayed(dateKey, "wordle", difficulty, seasonId);
    const timeLabel = formatDuration(elapsedMs);

    if (monthly) {
      if (!won) {
        setRevealAnswer(config.answer);
        setResults({ won: false, elapsedMs, answer: config.answer, definition: config.definition });
        setStatus(`Out of guesses (${timeLabel}).`);
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
          answer: config.answer,
          definition: config.definition,
          coinsEarned: mres.data.coinsEarned,
          coinBalance: mres.data.coinBalance,
        });
        if (typeof mres.data.coinBalance === "number") {
          emitCoinBalance(mres.data.coinBalance);
        }
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
          forfeit: !won && finalGuesses.length < config.maxGuesses,
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
            {!config.categoryTitle && <> · {DIFFICULTY_LABELS[difficulty]}</>}
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
        </div>
      )}

      {!done && !alreadyPlayed && (
        <CoinConsumableBar
          signedIn={signedIn}
          disabled={submitting}
          onHint={() => {
            const letter = config.answer[guesses.length % config.wordLength]!;
            setHintText(
              `Letter ${((guesses.length % config.wordLength) + 1)} is “${letter.toUpperCase()}”.`,
            );
          }}
          onExtraAttempt={() => setBonusGuesses((n) => n + 1)}
          onSkip={() => {
            setDone(true);
            void finish(guesses, false);
          }}
        />
      )}

      {hintText && !done && (
        <p className="mt-2 text-sm text-mint">{hintText}</p>
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

      {results && (
        <div className="mt-4">
          <PlayResultsCard {...results} />
        </div>
      )}
    </div>
  );
}
