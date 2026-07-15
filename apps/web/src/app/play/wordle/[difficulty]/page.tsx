import { notFound } from "next/navigation";
import {
  DIFFICULTIES,
  type Difficulty,
  todayKey,
} from "@daily-puzzle/puzzle-core";
import { WordleGame } from "@/components/wordle-game";
import { getExistingPlay } from "@/lib/game-service";
import { getSession } from "@/lib/session";

export default async function WordlePlayPage({
  params,
}: {
  params: Promise<{ difficulty: string }>;
}) {
  const { difficulty: raw } = await params;
  if (!DIFFICULTIES.includes(raw as Difficulty)) notFound();
  const difficulty = raw as Difficulty;
  const session = await getSession();
  const dateKey = todayKey();
  const existing = session?.user
    ? await getExistingPlay({
        userId: session.user.id,
        puzzleType: "wordle",
        difficulty,
        dateKey,
      })
    : null;

  return (
    <WordleGame
      difficulty={difficulty}
      dateKey={dateKey}
      signedIn={Boolean(session?.user)}
      alreadyPlayed={
        existing
          ? { score: existing.score, won: existing.won }
          : null
      }
    />
  );
}
