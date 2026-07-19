"use client";

import { useMemo, useRef, useState } from "react";
import type { Difficulty, GridMark } from "@daily-puzzle/puzzle-core";
import {
  cellKey,
  emptyLogicGrid,
  getLogicPuzzle,
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
import type { ScoreBreakdown } from "@daily-puzzle/puzzle-core";

type Props = {
  difficulty: Difficulty;
  dateKey?: string;
  alreadyPlayed?: { score: number; won: boolean } | null;
  signedIn: boolean;
  monthly?: MonthlyPlayContext | null;
  seasonId?: string | null;
  premium?: boolean;
};

const CYCLE: GridMark[] = ["unknown", "yes", "no"];

export function LogicGame({
  difficulty,
  dateKey = todayKey(),
  alreadyPlayed,
  signedIn,
  monthly = null,
  seasonId = null,
  premium = false,
}: Props) {
  const router = useRouter();
  const puzzle = useMemo(
    () => getLogicPuzzle(dateKey, difficulty, seasonId ?? (premium ? "plus" : null)),
    [dateKey, difficulty, seasonId, premium],
  );

  const [grid, setGrid] = useState(() => emptyLogicGrid(puzzle));
  const [gridHistory, setGridHistory] = useState<
    Array<Record<string, GridMark>>
  >([]);
  const [answer, setAnswer] = useState("");
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
  const maxAttempts = 3 + bonusAttempts;
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

  const logicHintLadder = useMemo(() => {
    const steps = puzzle.clues.map((clue, i) => `Clue ${i + 1}: ${clue}`);
    const subjectByName = puzzle.subjects.values.find(
      (name) => name.toLowerCase() === puzzle.answer.toLowerCase(),
    );
    const subjectByPlace = puzzle.subjects.values.find((name) =>
      Object.values(puzzle.solution[name] ?? {}).some(
        (v) => v.toLowerCase() === puzzle.answer.toLowerCase(),
      ),
    );
    const subject = subjectByName ?? subjectByPlace;
    const trait = puzzle.traits[0];
    if (subject && trait) {
      const row = puzzle.solution[subject];
      if (row) {
        steps.push(
          `Focus: ${subject}’s ${trait.label.toLowerCase()} is ${row[trait.id]}.`,
        );
      }
    }
    return steps;
  }, [puzzle]);

  function applyLogicHint() {
    const n = hintStepRef.current;
    if (n >= logicHintLadder.length) return;
    const next = logicHintLadder[n]!;
    hintStepRef.current = n + 1;
    setUnlockedHints((prev) => [...prev, next]);
  }
  function cycleCell(subject: string, traitId: string, value: string) {
    if (done) return;
    const key = cellKey(subject, traitId, value);
    const current = grid[key] ?? "unknown";
    const next = CYCLE[(CYCLE.indexOf(current) + 1) % CYCLE.length]!;

    setGridHistory((hist) => [...hist.slice(-79), grid]);
    setGrid((prev) => {
      const updated = { ...prev, [key]: next };
      if (next === "yes") {
        // Clear other values on the same subject×trait row
        for (const other of puzzle.traits.find((t) => t.id === traitId)?.values ?? []) {
          if (other === value) continue;
          updated[cellKey(subject, traitId, other)] = "no";
        }
        // Clear other subjects for this trait value
        for (const otherSubject of puzzle.subjects.values) {
          if (otherSubject === subject) continue;
          updated[cellKey(otherSubject, traitId, value)] = "no";
        }
      }
      return updated;
    });
  }

  /** Right-click / secondary click: mark or clear a red × (rule-out). */
  function markNoCell(subject: string, traitId: string, value: string) {
    if (done) return;
    const key = cellKey(subject, traitId, value);
    const current = grid[key] ?? "unknown";
    const next: GridMark = current === "no" ? "unknown" : "no";
    setGridHistory((hist) => [...hist.slice(-79), grid]);
    setGrid((prev) => ({ ...prev, [key]: next }));
  }

  function undoGrid() {
    if (done || gridHistory.length === 0) return;
    const prev = gridHistory[gridHistory.length - 1]!;
    setGridHistory((hist) => hist.slice(0, -1));
    setGrid(prev);
  }

  function markLabel(mark: GridMark): string {
    if (mark === "yes") return "●";
    if (mark === "no") return "×";
    return "";
  }

  async function finishLogic(opts: {
    won: boolean;
    answer: string;
    attemptsUsed: number;
    outcome?: "skipped" | "failed";
  }) {
    const elapsedMs = timer.freeze();
    if (!monthly) {
      markBoardPlayed(
        dateKey,
        "logic",
        difficulty,
        seasonId ?? (premium ? "plus" : null),
      );
    }
    const timeLabel = formatDuration(elapsedMs);
    const correct = opts.won;
    const outcomeLabel = correct
      ? undefined
      : opts.outcome === "skipped"
        ? "Skipped"
        : "Out of attempts";

    if (monthly) {
      if (!correct) {
        const outcome = opts.outcome ?? "failed";
        if (!signedIn) {
          setDone(true);
          setResults({
            won: false,
            outcomeLabel,
            elapsedMs,
            answer: puzzle.answer,
            explanation: puzzle.explanation,
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
            attemptsUsed: opts.attemptsUsed,
            elapsedMs,
          });
          if (!mres.ok) {
            setStatus(mres.data.error ?? "Could not save");
            return;
          }
          setDone(true);
          setResults({
            won: false,
            outcomeLabel,
            elapsedMs,
            answer: puzzle.answer,
            explanation: puzzle.explanation,
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
        setResults({
          won: true,
          elapsedMs,
          answer: puzzle.answer,
          explanation: puzzle.explanation,
        });
        setStatus("Cleared! Sign in to save Case File progress.");
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
          answer: puzzle.answer,
          explanation: puzzle.explanation,
        });
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
        won: correct,
        outcomeLabel,
        elapsedMs,
        answer: puzzle.answer,
        explanation: puzzle.explanation,
      });
      setStatus(
        correct
          ? `Cleared in ${timeLabel}. Sign in to save points.`
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
          puzzleType: "logic",
          difficulty,
          dateKey,
          answer: correct ? opts.answer : opts.answer || undefined,
          attemptsUsed: Math.max(1, opts.attemptsUsed),
          forfeit: !correct,
          elapsedMs,
          seasonId: seasonId || undefined,
          premium: premium || undefined,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setStatus(data.error ?? "Could not save");
        return;
      }
      setDone(true);
      setResults({
        won: Boolean(data.won),
        outcomeLabel: data.won ? undefined : outcomeLabel,
        elapsedMs: data.elapsedMs ?? elapsedMs,
        score: data.score,
        streak: data.streak,
        breakdown: data.breakdown,
        ranks: data.ranks,
        answer: data.answer ?? puzzle.answer,
        explanation: data.explanation ?? puzzle.explanation,
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

  function submitAnswer() {
    if (!answer || done || submitting) return;
    const correct =
      answer.trim().toLowerCase() === puzzle.answer.trim().toLowerCase();
    const nextAttempts = attempts + 1;
    setAttempts(nextAttempts);

    if (correct) {
      void finishLogic({ won: true, answer, attemptsUsed: nextAttempts });
      return;
    }

    // Wrong guesses stay private until the last try — no solution yet.
    if (nextAttempts >= maxAttempts) {
      void finishLogic({
        won: false,
        answer,
        attemptsUsed: nextAttempts,
        outcome: "failed",
      });
      return;
    }

    setStatus(
      `Not quite · ${maxAttempts - nextAttempts} attempt${
        maxAttempts - nextAttempts === 1 ? "" : "s"
      } left`,
    );
  }

  function revealLogicHint() {
    applyLogicHint();
  }

  return (
    <div className="mx-auto max-w-3xl animate-rise space-y-6">
      <div className="flex items-end justify-between gap-4">
        <div>
          <p className="text-xs uppercase tracking-[0.22em] text-ember">
            <Link
              href="/#logic-grid"
              className="transition-colors hover:text-paper hover:underline"
            >
              Logic Grid
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

      <p className="rounded-2xl border border-[var(--line)] bg-panel/60 p-5 leading-relaxed">
        {puzzle.synopsis}
      </p>

      <section>
        <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
          <h2 className="font-[family-name:var(--font-display)] text-xl font-bold">
            Clues
          </h2>
          {!done ? (
            <button
              type="button"
              onClick={undoGrid}
              disabled={gridHistory.length === 0}
              className="rounded-lg border border-[var(--line)] px-3 py-1.5 text-sm text-fog hover:text-paper disabled:opacity-40"
            >
              Undo
            </button>
          ) : null}
        </div>
        <ol className="mt-3 list-decimal space-y-2 pl-5 text-sm leading-relaxed text-paper/95">
          {puzzle.clues.map((clue) => (
            <li key={clue}>{clue}</li>
          ))}
        </ol>
      </section>

      {puzzle.traits.map((trait) => (
        <section key={trait.id} className="overflow-x-auto">
          <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
            <h3 className="text-sm font-semibold uppercase tracking-wider text-fog">
              {puzzle.subjects.label} × {trait.label}
            </h3>
            {!done && trait.id === puzzle.traits[0]?.id ? (
              <button
                type="button"
                onClick={undoGrid}
                disabled={gridHistory.length === 0}
                className="rounded-lg border border-[var(--line)] px-3 py-1.5 text-sm text-fog hover:text-paper disabled:opacity-40"
              >
                Undo
              </button>
            ) : null}
          </div>
          <table className="w-full min-w-[320px] border-collapse text-center text-sm">
            <thead>
              <tr>
                <th className="border border-[var(--line)] bg-ink-2 px-2 py-2 text-left text-xs text-fog">
                  {puzzle.subjects.label}
                </th>
                {trait.values.map((value) => (
                  <th
                    key={value}
                    className="border border-[var(--line)] bg-ink-2 px-2 py-2 text-xs font-semibold"
                  >
                    {value}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {puzzle.subjects.values.map((subject) => (
                <tr key={subject}>
                  <th className="border border-[var(--line)] bg-ink-2 px-2 py-2 text-left font-medium">
                    {subject}
                  </th>
                  {trait.values.map((value) => {
                    const mark = grid[cellKey(subject, trait.id, value)] ?? "unknown";
                    return (
                      <td
                        key={value}
                        className="border border-[var(--line)] p-0"
                      >
                        <button
                          type="button"
                          disabled={done}
                          onClick={() => cycleCell(subject, trait.id, value)}
                          onContextMenu={(e) => {
                            e.preventDefault();
                            markNoCell(subject, trait.id, value);
                          }}
                          className={[
                            "flex h-10 w-full items-center justify-center transition",
                            mark === "yes" && "bg-mint/25 text-mint",
                            mark === "no" && "bg-danger/15 text-danger",
                            mark === "unknown" && "hover:bg-white/5",
                          ]
                            .filter(Boolean)
                            .join(" ")}
                          aria-label={`${subject} ${trait.label} ${value}: ${mark}. Left-click to cycle; right-click for ×.`}
                        >
                          {markLabel(mark)}
                        </button>
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
          <p className="mt-2 text-xs text-fog">
            Left-click / tap cycles blank → yes (●) → no (×). Right-click (or
            two-finger click) marks a red × to rule a cell out.
          </p>
        </section>
      ))}

      <section className="rounded-2xl border border-[var(--line)] bg-panel/50 p-5">
        <p className="font-semibold">{puzzle.question}</p>
        <p className="mt-1 text-xs text-fog">
          Attempts {attempts}/{maxAttempts}
        </p>
        {!done && (
          <div className="mt-4 flex flex-col gap-2 sm:flex-row">
            <select
              value={answer}
              onChange={(e) => setAnswer(e.target.value)}
              className="flex-1 rounded-lg border border-[var(--line)] bg-ink-2 px-3 py-3 outline-none ring-ember/40 focus:ring-2"
              disabled={submitting}
            >
              <option value="">{puzzle.answerPrompt}</option>
              {puzzle.answerChoices.map((name) => (
                <option key={name} value={name}>
                  {name}
                </option>
              ))}
            </select>
            <button
              type="button"
              onClick={() => submitAnswer()}
              disabled={!answer || submitting}
              className="rounded-lg bg-ember px-5 py-3 font-semibold text-on-ember hover:bg-ember-deep disabled:opacity-50"
            >
              Submit
            </button>
          </div>
        )}
        {!done && !alreadyPlayed && (
          <CoinConsumableBar
            signedIn={signedIn}
            disabled={submitting}
            canUseHint={unlockedHints.length < logicHintLadder.length}
            onHint={revealLogicHint}
            onExtraAttempt={() => setBonusAttempts((n) => n + 1)}
            onSkip={() => {
              void finishLogic({
                won: false,
                answer: answer || "",
                attemptsUsed: Math.max(1, attempts),
                outcome: "skipped",
              });
            }}
          />
        )}
        {unlockedHints.length > 0 && !done && (
          <ul className="mt-3 space-y-1.5 text-sm text-mint">
            {unlockedHints.map((hint, i) => (
              <li key={`logic-hint-${i}`}>
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
        answer={puzzle.answer}
        detail={puzzle.explanation}
      />

      {results && <PlayResultsCard {...results} />}
    </div>
  );
}
