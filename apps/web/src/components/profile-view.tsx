"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { authClient } from "@/lib/auth-client";

type Props = {
  user: {
    name: string;
    email: string;
    displayName: string | null;
  };
  stats: {
    currentStreak: number;
    bestStreak: number;
    totalScore: number;
    puzzlesSolved: number;
    lastPlayDate: string | null;
  } | null;
  recent: Array<{
    id: string;
    puzzleType: string;
    difficulty: string;
    dateKey: string;
    score: number;
    won: boolean;
    metaJson: string | null;
  }>;
};

function timeFromMeta(metaJson: string | null): string | null {
  if (!metaJson) return null;
  try {
    const meta = JSON.parse(metaJson) as { elapsedMs?: number };
    if (typeof meta.elapsedMs !== "number") return null;
    const totalSec = Math.floor(meta.elapsedMs / 1000);
    const m = Math.floor(totalSec / 60);
    const s = totalSec % 60;
    return `${m}:${String(s).padStart(2, "0")}`;
  } catch {
    return null;
  }
}

export function ProfileView({ user, stats, recent }: Props) {
  const router = useRouter();

  async function signOut() {
    await authClient.signOut();
    router.push("/");
    router.refresh();
  }

  return (
    <div className="mx-auto max-w-2xl animate-rise space-y-8">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-xs uppercase tracking-[0.22em] text-ember">Profile</p>
          <h1 className="mt-1 font-[family-name:var(--font-display)] text-4xl font-bold">
            {user.displayName || user.name}
          </h1>
          <p className="mt-1 text-sm text-fog">{user.email}</p>
          <p className="mt-3 text-sm text-fog">
            Daily streak: win at least one puzzle each calendar day. A miss later
            the same day won’t wipe a streak you’ve already secured.
          </p>
        </div>
        <button
          type="button"
          onClick={signOut}
          className="rounded-lg border border-[var(--line)] px-3 py-2 text-sm text-fog hover:text-paper"
        >
          Sign out
        </button>
      </div>

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <Tile label="Streak" value={`${stats?.currentStreak ?? 0}d`} />
        <Tile label="Best streak" value={`${stats?.bestStreak ?? 0}d`} />
        <Tile label="Total score" value={`${stats?.totalScore ?? 0}`} />
        <Tile label="Solved" value={`${stats?.puzzlesSolved ?? 0}`} />
      </div>

      <section>
        <h2 className="font-[family-name:var(--font-display)] text-xl font-bold">
          Recent plays
        </h2>
        <div className="mt-3 space-y-2">
          {recent.length === 0 && (
            <p className="text-sm text-fog">
              No plays yet.{" "}
              <Link href="/" className="text-ember hover:underline">
                Start today’s board
              </Link>
              .
            </p>
          )}
          {recent.map((play) => {
            const time = timeFromMeta(play.metaJson);
            return (
              <div
                key={play.id}
                className="flex items-center justify-between rounded-xl border border-[var(--line)] bg-panel/50 px-4 py-3 text-sm"
              >
                <div>
                  <div className="font-medium capitalize">
                    {play.puzzleType} · {play.difficulty}
                  </div>
                  <div className="text-xs text-fog">
                    {play.dateKey}
                    {time ? ` · ${time}` : ""}
                  </div>
                </div>
                <div className={play.won ? "text-mint" : "text-fog"}>
                  {play.won ? `+${play.score}` : "miss"}
                </div>
              </div>
            );
          })}
        </div>
      </section>
    </div>
  );
}

function Tile({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl border border-[var(--line)] bg-ink-2/80 px-4 py-3">
      <div className="text-xs uppercase tracking-wider text-fog">{label}</div>
      <div className="mt-1 font-[family-name:var(--font-display)] text-2xl font-bold">
        {value}
      </div>
    </div>
  );
}
