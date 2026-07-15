import { LogicGame } from "@/components/logic-game";
import { LockedPuzzle } from "@/components/locked-puzzle";
import { loadPlayPage } from "@/lib/play-page";
import { getExistingPlay, userHasPremium } from "@/lib/game-service";
import { getSession } from "@/lib/session";
import { getSeason, todayKey } from "@daily-puzzle/puzzle-core";

export default async function LogicPlayPage({
  params,
  searchParams,
}: {
  params: Promise<{ difficulty: string }>;
  searchParams: Promise<{ season?: string; premium?: string }>;
}) {
  const { difficulty: raw } = await params;
  const { season: seasonRaw, premium: premiumRaw } = await searchParams;
  const wantPremium = premiumRaw === "1" || premiumRaw === "true";

  if (wantPremium) {
    const session = await getSession();
    if (!session?.user) {
      return (
        <LockedPuzzle
          title="Inkday Plus"
          reason="Sign in and activate Inkday Plus to open member boards."
        />
      );
    }
    if (!(await userHasPremium(session.user.id))) {
      return (
        <LockedPuzzle
          title="Inkday Plus"
          reason="Member’s Deduction is for Plus. Redeem a promo on your profile."
        />
      );
    }

    const dateKey = todayKey();
    const existing = await getExistingPlay({
      userId: session.user.id,
      puzzleType: "logic",
      difficulty: raw as "hard",
      dateKey,
      seasonId: "plus",
    });

    return (
      <LogicGame
        difficulty={raw as "hard"}
        dateKey={dateKey}
        signedIn
        alreadyPlayed={
          existing ? { score: existing.score, won: existing.won } : null
        }
        seasonId="plus"
        premium
      />
    );
  }

  const page = await loadPlayPage({
    puzzleType: "logic",
    difficultyRaw: raw,
    seasonRaw,
  });

  if (page.locked) {
    const season = page.seasonId ? getSeason(page.seasonId) : null;
    return (
      <LockedPuzzle
        title={season?.title ?? "Impossible Logic"}
        reason={page.lockReason!}
      />
    );
  }

  return (
    <LogicGame
      difficulty={page.difficulty}
      dateKey={page.dateKey}
      signedIn={page.signedIn}
      alreadyPlayed={page.alreadyPlayed}
      seasonId={page.seasonId}
    />
  );
}
