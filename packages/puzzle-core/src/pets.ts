import type { Difficulty } from "./types";
import { dayIndex, hashSeed, pickIndex } from "./types";

/** Permanent account XP never decreases. */

/**
 * XP model:
 * - Pet XP is per companion — grows that pet’s level/stage from hatch.
 * - Account XP is the unlock pool: total XP from every pet + other progression
 *   (historical puzzle wins, monthly clears, streak bonuses). Higher account XP
 *   unlocks more shop categories and garden goods for your pets.
 */
export type PetSpeciesId = "ink_owl" | "moss_fox" | "star_cat";

export type PetPersonalityId =
  | "curious"
  | "lazy"
  | "playful"
  | "shy"
  | "food_lover"
  | "mischievous"
  | "sassy";

export type PetStage =
  | "egg"
  | "baby"
  | "teen"
  | "adult"
  | "mythical"
  | "legendary";

export type HappinessState =
  | "ecstatic"
  | "happy"
  | "normal"
  | "sleepy"
  | "sad";

export type ShopCategoryId =
  | "food"
  | "garden"
  | "flowers"
  | "ponds"
  | "trees"
  | "seasonal"
  | "legendary";

export type PetSpecies = {
  id: PetSpeciesId;
  title: string;
  eggTitle: string;
  tagline: string;
  colors: { primary: string; secondary: string; accent: string };
};

export type PetPersonality = {
  id: PetPersonalityId;
  title: string;
  lines: {
    idle: string[];
    happy: string[];
    sleepy: string[];
    welcomeBack: string[];
    gift: string[];
  };
};

export const PET_SPECIES: Record<PetSpeciesId, PetSpecies> = {
  ink_owl: {
    id: "ink_owl",
    title: "Ink Owl",
    eggTitle: "Ink Egg",
    tagline: "A quiet detective with midnight feathers.",
    colors: { primary: "#2a3344", secondary: "#8fa3bf", accent: "#e8b86d" },
  },
  moss_fox: {
    id: "moss_fox",
    title: "Moss Fox",
    eggTitle: "Moss Egg",
    tagline: "Soft ferns and clever garden steps.",
    colors: { primary: "#2f5d3a", secondary: "#a8d5a2", accent: "#f0c27a" },
  },
  star_cat: {
    id: "star_cat",
    title: "Star Cat",
    eggTitle: "Star Egg",
    tagline: "A constellation curled into a companion.",
    colors: { primary: "#2b2150", secondary: "#b9a6ff", accent: "#f6e27a" },
  },
};

export const STARTER_SPECIES: PetSpeciesId[] = [
  "ink_owl",
  "moss_fox",
  "star_cat",
];

export const PET_PERSONALITIES: Record<PetPersonalityId, PetPersonality> = {
  curious: {
    id: "curious",
    title: "Curious",
    lines: {
      idle: ["What's that over there?", "I found a new corner of the garden."],
      happy: ["I found something shiny for you!", "Look what I sniffed out!"],
      sleepy: ["Still curious… just quietly.", "I'll investigate later."],
      welcomeBack: [
        "Welcome back! I saved a clue for you.",
        "I explored while you were away.",
      ],
      gift: ["I found something shiny for you!", "Look — a surprise!"],
    },
  },
  lazy: {
    id: "lazy",
    title: "Lazy",
    lines: {
      idle: ["I'm still sleepy today.", "Nap first, puzzles later."],
      happy: ["Okay… that was nice.", "A snack and a stretch."],
      sleepy: ["Zzz… don't mind me.", "Wake me for cake."],
      welcomeBack: [
        "Oh, you're back. I barely moved.",
        "I waited… mostly by napping.",
      ],
      gift: ["I rolled onto this. Take it.", "Found it without standing up."],
    },
  },
  playful: {
    id: "playful",
    title: "Playful",
    lines: {
      idle: ["Let's solve today's puzzle together!", "Tag — you're it!"],
      happy: ["Best day ever!", "Again! Again!"],
      sleepy: ["Play later… soft pillow now.", "My bounce is on pause."],
      welcomeBack: [
        "You're back! I missed our games.",
        "I've been waiting to play!",
      ],
      gift: ["Catch!", "I brought you a toy-shaped surprise!"],
    },
  },
  shy: {
    id: "shy",
    title: "Shy",
    lines: {
      idle: ["Hi… quietly.", "I'll stay beside you."],
      happy: ["That was… really nice.", "Thank you for noticing me."],
      sleepy: ["I'm hiding under the leaves.", "Soft shadows feel safer."],
      welcomeBack: [
        "Welcome back. I missed you.",
        "I waited behind the flowers.",
      ],
      gift: ["I… left this for you.", "Please take it — carefully."],
    },
  },
  food_lover: {
    id: "food_lover",
    title: "Food Lover",
    lines: {
      idle: ["Can I have another snack?", "Is that an apple I smell?"],
      happy: ["Delicious!", "More crumbs, please."],
      sleepy: ["Hunger nap…", "Dreaming of cake."],
      welcomeBack: [
        "You're back! Did you bring snacks?",
        "I saved a crumb for sharing.",
      ],
      gift: ["I traded a crumb for this!", "Snack-powered treasure!"],
    },
  },
  mischievous: {
    id: "mischievous",
    title: "Mischievous",
    lines: {
      idle: ["Hehe… I hid a present somewhere.", "Don't look behind you."],
      happy: ["Gotcha!", "My schemes are thriving."],
      sleepy: ["Even tricksters rest.", "Plotting… later."],
      welcomeBack: [
        "Hehe. I rearranged one flower.",
        "I kept a secret while you were gone.",
      ],
      gift: ["Hehe… I hid a present somewhere.", "Surprise!"],
    },
  },
  sassy: {
    id: "sassy",
    title: "Sassy",
    lines: {
      idle: ["Obviously I'm fabulous.", "Solve faster — I'm waiting."],
      happy: ["Acceptable.", "You may continue praising me."],
      sleepy: ["Do not disturb the icon.", "Even legends rest."],
      welcomeBack: [
        "Took you long enough.",
        "I missed you — slightly.",
      ],
      gift: ["You're welcome.", "Don't lose this. It's tasteful."],
    },
  },
};

