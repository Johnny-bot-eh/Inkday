import type { AchievementId } from "./progress";
import type { MonthlyMilestoneId, MonthlyMilestoneDef } from "./monthly";
import { MONTHLY_MILESTONES } from "./monthly";
import { getShopItem } from "./coins";

/** Achievement → badge avatar shop item (earned only, not purchasable). */
export const ACHIEVEMENT_AVATAR_REWARDS: Partial<
  Record<AchievementId, string>
> = {
  gumshoe_trainee: "avatar_badge_gumshoe",
  filing_cabinet_hero: "avatar_badge_gumshoe",
  sherlock: "avatar_badge_sherlock",
  spreadsheet_suspect: "avatar_badge_logic",
  cross_reference_cactus: "avatar_badge_logic",
  einstein: "avatar_badge_einstein",
  triple_digits: "avatar_badge_master",
  puzzle_master: "avatar_badge_master",
  legend: "avatar_badge_legend",
  season_devotee: "avatar_badge_season",
  weekly_champion: "avatar_badge_weekly",
  challenge_victor: "avatar_badge_weekly",
};

/** Monthly milestone → ribbon accessory (earned only). */
export const MILESTONE_ACCESSORY_REWARDS: Record<MonthlyMilestoneId, string> =
  {
    junior: "accessory_ribbon_junior",
    investigator: "accessory_ribbon_investigator",
    master: "accessory_ribbon_master",
    legendary: "accessory_ribbon_legendary",
  };

export const CASE_FILE_COMPLETE_ACCESSORY_ID = "accessory_ribbon_casefile";

const TOURNAMENT_ACCESSORY_BY_TITLE: Record<string, string> = {
  "Gold Crown": "accessory_crown_gold",
  "Silver Laurel": "accessory_crown_silver",
  "Bronze Seal": "accessory_crown_bronze",
};

export type CosmeticUnlockNotice = {
  id: string;
  title: string;
  description: string;
  /** accessory = equip on profile; avatar = portrait badge */
  kind: "accessory" | "avatar" | "cosmetic";
};

export function avatarRewardForAchievement(
  achievementId: string,
): string | null {
  return (
    ACHIEVEMENT_AVATAR_REWARDS[achievementId as AchievementId] ?? null
  );
}

export function accessoryRewardForMilestone(
  milestoneId: string,
): string | null {
  return (
    MILESTONE_ACCESSORY_REWARDS[milestoneId as MonthlyMilestoneId] ?? null
  );
}

export function accessoryRewardForTournament(
  badgeTitle: string,
): string | null {
  const normalized = badgeTitle.replace(/^Friends\s+/i, "").trim();
  return (
    TOURNAMENT_ACCESSORY_BY_TITLE[normalized] ??
    TOURNAMENT_ACCESSORY_BY_TITLE[badgeTitle] ??
    null
  );
}

export function caseFileCompleteAccessoryId(): string {
  return CASE_FILE_COMPLETE_ACCESSORY_ID;
}

/** Map granted shop item ids into player-facing unlock notices. */
export function cosmeticUnlockNotices(
  itemIds: string[],
): CosmeticUnlockNotice[] {
  const seen = new Set<string>();
  const out: CosmeticUnlockNotice[] = [];
  for (const id of itemIds) {
    if (!id || seen.has(id)) continue;
    seen.add(id);
    const item = getShopItem(id);
    out.push({
      id,
      title: item?.title ?? id,
      description:
        item?.description ??
        (item?.slot === "accessory"
          ? "Equip it on your profile whenever you like."
          : "New unlockable ready."),
      kind:
        item?.slot === "accessory"
          ? "accessory"
          : item?.slot === "avatar"
            ? "avatar"
            : "cosmetic",
    });
  }
  return out;
}

/** Next Case File ribbon the player can still earn this month. */
export function nextCaseFileAccessoryHint(
  cleared: number,
): {
  milestone: MonthlyMilestoneDef;
  accessoryId: string;
  remaining: number;
} | null {
  for (const milestone of MONTHLY_MILESTONES) {
    if (cleared >= milestone.threshold) continue;
    const accessoryId = accessoryRewardForMilestone(milestone.id);
    if (!accessoryId) continue;
    return {
      milestone,
      accessoryId,
      remaining: milestone.threshold - cleared,
    };
  }
  return null;
}
