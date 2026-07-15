import { EscapeGame } from "@/components/escape-game";
import { LockedPuzzle } from "@/components/locked-puzzle";
import { loadPlayPage } from "@/lib/play-page";
import { userHasUnlock } from "@/lib/game-service";
import { getSession } from "@/lib/session";

export default async function EscapePlayPage({
  params,
  searchParams,
}: {
  params: Promise<{ difficulty: string }>;
  searchParams: Promise<{ pack?: string }>;
}) {
  const { difficulty: raw } = await params;
  const { pack: packRaw } = await searchParams;
  const pack = packRaw === "exclusive" ? "exclusive" : "standard";

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

  const page = await loadPlayPage({
    puzzleType: "escape",
    difficultyRaw: raw,
  });

  if (page.locked) {
    return (
      <LockedPuzzle title="Impossible Escape" reason={page.lockReason!} />
    );
  }

  return (
    <EscapeGame
      difficulty={page.difficulty}
      dateKey={page.dateKey}
      signedIn={page.signedIn}
      alreadyPlayed={page.alreadyPlayed}
      pack={pack}
    />
  );
}
