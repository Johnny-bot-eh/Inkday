import { WordleGame } from "@/components/wordle-game";
import { LockedPuzzle } from "@/components/locked-puzzle";
import { loadPlayPage } from "@/lib/play-page";

export default async function WordlePlayPage({
  params,
  searchParams,
}: {
  params: Promise<{ difficulty: string }>;
  searchParams: Promise<{ category?: string; season?: string }>;
}) {
  const { difficulty: raw } = await params;
  const sp = await searchParams;
  const page = await loadPlayPage({
    puzzleType: "wordle",
    difficultyRaw: raw,
    seasonRaw: sp.season,
    categoryRaw: sp.category,
  });

  if (page.locked) {
    return (
      <LockedPuzzle title="Impossible Word" reason={page.lockReason!} />
    );
  }

  return (
    <WordleGame
      difficulty={page.difficulty}
      dateKey={page.dateKey}
      signedIn={page.signedIn}
      alreadyPlayed={page.alreadyPlayed}
      category={page.categoryId}
      seasonId={page.seasonId}
    />
  );
}
