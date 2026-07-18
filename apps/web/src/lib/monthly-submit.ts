/** Shared monthly Case File submit helper for reused daily games. */

export type MonthlyPlayContext = {
  collectionId: string;
  slotIndex: number;
};

export async function submitMonthlyFromGame(
  monthly: MonthlyPlayContext,
  payload: Record<string, unknown>,
): Promise<{
  ok: boolean;
  status: number;
  data: {
    error?: string;
    score?: number;
    cleared?: number;
    total?: number;
    totalBonus?: number;
    newMilestones?: Array<{ title: string }>;
    alreadyCleared?: boolean;
    coinsEarned?: number;
    coinBalance?: number;
    xpEarned?: number;
    accountXp?: number;
    accountLevel?: number;
    petLevel?: number | null;
    petStage?: string | null;
    happinessGain?: number;
  };
}> {
  const res = await fetch("/api/monthly/submit", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      collectionId: monthly.collectionId,
      slotIndex: monthly.slotIndex,
      ...payload,
    }),
  });
  const data = await res.json();
  return { ok: res.ok, status: res.status, data };
}
