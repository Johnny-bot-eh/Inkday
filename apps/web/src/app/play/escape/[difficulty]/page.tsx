import { EscapeGame } from "@/components/escape-game";
import { LockedPuzzle } from "@/components/locked-puzzle";
import { loadPlayPage } from "@/lib/play-page";
import {
  getExistingPlay,
  userHasPremium,
  userHasUnlock,
} from "@/lib/game-service";
import { getSession } from "@/lib/session";
import { getSeason, todayKey } from "@daily-puzzle/puzzle-core";

export default async function EscapePlayPage({
  params,
  searchParams,
}: {
  params: Promise<{ difficulty: string }>;
  searchParams: Promise<{ pack?: string; season?: string }>;
}) {
  const { difficulty: raw } = await params;
  const { pack: packRaw, season: seasonRaw } = await searchParams;
  const pack =
    packRaw === "exclusive"
      ? "exclusive"
      : packRaw === "premium"
        ? "premium"
        : "standard";

  if (pack === "exclusive") {
    const session = await getSession();
    if (!session?.user) {
      return (
        <LockedPuzzle
          title="Exclusive Cases"
          reason="Sign in and unlock Exclusive Cases (50 detective clears) to open this file."
        />
      );
    }
    const unlocked = await userHasUnlock(session.user.id, "exclusive_cases");
    if (!unlocked) {
      return (
        <LockedPuzzle
          title="Exclusive Cases"
          reason="Solve 50 Escape Room puzzles to unlock exclusive case files."
        />
      );
    }
  }

  if (pack === "premium") {
    const session = await getSession();
    if (!session?.user) {
      return (
        <LockedPuzzle
          title="Inkday Plus"
          reason="Sign in and activate Inkday Plus to open Plus case files."
        />
      );
    }
    if (!(await userHasPremium(session.user.id))) {
      return (
        <LockedPuzzle
          title="Inkday Plus"
          reason="Plus Vault cases are for Inkday Plus members. Redeem a promo on your profile."
        />
      );
    }

    const dateKey = todayKey();
    const existing = await getExistingPlay({
      userId: session.user.id,
      puzzleType: "escape",
      difficulty: raw as "hard",
      dateKey,
      seasonId: "plus",
    });

    return (
      <EscapeGame
        difficulty={raw as "hard"}
        dateKey={dateKey}
        signedIn
        alreadyPlayed={
          existing ? { score: existing.score, won: existing.won } : null
        }
        pack="premium"
      />
    );
  }

  const page = await loadPlayPage({
    puzzleType: "escape",
    difficultyRaw: raw,
    seasonRaw,
  });

  if (page.locked) {
    const season = page.seasonId ? getSeason(page.seasonId) : null;
    return (
      <LockedPuzzle
        title={season?.title ?? "Impossible Escape"}
        reason={page.lockReason!}
      />
    );
  }

  return (
    <EscapeGame
      difficulty={page.difficulty}
      dateKey={page.dateKey}
      signedIn={page.signedIn}
      alreadyPlayed={page.alreadyPlayed}
      pack={pack}
      seasonId={page.seasonId}
    />
  );
}
