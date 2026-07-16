import Link from "next/link";
import { collectionIdForDate, getMonthlyCollection } from "@daily-puzzle/puzzle-core";
import { listAllMonthlyBadges } from "@/lib/game-service";
import { getSession } from "@/lib/session";

export const dynamic = "force-dynamic";

export default async function BadgesPage() {
  const session = await getSession();
  const current = getMonthlyCollection(collectionIdForDate());

  if (!session?.user) {
    return (
      <div className="mx-auto max-w-md text-center animate-rise">
        <h1 className="font-[family-name:var(--font-display)] text-3xl font-bold">
          Badge collection
        </h1>
        <p className="mt-2 text-fog">
          Sign in to collect monthly Case File detective ranks.
        </p>
        <Link
          href="/auth"
          className="mt-6 inline-block rounded-lg bg-ember px-5 py-2.5 font-semibold text-on-ember"
        >
          Sign in
        </Link>
      </div>
    );
  }

  const badges = await listAllMonthlyBadges(session.user.id);

  return (
    <div className="mx-auto max-w-2xl animate-rise space-y-8">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-xs uppercase tracking-[0.22em] text-ember">
            Collection
          </p>
          <h1 className="mt-1 font-[family-name:var(--font-display)] text-4xl font-bold">
            Badges
          </h1>
          <p className="mt-2 text-sm text-fog">
            Monthly Case File ranks across months. This month:{" "}
            <span className="text-paper">{current.title}</span>
          </p>
        </div>
        <div className="flex flex-col items-end gap-2 text-sm">
          <Link href="/monthly" className="text-ember hover:underline">
            Open Case File →
          </Link>
          <Link href="/profile" className="text-fog hover:text-paper">
            Profile
          </Link>
        </div>
      </div>

      {badges.length === 0 ? (
        <p className="rounded-xl border border-[var(--line)] bg-ink-2/50 px-4 py-6 text-sm text-fog">
          No monthly badges yet. Clear Case File milestones to earn detective
          ranks.
        </p>
      ) : (
        <div className="grid gap-3">
          {badges.map((b) => (
            <div
              key={b.id}
              className="rounded-xl border border-ember/30 bg-ember/10 px-4 py-4"
            >
              <div className="font-semibold">{b.title}</div>
              <div className="mt-1 text-xs text-fog">
                Case File {b.collectionId} ·{" "}
                {b.awardedAt
                  ? new Date(b.awardedAt).toISOString().slice(0, 10)
                  : "—"}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
