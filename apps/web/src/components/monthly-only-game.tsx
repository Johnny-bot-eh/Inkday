"use client";

import { clearMonthlyPlayerNotes } from "@/lib/player-notes";
import { useEffect, useMemo, useRef, useState } from "react";
import type { Difficulty, MonthlyOnlyPuzzle, ScoreBreakdown, CosmeticUnlockNotice } from "@daily-puzzle/puzzle-core";
import {
  checkMonthlyOnlyAnswer,
  getMonthlyOnlyExplanation,
  getMonthlyOnlyPuzzle,
  monthlyAnswerLabel,
  type MonthlyOnlyType,
} from "@daily-puzzle/puzzle-core";
import { useRouter } from "next/navigation";
import { CaseFileBackLink } from "@/components/case-file-back-link";
import { CoinConsumableBar } from "@/components/coin-consumable-bar";
import { DifficultyLabel } from "@/components/difficulty-label";
import { PlayResultsCard } from "@/components/play-results-card";
import { PlayTimer, usePlayTimer } from "@/components/play-timer";

type Props = {
  collectionId: string;
  slotIndex: number;
  kind: MonthlyOnlyType;
  seedKey: string;
  difficulty: Difficulty;
  label: string;
  points: number;
  alreadyCleared: boolean;
  alreadyResolved?: boolean;
  priorOutcome?: "cleared" | "skipped" | "failed" | null;
  signedIn: boolean;
};

/** Escalating paid hints — each purchase unlocks the next rung. */
function buildHintLadder(
  puzzle: MonthlyOnlyPuzzle,
  opts: { includePackHint: boolean },
): string[] {
  switch (puzzle.kind) {
    case "riddle": {
      const ans = puzzle.answer.trim();
      const steps: string[] = [];
      if (
        opts.includePackHint &&
        puzzle.hint &&
        puzzle.hint !== "No further hints."
      ) {
        steps.push(puzzle.hint);
      }
      steps.push(
        `The answer has ${ans.length} letter${ans.length === 1 ? "" : "s"}.`,
      );
      steps.push(`Starts with “${ans[0]!.toUpperCase()}”.`);
      if (ans.length > 2) {
        steps.push(`Ends with “${ans[ans.length - 1]!.toUpperCase()}”.`);
      }
      if (ans.length > 3) {
        const pattern = ans
          .split("")
          .map((ch, i) => (i === 0 || i === ans.length - 1 ? ch : "_"))
          .join(" ");
        steps.push(`Outline: ${pattern}`);
      }
      if (ans.length > 4) {
        const shown = Math.min(3, ans.length - 1);
        steps.push(`Begins “${ans.slice(0, shown)}…”.`);
      }
      return steps;
    }
    case "mathlogic": {
      const ans = puzzle.answer.trim();
      return [
        `The answer is ${ans.length} character${ans.length === 1 ? "" : "s"} long.`,
        `Starts with “${ans[0]}”.`,
        ...(ans.length > 1 ? [`Ends with “${ans[ans.length - 1]}”.`] : []),
        puzzle.explanation,
      ];
    }
    case "trivia":
    case "pattern":
    case "deduction": {
      const wrong = puzzle.options
        .map((opt, i) => ({ opt, i }))
        .filter((row) => row.i !== puzzle.answerIndex)
        .map((row) => row.opt);
      const steps = wrong.map((opt) => `It isn’t “${opt}”.`);
      if (puzzle.kind === "deduction") {
        steps.push("Re-read the clues and eliminate impossibilities.");
      } else if (puzzle.kind === "pattern") {
        steps.push("Name the rule that turns each term into the next.");
      }
      steps.push(puzzle.explanation);
      return steps;
    }
    case "memory": {
      return puzzle.sequence.map(
        (symbol, i) =>
          `Symbol ${i + 1} of ${puzzle.sequence.length} is ${symbol}.`,
      );
    }
  }
}

const MONTHLY_BASE_ATTEMPTS = 3;

