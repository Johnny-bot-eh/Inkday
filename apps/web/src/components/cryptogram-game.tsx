"use client";

import {
  useEffect,
  useMemo,
  useRef,
  useState,
  type KeyboardEvent,
} from "react";
import type { Difficulty, ScoreBreakdown } from "@daily-puzzle/puzzle-core";
import {
  DIFFICULTY_LABELS,
  checkCryptogramAnswer,
  cryptogramHintDisplay,
  cryptogramSlots,
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
import { ShowAnswerPanel } from "@/components/show-answer-panel";

type Props = {
  difficulty: Difficulty;
  dateKey?: string;
  alreadyPlayed?: { score: number; won: boolean } | null;
  signedIn: boolean;
  monthly?: MonthlyPlayContext | null;
};

type WordLayout = {
  /** Indices into the letter-slot array for this word */
  slotIndexes: number[];
};

function buildWordLayout(plaintext: string): WordLayout[] {
  const words = plaintext.trim().split(/\s+/);
  const layout: WordLayout[] = [];
  let cursor = 0;
  for (const word of words) {
    const letters = word
      .split("")
      .filter((ch) => {
        const lower = ch.toLowerCase();
        return lower >= "a" && lower <= "z";
      });
    const slotIndexes = letters.map((_, i) => cursor + i);
    cursor += letters.length;
    layout.push({ slotIndexes });
  }
  return layout;
}

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
  const slots = useMemo(() => cryptogramSlots(puzzle), [puzzle]);
  const wordLayout = useMemo(
    () => buildWordLayout(puzzle.plaintext),
    [puzzle.plaintext],
  );
  const blankPattern = useMemo(() => cryptogramHintDisplay(puzzle), [puzzle]);

  const [letters, setLetters] = useState<string[]>(() =>
    slots.map((slot) => (slot.revealed ? slot.letter : "")),
  );
  const inputRefs = useRef<Array<HTMLInputElement | null>>([]);

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

  useEffect(() => {
    setLetters(slots.map((slot) => (slot.revealed ? slot.letter : "")));
  }, [slots]);

  function assembleGuess(nextLetters: string[]): string {
    let cursor = 0;
    return puzzle.plaintext
      .split("")
      .map((ch) => {
        const lower = ch.toLowerCase();
        if (lower < "a" || lower > "z") return ch;
        const filled = nextLetters[cursor] ?? "";
        cursor += 1;
        return filled || "_";
      })
      .join("");
  }

  function focusEditable(from: number, direction: 1 | -1) {
    let i = from + direction;
    while (i >= 0 && i < slots.length) {
      if (!slots[i]!.revealed) {
        inputRefs.current[i]?.focus();
        return;
      }
      i += direction;
    }
  }

  function setLetterAt(index: number, value: string) {
    if (slots[index]?.revealed) return;
    const ch = value.toLowerCase().replace(/[^a-z]/g, "").slice(-1);
    setLetters((prev) => {
      const next = [...prev];
      next[index] = ch;
      return next;
    });
    if (ch) focusEditable(index, 1);
  }

  function onKeyDown(index: number, event: KeyboardEvent<HTMLInputElement>) {
    if (event.key === "Backspace") {
      if (letters[index]) {
        setLetterAt(index, "");
      } else {
        event.preventDefault();
        focusEditable(index, -1);
      }
      return;
    }
    if (event.key === "ArrowLeft") {
      event.preventDefault();
      focusEditable(index, -1);
      return;
    }
    if (event.key === "ArrowRight") {
      event.preventDefault();
      focusEditable(index, 1);
    }
  }

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
          ? `Solved in ${timeLabel}! Sign in to save.`
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

  function submit() {
    if (done || submitting) return;
    if (letters.some((ch, i) => !slots[i]!.revealed && !ch)) {
      setStatus("Fill every blank first.");
      return;
    }
    const guess = assembleGuess(letters);
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
      <div className="mb-8 flex items-end justify-between gap-4">
        <div>
          <p className="text-xs uppercase tracking-[0.22em] text-ember">
            <Link
              href="/#cryptogram-puzzles"
              className="transition-colors hover:text-paper hover:underline"
            >
              Cryptogram
            </Link>{" "}
            · {DIFFICULTY_LABELS[difficulty]}
          </p>
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

      <div className="space-y-8">
        <div>
          <p className="text-xs uppercase tracking-[0.2em] text-fog">Theme</p>
          <h1 className="mt-2 font-[family-name:var(--font-display)] text-4xl font-bold leading-[1.15] tracking-tight text-paper">
            {puzzle.theme}
          </h1>
          <p className="mt-4 max-w-md text-lg leading-relaxed text-fog">
            {puzzle.clue}
          </p>
        </div>

        <div
          className="flex flex-wrap items-end gap-x-8 gap-y-5"
          aria-label={`Phrase blanks: ${blankPattern}`}
        >
          {wordLayout.map((word, wordIndex) => (
            <div
              key={`word-${wordIndex}`}
              className="flex flex-wrap items-end gap-x-2.5 gap-y-2"
            >
              {word.slotIndexes.map((slotIndex) => {
                const slot = slots[slotIndex]!;
                const value = letters[slotIndex] ?? "";
                if (slot.revealed) {
                  return (
                    <span
                      key={slotIndex}
                      className="inline-flex h-11 w-8 items-end justify-center border-b border-paper/35 pb-1 font-[family-name:var(--font-display)] text-2xl font-semibold lowercase text-paper"
                    >
                      {slot.letter}
                    </span>
                  );
                }
                return (
                  <input
                    key={slotIndex}
                    ref={(el) => {
                      inputRefs.current[slotIndex] = el;
                    }}
                    type="text"
                    inputMode="text"
                    autoComplete="off"
                    autoCapitalize="none"
                    spellCheck={false}
                    maxLength={1}
                    value={value}
                    disabled={done || submitting}
                    onChange={(e) => setLetterAt(slotIndex, e.target.value)}
                    onKeyDown={(e) => onKeyDown(slotIndex, e)}
                    onFocus={(e) => e.target.select()}
                    aria-label={`Letter ${slotIndex + 1}`}
                    className="h-11 w-8 border-0 border-b border-ember/55 bg-transparent pb-1 text-center font-[family-name:var(--font-display)] text-2xl font-semibold lowercase text-ember outline-none transition-[border-color] placeholder:text-fog/40 focus:border-ember disabled:opacity-60"
                    placeholder="_"
                  />
                );
              })}
            </div>
          ))}
        </div>

        <p className="text-sm text-fog/80">{puzzle.hint}</p>
      </div>

      {!done && (
        <div className="mt-8">
          <button
            type="button"
            onClick={submit}
            disabled={submitting}
            className="rounded-lg bg-ember px-4 py-2.5 font-semibold text-on-ember hover:bg-ember-deep disabled:opacity-60"
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
      <ShowAnswerPanel
        available={Boolean(alreadyPlayed)}
        answer={puzzle.plaintext}
        detail={`Theme: ${puzzle.theme} — ${puzzle.clue}`}
      />

      {results && (
        <div className="mt-4">
          <PlayResultsCard {...results} />
        </div>
      )}
    </div>
  );
}
