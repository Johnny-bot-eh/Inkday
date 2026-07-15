import { PathGame } from "@/components/path-game";
import { LockedPuzzle } from "@/components/locked-puzzle";
import { loadPlayPage } from "@/lib/play-page";

export default async function PathPlayPage({
  params,
}: {
  params: Promise<{ difficulty: string }>;
}) {
  const { difficulty: raw } = await params;
  const page = await loadPlayPage({
    puzzleType: "path",
    difficultyRaw: raw,
  });

  if (page.locked) {
    return (
      <LockedPuzzle title="Impossible Path" reason={page.lockReason!} />
    );
  }

  return (
    <PathGame
      difficulty={page.difficulty}
      dateKey={page.dateKey}
      signedIn={page.signedIn}
      alreadyPlayed={page.alreadyPlayed}
    />
  );
}
