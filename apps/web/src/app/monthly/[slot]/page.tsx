import { notFound } from "next/navigation";
import {
  collectionIdForDate,
  getMonthlySlot,
} from "@daily-puzzle/puzzle-core";
import { MonthlySlotPlayer } from "@/components/monthly-slot-player";
import {
  getMonthlyCompletion,
  monthlyOutcomeFromMeta,
} from "@/lib/game-service";
import { getSession } from "@/lib/session";

export const dynamic = "force-dynamic";

export default async function MonthlySlotPage({
  params,
}: {
  params: Promise<{ slot: string }>;
}) {
  const { slot: raw } = await params;
  const slotIndex = Number(raw);
  if (!Number.isInteger(slotIndex)) notFound();

  const collectionId = collectionIdForDate();
  const slot = getMonthlySlot(collectionId, slotIndex);
  if (!slot) notFound();

  const session = await getSession();
  const existing = session?.user
    ? await getMonthlyCompletion(session.user.id, collectionId, slotIndex)
    : null;

  const alreadyResolved = Boolean(existing);
  const priorWon = Boolean(existing?.won);
  const priorOutcome = existing
    ? existing.won
      ? ("cleared" as const)
      : monthlyOutcomeFromMeta(existing.metaJson)
    : null;

  return (
    <MonthlySlotPlayer
      collectionId={collectionId}
      slotIndex={slot.index}
      puzzleType={slot.puzzleType}
      difficulty={slot.difficulty}
      seedKey={slot.seedKey}
      label={slot.label}
      points={slot.points}
      alreadyCleared={priorWon}
      alreadyResolved={alreadyResolved}
      priorOutcome={priorOutcome}
      priorScore={existing?.score}
      signedIn={Boolean(session?.user)}
    />
  );
}
