import { LogicGame } from "@/components/logic-game";
import { LockedPuzzle } from "@/components/locked-puzzle";
import { loadPlayPage } from "@/lib/play-page";

export default async function LogicPlayPage({
  params,
}: {
  params: Promise<{ difficulty: string }>;
}) {
  const { difficulty: raw } = await params;
  const page = await loadPlayPage({
    puzzleType: "logic",
    difficultyRaw: raw,
  });

  if (page.locked) {
    return (
      <LockedPuzzle title="Impossible Logic" reason={page.lockReason!} />
    );
  }

  return (
    <LogicGame
      difficulty={page.difficulty}
      dateKey={page.dateKey}
      signedIn={page.signedIn}
      alreadyPlayed={page.alreadyPlayed}
    />
  );
}
