import Link from "next/link";
import {
  DIFFICULTIES,
  DIFFICULTY_LABELS,
  EXTRA_WORDLE_DIFFICULTIES,
  HIDDEN_CHALLENGES,
  MONTHLY_SLOT_COUNT,
  PUZZLE_LABELS,
  TODAYS_CHALLENGES,
  WORD_DAILY_DIFFICULTY,
  WORD_GAME_TYPES,
  collectionIdForDate,
  dailyChallengeHeadline,
  findPlayForBoard,
  getMonthlyCollection,
  getSurpriseWordleChallenge,
  todayKey,
  wordleTitle,
  type Difficulty,
} from "@daily-puzzle/puzzle-core";
import {
  getMonthlyProgress,
  getProfile,
  listPlaysForDate,
} from "@/lib/game-service";
import { getSession } from "@/lib/session";
import { ChallengeCountdown } from "@/components/challenge-countdown";
import { ChallengePlayRow } from "@/components/challenge-play-row";
import { LocalTodayLabel } from "@/components/local-today-label";

/** Always render with the current UTC day — never serve a stale cached “yesterday”. */
export const dynamic = "force-dynamic";

type DayPlay = Awaited<ReturnType<typeof listPlaysForDate>>[number];

export default async function HomePage() {
  const session = await getSession();
  const dateKey = todayKey();
  const collectionId = collectionIdForDate();
  const monthly = getMonthlyCollection(collectionId);

  let profile: Awaited<ReturnType<typeof getProfile>> | null = null;
  let plays: DayPlay[] = [];
  let monthlyCleared = 0;

  if (session?.user) {
    try {
      const [nextProfile, dayPlays, monthlyProgress] = await Promise.all([
        getProfile(session.user.id),
        listPlaysForDate(session.user.id, dateKey),
        getMonthlyProgress(session.user.id, collectionId),
      ]);
      profile = nextProfile;
      plays = dayPlays;
      monthlyCleared = monthlyProgress.cleared;
    } catch (err) {
      console.error("Home signed-in data failed", err);
    }
  }

  function boardPlay(
    puzzleType: DayPlay["puzzleType"] | string,
    difficulty: Difficulty,
    seasonId: string | null | undefined = "",
  ) {
    return findPlayForBoard(
      plays,
      puzzleType as Parameters<typeof findPlayForBoard>[1],
      difficulty,
      seasonId,
    );
  }

  function doneCopy(play: DayPlay | undefined): string {
    if (!play) return "Completed today";
    if (session?.user) return `Logged · ${play.score} pts`;
    return "Completed today";
  }

  const monthlyPct = Math.round((monthlyCleared / MONTHLY_SLOT_COUNT) * 100);
  const surpriseWordle = getSurpriseWordleChallenge(dateKey);

  return (
    <div className="space-y-10">
      <section className="animate-rise relative overflow-hidden rounded-[1.75rem] border border-[var(--line)] bg-panel/50 px-6 py-10 sm:px-10 sm:py-14">
        <div className="pointer-events-none absolute -right-16 top-0 h-64 w-64 rounded-full bg-ember/20 blur-3xl" />
        <div className="pointer-events-none absolute bottom-0 left-10 h-40 w-40 rounded-full bg-mint/15 blur-3xl" />
        <p className="text-xs uppercase tracking-[0.28em] text-ember">
          <LocalTodayLabel />
        </p>
        <h1 className="mt-3 max-w-xl font-[family-name:var(--font-display)] text-5xl font-extrabold leading-[1.05] tracking-tight sm:text-6xl">
          Inkday
        </h1>
        <p className="mt-4 max-w-lg text-lg text-fog">
          Four featured dailies refresh every UTC midnight. Crack them, then
          climb global and friend leaderboards.
        </p>
        <div className="mt-8 flex flex-wrap gap-3">
          <Link
            href={TODAYS_CHALLENGES[0]!.href}
            className="animate-glow rounded-lg bg-ember px-5 py-2.5 font-semibold text-on-ember transition hover:bg-ember-deep"
          >
            Today’s Challenges
          </Link>
          <Link
            href="/leaderboard"
            className="rounded-lg border border-[var(--line)] bg-white/5 px-5 py-2.5 font-semibold text-paper transition hover:bg-white/10"
          >
            Leaderboards
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

      <section
        className="animate-rise relative overflow-hidden rounded-[1.75rem] border px-6 py-8 sm:px-8"
        style={{
          borderColor: `${monthly.accent}55`,
          background: `linear-gradient(135deg, ${monthly.accent}22, transparent 55%), var(--panel, rgba(20,24,32,0.7))`,
        }}
      >
        <p
          className="text-xs uppercase tracking-[0.28em]"
          style={{ color: monthly.accent }}
        >
          Monthly Case File · {monthly.daysLeft}d left
        </p>
        <h2 className="mt-2 font-[family-name:var(--font-display)] text-3xl font-bold tracking-tight sm:text-4xl">
          {monthly.title}
        </h2>
        <p className="mt-2 max-w-xl text-fog">{monthly.tagline}</p>
        <p className="mt-3 text-sm text-fog">
          60 puzzles · exclusive new puzzles · any order · not day-locked ·
          milestone detective ranks
        </p>
        <div className="mt-4 max-w-md">
          <div className="mb-1 flex justify-between text-xs text-fog">
            <span>
              {monthlyCleared}/{MONTHLY_SLOT_COUNT} completed
            </span>
            <span>{monthlyPct}%</span>
          </div>
          <div className="h-2 overflow-hidden rounded-full bg-[var(--line)]">
            <div
              className="h-full rounded-full"
              style={{ width: `${monthlyPct}%`, background: monthly.accent }}
            />
          </div>
        </div>
        <div className="mt-5 flex flex-wrap gap-3">
          <Link
            href="/monthly"
            className="inline-block rounded-lg px-5 py-2.5 font-semibold text-on-ember transition"
            style={{ background: monthly.accent }}
          >
            Open Case File →
          </Link>
          <Link
            href="/badges"
            className="inline-block rounded-lg border border-[var(--line)] px-5 py-2.5 text-sm font-semibold text-paper"
          >
            Badges
          </Link>
        </div>
      </section>

      <section className="animate-rise-delay space-y-5">
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div>
            <h2 className="font-[family-name:var(--font-display)] text-3xl font-bold">
              Today’s Challenges
            </h2>
            <p className="mt-1 text-sm text-fog">
              New boards every day at <span className="text-paper">00:00 UTC</span>{" "}
              · today <LocalTodayLabel className="text-paper" />
            </p>
          </div>
          <ChallengeCountdown />
        </div>

        <div className="grid gap-3 sm:grid-cols-2">
          {TODAYS_CHALLENGES.map((challenge) => {
            const play = boardPlay(challenge.puzzleType, challenge.difficulty);
            const headline = dailyChallengeHeadline(challenge, dateKey);
            return (
              <ChallengePlayRow
                key={`${challenge.id}-${dateKey}`}
                href={challenge.href}
                title={`${challenge.title} · ${challenge.difficultyLabel}`}
                openSubtitle={headline}
                doneSubtitle={doneCopy(play)}
                puzzleType={challenge.puzzleType}
                difficulty={challenge.difficulty}
                dateKey={dateKey}
                serverDone={Boolean(play)}
                featured
              />
            );
          })}
        </div>

        {session?.user &&
          profile?.insights?.unlockIds?.includes("hidden_challenges") && (
            <div className="mt-6 space-y-3">
              <h3 className="font-[family-name:var(--font-display)] text-xl font-bold">
                Hidden Challenges
              </h3>
              <p className="text-sm text-fog">
                Unlocked by your 7-day streak — exclusive night boards.
              </p>
              <div className="grid gap-3">
                {HIDDEN_CHALLENGES.map((challenge) => {
                  const play = boardPlay(
                    challenge.puzzleType,
                    challenge.difficulty,
                  );
                  return (
                    <ChallengePlayRow
                      key={challenge.id}
                      href={challenge.href}
                      title={challenge.title}
                      openSubtitle={challenge.difficultyLabel}
                      doneSubtitle={doneCopy(play)}
                      puzzleType={challenge.puzzleType}
                      difficulty={challenge.difficulty}
                      dateKey={dateKey}
                      serverDone={Boolean(play)}
                      featured
                    />
                  );
                })}
              </div>
            </div>
          )}
      </section>

      <section className="space-y-5">
        <div>
          <h2 className="font-[family-name:var(--font-display)] text-2xl font-bold">
            More puzzles
          </h2>
          <p className="mt-1 text-sm text-fog">
            Word Daily, extras, and every difficulty still available below.
          </p>
        </div>

        {session?.user && (
          <div className="rounded-2xl border border-ember/30 bg-ember/10 p-5">
            <h3 className="font-[family-name:var(--font-display)] text-xl font-bold">
              Inkday Plus
            </h3>
            <p className="mt-1 text-sm text-fog">
              {profile?.premium?.active
                ? "You’re on Plus — open member boards and claim a weekly streak freeze from Profile."
                : "Plus adds vault cases, a weekly streak freeze, monthly Ink Coins, and +25% coin earnings from puzzles. Redeem a promo on Profile (Stripe later)."}
            </p>
            <div className="mt-3 flex flex-wrap gap-3">
              <Link
                href="/profile"
                className="rounded-lg bg-ember px-4 py-2 text-sm font-semibold text-on-ember"
              >
                {profile?.premium?.active ? "Manage Plus" : "Redeem / preferences"}
              </Link>
              {profile?.premium?.active && (
                <Link
                  href="/play/escape/hard?pack=premium"
                  className="rounded-lg border border-ember/40 px-4 py-2 text-sm font-semibold text-ember"
                >
                  Plus Vault →
                </Link>
              )}
            </div>
          </div>
        )}

        {session?.user && profile?.insights?.unlocks && (
          <div className="rounded-2xl border border-[var(--line)] bg-ink-2/70 p-5">
            <h3 className="font-[family-name:var(--font-display)] text-xl font-bold">
              Unlockables
            </h3>
            <p className="mt-1 text-sm text-fog">
              Earn bonus content as you progress: solve 50 Escape Rooms for
              Exclusive Cases, hold a 7-day streak for Hidden Challenges, and
              solve 100 total puzzles for Impossible Mode.
            </p>
            <div className="mt-3 grid gap-2">
              {profile.insights.unlocks.map((u) => (
                <div
                  key={u.id}
                  className={[
                    "rounded-xl border px-3 py-3 text-sm",
                    u.unlocked
                      ? "border-mint/35 bg-mint/10"
                      : "border-[var(--line)] bg-panel/40",
                  ].join(" ")}
                >
                  <div className="font-semibold">{u.title}</div>
                  <div className="mt-1 text-xs text-fog">{u.description}</div>
                  {u.unlocked && u.id === "impossible_mode" && (
                    <Link
                      href="/play/path/impossible"
                      className="mt-2 inline-block text-ember hover:underline"
                    >
                      Try Impossible →
                    </Link>
                  )}
                  {u.unlocked && u.id === "exclusive_cases" && (
                    <Link
                      href="/play/escape/medium?pack=exclusive"
                      className="mt-2 inline-block text-ember hover:underline"
                    >
                      Open exclusive case →
                    </Link>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        <div className="grid gap-6 lg:grid-cols-2">
          <article
            id="word-puzzles"
            className="scroll-mt-24 rounded-2xl border border-[var(--line)] bg-ink-2/70 p-6"
          >
            <h3 className="font-[family-name:var(--font-display)] text-xl font-bold">
              Word puzzles
            </h3>
            <div className="mt-4 grid gap-3">
              {(() => {
                const play = boardPlay("wordle", WORD_DAILY_DIFFICULTY);
                return (
                  <ChallengePlayRow
                    href={`/play/wordle/${WORD_DAILY_DIFFICULTY}`}
                    title="Word Daily"
                    openSubtitle="Medium · main daily board"
                    doneSubtitle={doneCopy(play)}
                    puzzleType="wordle"
                    difficulty={WORD_DAILY_DIFFICULTY}
                    dateKey={dateKey}
                    serverDone={Boolean(play)}
                  />
                );
              })()}
              {EXTRA_WORDLE_DIFFICULTIES.map((difficulty) => {
                const play = boardPlay("wordle", difficulty);
                const subtitle =
                  difficulty === "easy"
                    ? "Featured above as Daily Word"
                    : difficulty === "hard"
                      ? "Rare words · 7 letters · 5 guesses"
                      : "Do you even know that word? · 500 pts";
                return (
                  <ChallengePlayRow
                    key={difficulty}
                    href={`/play/wordle/${difficulty}`}
                    title={`${wordleTitle(difficulty)} · ${DIFFICULTY_LABELS[difficulty]}`}
                    openSubtitle={subtitle}
                    doneSubtitle={doneCopy(play)}
                    puzzleType="wordle"
                    difficulty={difficulty}
                    dateKey={dateKey}
                    serverDone={Boolean(play)}
                  />
                );
              })}
              {surpriseWordle &&
                (() => {
                  const play = boardPlay(
                    "wordle",
                    surpriseWordle.category.difficulty,
                    surpriseWordle.seasonId,
                  );
                  return (
                    <ChallengePlayRow
                      href={surpriseWordle.href}
                      title={`✦ Surprise · ${surpriseWordle.category.title}`}
                      openSubtitle={surpriseWordle.category.tagline}
                      doneSubtitle={doneCopy(play)}
                      puzzleType="wordle"
                      difficulty={surpriseWordle.category.difficulty}
                      dateKey={dateKey}
                      seasonId={surpriseWordle.seasonId}
                      serverDone={Boolean(play)}
                      featured
                    />
                  );
                })()}
            </div>
          </article>

          <article
            id="escape-room"
            className="scroll-mt-24 rounded-2xl border border-[var(--line)] bg-ink-2/70 p-6"
          >
            <h3 className="font-[family-name:var(--font-display)] text-xl font-bold">
              Escape Room
            </h3>
            <div className="mt-4 grid gap-3">
              {DIFFICULTIES.map((difficulty) => {
                const play = boardPlay("escape", difficulty);
                return (
                  <ChallengePlayRow
                    key={difficulty}
                    href={`/play/escape/${difficulty}`}
                    title={DIFFICULTY_LABELS[difficulty]}
                    openSubtitle={
                      difficulty === "hard"
                        ? "Featured above as Daily Detective"
                        : `${DIFFICULTY_LABELS[difficulty]} escape`
                    }
                    doneSubtitle={doneCopy(play)}
                    puzzleType="escape"
                    difficulty={difficulty}
                    dateKey={dateKey}
                    serverDone={Boolean(play)}
                  />
                );
              })}
            </div>
          </article>

          <article
            id="logic-grid"
            className="scroll-mt-24 rounded-2xl border border-[var(--line)] bg-ink-2/70 p-6"
          >
            <h3 className="font-[family-name:var(--font-display)] text-xl font-bold">
              Logic Grid
            </h3>
            <div className="mt-4 grid gap-3">
              {DIFFICULTIES.map((difficulty) => {
                const play = boardPlay("logic", difficulty);
                return (
                  <ChallengePlayRow
                    key={difficulty}
                    href={`/play/logic/${difficulty}`}
                    title={DIFFICULTY_LABELS[difficulty]}
                    openSubtitle={
                      difficulty === "medium"
                        ? "Featured above as Daily Logic"
                        : difficulty === "easy"
                          ? "3 suspects"
                          : "4 suspects"
                    }
                    doneSubtitle={doneCopy(play)}
                    puzzleType="logic"
                    difficulty={difficulty}
                    dateKey={dateKey}
                    serverDone={Boolean(play)}
                  />
                );
              })}
            </div>
          </article>

          <article
            id="path-puzzle"
            className="scroll-mt-24 rounded-2xl border border-[var(--line)] bg-ink-2/70 p-6"
          >
            <h3 className="font-[family-name:var(--font-display)] text-xl font-bold">
              Path Puzzle
            </h3>
            <div className="mt-4 grid gap-3">
              {DIFFICULTIES.map((difficulty) => {
                const play = boardPlay("path", difficulty);
                return (
                  <ChallengePlayRow
                    key={difficulty}
                    href={`/play/path/${difficulty}`}
                    title={DIFFICULTY_LABELS[difficulty]}
                    openSubtitle={
                      difficulty === "hard"
                        ? "Featured above as Daily Mystery"
                        : difficulty === "easy"
                          ? "Small board"
                          : "Checkpoints"
                    }
                    doneSubtitle={doneCopy(play)}
                    puzzleType="path"
                    difficulty={difficulty}
                    dateKey={dateKey}
                    serverDone={Boolean(play)}
                  />
                );
              })}
            </div>
          </article>

          {WORD_GAME_TYPES.map((puzzleType) => (
            <article
              key={puzzleType}
              id={`${puzzleType}-puzzles`}
              className="scroll-mt-24 rounded-2xl border border-[var(--line)] bg-ink-2/70 p-6"
            >
              <h3 className="font-[family-name:var(--font-display)] text-xl font-bold">
                {PUZZLE_LABELS[puzzleType]}
              </h3>
              <div className="mt-4 grid gap-3">
                {DIFFICULTIES.map((difficulty) => {
                  const play = boardPlay(puzzleType, difficulty);
                  return (
                    <ChallengePlayRow
                      key={difficulty}
                      href={`/play/${puzzleType}/${difficulty}`}
                      title={DIFFICULTY_LABELS[difficulty]}
                      openSubtitle={wordGameBlurb(puzzleType, difficulty)}
                      doneSubtitle={doneCopy(play)}
                      puzzleType={puzzleType}
                      difficulty={difficulty}
                      dateKey={dateKey}
                      serverDone={Boolean(play)}
                    />
                  );
                })}
              </div>
            </article>
          ))}
        </div>
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

function wordGameBlurb(
  puzzleType: (typeof WORD_GAME_TYPES)[number],
  difficulty: Difficulty,
): string {
  switch (puzzleType) {
    case "anagram":
      return difficulty === "easy"
        ? "Unscramble a 5-letter word"
        : difficulty === "medium"
          ? "Six-letter scramble"
          : "Longer scramble · fewer tries";
    case "cryptogram":
      return difficulty === "easy"
        ? "Short phrase · letter hints"
        : difficulty === "medium"
          ? "Decode the cipher"
          : "Sparse reveals";
    case "acrostic":
      return difficulty === "easy"
        ? "Clues spell a short message"
        : difficulty === "medium"
          ? "Longer hidden word"
          : "Tough clues · longer message";
    case "wordladder":
      return difficulty === "easy"
        ? "Short transformation"
        : difficulty === "medium"
          ? "One letter at a time"
          : "Longer chain";
  }
}