export const PERSONALITY_IDS = Object.keys(
  PET_PERSONALITIES,
) as PetPersonalityId[];

/** Level thresholds for evolution stages (inclusive minimum level). */
export const STAGE_LEVELS: Array<{ stage: PetStage; minLevel: number }> = [
  { stage: "egg", minLevel: 1 },
  { stage: "baby", minLevel: 15 },
  { stage: "teen", minLevel: 30 },
  { stage: "adult", minLevel: 50 },
  { stage: "mythical", minLevel: 75 },
  { stage: "legendary", minLevel: 100 },
];

/** Shop category unlock levels. */
export const SHOP_UNLOCK_LEVELS: Record<ShopCategoryId, number> = {
  food: 1,
  garden: 1,
  flowers: 20,
  ponds: 40,
  trees: 60,
  seasonal: 80,
  legendary: 100,
};

export const XP_AWARD = {
  dailyWin: {
    easy: 12,
    medium: 20,
    hard: 35,
    obscure: 50,
    impossible: 60,
  } as Record<Difficulty, number>,
  monthlySlot: 40,
  streak7: 75,
  /** Base XP for the first purchase of a garden decoration. */
  gardenBuyBase: 6,
} as const;

/** Account levels that unlock new decoration tiers. */
export const DECORATION_UNLOCK_LEVELS = [
  1, 5, 10, 20, 30, 40, 50, 60, 80, 100,
] as const;

export function nextDecorationUnlockLevel(
  accountLevel: number,
): number | null {
  const level = Math.max(1, Math.floor(accountLevel));
  for (const unlock of DECORATION_UNLOCK_LEVELS) {
    if (unlock > level) return unlock;
  }
  return null;
}

/** Unlocked decorations always show; locked ones only at the next unlock tier. */
export function isDecorationVisibleInShop(
  requiredLevel: number,
  accountLevel: number,
): boolean {
  const need = Math.max(1, Math.floor(requiredLevel));
  const level = Math.max(0, Math.floor(accountLevel));
  if (need <= level) return true;
  const next = nextDecorationUnlockLevel(level);
  return next != null && need === next;
}

/** XP for buying a decoration; drops sharply on repeat purchases. */
export function xpForGardenBuy(
  requiredLevel = 1,
  ownedBefore = 0,
): number {
  const level = Math.max(1, Math.floor(requiredLevel));
  const base = XP_AWARD.gardenBuyBase + level;
  const copies = Math.max(0, Math.floor(ownedBefore));
  const factor = Math.pow(0.3, copies);
  return Math.max(1, Math.round(base * factor));
}

/** @deprecated Prefer xpForGardenBuy — kept for older callers. */
export function xpForGardenPlace(requiredLevel = 1): number {
  return xpForGardenBuy(requiredLevel, 0);
}

