"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { authClient } from "@/lib/auth-client";
import { PUZZLE_LABELS, type PuzzleType } from "@daily-puzzle/puzzle-core";
import { formatDuration } from "@/components/play-timer";
import { AvatarPicker } from "@/components/avatar-picker";
import { AvatarMark } from "@/components/avatar-mark";

type Props = {
  user: {
    name: string;
    email: string;
    displayName: string | null;
  };
  stats: {
    currentStreak: number;
    bestStreak: number;
    weeklyStreak?: number;
    bestWeeklyStreak?: number;
    monthlyStreak?: number;
    bestMonthlyStreak?: number;
    totalScore: number;
    puzzlesSolved: number;
    lastPlayDate: string | null;
  } | null;
  insights: {
    averageCompletionMs: number | null;
    favoriteCategory: string | null;
    favoriteCount: number;
    friends: Array<{
      id: string;
      name: string;
      equippedAvatarId?: string | null;
    }>;
    achievements: Array<{
      id: string;
      title: string;
      description: string;
      earned: boolean;
    }>;
    unlocks: Array<{
      id: string;
      title: string;
      description: string;
      unlocked: boolean;
    }>;
    unlockIds: string[];
  };
  recent: Array<{
    id: string;
    puzzleType: string;
    difficulty: string;
    dateKey: string;
    score: number;
    won: boolean;
    metaJson: string | null;
  }>;
  equippedAvatarId?: string;
  ownedAvatarIds?: string[];
  coinBalance?: number | null;
};

function timeFromMeta(metaJson: string | null): string | null {
  if (!metaJson) return null;
  try {
    const meta = JSON.parse(metaJson) as { elapsedMs?: number };
    if (typeof meta.elapsedMs !== "number") return null;
    return formatDuration(meta.elapsedMs);
  } catch {
    return null;
  }
}

function categoryLabel(type: string | null): string {
  if (!type) return "—";
  if (type === "path") return "Path Puzzle";
  return PUZZLE_LABELS[type as PuzzleType] ?? type;
}

export function ProfileView({
  user,
  stats,
  insights,
  recent,
  isPlus = false,
  equippedAvatarId = "avatar_default",
  ownedAvatarIds = [],
  coinBalance = null,
}: Props & { isPlus?: boolean }) {
  const router = useRouter();
  const earnedCount = insights.achievements.filter((a) => a.earned).length;

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
            {isPlus && (
              <span className="ml-2 align-middle text-sm font-semibold text-ember">
                Plus
              </span>
            )}
          </h1>
          <p className="mt-1 text-sm text-fog">{user.email}</p>
        </div>
        <button
          type="button"
          onClick={signOut}
          className="rounded-lg border border-[var(--line)] px-3 py-2 text-sm text-fog hover:text-paper"
        >
          Sign out
        </button>
      </div>

      <AvatarPicker
        equippedAvatarId={equippedAvatarId}
        ownedAvatarIds={ownedAvatarIds}
        isPlus={isPlus}
        balance={coinBalance}
      />

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
        <Tile label="Username" value={user.displayName || user.name} />
        <Tile label="Solved" value={`${stats?.puzzlesSolved ?? 0}`} />
        <Tile label="Total points" value={`${stats?.totalScore ?? 0}`} />
        <Tile label="Daily streak" value={`${stats?.currentStreak ?? 0}d`} />
        <Tile label="Best daily" value={`${stats?.bestStreak ?? 0}d`} />
        <Tile label="Weekly streak" value={`${stats?.weeklyStreak ?? 0}w`} />
        <Tile label="Monthly streak" value={`${stats?.monthlyStreak ?? 0}m`} />
        <Tile
          label="Avg time"
          value={
            insights.averageCompletionMs != null
              ? formatDuration(insights.averageCompletionMs)
              : "—"
          }
        />
        <Tile label="Favorite" value={categoryLabel(insights.favoriteCategory)} />
        <Tile label="Achievements" value={`${earnedCount}/${insights.achievements.length}`} />
      </div>

      <p className="text-sm text-fog">
        <Link href="/monthly" className="text-ember hover:underline">
          Monthly Case File
        </Link>
        {" · "}
        <Link href="/badges" className="text-ember hover:underline">
          Badge collection
        </Link>
      </p>

      <section>
        <h2 className="font-[family-name:var(--font-display)] text-xl font-bold">
          Achievements
        </h2>
        <p className="mt-1 text-sm text-fog">
          Cleared ones and the next door in each chain. Secrets stay secret.
        </p>
        <div className="mt-3 grid gap-2">
          {insights.achievements.map((a) => (
            <div
              key={a.id}
              className={[
                "rounded-xl border px-4 py-3",
                a.earned
                  ? "border-ember/35 bg-ember/10"
                  : "border-[var(--line)] bg-ink-2/50 opacity-70",
              ].join(" ")}
            >
              <div className="font-semibold">
                {a.earned ? "✓ " : ""}
                {a.title}
              </div>
              <div className="mt-1 text-xs text-fog">{a.description}</div>
            </div>
          ))}
        </div>
      </section>

      <section>
        <h2 className="font-[family-name:var(--font-display)] text-xl font-bold">
          Unlocks
        </h2>
        <p className="mt-1 text-sm text-fog">
          Bonus content earned through progress. Some remain hidden until you
          get close to their requirement.
        </p>
        <div className="mt-3 grid gap-2">
          {insights.unlocks.map((u) => (
            <div
              key={u.id}
              className={[
                "rounded-xl border px-4 py-3",
                u.unlocked
                  ? "border-mint/40 bg-mint/10"
                  : "border-[var(--line)] bg-ink-2/50",
              ].join(" ")}
            >
              <div className="flex items-center justify-between gap-2">
                <div className="font-semibold">{u.title}</div>
                <span className="text-xs text-fog">
                  {u.unlocked ? "Unlocked" : "Locked"}
                </span>
              </div>
              <div className="mt-1 text-xs text-fog">{u.description}</div>
              {u.unlocked && u.id === "impossible_mode" && (
                <Link
                  href="/play/escape/impossible"
                  className="mt-2 inline-block text-sm text-ember hover:underline"
                >
                  Play Impossible Escape →
                </Link>
              )}
              {u.unlocked && u.id === "exclusive_cases" && (
                <Link
                  href="/play/escape/hard"
                  className="mt-2 inline-block text-sm text-ember hover:underline"
                >
                  Exclusive hard cases →
                </Link>
              )}
            </div>
          ))}
        </div>
      </section>

      <section>
        <div className="flex items-center justify-between gap-3">
          <h2 className="font-[family-name:var(--font-display)] text-xl font-bold">
            Friends
          </h2>
          <Link href="/friends" className="text-sm text-ember hover:underline">
            Manage →
          </Link>
        </div>
        <div className="mt-3 flex flex-wrap gap-2">
          {insights.friends.length === 0 ? (
            <p className="text-sm text-fog">
              No friends yet.{" "}
              <Link href="/friends" className="text-ember hover:underline">
                Invite someone
              </Link>
              .
            </p>
          ) : (
            insights.friends.map((friend) => (
              <span
                key={friend.id}
                className="inline-flex items-center gap-2 rounded-full border border-[var(--line)] bg-ink-2/80 px-3 py-1 text-sm"
              >
                <AvatarMark avatarId={friend.equippedAvatarId} size={22} />
                {friend.name}
              </span>
            ))
          )}
        </div>
      </section>

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
      <div className="mt-1 truncate font-[family-name:var(--font-display)] text-2xl font-bold">
        {value}
      </div>
    </div>
  );
}