export function MonthlyOnlyGame({
  collectionId,
  slotIndex,
  kind,
  seedKey,
  difficulty,
  label,
  points,
  alreadyCleared,
  alreadyResolved = alreadyCleared,
  priorOutcome = alreadyCleared ? "cleared" : null,
  signedIn,
}: Props) {
  const router = useRouter();
  const puzzle = useMemo(
    () => getMonthlyOnlyPuzzle(kind, seedKey, difficulty),
    [kind, seedKey, difficulty],
  );
  const clearedAnswer = useMemo(() => monthlyAnswerLabel(puzzle), [puzzle]);
  const clearedExplanation = useMemo(
    () => getMonthlyOnlyExplanation(puzzle),
    [puzzle],
  );
  const showFreeHint = difficulty === "easy";
  const hintLadder = useMemo(
    () => buildHintLadder(puzzle, { includePackHint: !showFreeHint }),
    [puzzle, showFreeHint],
  );

  const [status, setStatus] = useState<string | null>(() => {
    if (alreadyCleared) return "Already cleared this month";
    if (priorOutcome === "skipped") return "Skipped — this slot is closed.";
    if (priorOutcome === "failed" || alreadyResolved) {
      return "Already finished — this slot is closed.";
    }
    return null;
  });
  const [done, setDone] = useState(alreadyResolved);
  const [skipped, setSkipped] = useState(priorOutcome === "skipped");
  const [failed, setFailed] = useState(
    priorOutcome === "failed" || (alreadyResolved && !alreadyCleared && priorOutcome !== "skipped"),
  );
  const [submitting, setSubmitting] = useState(false);
  const [bonusNote, setBonusNote] = useState<string | null>(null);
  const [attempts, setAttempts] = useState(0);
  const [bonusAttempts, setBonusAttempts] = useState(0);
  const [hintStep, setHintStep] = useState(0);
  const [unlockedHints, setUnlockedHints] = useState<string[]>([]);
  const hintStepRef = useRef(0);
  const [lastElapsedMs, setLastElapsedMs] = useState<number | null>(null);
  const [lastScore, setLastScore] = useState<number | null>(null);
  const [lastBreakdown, setLastBreakdown] = useState<ScoreBreakdown | null>(
    null,
  );
  const [lastCosmetics, setLastCosmetics] = useState<CosmeticUnlockNotice[]>(
    [],
  );

  const timer = usePlayTimer({
    running: !done && !alreadyResolved,
    resetKey: `${collectionId}-${slotIndex}`,
  });

  const maxAttempts = MONTHLY_BASE_ATTEMPTS + bonusAttempts;
  const canUseHint = hintStep < hintLadder.length;

  function applyMonthlyHint() {
    const n = hintStepRef.current;
    if (hintLadder.length === 0 || n >= hintLadder.length) return;
    const next = hintLadder[n]!;
    hintStepRef.current = n + 1;
    setHintStep(n + 1);
    setUnlockedHints((prev) => [...prev, next]);
  }

  async function forfeitSlot(outcome: "skipped" | "failed") {
    if (!signedIn) {
      clearMonthlyPlayerNotes(collectionId, slotIndex);
      if (outcome === "skipped") setSkipped(true);
      else setFailed(true);
      setDone(true);
      setStatus(
        outcome === "skipped"
          ? "Skipped — sign in next time to lock the slot."
          : "Out of attempts — puzzle not cleared.",
      );
      return;
    }
    setSubmitting(true);
    try {
      const res = await fetch("/api/monthly/submit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          collectionId,
          slotIndex,
          forfeit: true,
          outcome,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setStatus(data.error ?? "Could not save");
        return;
      }
      clearMonthlyPlayerNotes(collectionId, slotIndex);
      if (outcome === "skipped") setSkipped(true);
      else setFailed(true);
      setDone(true);
      setStatus(
        outcome === "skipped"
          ? "Skipped — this Case File slot is closed."
          : "Out of attempts — this Case File slot is closed.",
      );
      router.refresh();
    } catch {
      setStatus("Network error");
    } finally {
      setSubmitting(false);
    }
  }

  async function save(payload: {
    answer?: string;
    choiceIndex?: number;
    sequence?: string[];
  }) {
    if (done || submitting) return;
    const verdict = checkMonthlyOnlyAnswer(puzzle, payload);
    if (!verdict.correct) {
      const nextAttempts = attempts + 1;
      setAttempts(nextAttempts);
      if (nextAttempts >= maxAttempts) {
        await forfeitSlot("failed");
        return;
      }
      setStatus(
        `Not quite — ${maxAttempts - nextAttempts} attempt${
          maxAttempts - nextAttempts === 1 ? "" : "s"
        } left.`,
      );
      return;
    }

    if (!signedIn) {
      const elapsedMs = timer.freeze();
      clearMonthlyPlayerNotes(collectionId, slotIndex);
      setLastElapsedMs(elapsedMs);
      setDone(true);
      setStatus(`Cleared! Sign in to save Case File progress (+${points} pts).`);
      return;
    }

    setSubmitting(true);
    try {
      const elapsedMs = timer.freeze();
      setLastElapsedMs(elapsedMs);
      const res = await fetch("/api/monthly/submit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          collectionId,
          slotIndex,
          elapsedMs,
          ...payload,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setStatus(data.error ?? "Could not save");
        return;
      }
      clearMonthlyPlayerNotes(collectionId, slotIndex);
      setDone(true);
      if (typeof data.score === "number") setLastScore(data.score);
      if (data.breakdown) setLastBreakdown(data.breakdown);
      if (Array.isArray(data.newCosmetics) && data.newCosmetics.length > 0) {
        setLastCosmetics(data.newCosmetics);
      }
      const parts = [`Cleared · ${data.score} pts · ${data.cleared}/${data.total}`];
      if (typeof data.timeBonus === "number" && data.timeBonus > 0) {
        parts.push(`speed +${data.timeBonus}`);
      }
      if (data.totalBonus > 0) {
        parts.push(`Milestone bonus +${data.totalBonus}`);
      }
      if (data.newMilestones?.length) {
        const ranks = data.newMilestones
          .map((m: { title: string }) => m.title)
          .join(" · ");
        const accessories = Array.isArray(data.newCosmetics)
          ? data.newCosmetics
              .filter((c: { kind?: string }) => c.kind === "accessory")
              .map((c: { title: string }) => c.title)
          : [];
        setBonusNote(
          accessories.length
            ? `${ranks} · accessory: ${accessories.join(", ")}`
            : ranks,
        );
      }
      setStatus(parts.join(" · "));
      router.refresh();
    } catch {
      setStatus("Network error");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="mx-auto max-w-lg animate-rise">
      <div className="mb-6 flex items-end justify-between gap-4">
        <div>
          <p className="text-xs uppercase tracking-[0.22em] text-ember">
            Case File #{slotIndex} · <DifficultyLabel difficulty={difficulty} />
          </p>
          <h1 className="mt-1 font-[family-name:var(--font-display)] text-3xl font-bold">
            {label}
          </h1>
          <p className="mt-1 text-sm text-fog">
            +{points} pts on clear · Attempts {attempts}/{maxAttempts}
          </p>
        </div>
        <div className="flex flex-col items-end gap-2">
          <CaseFileBackLink collectionId={collectionId} />
          {!alreadyResolved && (
            <PlayTimer formatted={timer.formatted} stopped={done} />
          )}
        </div>
      </div>

      <MonthlyOnlyBody
        puzzle={puzzle}
        done={done}
        submitting={submitting}
        showFreeHint={showFreeHint}
        onSubmit={save}
      />

      {!done && !alreadyResolved && (
        <CoinConsumableBar
          signedIn={signedIn}
          disabled={submitting}
          canUseHint={canUseHint}
          onHint={applyMonthlyHint}
          onExtraAttempt={() => setBonusAttempts((n) => n + 1)}
          onSkip={() => {
            void forfeitSlot("skipped");
          }}
        />
      )}

      {unlockedHints.length > 0 && !done && (
        <ul className="mt-3 space-y-1.5 text-sm text-mint">
          {unlockedHints.map((hint, i) => (
            <li key={`hint-${i}`}>
              <span className="text-fog">Hint {i + 1}: </span>
              {hint}
            </li>
          ))}
        </ul>
      )}

      {status && (
        <p className="mt-4 rounded-lg border border-[var(--line)] bg-panel/60 px-4 py-3 text-sm">
          {status}
          {bonusNote && (
            <span className="mt-1 block text-ember">Rank unlocked: {bonusNote}</span>
          )}
        </p>
      )}

      {(done || alreadyCleared) && clearedAnswer ? (
        <div className="mt-4">
          <PlayResultsCard
            won={!skipped && !failed}
            outcomeLabel={
              skipped ? "Skipped" : failed ? "Out of attempts" : undefined
            }
            elapsedMs={lastElapsedMs}
            score={lastScore ?? undefined}
            breakdown={lastBreakdown}
            answer={clearedAnswer}
            explanation={clearedExplanation}
            newCosmetics={lastCosmetics}
          />
        </div>
      ) : null}
    </div>
  );
}

function MonthlyOnlyBody({
  puzzle,
  done,
  submitting,
  showFreeHint,
  onSubmit,
}: {
  puzzle: MonthlyOnlyPuzzle;
  done: boolean;
  submitting: boolean;
  showFreeHint: boolean;
  onSubmit: (p: {
    answer?: string;
    choiceIndex?: number;
    sequence?: string[];
  }) => void;
}) {
  const [text, setText] = useState("");
  const [choice, setChoice] = useState<number | null>(null);
  const [memoryReveal, setMemoryReveal] = useState(true);
  const [memoryPick, setMemoryPick] = useState<string[]>([]);

  useEffect(() => {
    if (puzzle.kind !== "memory") return;
    setMemoryReveal(true);
    const t = window.setTimeout(() => setMemoryReveal(false), puzzle.flashMs);
    return () => window.clearTimeout(t);
  }, [puzzle]);

  if (puzzle.kind === "riddle" || puzzle.kind === "mathlogic") {
    return (
      <div className="space-y-4">
        <p className="rounded-xl border border-[var(--line)] bg-panel/60 px-4 py-4">
          {puzzle.prompt}
        </p>
        {puzzle.kind === "riddle" &&
          showFreeHint &&
          puzzle.hint &&
          puzzle.hint !== "No further hints." && (
            <p className="text-xs text-fog">{puzzle.hint}</p>
          )}
        {!done && (
          <div className="flex gap-2">
            <input
              value={text}
              onChange={(e) => setText(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") onSubmit({ answer: text });
              }}
              className="flex-1 rounded-lg border border-[var(--line)] bg-ink-2 px-3 py-3 outline-none ring-ember/40 focus:ring-2"
              placeholder="Your answer"
              disabled={submitting}
            />
            <button
              type="button"
              disabled={submitting}
              onClick={() => onSubmit({ answer: text })}
              className="rounded-lg bg-ember px-4 font-semibold text-on-ember"
            >
              Submit
            </button>
          </div>
        )}
      </div>
    );
  }

  if (
    puzzle.kind === "trivia" ||
    puzzle.kind === "pattern" ||
    puzzle.kind === "deduction"
  ) {
    return (
      <div className="space-y-4">
        {puzzle.kind === "trivia" && (
          <p className="rounded-xl border border-[var(--line)] bg-panel/60 px-4 py-4">
            {puzzle.question}
          </p>
        )}
        {puzzle.kind === "pattern" && (
          <div className="rounded-xl border border-[var(--line)] bg-panel/60 px-4 py-4">
            <p className="text-xs uppercase tracking-wider text-fog">Sequence</p>
            {/*
              Render each step in its own cell. Never use "→" as a separator —
              arrow patterns would look like an extra term (↑ → ↓ → ? reads as
              four arrows, so “90° clockwise → ←” looks like a 180° turn).
            */}
            <div className="mt-3 flex flex-wrap items-center gap-2 font-mono text-2xl">
              {puzzle.shown.map((step, i) => (
                <span
                  key={`${step}-${i}`}
                  className="inline-flex min-w-11 items-center justify-center rounded-md border border-[var(--line)] bg-ink-2/80 px-3 py-2"
                >
                  {step}
                </span>
              ))}
              <span
                className="inline-flex min-w-11 items-center justify-center rounded-md border border-dashed border-ember/50 bg-ember/10 px-3 py-2 text-ember"
                aria-label="missing term"
              >
                ?
              </span>
            </div>
          </div>
        )}
        {puzzle.kind === "deduction" && (
          <div className="space-y-3 rounded-xl border border-[var(--line)] bg-panel/60 px-4 py-4">
            <p>{puzzle.briefing}</p>
            <ul className="list-disc space-y-1 pl-5 text-sm text-fog">
              {puzzle.clues.map((c) => (
                <li key={c}>{c}</li>
              ))}
            </ul>
          </div>
        )}
        {!done && (
          <div className="grid gap-2">
            {puzzle.options.map((opt, i) => (
              <button
                key={opt}
                type="button"
                disabled={submitting}
                onClick={() => {
                  setChoice(i);
                  onSubmit({ choiceIndex: i });
                }}
                className={[
                  "rounded-lg border px-4 py-3 text-left transition",
                  choice === i
                    ? "border-ember bg-ember/15"
                    : "border-[var(--line)] bg-ink-2/70 hover:border-ember/40",
                ].join(" ")}
              >
                {opt}
              </button>
            ))}
          </div>
        )}
      </div>
    );
  }

  // memory
  const symbols = ["●", "■", "▲", "◆", "★", "○", "□", "△"];
  return (
    <div className="space-y-4">
      <p className="text-sm text-fog">
        {memoryReveal
          ? "Memorize the sequence…"
          : "Tap the symbols in order."}
      </p>
      {memoryReveal ? (
        <div className="flex justify-center gap-3 rounded-xl border border-ember/30 bg-ember/10 px-4 py-8 text-3xl">
          {puzzle.sequence.map((s, i) => (
            <span key={`${s}-${i}`}>{s}</span>
          ))}
        </div>
      ) : (
        <>
          <div className="flex min-h-12 justify-center gap-2 text-2xl">
            {memoryPick.map((s, i) => (
              <span key={`${s}-${i}`}>{s}</span>
            ))}
          </div>
          {!done && (
            <div className="grid grid-cols-4 gap-2">
              {symbols.map((s) => (
                <button
                  key={s}
                  type="button"
                  disabled={submitting}
                  onClick={() => {
                    const next = [...memoryPick, s];
                    setMemoryPick(next);
                    if (next.length === puzzle.sequence.length) {
                      onSubmit({ sequence: next });
                      setMemoryPick([]);
                    }
                  }}
                  className="rounded-lg border border-[var(--line)] bg-ink-2 py-3 text-xl hover:border-ember/40"
                >
                  {s}
                </button>
              ))}
            </div>
          )}
        </>
      )}
    </div>
  );
}