export const HAPPINESS = {
  max: 100,
  decayPerDay: 5,
  petBonus: 5,
  food: {
    food_apple: 10,
    food_cookie: 24,
    food_cake: 55,
  } as Record<string, number>,
  dailyPuzzleBonus: 10,
  streakBonus: 5,
  giftThreshold: 90,
} as const;

export const FOOD_ITEM_IDS = [
  "food_apple",
  "food_cookie",
  "food_cake",
] as const;
export type FoodItemId = (typeof FOOD_ITEM_IDS)[number];

export function isFoodItemId(id: string): id is FoodItemId {
  return (FOOD_ITEM_IDS as readonly string[]).includes(id);
}

/**
 * XP required to reach a given level from the previous one.
 * Level 1 starts at 0 XP; level N requires cumulative sum.
 */
export function xpToNextLevel(level: number): number {
  const safe = Math.max(1, Math.floor(level));
  return 40 + safe * 18;
}

/** Convert total XP into level (min 1) and progress toward next. */
export function levelFromXp(totalXp: number): {
  level: number;
  xpIntoLevel: number;
  xpForNext: number;
  totalXp: number;
} {
  let remaining = Math.max(0, Math.floor(totalXp));
  let level = 1;
  while (level < 200) {
    const need = xpToNextLevel(level);
    if (remaining < need) {
      return {
        level,
        xpIntoLevel: remaining,
        xpForNext: need,
        totalXp: Math.max(0, Math.floor(totalXp)),
      };
    }
    remaining -= need;
    level += 1;
  }
  return {
    level: 200,
    xpIntoLevel: 0,
    xpForNext: xpToNextLevel(200),
    totalXp: Math.max(0, Math.floor(totalXp)),
  };
}

export function stageFromLevel(level: number): PetStage {
  let stage: PetStage = "egg";
  for (const row of STAGE_LEVELS) {
    if (level >= row.minLevel) stage = row.stage;
  }
  return stage;
}

export function happinessState(value: number): HappinessState {
  if (value >= 100) return "ecstatic";
  if (value >= 75) return "happy";
  if (value >= 50) return "normal";
  if (value >= 25) return "sleepy";
  return "sad";
}

export function clampHappiness(value: number): number {
  return Math.max(0, Math.min(HAPPINESS.max, Math.round(value)));
}

/**
 * Lazy happiness decay: −5 per full UTC day since last update.
 * Never below 0; never removes XP/levels.
 */
export function decayedHappiness(
  base: number,
  updatedAt: Date | number | null | undefined,
  now = new Date(),
): number {
  if (!updatedAt) return clampHappiness(base);
  const then =
    typeof updatedAt === "number" ? updatedAt : updatedAt.getTime();
  const elapsedMs = Math.max(0, now.getTime() - then);
  const fullDays = Math.floor(elapsedMs / 86_400_000);
  return clampHappiness(base - fullDays * HAPPINESS.decayPerDay);
}

export function daysAway(
  updatedAt: Date | number | null | undefined,
  now = new Date(),
): number {
  if (!updatedAt) return 0;
  const then =
    typeof updatedAt === "number" ? updatedAt : updatedAt.getTime();
  return Math.max(0, Math.floor((now.getTime() - then) / 86_400_000));
}

export function shopCategoryUnlocked(
  accountLevel: number,
  category: ShopCategoryId,
): boolean {
  return accountLevel >= SHOP_UNLOCK_LEVELS[category];
}

export function requiredLevelForShopItem(
  category: ShopCategoryId | null | undefined,
): number {
  if (!category) return 1;
  return SHOP_UNLOCK_LEVELS[category] ?? 1;
}

export function pickPersonality(
  userId: string,
  speciesId: PetSpeciesId,
): PetPersonalityId {
  const seed = hashSeed("pet-personality", userId, speciesId);
  return PERSONALITY_IDS[pickIndex(seed, PERSONALITY_IDS.length)]!;
}

export function dialogueFor(
  personalityId: PetPersonalityId,
  mood: keyof PetPersonality["lines"],
  salt = 0,
): string {
  const pack = PET_PERSONALITIES[personalityId];
  const lines = pack.lines[mood];
  return lines[salt % lines.length]!;
}

