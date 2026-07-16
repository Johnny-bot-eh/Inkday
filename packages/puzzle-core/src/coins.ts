/** Ink Coins economy — earn rates, spend prices, shop catalog, Plus multipliers. */

export const PLUS_COIN_MULTIPLIER = 1.25;
export const PLUS_MONTHLY_STIPEND = 500;

export const COIN_EARN = {
  dailyWin: 35,
  monthlySlot: 60,
  streak7: 100,
  dailyLogin: 25,
  caseFileComplete: 5000,
  achievement: 40,
  monthlyMilestone: {
    junior: 500,
    investigator: 1500,
    master: 3000,
    legendary: 5000,
  } as const,
} as const;

export const COIN_SPEND = {
  hint: 50,
  extraAttempt: 75,
  streakRestore: 200,
  skip: 150,
} as const;

export type CoinItemKind =
  | "consumable"
  | "cosmetic"
  | "pet"
  | "plant"
  | "decoration"
  | "pack";

export type ShopItem = {
  id: string;
  title: string;
  description: string;
  kind: CoinItemKind;
  price: number;
  /** Immediate effect instead of inventory stack */
  effect?: "streak_restore" | "plus_stipend";
  comingSoon?: boolean;
  plusOnly?: boolean;
};

export const SHOP_ITEMS: ShopItem[] = [
  {
    id: "hint",
    title: "Hint",
    description: "Reveal a helpful nudge on a puzzle.",
    kind: "consumable",
    price: COIN_SPEND.hint,
  },
  {
    id: "extra_attempt",
    title: "Extra attempt",
    description: "Add one more try after a failed board.",
    kind: "consumable",
    price: COIN_SPEND.extraAttempt,
  },
  {
    id: "skip",
    title: "Skip puzzle",
    description: "Skip today’s board once (marks it done without a score).",
    kind: "consumable",
    price: COIN_SPEND.skip,
  },
  {
    id: "streak_restore",
    title: "Restore streak",
    description: "Repair a broken daily streak within 48 hours.",
    kind: "consumable",
    price: COIN_SPEND.streakRestore,
    effect: "streak_restore",
  },
  {
    id: "cosmetic_frame_ember",
    title: "Ember profile frame",
    description: "Cosmetic frame for your profile avatar.",
    kind: "cosmetic",
    price: 400,
    comingSoon: true,
  },
  {
    id: "pet_owl_starter",
    title: "Inkday owl",
    description: "Adopt a detective owl companion.",
    kind: "pet",
    price: 800,
    comingSoon: true,
  },
  {
    id: "plant_fern",
    title: "Case-file fern",
    description: "A desk plant that slows (never dies) when you’re away.",
    kind: "plant",
    price: 600,
    comingSoon: true,
  },
  {
    id: "deco_lamp",
    title: "Desk lamp",
    description: "Habitat decoration for companions.",
    kind: "decoration",
    price: 250,
    comingSoon: true,
  },
  {
    id: "coin_pack_small",
    title: "Coin pack (coming soon)",
    description: "Real-money packs will plug in later via Stripe.",
    kind: "pack",
    price: 0,
    comingSoon: true,
    plusOnly: true,
  },
];

export const CONSUMABLE_ITEM_IDS = ["hint", "extra_attempt", "skip"] as const;
export type ConsumableItemId = (typeof CONSUMABLE_ITEM_IDS)[number];

export function isConsumableItemId(id: string): id is ConsumableItemId {
  return (CONSUMABLE_ITEM_IDS as readonly string[]).includes(id);
}

export function getShopItem(id: string): ShopItem | undefined {
  return SHOP_ITEMS.find((i) => i.id === id);
}

export function applyPlusCoinBonus(base: number, isPlus: boolean): number {
  if (!isPlus || base <= 0) return base;
  return Math.round(base * PLUS_COIN_MULTIPLIER);
}

export function monthlyMilestoneCoins(milestoneId: string): number {
  const map = COIN_EARN.monthlyMilestone;
  if (milestoneId in map) {
    return map[milestoneId as keyof typeof map];
  }
  return 0;
}

export type CoinReason =
  | "daily_win"
  | "monthly_slot"
  | "monthly_milestone"
  | "case_file_complete"
  | "streak_7"
  | "daily_login"
  | "achievement"
  | "plus_stipend"
  | "shop_buy"
  | "shop_use"
  | "streak_restore";
