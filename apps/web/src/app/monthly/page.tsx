import Link from "next/link";
import {
  MONTHLY_MILESTONES,
  MONTHLY_SLOT_COUNT,
  collectionIdForDate,
  getMonthlyCollection,
} from "@daily-puzzle/puzzle-core";
import { getMonthlyProgress, monthlyOutcomeFromMeta } from "@/lib/game-service";
import { getSession } from "@/lib/session";
import { DifficultyLabel } from "@/components/difficulty-label";

export const dynamic = "force-dynamic";

export default async function MonthlyHubPage() {
  const session = await getSession();
  const collectionId = collectionIdForDate();
  const collection = getMonthlyCollection(collectionId);

  let cleared = 0;
  let clearedSet = new Set<number>();
  let resolvedMap = new Map<number, "cleared" | "skipped" | "failed">();
  let milestoneIds = new Set<string>();

  if (session?.user) {
    const progress = await getMonthlyProgress(session.user.id, collectionId);
    cleared = progress.cleared;
    clearedSet = new Set(progress.completions.map((c) => c.slotIndex));
    for (const row of progress.resolutions) {
      if (row.won) {
        resolvedMap.set(row.slotIndex, "cleared");
      } else {
        resolvedMap.set(
          row.slotIndex,
          monthlyOutcomeFromMeta(row.metaJson) ?? "failed",
        );
      }
    }
    milestoneIds = new Set(progress.milestones.map((m) => m.milestoneId));
  }

  const pct = Math.round((cleared / MONTHLY_SLOT_COUNT) * 100);

  return (
    <div className="mx-auto max-w-3xl animate-rise space-y-8">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <p
            className="text-xs uppercase tracking-[0.28em]"
            style={{ color: collection.accent }}
          >
            Monthly Puzzle Collection
          </p>
          <h1 className="mt-2 font-[family-name:var(--font-display)] text-3xl font-bold sm:text-4xl">
            {collection.title}
          </h1>
          <p className="mt-2 max-w-xl text-fog">{collection.tagline}</p>
          <p className="mt-2 text-sm text-fog">
            Any order · not day-locked · {collection.daysLeft} day
            {collection.daysLeft === 1 ? "" : "s"} left in {collection.id}
          </p>
        </div>
        <div className="flex flex-col items-end gap-2 text-sm">
          <Link href="/" className="text-fog hover:text-paper">
            ← Today
          </Link>
          <Link href="/badges" className="text-ember hover:underline">
            Badge collection →
          </Link>
        </div>
      </div>

      <div className="rounded-2xl border border-[var(--line)] bg-ink-2/70 p-5">
        <div className="flex items-end justify-between gap-3">
          <div>
            <p className="text-xs uppercase tracking-wider text-fog">Progress</p>
            <p className="font-[family-name:var(--font-display)] text-2xl font-bold">
              {cleared}/{MONTHLY_SLOT_COUNT} completed
            </p>
          </div>
          <p className="text-sm text-fog">{pct}%</p>
        </div>
        <div className="mt-3 h-2 overflow-hidden rounded-full bg-[var(--line)]">
          <div
            className="h-full rounded-full transition-all"
            style={{
              width: `${pct}%`,
              background: collection.accent,
            }}
          />
        </div>
        {!session?.user && (
          <p className="mt-3 text-sm text-fog">
            <Link href="/auth" className="text-ember hover:underline">
              Sign in
            </Link>{" "}
            to track Case File clears across the month.
          </p>
        )}
      </div>

      <section>
        <h2 className="font-[family-name:var(--font-display)] text-xl font-bold">
          Detective ranks
        </h2>
        <div className="mt-3 grid gap-2 sm:grid-cols-2">
          {MONTHLY_MILESTONES.map((m) => {
            const earned = milestoneIds.has(m.id);
            return (
              <div
                key={m.id}
                className={[
                  "rounded-xl border px-4 py-3",
                  earned
                    ? "border-ember/35 bg-ember/10"
                    : "border-[var(--line)] bg-panel/40 opacity-80",
                ].join(" ")}
              >
                <div className="font-semibold">
                  {earned ? "✓ " : ""}
                  {m.title}
                </div>
                <div className="mt-1 text-xs text-fog">
                  {m.threshold}/60 · +{m.bonusPoints.toLocaleString()} bonus
                </div>
              </div>
            );
          })}
        </div>
      </section>

      <section>
        <h2 className="font-[family-name:var(--font-display)] text-xl font-bold">
          Puzzles
        </h2>
        <div className="mt-3 grid gap-2">
          {collection.puzzles.map((slot) => {
            const outcome = resolvedMap.get(slot.index);
            const done = Boolean(outcome);
            const won = clearedSet.has(slot.index);
            const statusLabel = won
              ? "Completed"
              : outcome === "skipped"
                ? "Skipped"
                : outcome === "failed"
                  ? "Not solved"
                  : `+${slot.points} pts`;
            return (
              <Link
                key={slot.index}
                href={`/monthly/${slot.index}`}
                className={[
                  "flex items-center justify-between gap-3 rounded-xl border px-4 py-3 transition",
                  done
                    ? "border-[var(--line)] bg-[var(--line)]/25 opacity-75"
                    : "border-[var(--line)] bg-panel/60 hover:border-ember/40",
                ].join(" ")}
              >
                <div>
                  <div className={done ? "font-semibold text-fog" : "font-semibold"}>
                    {won ? "✓" : done ? "–" : "·"} #{slot.index}{" "}
                    <DifficultyLabel difficulty={slot.difficulty} /> —{" "}
                    {slot.label}
                  </div>
                  <div className="text-xs text-fog">{statusLabel}</div>
                </div>
                <span className={done ? "text-fog" : "text-ember"}>
                  {done ? "Done" : "Play →"}
                </span>
              </Link>
            );
          })}
        </div>
      </section>
    </div>
  );
}
