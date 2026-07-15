import type { DailyChallenge } from "./types";

/** Points of Inkday Plus beyond the free game — no score bonus (anti pay-to-win). */
export const PLUS_SCORE_BONUS = 0;

export const PREMIUM_PERKS = [
  {
    id: "plus_boards",
    title: "Plus case files",
    description: "Extra daily Escape boards reserved for Plus members.",
  },
  {
    id: "streak_freeze",
    title: "Weekly streak freeze",
    description: "Protect your daily streak once per UTC week if you miss a day.",
  },
  {
    id: "reminders",
    title: "Priority reminders",
    description: "Choose when Inkday should nudge you (email wiring comes next).",
  },
] as const;

/** Limited Plus-only boards (gated by membership, not season calendar). */
export const PREMIUM_CHALLENGES: DailyChallenge[] = [
  {
    id: "plus-vault",
    title: "Plus Vault",
    difficultyLabel: "Hard",
    puzzleType: "escape",
    difficulty: "hard",
    href: "/play/escape/hard?pack=premium",
  },
  {
    id: "plus-grid",
    title: "Member’s Deduction",
    difficultyLabel: "Hard",
    puzzleType: "logic",
    difficulty: "hard",
    href: "/play/logic/hard?premium=1",
  },
];

export type PremiumStatusView = {
  active: boolean;
  tier: "plus" | null;
  source: "promo" | "manual" | "stripe" | null;
  endsAt: string | null;
  streakFreezeAvailable: boolean;
};

export function isPremiumActive(opts: {
  status: string;
  endsAt: Date | number | null | undefined;
  now?: Date;
}): boolean {
  if (opts.status !== "active") return false;
  if (opts.endsAt == null) return true;
  const end =
    opts.endsAt instanceof Date
      ? opts.endsAt.getTime()
      : new Date(opts.endsAt).getTime();
  return end > (opts.now ?? new Date()).getTime();
}

export function plusBonus(_active: boolean): number {
  // Kept for ScoreBreakdown compat — Plus never adds points.
  return 0;
}

export type NotificationPrefView = {
  emailEnabled: boolean;
  dailyReminder: boolean;
  streakAtRisk: boolean;
  friendChallenge: boolean;
  tournamentResult: boolean;
  seasonStart: boolean;
  reminderHourUtc: number;
};

export const DEFAULT_NOTIFICATION_PREFS: NotificationPrefView = {
  emailEnabled: true,
  dailyReminder: true,
  streakAtRisk: true,
  friendChallenge: true,
  tournamentResult: true,
  seasonStart: true,
  reminderHourUtc: 14,
};
