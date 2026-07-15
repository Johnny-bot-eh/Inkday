import { WordleGame } from "@/components/wordle-game";
import { LockedPuzzle } from "@/components/locked-puzzle";
import { loadPlayPage } from "@/lib/play-page";

export default async function WordlePlayPage({
  params,
}: {
  params: Promise<{ difficulty: string }>;
}) {
  const { difficulty: raw } = await params;
  const page = await loadPlayPage({
    puzzleType: "wordle",
    difficultyRaw: raw,
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
    />
  );
}
