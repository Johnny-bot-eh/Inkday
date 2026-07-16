"use client";

import { useMemo, useState } from "react";
import type { Difficulty, GridMark } from "@daily-puzzle/puzzle-core";
import {
  DIFFICULTY_LABELS,
  cellKey,
  emptyLogicGrid,
  getLogicPuzzle,
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
  const [answer, setAnswer] = useState("");
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
  } | null>(null);
  const timer = usePlayTimer({
    running: !done && !alreadyPlayed,
    resetKey: `${dateKey}-${difficulty}`,
  });

  function cycleCell(subject: string, traitId: string, value: string) {
    if (done) return;
    const key = cellKey(subject, traitId, value);
    const current = grid[key] ?? "unknown";
    const next = CYCLE[(CYCLE.indexOf(current) + 1) % CYCLE.length]!;

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

  function markLabel(mark: GridMark): string {
    if (mark === "yes") return "●";
    if (mark === "no") return "×";
    return "";
  }

  async function submitAnswer() {
    if (!answer || done) return;
    const elapsedMs = timer.freeze();
    if (!monthly) markBoardPlayed(dateKey, "logic", difficulty, seasonId ?? (premium ? "plus" : null));
    const timeLabel = formatDuration(elapsedMs);
    const correct =
      answer.trim().toLowerCase() === puzzle.answer.trim().toLowerCase();

    if (monthly) {
      if (!correct) {
        setDone(true);
        setResults({ won: false, elapsedMs, answer: puzzle.answer });
        setStatus(`Not quite (${timeLabel}).`);
        return;
      }
      if (!signedIn) {
        setDone(true);
        setResults({ won: true, elapsedMs, answer: puzzle.answer });
        setStatus("Correct! Sign in to save Case File progress.");
        return;
      }
      setSubmitting(true);
      try {
        const mres = await submitMonthlyFromGame(monthly, {
          answer,
          elapsedMs,
        });
        if (!mres.ok) {
          setStatus(mres.data.error ?? "Could not save");
          return;
        }
        setDone(true);
        setResults({ won: true, elapsedMs, score: mres.data.score, answer: puzzle.answer });
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
      setResults({
        won: correct,
        elapsedMs,
        answer: puzzle.answer,
      });
      setStatus(
        correct
          ? `Correct in ${timeLabel}. Sign in to save points.`
          : `Not quite (${timeLabel}).`,
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
          answer,
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

  return (
    <div className="mx-auto max-w-3xl animate-rise space-y-6">
      <div className="flex items-end justify-between gap-4">
        <div>
          <p className="text-xs uppercase tracking-[0.22em] text-ember">
            Logic Grid · {DIFFICULTY_LABELS[difficulty]}
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
        <h2 className="font-[family-name:var(--font-display)] text-xl font-bold">
          Clues
        </h2>
        <ol className="mt-3 list-decimal space-y-2 pl-5 text-sm leading-relaxed text-paper/95">
          {puzzle.clues.map((clue) => (
            <li key={clue}>{clue}</li>
          ))}
        </ol>
      </section>

      {puzzle.traits.map((trait) => (
        <section key={trait.id} className="overflow-x-auto">
          <h3 className="mb-2 text-sm font-semibold uppercase tracking-wider text-fog">
            {puzzle.subjects.label} × {trait.label}
          </h3>
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
                          className={[
                            "flex h-10 w-full items-center justify-center transition",
                            mark === "yes" && "bg-mint/25 text-mint",
                            mark === "no" && "bg-danger/15 text-danger",
                            mark === "unknown" && "hover:bg-white/5",
                          ]
                            .filter(Boolean)
                            .join(" ")}
                          aria-label={`${subject} ${trait.label} ${value}: ${mark}`}
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
            Tap cells to cycle blank → yes (●) → no (×).
          </p>
        </section>
      ))}

      <section className="rounded-2xl border border-[var(--line)] bg-panel/50 p-5">
        <p className="font-semibold">{puzzle.question}</p>
        {!done && (
          <div className="mt-4 flex flex-col gap-2 sm:flex-row">
            <select
              value={answer}
              onChange={(e) => setAnswer(e.target.value)}
              className="flex-1 rounded-lg border border-[var(--line)] bg-ink-2 px-3 py-3 outline-none ring-ember/40 focus:ring-2"
              disabled={submitting}
            >
              <option value="">Choose suspect…</option>
              {puzzle.subjects.values.map((name) => (
                <option key={name} value={name}>
                  {name}
                </option>
              ))}
            </select>
            <button
              type="button"
              onClick={() => void submitAnswer()}
              disabled={!answer || submitting}
              className="rounded-lg bg-ember px-5 py-3 font-semibold text-on-ember hover:bg-ember-deep disabled:opacity-50"
            >
              Accuse
            </button>
          </div>
        )}
      </section>

      {status && (
        <p className="rounded-xl border border-[var(--line)] bg-panel/70 px-4 py-3 text-sm">
          {status}
        </p>
      )}

      {results && <PlayResultsCard {...results} />}
    </div>
  );
}
