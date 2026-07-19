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
  checkCryptogramAnswer,
  cryptogramHintDisplay,
  cryptogramSlots,
  getCryptogramPuzzle,
  todayKey,
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
  const [hintedLetters, setHintedLetters] = useState<string[]>([]);
  const [bonusAttempts, setBonusAttempts] = useState(0);
  const [coinHint, setCoinHint] = useState<string | null>(null);
  const inputRefs = useRef<Array<HTMLInputElement | null>>([]);

  const [attempts, setAttempts] = useState(0);
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
  const maxAttempts = puzzle.maxAttempts + bonusAttempts;
  const lockedLetters = useMemo(() => {
    const set = new Set(puzzle.revealed.map((ch) => ch.toLowerCase()));
    for (const ch of hintedLetters) set.add(ch.toLowerCase());
    return set;
  }, [puzzle.revealed, hintedLetters]);
  function isLocked(slotIndex: number): boolean {
    const slot = slots[slotIndex];
    return Boolean(slot && lockedLetters.has(slot.letter));
  }
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
      if (!isLocked(i)) {
        inputRefs.current[i]?.focus();
        return;
      }
      i += direction;
    }
  }

  function setLetterAt(index: number, value: string) {
    if (isLocked(index)) return;
    const ch = value.toLowerCase().replace(/[^a-z]/g, "").slice(-1);
    setLetters((prev) => {
      const next = [...prev];
      next[index] = ch;
      return next;
    });
    if (ch) focusEditable(index, 1);
  }

  function revealHintLetter() {
    const pool = [
      ...new Set(
        slots
          .map((slot) => slot.letter)
          .filter((ch) => !lockedLetters.has(ch)),
      ),
    ];
    if (pool.length === 0) {
      setCoinHint("Every letter is already revealed.");
      return;
    }
    const pick = pool[0]!;
    setHintedLetters((prev) => [...prev, pick]);
    setLetters((prev) =>
      prev.map((ch, i) => (slots[i]!.letter === pick ? pick : ch)),
    );
    setCoinHint(`Revealed “${pick.toUpperCase()}” everywhere it appears.`);
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

  async function finish(opts: {
    won: boolean;
    attemptsUsed: number;
    answer: string;
    outcome?: "skipped" | "failed";
  }) {
    const elapsedMs = timer.freeze();
    if (!monthly) markBoardPlayed(dateKey, "cryptogram", difficulty);
    const timeLabel = formatDuration(elapsedMs);

    if (monthly) {
      if (!opts.won) {
        const outcome = opts.outcome ?? "failed";
        if (!signedIn) {
          setDone(true);
          setResults({
            won: false,
            outcomeLabel: outcome === "skipped" ? "Skipped" : "Out of attempts",
            elapsedMs,
            answer: puzzle.plaintext,
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
            answer: opts.answer,
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
            answer: puzzle.plaintext,
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
        setResults({ won: true, elapsedMs, score: mres.data.score,
          breakdown: mres.data.breakdown, answer: puzzle.plaintext });
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
        answer: data.answer ?? puzzle.plaintext,
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

  function submit() {
    if (done || submitting) return;
    if (letters.some((ch, i) => !isLocked(i) && !ch)) {
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

    if (nextAttempts >= maxAttempts) {
      void finish({ won: false, attemptsUsed: nextAttempts, answer: guess });
      return;
    }

    setStatus(
      `Not the phrase · ${maxAttempts - nextAttempts} attempt${
        maxAttempts - nextAttempts === 1 ? "" : "s"
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
            · <DifficultyLabel difficulty={difficulty} />
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
              className="flex flex-wrap items-end gap-x-2.5 gap-y-3"
            >
              {word.slotIndexes.map((slotIndex) => {
                const slot = slots[slotIndex]!;
                const value = letters[slotIndex] ?? "";
                const locked = isLocked(slotIndex);
                const underline = hintedLetters.includes(slot.letter)
                  ? "border-mint/50"
                  : locked
                    ? "border-paper/35"
                    : "border-ember/55";
                const glyph = locked
                  ? hintedLetters.includes(slot.letter)
                    ? "text-mint"
                    : "text-paper"
                  : "text-ember";
                return (
                  <span
                    key={slotIndex}
                    className={[
                      // Border lives on the wrapper so descenders (g/y/p/q)
                      // are never clipped by the input’s fixed content box.
                      "inline-flex w-9 flex-col items-center border-b-2",
                      underline,
                    ].join(" ")}
                  >
                    {locked ? (
                      <span
                        className={[
                          "flex min-h-11 w-full items-center justify-center overflow-visible px-0.5 pb-1.5 pt-1 font-[family-name:var(--font-display)] text-2xl font-semibold lowercase leading-[1.5]",
                          glyph,
                        ].join(" ")}
                      >
                        {slot.letter}
                      </span>
                    ) : (
                      <input
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
                        className={[
                          "min-h-11 w-full appearance-none border-0 bg-transparent px-0.5 pb-1.5 pt-1 text-center font-[family-name:var(--font-display)] text-2xl font-semibold lowercase leading-[1.5] outline-none placeholder:text-fog/40 disabled:opacity-60",
                          glyph,
                        ].join(" ")}
                        placeholder="_"
                      />
                    )}
                  </span>
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

      {!done && !alreadyPlayed && (
        <CoinConsumableBar
          signedIn={signedIn}
          disabled={submitting}
          canUseHint={slots.some((slot) => !lockedLetters.has(slot.letter))}
          onHint={revealHintLetter}
          onExtraAttempt={() => setBonusAttempts((n) => n + 1)}
          onSkip={() => {
            void finish({
              won: false,
              attemptsUsed: Math.max(1, attempts),
              answer: "",
              outcome: "skipped",
            });
          }}
        />
      )}

      {coinHint && !done && (
        <p className="mt-2 text-sm text-mint">{coinHint}</p>
      )}

      <p className="mt-2 text-xs text-fog">
        Attempts {attempts}/{maxAttempts}
      </p>
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
