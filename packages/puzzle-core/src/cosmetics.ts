import type { AchievementId } from "./progress";
import type { MonthlyMilestoneId } from "./monthly";

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
  return TOURNAMENT_ACCESSORY_BY_TITLE[badgeTitle] ?? null;
}

export function caseFileCompleteAccessoryId(): string {
  return CASE_FILE_COMPLETE_ACCESSORY_ID;
}
