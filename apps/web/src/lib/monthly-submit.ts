/** Shared monthly Case File submit helper for reused daily games. */

import type { ScoreBreakdown } from "@daily-puzzle/puzzle-core";
import { clearMonthlyPlayerNotes } from "@/lib/player-notes";

export type MonthlyPlayContext = {
  collectionId: string;
  slotIndex: number;
};

export type MonthlySubmitData = {
  error?: string;
  score?: number;
  timeBonus?: number;
  breakdown?: ScoreBreakdown;
  elapsedMs?: number;
  cleared?: number;
  total?: number;
  totalBonus?: number;
  newMilestones?: Array<{ title: string }>;
  alreadyCleared?: boolean;
  alreadyResolved?: boolean;
  forfeited?: boolean;
  won?: boolean;
  outcome?: string | null;
  coinsEarned?: number;
  coinBalance?: number;
  xpEarned?: number;
  accountXp?: number;
  accountLevel?: number;
  petLevel?: number | null;
  petStage?: string | null;
  happinessGain?: number;
};

export function caseFileClearLabel(data: MonthlySubmitData): string {
  const parts = [`Case File · ${data.score ?? 0} pts`];
  if (typeof data.timeBonus === "number" && data.timeBonus > 0) {
    parts.push(`speed +${data.timeBonus}`);
  }
  if (typeof data.totalBonus === "number" && data.totalBonus > 0) {
    parts.push(`bonus +${data.totalBonus}`);
  }
  return parts.join(" · ");
}

/** Drop scratch notes when a Case File slot is finished on this device. */
export function dismissMonthlySlotNotes(monthly: MonthlyPlayContext): void {
  clearMonthlyPlayerNotes(monthly.collectionId, monthly.slotIndex);
}

export async function submitMonthlyFromGame(
  monthly: MonthlyPlayContext,
  payload: Record<string, unknown>,
): Promise<{
  ok: boolean;
  status: number;
  data: MonthlySubmitData;
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
  const data = (await res.json()) as MonthlySubmitData;
  if (res.ok) dismissMonthlySlotNotes(monthly);
  return { ok: res.ok, status: res.status, data };
}

export async function forfeitMonthlyFromGame(
  monthly: MonthlyPlayContext,
  outcome: "skipped" | "failed",
  payload: Record<string, unknown> = {},
) {
  return submitMonthlyFromGame(monthly, {
    ...payload,
    forfeit: true,
    outcome,
  });
}
