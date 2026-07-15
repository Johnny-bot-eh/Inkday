import { CryptogramGame } from "@/components/cryptogram-game";
import { LockedPuzzle } from "@/components/locked-puzzle";
import { loadPlayPage } from "@/lib/play-page";

export default async function CryptogramPlayPage({
  params,
}: {
  params: Promise<{ difficulty: string }>;
}) {
  const { difficulty: raw } = await params;
  const page = await loadPlayPage({
    puzzleType: "cryptogram",
    difficultyRaw: raw,
  });

  if (page.locked) {
    return (
      <LockedPuzzle title="Impossible Cryptogram" reason={page.lockReason!} />
    );
  }

  return (
    <CryptogramGame
      difficulty={page.difficulty}
      dateKey={page.dateKey}
      signedIn={page.signedIn}
      alreadyPlayed={page.alreadyPlayed}
    />
  );
}
