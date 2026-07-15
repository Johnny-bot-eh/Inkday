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
};

export function WordleGame({
  difficulty,
  dateKey = todayKey(),
  alreadyPlayed,
  signedIn,
}: Props) {
  const router = useRouter();
  const config = useMemo(
    () => getWordleConfig(dateKey, difficulty),
    [dateKey, difficulty],
  );

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
    const exhausted = nextGuesses.length >= config.maxGuesses;
    if (won || exhausted) {
      setDone(true);
      void finish(nextGuesses, won);
    } else {
      setStatus(null);
    }
  }

  async function finish(finalGuesses: string[], won: boolean) {
    const elapsedMs = timer.freeze();
    const timeLabel = formatDuration(elapsedMs);

    if (!signedIn) {
      setRevealAnswer(config.answer);
      setResults({
        won,
        elapsedMs,
        answer: config.answer,
      });
      setStatus(
        won
          ? `Solved in ${timeLabel}! Sign in to save your score.`
          : `Out of guesses (${timeLabel}). Answer: ${config.answer}`,
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

  const rows = Array.from({ length: config.maxGuesses }, (_, i) => {
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
    <div className="mx-auto max-w-lg animate-rise">
      <div className="mb-6 flex items-end justify-between gap-4">
        <div>
          <p className="text-xs uppercase tracking-[0.22em] text-ember">
            {wordleTitle(difficulty)} · {DIFFICULTY_LABELS[difficulty]}
          </p>
          <h1 className="mt-1 font-[family-name:var(--font-display)] text-3xl font-bold">
            {config.wordLength}-letter{" "}
            {wordleTitle(difficulty) === "Word Daily" ? "day" : "board"}
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

      {status && (
        <p className="mt-4 rounded-lg border border-[var(--line)] bg-panel/60 px-4 py-3 text-sm">
          {status}
          {revealAnswer && done && !results ? (
            <span className="mt-1 block text-fog">Answer: {revealAnswer}</span>
          ) : null}
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
