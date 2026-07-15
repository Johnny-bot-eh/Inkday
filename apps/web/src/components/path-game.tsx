"use client";

import { useMemo, useState } from "react";
import type { Difficulty, PathCoord } from "@daily-puzzle/puzzle-core";
import {
  DIFFICULTY_LABELS,
  areAdjacent,
  checkPath,
  coordKey,
  findStart,
  getPathPuzzle,
  isWalkable,
  todayKey,
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

export function PathGame({
  difficulty,
  dateKey = todayKey(),
  alreadyPlayed,
  signedIn,
}: Props) {
  const router = useRouter();
  const puzzle = useMemo(
    () => getPathPuzzle(dateKey, difficulty),
    [dateKey, difficulty],
  );
  const start = useMemo(() => findStart(puzzle), [puzzle]);

  const [path, setPath] = useState<PathCoord[]>([start]);
  const [done, setDone] = useState(Boolean(alreadyPlayed));
  const [status, setStatus] = useState<string | null>(
    alreadyPlayed
      ? `Already logged today · ${alreadyPlayed.score} pts`
      : "Tap adjacent cells to extend your path. Undo backs up one step.",
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

  const pathSet = useMemo(
    () => new Set(path.map(coordKey)),
    [path],
  );
  const head = path[path.length - 1]!;

  function undo() {
    if (done || path.length <= 1) return;
    setPath((prev) => prev.slice(0, -1));
    setStatus(null);
  }

  function reset() {
    if (done) return;
    setPath([start]);
    setStatus("Path cleared.");
  }

  function tryStep(cell: PathCoord) {
    if (done) return;
    const tile = puzzle.grid[cell.r]?.[cell.c];
    if (!tile || !isWalkable(tile)) return;
    if (pathSet.has(coordKey(cell))) {
      // Click earlier cell to rewind to it
      const idx = path.findIndex((p) => p.r === cell.r && p.c === cell.c);
      if (idx >= 0) {
        setPath(path.slice(0, idx + 1));
        setStatus(null);
      }
      return;
    }
    if (!areAdjacent(head, cell)) {
      setStatus("Move to an adjacent open cell.");
      return;
    }
    setPath([...path, cell]);
    setStatus(null);
  }

  async function submit() {
    const verdict = checkPath(puzzle, path);
    if (!verdict.ok) {
      setStatus(verdict.reason);
      return;
    }

    const elapsedMs = timer.freeze();
    const timeLabel = formatDuration(elapsedMs);

    if (!signedIn) {
      setDone(true);
      setResults({ won: true, elapsedMs });
      setStatus(`Path complete in ${timeLabel}! Sign in to save your score.`);
      return;
    }

    setSubmitting(true);
    try {
      const res = await fetch("/api/play/submit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          puzzleType: "path",
          difficulty,
          dateKey,
          path,
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
        won: Boolean(data.won),
        elapsedMs: data.elapsedMs ?? elapsedMs,
        score: data.score,
        streak: data.streak,
        breakdown: data.breakdown,
        ranks: data.ranks,
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
    <div className="mx-auto max-w-xl animate-rise space-y-6">
      <div className="flex items-end justify-between gap-4">
        <div>
          <p className="text-xs uppercase tracking-[0.22em] text-ember">
            Path Puzzle · {DIFFICULTY_LABELS[difficulty]}
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
        {puzzle.briefing}
        {puzzle.waypoints.length > 0 && (
          <span className="mt-2 block text-sm text-fog">
            Checkpoints in order: {puzzle.waypoints.join(" → ")} → E
          </span>
        )}
      </p>

      <div
        className="mx-auto grid gap-1.5"
        style={{
          gridTemplateColumns: `repeat(${puzzle.cols}, minmax(0, 1fr))`,
          maxWidth: puzzle.cols * 52,
        }}
      >
        {puzzle.grid.map((row, r) =>
          row.map((tile, c) => {
            const coord = { r, c };
            const key = coordKey(coord);
            const onPath = pathSet.has(key);
            const isHead = head.r === r && head.c === c;
            const wall = tile === "#";
            const label =
              tile === "." ? "" : tile === "#" ? "" : tile;

            return (
              <button
                key={key}
                type="button"
                disabled={done || wall}
                onClick={() => tryStep(coord)}
                className={[
                  "flex aspect-square items-center justify-center rounded-md border text-sm font-bold transition",
                  wall &&
                    "cursor-default border-transparent bg-absent text-fog/30 shadow-inner",
                  !wall && !onPath && "border-[var(--line)] bg-ink-2/80 hover:border-ember/50",
                  onPath && !isHead && "border-transparent bg-path/35 text-paper",
                  isHead && "border-transparent bg-path-head text-on-ember",
                  (tile === "S" || tile === "E" || puzzle.waypoints.includes(tile)) &&
                    !onPath &&
                    "text-ember",
                ]
                  .filter(Boolean)
                  .join(" ")}
              >
                {label}
              </button>
            );
          }),
        )}
      </div>

      {!done && (
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={undo}
            className="rounded-lg border border-[var(--line)] px-4 py-2 text-sm text-fog hover:text-paper"
          >
            Undo
          </button>
          <button
            type="button"
            onClick={reset}
            className="rounded-lg border border-[var(--line)] px-4 py-2 text-sm text-fog hover:text-paper"
          >
            Reset
          </button>
          <button
            type="button"
            onClick={() => void submit()}
            disabled={submitting}
            className="ml-auto rounded-lg bg-ember px-5 py-2 font-semibold text-on-ember hover:bg-ember-deep disabled:opacity-50"
          >
            {submitting ? "Checking…" : "Submit path"}
          </button>
        </div>
      )}

      {status && (
        <p className="rounded-xl border border-[var(--line)] bg-panel/70 px-4 py-3 text-sm">
          {status}
        </p>
      )}

      {results && <PlayResultsCard {...results} />}
    </div>
  );
}
