import Link from "next/link";
import {
  DIFFICULTIES,
  DIFFICULTY_LABELS,
  EXTRA_WORDLE_DIFFICULTIES,
  WORD_DAILY_DIFFICULTY,
  todayKey,
  wordleTitle,
  type Difficulty,
  type PuzzleType,
} from "@daily-puzzle/puzzle-core";
import { getExistingPlay, getProfile } from "@/lib/game-service";
import { getSession } from "@/lib/session";

export default async function HomePage() {
  const session = await getSession();
  const dateKey = todayKey();
  const profile = session?.user ? await getProfile(session.user.id) : null;

  const playKeys: Array<{ type: PuzzleType; difficulty: Difficulty }> = [
    { type: "wordle", difficulty: WORD_DAILY_DIFFICULTY },
    ...EXTRA_WORDLE_DIFFICULTIES.map((difficulty) => ({
      type: "wordle" as const,
      difficulty,
    })),
    ...DIFFICULTIES.map((difficulty) => ({
      type: "escape" as const,
      difficulty,
    })),
    ...DIFFICULTIES.map((difficulty) => ({
      type: "logic" as const,
      difficulty,
    })),
    ...DIFFICULTIES.map((difficulty) => ({
      type: "path" as const,
      difficulty,
    })),
  ];

  const played = session?.user
    ? await Promise.all(
        playKeys.map(async ({ type, difficulty }) => {
          const play = await getExistingPlay({
            userId: session.user.id,
            puzzleType: type,
            difficulty,
            dateKey,
          });
          return [`${type}:${difficulty}`, play] as const;
        }),
      )
    : [];

  const playedMap = new Map(played);
  const dailyWord = playedMap.get(`wordle:${WORD_DAILY_DIFFICULTY}`);

  return (
    <div className="space-y-10">
      <section className="animate-rise relative overflow-hidden rounded-[1.75rem] border border-[var(--line)] bg-panel/50 px-6 py-10 sm:px-10 sm:py-14">
        <div className="pointer-events-none absolute -right-16 top-0 h-64 w-64 rounded-full bg-ember/20 blur-3xl" />
        <div className="pointer-events-none absolute bottom-0 left-10 h-40 w-40 rounded-full bg-mint/15 blur-3xl" />
        <p className="text-xs uppercase tracking-[0.28em] text-ember">
          {dateKey}
        </p>
        <h1 className="mt-3 max-w-xl font-[family-name:var(--font-display)] text-5xl font-extrabold leading-[0.95] tracking-tight sm:text-6xl">
          Inkday
        </h1>
        <p className="mt-4 max-w-lg text-lg text-fog">
          Word Daily is today’s medium board. Crack escape codes, fill logic
          grids, draw paths through mazes, and climb the ranks with friends.
        </p>
        <div className="mt-8 flex flex-wrap gap-3">
          <Link
            href={`/play/wordle/${WORD_DAILY_DIFFICULTY}`}
            className="animate-glow rounded-lg bg-ember px-5 py-2.5 font-semibold text-on-ember transition hover:bg-ember-deep"
          >
            Play Word Daily
          </Link>
          <Link
            href="/play/path/medium"
            className="rounded-lg border border-[var(--line)] bg-white/5 px-5 py-2.5 font-semibold text-paper transition hover:bg-white/10"
          >
            Path Puzzle
          </Link>
          <Link
            href="/play/escape/medium"
            className="rounded-lg border border-[var(--line)] bg-white/5 px-5 py-2.5 font-semibold text-paper transition hover:bg-white/10"
          >
            Escape Room
          </Link>
          <Link
            href="/play/logic/medium"
            className="rounded-lg border border-[var(--line)] bg-white/5 px-5 py-2.5 font-semibold text-paper transition hover:bg-white/10"
          >
            Logic Grid
          </Link>
        </div>
        {profile?.stats && (
          <div className="mt-8 flex flex-wrap gap-6 text-sm">
            <Stat label="Streak" value={`${profile.stats.currentStreak}d`} />
            <Stat label="Best" value={`${profile.stats.bestStreak}d`} />
            <Stat label="Score" value={`${profile.stats.totalScore}`} />
            <Stat label="Solved" value={`${profile.stats.puzzlesSolved}`} />
          </div>
        )}
        {profile?.stats && (
          <p className="mt-4 max-w-xl text-sm text-fog">
            {profile.stats.lastPlayDate === dateKey
              ? profile.stats.currentStreak > 0
                ? `Today counts toward your ${profile.stats.currentStreak}-day streak. Win at least one puzzle each day to keep it alive.`
                : "Play and win a puzzle today to start a streak."
              : "Win any puzzle today to extend or start your daily streak. Faster solves earn a time bonus."}
          </p>
        )}
        {!session?.user && (
          <p className="mt-4 max-w-xl text-sm text-fog">
            Sign in to track a daily streak. Every puzzle runs a timer — speed
            bonuses stack onto your score.
          </p>
        )}
      </section>

      <section className="animate-rise-delay grid gap-6 lg:grid-cols-2">
        <article className="rounded-2xl border border-[var(--line)] bg-ink-2/70 p-6">
          <h2 className="font-[family-name:var(--font-display)] text-2xl font-bold">
            Word Daily
          </h2>
          <p className="mt-2 text-sm text-fog">
            The main daily wordle — always medium difficulty.
          </p>
          <div className="mt-5">
            <PlayRow
              href={`/play/wordle/${WORD_DAILY_DIFFICULTY}`}
              title="Today’s board"
              subtitle={
                dailyWord
                  ? session?.user
                    ? `Logged · ${dailyWord.score} pts`
                    : "Completed today"
                  : "Medium · 6 letters"
              }
              done={Boolean(dailyWord)}
              featured
            />
          </div>

          <h3 className="mt-8 text-sm font-semibold uppercase tracking-[0.18em] text-fog">
            Word Extra
          </h3>
          <p className="mt-1 text-sm text-fog">
            Bonus boards — easier warm-up or a harder crunch.
          </p>
          <div className="mt-4 grid gap-3">
            {EXTRA_WORDLE_DIFFICULTIES.map((difficulty) => {
              const done = playedMap.get(`wordle:${difficulty}`);
              return (
                <PlayRow
                  key={difficulty}
                  href={`/play/wordle/${difficulty}`}
                  title={`${wordleTitle(difficulty)} · ${DIFFICULTY_LABELS[difficulty]}`}
                  subtitle={
                    done
                      ? session?.user
                        ? `Logged · ${done.score} pts`
                        : "Completed today"
                      : difficulty === "easy"
                        ? "Shorter words · 6 guesses"
                        : "Longer words · 5 guesses"
                  }
                  done={Boolean(done)}
                />
              );
            })}
          </div>
        </article>

        <article className="rounded-2xl border border-[var(--line)] bg-ink-2/70 p-6">
          <h2 className="font-[family-name:var(--font-display)] text-2xl font-bold">
            Escape Room
          </h2>
          <p className="mt-2 text-sm text-fog">
            Combine notebook scraps, calendars, and plaques into a single code —
            like cracking a safe from scattered clues.
          </p>
          <div className="mt-5 grid gap-3">
            {DIFFICULTIES.map((difficulty) => {
              const done = playedMap.get(`escape:${difficulty}`);
              return (
                <PlayRow
                  key={difficulty}
                  href={`/play/escape/${difficulty}`}
                  title={DIFFICULTY_LABELS[difficulty]}
                  subtitle={
                    done
                      ? session?.user
                        ? `Logged · ${done.score} pts`
                        : "Completed today"
                      : difficulty === "easy"
                        ? "More hints · 5 attempts"
                        : difficulty === "medium"
                          ? "Core clues · 3 attempts"
                          : "Sparse hints · 2 attempts"
                  }
                  done={Boolean(done)}
                />
              );
            })}
          </div>
        </article>

        <article className="rounded-2xl border border-[var(--line)] bg-ink-2/70 p-6 lg:col-span-2">
          <h2 className="font-[family-name:var(--font-display)] text-2xl font-bold">
            Logic Grid
          </h2>
          <p className="mt-2 max-w-2xl text-sm text-fog">
            Classic detective deduction: mark a grid from the clues, then answer
            who did it. Easy uses smaller 3×3 cases; medium and hard scale up.
          </p>
          <div className="mt-5 grid gap-3 sm:grid-cols-3">
            {DIFFICULTIES.map((difficulty) => {
              const done = playedMap.get(`logic:${difficulty}`);
              return (
                <PlayRow
                  key={difficulty}
                  href={`/play/logic/${difficulty}`}
                  title={DIFFICULTY_LABELS[difficulty]}
                  subtitle={
                    done
                      ? session?.user
                        ? `Logged · ${done.score} pts`
                        : "Completed today"
                      : difficulty === "easy"
                        ? "3 suspects"
                        : "4 suspects"
                  }
                  done={Boolean(done)}
                />
              );
            })}
          </div>
        </article>

        <article className="rounded-2xl border border-[var(--line)] bg-ink-2/70 p-6 lg:col-span-2">
          <h2 className="font-[family-name:var(--font-display)] text-2xl font-bold">
            Path Puzzle
          </h2>
          <p className="mt-2 max-w-2xl text-sm text-fog">
            Draw an unbroken path from S to E. Stay off walls, never revisit a
            cell, and hit numbered checkpoints in order when they appear.
          </p>
          <div className="mt-5 grid gap-3 sm:grid-cols-3">
            {DIFFICULTIES.map((difficulty) => {
              const done = playedMap.get(`path:${difficulty}`);
              return (
                <PlayRow
                  key={difficulty}
                  href={`/play/path/${difficulty}`}
                  title={DIFFICULTY_LABELS[difficulty]}
                  subtitle={
                    done
                      ? session?.user
                        ? `Logged · ${done.score} pts`
                        : "Completed today"
                      : difficulty === "easy"
                        ? "Small board"
                        : difficulty === "medium"
                          ? "Checkpoints"
                          : "Tight mazes"
                  }
                  done={Boolean(done)}
                />
              );
            })}
          </div>
        </article>
      </section>

      {!session?.user && (
        <p className="text-center text-sm text-fog">
          <Link href="/auth" className="font-semibold text-ember hover:underline">
            Sign in
          </Link>{" "}
          to save scores, streaks, and friend ranks. You can still preview puzzles
          signed out.
        </p>
      )}
    </div>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <div className="text-xs uppercase tracking-wider text-fog">{label}</div>
      <div className="font-[family-name:var(--font-display)] text-2xl font-bold">
        {value}
      </div>
    </div>
  );
}

function PlayRow({
  href,
  title,
  subtitle,
  done,
  featured,
}: {
  href: string;
  title: string;
  subtitle: string;
  done: boolean;
  featured?: boolean;
}) {
  return (
    <Link
      href={href}
      className={[
        "flex items-center justify-between rounded-xl border px-4 py-3 transition hover:border-ember/40 hover:bg-panel",
        featured
          ? "border-ember/35 bg-ember/10"
          : "border-[var(--line)] bg-panel/60",
      ].join(" ")}
    >
      <div>
        <div className="font-semibold">{title}</div>
        <div className="text-xs text-fog">{subtitle}</div>
      </div>
      <span className="text-ember">{done ? "Replay" : "Play →"}</span>
    </Link>
  );
}