export function welcomeBackLine(
  personalityId: PetPersonalityId,
  awayDays: number,
  dateKey: string,
): string {
  if (awayDays <= 0) {
    return dialogueFor(personalityId, "idle", dayIndex(dateKey));
  }
  if (awayDays >= 28) {
    return "I've been waiting for you… I took a long nap.";
  }
  if (awayDays >= 7) {
    return "Welcome back! I missed solving puzzles with you.";
  }
  if (awayDays >= 3) {
    return "I got a little sleepy while you were away.";
  }
  return dialogueFor(personalityId, "welcomeBack", dayIndex(dateKey));
}

export type PetGiftKind =
  | "coins_25"
  | "coins_50"
  | "hint"
  | "avatar"
  | "garden_cosmetic";

export type PetGiftDef = {
  kind: PetGiftKind;
  weight: number;
  coins?: number;
  itemId?: string;
};

/** Weighted daily gift table when happiness ≥ 90. */
export const PET_GIFT_TABLE: PetGiftDef[] = [
  { kind: "coins_25", weight: 25, coins: 25 },
  { kind: "coins_50", weight: 20, coins: 50 },
  { kind: "hint", weight: 10, itemId: "hint" },
  { kind: "avatar", weight: 5, itemId: "avatar_fog" },
  { kind: "garden_cosmetic", weight: 5, itemId: "deco_flower_daisy" },
];

export function rollPetGift(
  userId: string,
  dateKey: string,
  petId: string,
): PetGiftDef {
  const seed = hashSeed("pet-gift", userId, dateKey, petId);
  const total = PET_GIFT_TABLE.reduce((sum, g) => sum + g.weight, 0);
  let roll = pickIndex(seed, Math.max(1, total));
  for (const gift of PET_GIFT_TABLE) {
    if (roll < gift.weight) return gift;
    roll -= gift.weight;
  }
  return PET_GIFT_TABLE[0]!;
}

export function xpForDailyWin(difficulty: Difficulty): number {
  return XP_AWARD.dailyWin[difficulty] ?? XP_AWARD.dailyWin.medium;
}

export function xpForMonthlySlot(): number {
  return XP_AWARD.monthlySlot;
}

export function xpForStreak7(): number {
  return XP_AWARD.streak7;
}

export const DECORATION_ITEM_IDS = [
  "deco_starter_moss",
  "deco_starter_pebble",
  "deco_starter_fern",
  "deco_clover",
  "deco_mushroom",
  "deco_pebble_stack",
  "deco_dandelion",
  "deco_grass_tuft",
  "deco_twig",
  "deco_berry_bush",
  "deco_toadstool",
  "deco_wildflower",
  "deco_acorn_pile",
  "deco_fern_pot",
  "deco_snail_shell",
  "deco_sunflower",
  "deco_birdbath",
  "deco_watering_can",
  "deco_lily",
  "deco_wheelbarrow",
  "deco_beehive",
  "deco_flower_daisy",
  "deco_flower_tulip",
  "deco_flower_lantern",
  "deco_rose",
  "deco_lavender",
  "deco_orchid",
  "deco_ivy_pot",
  "deco_log_bench",
  "deco_crystal",
  "deco_wind_chime",
  "deco_stone_lantern",
  "deco_hammock",
  "deco_scarecrow",
  "deco_pond",
  "deco_reeds",
  "deco_stepping_stones",
  "deco_koi_bridge",
  "deco_lily_pad",
  "deco_dragonfly",
  "deco_mini_fountain",
  "deco_vine_arch",
  "deco_garden_statue",
  "deco_trellis",
  "deco_gazebo_mini",
  "deco_moon_gate",
  "deco_tree_oak",
  "deco_tree_willow",
  "deco_pine",
  "deco_birch",
  "deco_maple",
  "deco_bamboo",
  "deco_seasonal_lantern",
  "deco_festival_banner",
  "deco_firefly_jar",
  "deco_snow_lantern",
  "deco_harvest_wreath",
  "deco_legendary_obelisk",
  "deco_mythic_gate",
  "deco_aurora_spire",
  "deco_starfall_orb",
  "deco_eternal_fountain",
] as const;

export type DecorationItemId = (typeof DECORATION_ITEM_IDS)[number];

/**
 * Legacy IDs for scenery that now lives in the habitat wallpaper —
 * not placeable inventory decorations.
 */
export const STARTER_DECORATION_IDS = [
  "deco_starter_moss",
  "deco_starter_pebble",
  "deco_starter_fern",
] as const;

export function isHabitatDecorItemId(id: string): boolean {
  return (STARTER_DECORATION_IDS as readonly string[]).includes(id);
}

export function isDecorationItemId(id: string): id is DecorationItemId {
  return (DECORATION_ITEM_IDS as readonly string[]).includes(id);
}
