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

export type ShopItemSlot = "avatar";

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
  /** Cosmetic sub-slot (avatars equip on profile) */
  slot?: ShopItemSlot;
  /** Free starter avatars — always owned, never bought */
  free?: boolean;
};

export const DEFAULT_AVATAR_ID = "avatar_default";

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
  // —— Free starter avatars ——
  {
    id: "avatar_default",
    title: "Inkday mark",
    description: "Classic ink blot — free for everyone.",
    kind: "cosmetic",
    slot: "avatar",
    price: 0,
    free: true,
  },
  {
    id: "avatar_ink",
    title: "Deep ink",
    description: "A darker pour of midnight ink.",
    kind: "cosmetic",
    slot: "avatar",
    price: 0,
    free: true,
  },
  {
    id: "avatar_quill",
    title: "Quill tip",
    description: "A sharp nib ready for the next clue.",
    kind: "cosmetic",
    slot: "avatar",
    price: 0,
    free: true,
  },
  {
    id: "avatar_paper",
    title: "Folded paper",
    description: "A blank page waiting for the next solve.",
    kind: "cosmetic",
    slot: "avatar",
    price: 0,
    free: true,
  },
  {
    id: "avatar_dot",
    title: "Compass dot",
    description: "A single mark to find true north.",
    kind: "cosmetic",
    slot: "avatar",
    price: 0,
    free: true,
  },
  // —— Coin exclusives ——
  {
    id: "avatar_mint",
    title: "Mint ledger",
    description: "Cool mint stamp from the scoring ledger.",
    kind: "cosmetic",
    slot: "avatar",
    price: 180,
  },
  {
    id: "avatar_ember",
    title: "Ember seal",
    description: "Warm ember rings for case-hardened solvers.",
    kind: "cosmetic",
    slot: "avatar",
    price: 200,
  },
  {
    id: "avatar_lantern",
    title: "Path lantern",
    description: "A warm lantern for maze runners.",
    kind: "cosmetic",
    slot: "avatar",
    price: 220,
  },
  {
    id: "avatar_lock",
    title: "Escape lock",
    description: "Padlock from the escape-room desk.",
    kind: "cosmetic",
    slot: "avatar",
    price: 240,
  },
  {
    id: "avatar_stamp",
    title: "Case stamp",
    description: "Red-ink APPROVED for closed cases.",
    kind: "cosmetic",
    slot: "avatar",
    price: 260,
  },
  {
    id: "avatar_vault",
    title: "Vault key",
    description: "Brass-and-ink keyhole for vault hunters.",
    kind: "cosmetic",
    slot: "avatar",
    price: 280,
  },
  {
    id: "avatar_ladder",
    title: "Word ladder",
    description: "Rungs for one-letter climbers.",
    kind: "cosmetic",
    slot: "avatar",
    price: 300,
  },
  {
    id: "avatar_cipher",
    title: "Cipher wheel",
    description: "Rotating letter rings from the cryptogram desk.",
    kind: "cosmetic",
    slot: "avatar",
    price: 320,
  },
  {
    id: "avatar_map",
    title: "Folded map",
    description: "Creased paths and a circled exit.",
    kind: "cosmetic",
    slot: "avatar",
    price: 340,
  },
  {
    id: "avatar_fog",
    title: "Harbor fog",
    description: "Mist over the pier for night solvers.",
    kind: "cosmetic",
    slot: "avatar",
    price: 360,
  },
  {
    id: "avatar_nocturne",
    title: "Nocturne",
    description: "Moonlit indigo for late-night streaks.",
    kind: "cosmetic",
    slot: "avatar",
    price: 400,
  },
  {
    id: "avatar_crimson",
    title: "Crimson blot",
    description: "A bold red pour for high-stakes boards.",
    kind: "cosmetic",
    slot: "avatar",
    price: 450,
  },
  // —— Plus exclusives (claim free while Plus) ——
  {
    id: "avatar_plus_seal",
    title: "Plus seal",
    description: "Official Inkday Plus emblem.",
    kind: "cosmetic",
    slot: "avatar",
    price: 0,
    plusOnly: true,
  },
  {
    id: "avatar_plus_gold",
    title: "Gilded Plus",
    description: "Gold-rimmed portrait for Plus members.",
    kind: "cosmetic",
    slot: "avatar",
    price: 0,
    plusOnly: true,
  },
  {
    id: "avatar_plus_case",
    title: "Case File crest",
    description: "Monthly Case File crest — Plus members only.",
    kind: "cosmetic",
    slot: "avatar",
    price: 0,
    plusOnly: true,
  },
  {
    id: "avatar_plus_star",
    title: "Constellation",
    description: "Star-chart crest for Plus members.",
    kind: "cosmetic",
    slot: "avatar",
    price: 0,
    plusOnly: true,
  },
  {
    id: "avatar_plus_ribbon",
    title: "Ribbon seal",
    description: "Wax ribbon badge — Plus members only.",
    kind: "cosmetic",
    slot: "avatar",
    price: 0,
    plusOnly: true,
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

export const AVATAR_ITEMS = SHOP_ITEMS.filter((i) => i.slot === "avatar");

export const CONSUMABLE_ITEM_IDS = ["hint", "extra_attempt", "skip"] as const;
export type ConsumableItemId = (typeof CONSUMABLE_ITEM_IDS)[number];

export function isConsumableItemId(id: string): id is ConsumableItemId {
  return (CONSUMABLE_ITEM_IDS as readonly string[]).includes(id);
}

export function getShopItem(id: string): ShopItem | undefined {
  return SHOP_ITEMS.find((i) => i.id === id);
}

export function getAvatarItem(id: string): ShopItem | undefined {
  const item = getShopItem(id);
  return item?.slot === "avatar" ? item : undefined;
}

export function isFreeAvatar(id: string): boolean {
  return Boolean(getAvatarItem(id)?.free);
}

export function isAvatarItemId(id: string): boolean {
  return Boolean(getAvatarItem(id));
}

export function resolveAvatarId(id: string | null | undefined): string {
  if (id && getAvatarItem(id)) return id;
  return DEFAULT_AVATAR_ID;
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
