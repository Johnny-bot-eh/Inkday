"use client";

import { useEffect, useMemo, useState } from "react";
import type { Difficulty, MonthlyOnlyPuzzle } from "@daily-puzzle/puzzle-core";
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

type Props = {
  collectionId: string;
  slotIndex: number;
  kind: MonthlyOnlyType;
  seedKey: string;
  difficulty: Difficulty;
  label: string;
  points: number;
  alreadyCleared: boolean;
  signedIn: boolean;
};

/** Escalating paid hints — each purchase unlocks the next rung. */
function buildHintLadder(puzzle: MonthlyOnlyPuzzle): string[] {
  switch (puzzle.kind) {
    case "riddle": {
      const ans = puzzle.answer.trim();
      const steps: string[] = [];
      if (puzzle.hint && puzzle.hint !== "No further hints.") {
        steps.push(puzzle.hint);
      }
      steps.push(`The answer has ${ans.length} letter${ans.length === 1 ? "" : "s"}.`);
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
        ...(ans.length > 1
          ? [`Ends with “${ans[ans.length - 1]}”.`]
          : []),
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

export function MonthlyOnlyGame({
  collectionId,
  slotIndex,
  kind,
  seedKey,
  difficulty,
  label,
  points,
  alreadyCleared,
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
  const hintLadder = useMemo(() => buildHintLadder(puzzle), [puzzle]);

  const [status, setStatus] = useState<string | null>(
    alreadyCleared ? "Already cleared this month" : null,
  );
  const [done, setDone] = useState(alreadyCleared);
  const [skipped, setSkipped] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [bonusNote, setBonusNote] = useState<string | null>(null);
  const [hintStep, setHintStep] = useState(0);
  const [unlockedHints, setUnlockedHints] = useState<string[]>([]);

  function applyMonthlyHint() {
    if (hintLadder.length === 0) {
      setUnlockedHints(["No hints available for this board."]);
      return;
    }
    if (hintStep >= hintLadder.length) {
      setUnlockedHints((prev) =>
        prev[prev.length - 1] === "No further paid hints."
          ? prev
          : [...prev, "No further paid hints."],
      );
      return;
    }
    const next = hintLadder[hintStep]!;
    setUnlockedHints((prev) => [...prev, next]);
    setHintStep((n) => n + 1);
  }

  async function save(payload: {
    answer?: string;
    choiceIndex?: number;
    sequence?: string[];
  }) {
    const verdict = checkMonthlyOnlyAnswer(puzzle, payload);
    if (!verdict.correct) {
      setStatus("Not quite — try again.");
      return;
    }

    if (!signedIn) {
      setDone(true);
      setStatus(`Correct! Sign in to save Case File progress (+${points} pts).`);
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
          ...payload,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setStatus(data.error ?? "Could not save");
        return;
      }
      setDone(true);
      const parts = [`Cleared · ${data.score} pts · ${data.cleared}/${data.total}`];
      if (data.totalBonus > 0) {
        parts.push(`Milestone bonus +${data.totalBonus}`);
      }
      if (data.newMilestones?.length) {
        setBonusNote(
          data.newMilestones
            .map((m: { title: string }) => m.title)
            .join(" · "),
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
          <p className="mt-1 text-sm text-fog">+{points} pts on clear</p>
        </div>
        <CaseFileBackLink collectionId={collectionId} />
      </div>

      <MonthlyOnlyBody
        puzzle={puzzle}
        done={done}
        submitting={submitting}
        showFreeHint={difficulty === "easy"}
        onSubmit={save}
      />

      {!done && !alreadyCleared && (
        <CoinConsumableBar
          signedIn={signedIn}
          disabled={submitting}
          onHint={applyMonthlyHint}
          onSkip={() => {
            setSkipped(true);
            setDone(true);
            setStatus("Skipped — no Case File credit this slot.");
          }}
        />
      )}

      {unlockedHints.length > 0 && !done && (
        <ul className="mt-3 space-y-1.5 text-sm text-mint">
          {unlockedHints.map((hint, i) => (
            <li key={`${i}-${hint}`}>
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
            won={!skipped}
            answer={clearedAnswer}
            explanation={clearedExplanation}
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
            <p className="mt-2 font-mono text-2xl tracking-widest">
              {puzzle.shown.join("  ")} → ?
            </p>
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
