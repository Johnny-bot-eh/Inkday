import { PathGame } from "@/components/path-game";
import { LockedPuzzle } from "@/components/locked-puzzle";
import { loadPlayPage } from "@/lib/play-page";
import { getSeason } from "@daily-puzzle/puzzle-core";

export default async function PathPlayPage({
  params,
  searchParams,
}: {
  params: Promise<{ difficulty: string }>;
  searchParams: Promise<{ season?: string }>;
}) {
  const { difficulty: raw } = await params;
  const { season: seasonRaw } = await searchParams;
  const page = await loadPlayPage({
    puzzleType: "path",
    difficultyRaw: raw,
    seasonRaw,
  });

  if (page.locked) {
    const season = page.seasonId ? getSeason(page.seasonId) : null;
    return (
      <LockedPuzzle
        title={season?.title ?? "Impossible Path"}
        reason={page.lockReason!}
      />
    );
  }

  return (
    <PathGame
      difficulty={page.difficulty}
      dateKey={page.dateKey}
      signedIn={page.signedIn}
      alreadyPlayed={page.alreadyPlayed}
      seasonId={page.seasonId}
    />
  );
}
