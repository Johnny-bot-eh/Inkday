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
      idle: [
        "What's that over there?",
        "I found a new corner of the garden.",
        "Hmm… interesting footprints.",
        "Can we investigate something next?",
        "I catalogued three suspicious pebbles.",
      ],
      happy: [
        "I found something shiny for you!",
        "Look what I sniffed out!",
        "My whiskers are buzzing with clues!",
        "Today feels like a mystery waiting to happen.",
        "I love when the garden has secrets.",
      ],
      sleepy: [
        "Still curious… just quietly.",
        "I'll investigate later.",
        "Even detectives need naps.",
        "Dreaming of open case files…",
      ],
      welcomeBack: [
        "Welcome back! I saved a clue for you.",
        "I explored while you were away.",
        "I kept watch — and took notes.",
        "You're back! Tell me everything.",
      ],
      gift: [
        "I found something shiny for you!",
        "Look — a surprise!",
        "This mystery came with a reward.",
        "I dug this up just for you.",
      ],
    },
  },
  lazy: {
    id: "lazy",
    title: "Lazy",
    lines: {
      idle: [
        "I'm still sleepy today.",
        "Nap first, puzzles later.",
        "Gravity is winning.",
        "If you need me, I'll be horizontal.",
        "Effort is optional before noon.",
      ],
      happy: [
        "Okay… that was nice.",
        "A snack and a stretch.",
        "Slightly less sleepy. Slightly.",
        "I'll allow this joy… briefly.",
      ],
      sleepy: [
        "Zzz… don't mind me.",
        "Wake me for cake.",
        "Soft patch. Do not relocate.",
        "Hibernating with style.",
      ],
      welcomeBack: [
        "Oh, you're back. I barely moved.",
        "I waited… mostly by napping.",
        "Missed you. Didn't stand up about it.",
        "Welcome back. Couch privileges restored.",
      ],
      gift: [
        "I rolled onto this. Take it.",
        "Found it without standing up.",
        "A treasure… delivered horizontally.",
        "Here. Now let me sleep.",
      ],
    },
  },
  playful: {
    id: "playful",
    title: "Playful",
    lines: {
      idle: [
        "Let's solve today's puzzle together!",
        "Tag — you're it!",
        "Bounce mode: engaged!",
        "Race you to the next clue!",
        "I practiced my victory dance.",
      ],
      happy: [
        "Best day ever!",
        "Again! Again!",
        "Wheee — happiness overload!",
        "I'm vibrating with good vibes!",
        "High five… or high paw!",
      ],
      sleepy: [
        "Play later… soft pillow now.",
        "My bounce is on pause.",
        "Recharging my zoomies.",
        "Even rockets need sleep.",
      ],
      welcomeBack: [
        "You're back! I missed our games.",
        "I've been waiting to play!",
        "Welcome back, teammate!",
        "Ready? Set? Puzzle!",
      ],
      gift: [
        "Catch!",
        "I brought you a toy-shaped surprise!",
        "Present party!",
        "For you — with sparkles!",
      ],
    },
  },
  shy: {
    id: "shy",
    title: "Shy",
    lines: {
      idle: [
        "Hi… quietly.",
        "I'll stay beside you.",
        "Is it okay if I sit nearby?",
        "Soft steps only today.",
        "I'm listening… from over here.",
      ],
      happy: [
        "That was… really nice.",
        "Thank you for noticing me.",
        "I feel a little braver now.",
        "Warm feelings. Tiny smile.",
      ],
      sleepy: [
        "I'm hiding under the leaves.",
        "Soft shadows feel safer.",
        "Quiet dreams, please.",
        "I'll peek out later… maybe.",
      ],
      welcomeBack: [
        "Welcome back. I missed you.",
        "I waited behind the flowers.",
        "You're here… that helps.",
        "I saved a quiet hello for you.",
      ],
      gift: [
        "I… left this for you.",
        "Please take it — carefully.",
        "A small gift. No fuss.",
        "I hope you like it…",
      ],
    },
  },
  food_lover: {
    id: "food_lover",
    title: "Food Lover",
    lines: {
      idle: [
        "Can I have another snack?",
        "Is that an apple I smell?",
        "My tummy filed a request.",
        "Snack o'clock is every o'clock.",
        "Crumbs are a love language.",
      ],
      happy: [
        "Delicious!",
        "More crumbs, please.",
        "Flavor unlocked!",
        "That hit the spot.",
        "10/10 would nibble again.",
      ],
      sleepy: [
        "Hunger nap…",
        "Dreaming of cake.",
        "Food coma loading…",
        "Wake me for dessert.",
      ],
      welcomeBack: [
        "You're back! Did you bring snacks?",
        "I saved a crumb for sharing.",
        "Welcome back, chef.",
        "I practiced tasting… mentally.",
      ],
      gift: [
        "I traded a crumb for this!",
        "Snack-powered treasure!",
        "Found between bites!",
        "A gift — edible vibes included.",
      ],
    },
  },
  mischievous: {
    id: "mischievous",
    title: "Mischievous",
    lines: {
      idle: [
        "Hehe… I hid a present somewhere.",
        "Don't look behind you.",
        "I definitely didn't move that flower.",
        "Schemes loading…",
        "Innocent face. Suspicious paws.",
      ],
      happy: [
        "Gotcha!",
        "My schemes are thriving.",
        "Chaos, but make it cute.",
        "Prank successful. Morale high.",
      ],
      sleepy: [
        "Even tricksters rest.",
        "Plotting… later.",
        "Dreaming of mild mayhem.",
        "Shh. Villain nap in progress.",
      ],
      welcomeBack: [
        "Hehe. I rearranged one flower.",
        "I kept a secret while you were gone.",
        "Welcome back — nothing's on fire!",
        "I only mildly misbehaved.",
      ],
      gift: [
        "Hehe… surprise!",
        "Stolen… I mean found… for you.",
        "A gift with zero traps. Probably.",
        "Take it before I hide it again.",
      ],
    },
  },
  sassy: {
    id: "sassy",
    title: "Sassy",
    lines: {
      idle: [
        "Obviously I'm fabulous.",
        "Solve faster — I'm waiting.",
        "You're welcome for my presence.",
        "Standards remain high.",
        "Try to keep up.",
      ],
      happy: [
        "Acceptable.",
        "You may continue praising me.",
        "Yes, I noticed. Impressive of you.",
        "I allow this celebration.",
      ],
      sleepy: [
        "Do not disturb the icon.",
        "Even legends rest.",
        "Beauty sleep is non-negotiable.",
        "Wake me only for excellence.",
      ],
      welcomeBack: [
        "Took you long enough.",
        "I missed you — slightly.",
        "Welcome back. Try not to spoil the vibe.",
        "I maintained the aesthetic without you.",
      ],
      gift: [
        "You're welcome.",
        "Don't lose this. It's tasteful.",
        "A gift. Be grateful.",
        "I selected this. Obviously.",
      ],
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
  return lines[Math.abs(salt) % lines.length]!;
}

export type PetDialogueContext = {
  dateKey: string;
  happiness: number;
  happinessState: string;
  stage: string;
  level: number;
  awayDays?: number;
  /** Last food title fed (e.g. "Cake"), if any. */
  lastFoodTitle?: string | null;
  fedToday?: boolean;
  pettedToday?: boolean;
  /** Titles of decorations currently placed in the garden. */
  decorTitles?: string[];
  /** Labels of puzzles cleared today (e.g. "Word Daily"). */
  recentPlayLabels?: string[];
  /** Recent achievement titles. */
  recentAchievementTitles?: string[];
  /** Extra salt so feed/pet/refresh can rotate lines within a day. */
  rotateSalt?: number;
};

function contextualLines(
  personalityId: PetPersonalityId,
  ctx: PetDialogueContext,
): string[] {
  const lines: string[] = [];
  const food = ctx.lastFoodTitle?.trim();
  const decor = (ctx.decorTitles ?? []).filter(Boolean);
  const plays = (ctx.recentPlayLabels ?? []).filter(Boolean);
  const badges = (ctx.recentAchievementTitles ?? []).filter(Boolean);
  const happy = ctx.happiness;

  if (food) {
    lines.push(
      `That ${food} was wonderful — thank you!`,
      `Still tasting the ${food}…`,
      `More ${food} someday? Asking for a friend.`,
    );
    if (personalityId === "food_lover") {
      lines.push(`${food} ranking: legendary.`, `I would write a review of that ${food}.`);
    }
  } else if (!ctx.fedToday) {
    lines.push(
      "A snack would really hit the spot.",
      "My tummy filed a polite request.",
    );
  }

  if (ctx.pettedToday) {
    lines.push(
      "Your pets always make my day.",
      "Still glowing from that headpat.",
      "Affection received. Morale excellent.",
    );
  } else {
    lines.push("A little petting never hurts…", "I'm right here if you want to say hi.");
  }

  if (decor.length > 0) {
    const piece = decor[Math.abs(hashSeed("decor-line", ctx.dateKey, String(decor.length))) % decor.length]!;
    lines.push(
      `I love our ${piece} — it makes the garden feel like home.`,
      `Been admiring the ${piece} all day.`,
      `The ${piece} is my favorite hangout spot.`,
    );
    if (personalityId === "mischievous") {
      lines.push(`I absolutely did not rearrange the ${piece}.`);
    }
  } else {
    lines.push(
      "Our garden could use a new decoration…",
      "Empty corners are so… empty.",
    );
  }

  if (plays.length > 0) {
    const game = plays[0]!;
    lines.push(
      `Proud of you clearing ${game}!`,
      `${game} looked fun — I cheered from the garden.`,
      `You solved ${game}. I felt that win.`,
    );
    if (plays.length > 1) {
      lines.push(`A whole puzzle streak today — ${plays.slice(0, 2).join(" and ")}!`);
    }
    if (personalityId === "playful") {
      lines.push("Puzzle buddy energy is unmatched!");
    }
    if (personalityId === "sassy") {
      lines.push("Acceptable puzzle form. Continue.");
    }
  } else {
    lines.push(
      "Shall we clear a puzzle together today?",
      "I'm ready whenever you want to solve something.",
      "A win would make both of us sparkle.",
    );
  }

  if (badges.length > 0) {
    const badge = badges[0]!;
    lines.push(
      `"${badge}" looks good on you.`,
      `That ${badge} achievement made me proud.`,
      `I framed "${badge}" in my mind.`,
    );
  }

  // Emotion / encouragement by happiness band
  if (happy >= 90) {
    lines.push(
      "I'm over the moon today!",
      "Happiness overflowing — thanks to you.",
      "Ecstatic mode: fully engaged.",
    );
  } else if (happy >= 70) {
    lines.push(
      "Feeling bright and buoyant.",
      "Good vibes in the garden air.",
      "You've got this — and I've got your back.",
    );
  } else if (happy >= 50) {
    lines.push(
      "Doing okay — company helps.",
      "A little attention goes a long way.",
      "Steady as we grow together.",
    );
  } else if (happy >= 25) {
    lines.push(
      "I'm a bit low… a pet or snack would help.",
      "Feeling quiet. Stay with me?",
      "Could use a boost of kindness.",
    );
  } else {
    lines.push(
      "I'm sad… please don't forget me.",
      "The garden feels lonely right now.",
      "I miss feeling cheerful with you.",
    );
  }

  lines.push(
    `Level ${ctx.level} ${ctx.stage} life suits me.`,
    "One paw in front of the other.",
    "You're my favorite human.",
    "We've got this — together.",
  );

  return lines;
}

/**
 * Pick a pet line from personality mood pools + situational context
 * (food, decor, recent clears, achievements, emotions).
 */
export function composePetDialogue(
  personalityId: PetPersonalityId,
  mood: keyof PetPersonality["lines"],
  ctx: PetDialogueContext,
): string {
  const pack = PET_PERSONALITIES[personalityId] ?? PET_PERSONALITIES.curious;
  const pool = [
    ...pack.lines[mood],
    ...contextualLines(personalityId, ctx),
  ];
  const salt = hashSeed(
    "pet-dialogue",
    personalityId,
    mood,
    ctx.dateKey,
    String(ctx.happiness),
    ctx.lastFoodTitle ?? "",
    String(ctx.decorTitles?.length ?? 0),
    String(ctx.recentPlayLabels?.length ?? 0),
    String(ctx.rotateSalt ?? 0),
    String(dayIndex(ctx.dateKey)),
  );
  return pool[pickIndex(salt, pool.length)]!;
}

export function welcomeBackLine(
  personalityId: PetPersonalityId,
  awayDays: number,
  dateKey: string,
  ctx?: Partial<PetDialogueContext>,
): string {
  const base: PetDialogueContext = {
    dateKey,
    happiness: ctx?.happiness ?? 50,
    happinessState: ctx?.happinessState ?? "idle",
    stage: ctx?.stage ?? "baby",
    level: ctx?.level ?? 1,
    awayDays,
    ...ctx,
  };
  if (awayDays <= 0) {
    return composePetDialogue(personalityId, "idle", base);
  }
  if (awayDays >= 28) {
    const long = [
      "I've been waiting for you… I took a long nap.",
      "Weeks passed. I kept the garden warm for you.",
      "You're back… I almost forgot how loud joy is.",
      composePetDialogue(personalityId, "welcomeBack", {
        ...base,
        rotateSalt: awayDays,
      }),
    ];
    return long[dayIndex(dateKey) % long.length]!;
  }
  if (awayDays >= 7) {
    const week = [
      "Welcome back! I missed solving puzzles with you.",
      `A whole week… I counted the sunrises (${awayDays} of them).`,
      "The flowers asked where you went. So did I.",
      composePetDialogue(personalityId, "welcomeBack", base),
    ];
    return week[dayIndex(dateKey) % week.length]!;
  }
  if (awayDays >= 3) {
    const mid = [
      "I got a little sleepy while you were away.",
      `You were gone ${awayDays} days — I saved you a hello.`,
      "Missed you. The garden did too.",
      composePetDialogue(personalityId, "welcomeBack", base),
    ];
    return mid[dayIndex(dateKey) % mid.length]!;
  }
  return composePetDialogue(personalityId, "welcomeBack", base);
}

export function personalityDisplayTitle(personalityId: string): string {
  const pack = PET_PERSONALITIES[personalityId as PetPersonalityId];
  return pack?.title ?? personalityId;
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
