"use client";

import { useMemo, useRef, useState } from "react";
import type { Difficulty } from "@daily-puzzle/puzzle-core";
import {
  checkEscapeAnswer,
  getEscapeRoom,
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
import type { ScoreBreakdown } from "@daily-puzzle/puzzle-core";

type Props = {
  difficulty: Difficulty;
  dateKey?: string;
  alreadyPlayed?: { score: number; won: boolean } | null;
  signedIn: boolean;
  monthly?: MonthlyPlayContext | null;
  pack?: "standard" | "exclusive" | "premium";
  seasonId?: string | null;
};

export function EscapeGame({
  difficulty,
  dateKey = todayKey(),
  alreadyPlayed,
  signedIn,
  monthly = null,
  pack = "standard",
  seasonId = null,
}: Props) {
  const router = useRouter();
  const room = useMemo(
    () => getEscapeRoom(dateKey, difficulty, pack, seasonId),
    [dateKey, difficulty, pack, seasonId],
  );

  const [code, setCode] = useState("");
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
    explanation?: string | null;
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

  const maxAttempts = room.maxAttempts + bonusAttempts;

  const escapeHintLadder = useMemo(() => {
    const steps = room.clues.map(
      (clue) =>
        `Re-read “${clue.label}” carefully — something there still matters.`,
    );
    if (difficulty === "easy") {
      steps.push("The lock usually wants numbers more than letters.");
      steps.push("Follow the evidence order; ignore numbers that don’t fit the story.");
    } else {
      steps.push("Synthesize the essentials — decoys are meant to look useful.");
      steps.push("Nothing in the evidence should hand you the finished code.");
    }
    return steps;
  }, [room.clues, difficulty]);

  function applyEscapeHint() {
    const n = hintStepRef.current;
    if (n >= escapeHintLadder.length) return;
    const next = escapeHintLadder[n]!;
    hintStepRef.current = n + 1;
    setUnlockedHints((prev) => [...prev, next]);
  }

  async function finish(opts: {
    won: boolean;
    attemptsUsed: number;
    code: string;
    outcome?: "skipped" | "failed";
  }) {
    const elapsedMs = timer.freeze();
    if (!monthly) markBoardPlayed(dateKey, "escape", difficulty, pack === "premium" ? "plus" : seasonId);
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
            answer: room.answer,
            explanation: room.explanation,
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
            code: opts.code,
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
            answer: room.answer,
            explanation: room.explanation,
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
        setResults({ won: true, elapsedMs, answer: room.answer, explanation: room.explanation });
        setStatus("Unlocked! Sign in to save Case File progress.");
        return;
      }
      setSubmitting(true);
      try {
        const mres = await submitMonthlyFromGame(monthly, {
          code: opts.code,
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
          answer: room.answer,
          explanation: room.explanation,
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
        answer: room.answer,
        explanation: room.explanation,
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
          puzzleType: "escape",
          difficulty,
          dateKey,
          code: opts.won ? opts.code : opts.code || undefined,
          attemptsUsed: Math.max(1, opts.attemptsUsed),
          forfeit: !opts.won,
          elapsedMs,
          seasonId: seasonId || undefined,
          premium: pack === "premium" || undefined,
        }),
      });
      const data = await res.json();
      if (!res.ok && res.status !== 400) {
        setStatus(data.error ?? "Could not save");
        return;
      }
      if (!res.ok) {
        setStatus(data.error ?? "Incorrect");
        return;
      }
      setDone(true);
      setResults({
        won: Boolean(data.won),
        outcomeLabel: data.won
          ? undefined
          : opts.outcome === "skipped"
            ? "Skipped"
            : "Out of attempts",
        elapsedMs: data.elapsedMs ?? elapsedMs,
        score: data.score,
        streak: data.streak,
        breakdown: data.breakdown,
        ranks: data.ranks,
        answer: data.answer ?? room.answer,
        explanation: data.explanation ?? room.explanation,
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
      if (typeof data.coinBalance === "number") emitCoinBalance(data.coinBalance);
      setStatus(null);
      router.refresh();
    } catch {
      setStatus("Network error saving result");
    } finally {
      setSubmitting(false);
    }
  }

  async function tryCode() {
    if (done || submitting) return;
    const nextAttempts = attempts + 1;
    setAttempts(nextAttempts);
    const verdict = checkEscapeAnswer(room, code);

    if (verdict.correct) {
      setDone(true);
      await finish({ won: true, attemptsUsed: nextAttempts, code });
      return;
    }

    if (nextAttempts >= maxAttempts) {
      setDone(true);
      await finish({ won: false, attemptsUsed: nextAttempts, code });
      return;
    }

    setStatus(
      `Not quite. ${maxAttempts - nextAttempts} attempt${
        maxAttempts - nextAttempts === 1 ? "" : "s"
      } left.`,
    );
  }

  return (
    <div className="mx-auto max-w-2xl animate-rise space-y-6">
      <div className="flex items-end justify-between gap-4">
        <div>
          <p className="text-xs uppercase tracking-[0.22em] text-ember">
            <Link
              href="/#escape-room"
              className="transition-colors hover:text-paper hover:underline"
            >
              Escape Room
            </Link>{" "}
            · <DifficultyLabel difficulty={difficulty} />
          </p>
          <h1 className="mt-1 font-[family-name:var(--font-display)] text-3xl font-bold">
            {room.title}
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

      <p className="rounded-2xl border border-[var(--line)] bg-panel/60 p-5 leading-relaxed">
        {room.briefing}
      </p>

      <section className="space-y-3">
        <h2 className="font-[family-name:var(--font-display)] text-xl font-bold">
          Evidence
        </h2>
        {room.clues.map((clue) => (
          <div
            key={clue.id}
            className="rounded-xl border border-[var(--line)] bg-ink-2/80 p-4"
          >
            <div className="text-xs uppercase tracking-wider text-ember">
              {clue.label}
            </div>
            <p className="mt-2 text-sm leading-relaxed">{clue.text}</p>
          </div>
        ))}
      </section>

      <section className="rounded-2xl border border-[var(--line)] bg-panel/50 p-5">
        <p className="font-semibold">{room.prompt}</p>
        <p className="mt-1 text-xs text-fog">
          Attempts {attempts}/{maxAttempts}
        </p>
        {!done && (
          <div className="mt-4 flex flex-col gap-2 sm:flex-row">
            <input
              value={code}
              onChange={(e) => setCode(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") void tryCode();
              }}
              placeholder={room.placeholder}
              className="flex-1 rounded-lg border border-[var(--line)] bg-ink-2 px-3 py-3 tracking-[0.35em] outline-none ring-ember/40 focus:ring-2"
              autoFocus
              disabled={submitting}
            />
            <button
              type="button"
              onClick={() => void tryCode()}
              disabled={!code.trim() || submitting}
              className="rounded-lg bg-ember px-5 py-3 font-semibold text-on-ember hover:bg-ember-deep disabled:opacity-50"
            >
              Try code
            </button>
          </div>
        )}
        {!done && !alreadyPlayed && (
          <CoinConsumableBar
            signedIn={signedIn}
            disabled={submitting}
            canUseHint={unlockedHints.length < escapeHintLadder.length}
            onHint={applyEscapeHint}
            onExtraAttempt={() => setBonusAttempts((n) => n + 1)}
            onSkip={() => {
              void finish({
                won: false,
                attemptsUsed: Math.max(1, attempts),
                code: code.trim() || "",
                outcome: "skipped",
              });
            }}
          />
        )}
        {unlockedHints.length > 0 && !done && (
          <ul className="mt-3 space-y-1.5 text-sm text-mint">
            {unlockedHints.map((hint, i) => (
              <li key={`escape-hint-${i}`}>
                <span className="text-fog">Hint {i + 1}: </span>
                {hint}
              </li>
            ))}
          </ul>
        )}
      </section>

      {status && (
        <p className="rounded-xl border border-[var(--line)] bg-panel/70 px-4 py-3 text-sm">
          {status}
        </p>
      )}
      <ShowAnswerPanel
        available={Boolean(alreadyPlayed)}
        answer={room.answer}
        detail={room.explanation}
      />

      {results && <PlayResultsCard {...results} />}
    </div>
  );
}
