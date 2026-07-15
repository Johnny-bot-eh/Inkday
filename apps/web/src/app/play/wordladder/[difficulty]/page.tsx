import { WordLadderGame } from "@/components/wordladder-game";
import { LockedPuzzle } from "@/components/locked-puzzle";
import { loadPlayPage } from "@/lib/play-page";

export default async function WordLadderPlayPage({
  params,
}: {
  params: Promise<{ difficulty: string }>;
}) {
  const { difficulty: raw } = await params;
  const page = await loadPlayPage({
    puzzleType: "wordladder",
    difficultyRaw: raw,
  });

  if (page.locked) {
    return (
      <LockedPuzzle title="Impossible Word Ladder" reason={page.lockReason!} />
    );
  }

  return (
    <WordLadderGame
      difficulty={page.difficulty}
      dateKey={page.dateKey}
      signedIn={page.signedIn}
      alreadyPlayed={page.alreadyPlayed}
    />
  );
}
