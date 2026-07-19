import type { ShopCategoryId } from "./pets";

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
  | "food"
  | "pack";

export type ShopItemSlot = "avatar" | "accessory";

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
  /** Cosmetic sub-slot (avatars / accessories equip on profile) */
  slot?: ShopItemSlot;
  /** Free starter avatars — always owned, never bought */
  free?: boolean;
  /** Earned via achievement — cannot be purchased */
  badgeReward?: boolean;
  /** Garden / pet shop unlock category */
  shopCategory?: ShopCategoryId;
  /** Account level required to purchase (XP unlocks eligibility only) */
  requiredLevel?: number;
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
  // —— Badge-unlocked avatars (earned via achievements) ——
  {
    id: "avatar_badge_gumshoe",
    title: "Gumshoe badge",
    description: "Earned by clearing Escape Room milestones.",
    kind: "cosmetic",
    slot: "avatar",
    price: 0,
    badgeReward: true,
  },
  {
    id: "avatar_badge_sherlock",
    title: "Sherlock badge",
    description: "Earned by mastering the detective desk.",
    kind: "cosmetic",
    slot: "avatar",
    price: 0,
    badgeReward: true,
  },
  {
    id: "avatar_badge_logic",
    title: "Logic grid badge",
    description: "Earned by conquering logic puzzles.",
    kind: "cosmetic",
    slot: "avatar",
    price: 0,
    badgeReward: true,
  },
  {
    id: "avatar_badge_einstein",
    title: "Einstein badge",
    description: "Earned by solving 100 logic grids.",
    kind: "cosmetic",
    slot: "avatar",
    price: 0,
    badgeReward: true,
  },
  {
    id: "avatar_badge_master",
    title: "Puzzle master badge",
    description: "Earned by completing hundreds of puzzles.",
    kind: "cosmetic",
    slot: "avatar",
    price: 0,
    badgeReward: true,
  },
  {
    id: "avatar_badge_legend",
    title: "Legend badge",
    description: "Earned by reaching legendary status.",
    kind: "cosmetic",
    slot: "avatar",
    price: 0,
    badgeReward: true,
  },
  {
    id: "avatar_badge_season",
    title: "Season devotee badge",
    description: "Earned by playing every season.",
    kind: "cosmetic",
    slot: "avatar",
    price: 0,
    badgeReward: true,
  },
  {
    id: "avatar_badge_weekly",
    title: "Weekly champion badge",
    description: "Earned by winning weekly tournaments.",
    kind: "cosmetic",
    slot: "avatar",
    price: 0,
    badgeReward: true,
  },
  // —— Profile accessories (ribbons, crowns, frames) ——
  {
    id: "accessory_ribbon_junior",
    title: "Junior ribbon",
    description: "Monthly Case File — Junior Detective milestone.",
    kind: "cosmetic",
    slot: "accessory",
    price: 0,
    badgeReward: true,
  },
  {
    id: "accessory_ribbon_investigator",
    title: "Investigator ribbon",
    description: "Monthly Case File — Investigator milestone.",
    kind: "cosmetic",
    slot: "accessory",
    price: 0,
    badgeReward: true,
  },
  {
    id: "accessory_ribbon_master",
    title: "Master ribbon",
    description: "Monthly Case File — Master Detective milestone.",
    kind: "cosmetic",
    slot: "accessory",
    price: 0,
    badgeReward: true,
  },
  {
    id: "accessory_ribbon_legendary",
    title: "Legendary ribbon",
    description: "Monthly Case File — Legendary Detective milestone.",
    kind: "cosmetic",
    slot: "accessory",
    price: 0,
    badgeReward: true,
  },
  {
    id: "accessory_ribbon_casefile",
    title: "Case File ribbon",
    description: "Complete an entire monthly Case File.",
    kind: "cosmetic",
    slot: "accessory",
    price: 0,
    badgeReward: true,
  },
  {
    id: "accessory_crown_gold",
    title: "Gold crown",
    description: "Weekly tournament — 1st place.",
    kind: "cosmetic",
    slot: "accessory",
    price: 0,
    badgeReward: true,
  },
  {
    id: "accessory_crown_silver",
    title: "Silver laurel",
    description: "Weekly tournament — 2nd place.",
    kind: "cosmetic",
    slot: "accessory",
    price: 0,
    badgeReward: true,
  },
  {
    id: "accessory_crown_bronze",
    title: "Bronze seal",
    description: "Weekly tournament — 3rd place.",
    kind: "cosmetic",
    slot: "accessory",
    price: 0,
    badgeReward: true,
  },
  {
    id: "accessory_frame_ember",
    title: "Ember profile frame",
    description: "Warm ember ring around your portrait.",
    kind: "cosmetic",
    slot: "accessory",
    price: 400,
  },
  {
    id: "food_apple",
    title: "Apple",
    description: "A crisp snack. +10 happiness.",
    kind: "food",
    price: 5,
    shopCategory: "food",
    requiredLevel: 1,
  },
  {
    id: "food_cookie",
    title: "Cookie",
    description: "A warm treat. +24 happiness.",
    kind: "food",
    price: 10,
    shopCategory: "food",
    requiredLevel: 1,
  },
  {
    id: "food_cake",
    title: "Cake",
    description: "Celebration slice. +55 happiness.",
    kind: "food",
    price: 20,
    shopCategory: "food",
    requiredLevel: 1,
  },
  {
    id: "deco_clover",
    title: "Lucky clover",
    description: "A tiny patch of clover for new gardens.",
    kind: "decoration",
    price: 25,
    shopCategory: "garden",
    requiredLevel: 1,
  },
  {
    id: "deco_mushroom",
    title: "Spotted mushroom",
    description: "A friendly toadstool by the nest.",
    kind: "decoration",
    price: 30,
    shopCategory: "garden",
    requiredLevel: 1,
  },
  {
    id: "deco_pebble_stack",
    title: "Pebble stack",
    description: "A little cairn of smooth stones.",
    kind: "decoration",
    price: 28,
    shopCategory: "garden",
    requiredLevel: 1,
  },
  {
    id: "deco_dandelion",
    title: "Dandelion",
    description: "A bright weed that pets seem to love.",
    kind: "decoration",
    price: 22,
    shopCategory: "garden",
    requiredLevel: 1,
  },
  {
    id: "deco_grass_tuft",
    title: "Grass tuft",
    description: "A soft patch of meadow grass.",
    kind: "decoration",
    price: 20,
    shopCategory: "garden",
    requiredLevel: 1,
  },
  {
    id: "deco_twig",
    title: "Fallen twig",
    description: "A weathered twig for rustic charm.",
    kind: "decoration",
    price: 18,
    shopCategory: "garden",
    requiredLevel: 1,
  },
  {
    id: "deco_berry_bush",
    title: "Berry bush",
    description: "A small bush with bright berries.",
    kind: "decoration",
    price: 50,
    shopCategory: "garden",
    requiredLevel: 5,
  },
  {
    id: "deco_toadstool",
    title: "Fairy toadstool",
    description: "A taller mushroom with a rosy cap.",
    kind: "decoration",
    price: 55,
    shopCategory: "garden",
    requiredLevel: 5,
  },
  {
    id: "deco_wildflower",
    title: "Wildflower cluster",
    description: "A mix of tiny meadow blooms.",
    kind: "decoration",
    price: 48,
    shopCategory: "garden",
    requiredLevel: 5,
  },
  {
    id: "deco_acorn_pile",
    title: "Acorn pile",
    description: "A snack stash for curious companions.",
    kind: "decoration",
    price: 45,
    shopCategory: "garden",
    requiredLevel: 5,
  },
  {
    id: "deco_fern_pot",
    title: "Fern pot",
    description: "A potted fern for shady corners.",
    kind: "decoration",
    price: 52,
    shopCategory: "garden",
    requiredLevel: 5,
  },
  {
    id: "deco_snail_shell",
    title: "Snail shell",
    description: "A spiral shell left by a garden visitor.",
    kind: "decoration",
    price: 42,
    shopCategory: "garden",
    requiredLevel: 5,
  },
  {
    id: "deco_sunflower",
    title: "Sunflower",
    description: "Tall golden petals that follow the light.",
    kind: "decoration",
    price: 80,
    shopCategory: "garden",
    requiredLevel: 10,
  },
  {
    id: "deco_birdbath",
    title: "Stone birdbath",
    description: "A shallow bath for visiting songbirds.",
    kind: "decoration",
    price: 90,
    shopCategory: "garden",
    requiredLevel: 10,
  },
  {
    id: "deco_watering_can",
    title: "Watering can",
    description: "A dented can ready for garden duty.",
    kind: "decoration",
    price: 75,
    shopCategory: "garden",
    requiredLevel: 10,
  },
  {
    id: "deco_lily",
    title: "Garden lily",
    description: "Elegant petals for a calm corner.",
    kind: "decoration",
    price: 85,
    shopCategory: "garden",
    requiredLevel: 10,
  },
  {
    id: "deco_wheelbarrow",
    title: "Wheelbarrow",
    description: "A rusty wheelbarrow ready for harvest.",
    kind: "decoration",
    price: 88,
    shopCategory: "garden",
    requiredLevel: 10,
  },
  {
    id: "deco_beehive",
    title: "Beehive",
    description: "A small hive buzzing with garden life.",
    kind: "decoration",
    price: 92,
    shopCategory: "garden",
    requiredLevel: 10,
  },
  {
    id: "deco_flower_daisy",
    title: "Ink daisy",
    description: "A soft white bloom for your garden path.",
    kind: "decoration",
    price: 100,
    shopCategory: "flowers",
    requiredLevel: 20,
  },
  {
    id: "deco_flower_tulip",
    title: "Ember tulip",
    description: "Warm petals beside the pet nest.",
    kind: "decoration",
    price: 100,
    shopCategory: "flowers",
    requiredLevel: 20,
  },
  {
    id: "deco_flower_lantern",
    title: "Lantern blossom",
    description: "A glowing flower that softens evening light.",
    kind: "decoration",
    price: 120,
    shopCategory: "flowers",
    requiredLevel: 20,
  },
  {
    id: "deco_rose",
    title: "Ink rose",
    description: "A classic bloom with deep red petals.",
    kind: "decoration",
    price: 110,
    shopCategory: "flowers",
    requiredLevel: 20,
  },
  {
    id: "deco_lavender",
    title: "Lavender sprigs",
    description: "Soft purple stems with a calm scent.",
    kind: "decoration",
    price: 105,
    shopCategory: "flowers",
    requiredLevel: 20,
  },
  {
    id: "deco_orchid",
    title: "Ink orchid",
    description: "An exotic bloom with deep violet petals.",
    kind: "decoration",
    price: 115,
    shopCategory: "flowers",
    requiredLevel: 20,
  },
  {
    id: "deco_ivy_pot",
    title: "Ivy pot",
    description: "Trailing ivy spilling from a clay pot.",
    kind: "decoration",
    price: 108,
    shopCategory: "flowers",
    requiredLevel: 20,
  },
  {
    id: "deco_log_bench",
    title: "Log bench",
    description: "A weathered seat carved from a fallen trunk.",
    kind: "decoration",
    price: 180,
    shopCategory: "garden",
    requiredLevel: 30,
  },
  {
    id: "deco_crystal",
    title: "Glow crystal",
    description: "A soft crystal that catches garden light.",
    kind: "decoration",
    price: 200,
    shopCategory: "garden",
    requiredLevel: 30,
  },
  {
    id: "deco_wind_chime",
    title: "Wind chime",
    description: "Gentle tones for breezy afternoons.",
    kind: "decoration",
    price: 190,
    shopCategory: "garden",
    requiredLevel: 30,
  },
  {
    id: "deco_stone_lantern",
    title: "Stone lantern",
    description: "A mossy lantern for garden paths.",
    kind: "decoration",
    price: 210,
    shopCategory: "garden",
    requiredLevel: 30,
  },
  {
    id: "deco_hammock",
    title: "Garden hammock",
    description: "A cozy hammock strung between trees.",
    kind: "decoration",
    price: 220,
    shopCategory: "garden",
    requiredLevel: 30,
  },
  {
    id: "deco_scarecrow",
    title: "Scarecrow",
    description: "A friendly scarecrow guarding the beds.",
    kind: "decoration",
    price: 200,
    shopCategory: "garden",
    requiredLevel: 30,
  },
  {
    id: "deco_pond",
    title: "Mirror pond",
    description: "A still pond that reflects starlight.",
    kind: "decoration",
    price: 300,
    shopCategory: "ponds",
    requiredLevel: 40,
  },
  {
    id: "deco_reeds",
    title: "Pond reeds",
    description: "Tall reeds for the water’s edge.",
    kind: "decoration",
    price: 280,
    shopCategory: "ponds",
    requiredLevel: 40,
  },
  {
    id: "deco_stepping_stones",
    title: "Stepping stones",
    description: "A path of flat stones across soft ground.",
    kind: "decoration",
    price: 290,
    shopCategory: "ponds",
    requiredLevel: 40,
  },
  {
    id: "deco_koi_bridge",
    title: "Koi bridge",
    description: "A small arched bridge over still water.",
    kind: "decoration",
    price: 310,
    shopCategory: "ponds",
    requiredLevel: 40,
  },
  {
    id: "deco_lily_pad",
    title: "Lily pad cluster",
    description: "Floating pads with a single bloom.",
    kind: "decoration",
    price: 275,
    shopCategory: "ponds",
    requiredLevel: 40,
  },
  {
    id: "deco_dragonfly",
    title: "Dragonfly perch",
    description: "A reed where dragonflies like to land.",
    kind: "decoration",
    price: 285,
    shopCategory: "ponds",
    requiredLevel: 40,
  },
  {
    id: "deco_mini_fountain",
    title: "Mini fountain",
    description: "A bubbling fountain for the clearing.",
    kind: "decoration",
    price: 360,
    shopCategory: "garden",
    requiredLevel: 50,
  },
  {
    id: "deco_vine_arch",
    title: "Vine arch",
    description: "A leafy archway framing the nest path.",
    kind: "decoration",
    price: 380,
    shopCategory: "garden",
    requiredLevel: 50,
  },
  {
    id: "deco_garden_statue",
    title: "Garden statue",
    description: "A small stone companion for the lawn.",
    kind: "decoration",
    price: 400,
    shopCategory: "garden",
    requiredLevel: 50,
  },
  {
    id: "deco_trellis",
    title: "Flower trellis",
    description: "A climbing frame for vines and blooms.",
    kind: "decoration",
    price: 370,
    shopCategory: "garden",
    requiredLevel: 50,
  },
  {
    id: "deco_gazebo_mini",
    title: "Mini gazebo",
    description: "A tiny gazebo for afternoon shade.",
    kind: "decoration",
    price: 390,
    shopCategory: "garden",
    requiredLevel: 50,
  },
  {
    id: "deco_moon_gate",
    title: "Moon gate",
    description: "A circular gate framing the garden path.",
    kind: "decoration",
    price: 410,
    shopCategory: "garden",
    requiredLevel: 50,
  },
  {
    id: "deco_tree_oak",
    title: "Case-file oak",
    description: "A sturdy oak for shade and secrets.",
    kind: "decoration",
    price: 500,
    shopCategory: "trees",
    requiredLevel: 60,
  },
  {
    id: "deco_tree_willow",
    title: "Whisper willow",
    description: "Long branches for lazy companions.",
    kind: "decoration",
    price: 520,
    shopCategory: "trees",
    requiredLevel: 60,
  },
  {
    id: "deco_pine",
    title: "Inkday pine",
    description: "An evergreen for year-round shade.",
    kind: "decoration",
    price: 510,
    shopCategory: "trees",
    requiredLevel: 60,
  },
  {
    id: "deco_birch",
    title: "Silver birch",
    description: "Pale bark and delicate leaves.",
    kind: "decoration",
    price: 530,
    shopCategory: "trees",
    requiredLevel: 60,
  },
  {
    id: "deco_maple",
    title: "Autumn maple",
    description: "A maple with warm seasonal foliage.",
    kind: "decoration",
    price: 540,
    shopCategory: "trees",
    requiredLevel: 60,
  },
  {
    id: "deco_bamboo",
    title: "Bamboo grove",
    description: "Slender bamboo stalks for zen shade.",
    kind: "decoration",
    price: 525,
    shopCategory: "trees",
    requiredLevel: 60,
  },
  {
    id: "deco_seasonal_lantern",
    title: "Seasonal lantern",
    description: "Festival light for rare garden nights.",
    kind: "decoration",
    price: 900,
    shopCategory: "seasonal",
    requiredLevel: 80,
  },
  {
    id: "deco_festival_banner",
    title: "Festival banner",
    description: "Bright cloth for celebration days.",
    kind: "decoration",
    price: 880,
    shopCategory: "seasonal",
    requiredLevel: 80,
  },
  {
    id: "deco_firefly_jar",
    title: "Firefly jar",
    description: "A jar of gentle evening fireflies.",
    kind: "decoration",
    price: 920,
    shopCategory: "seasonal",
    requiredLevel: 80,
  },
  {
    id: "deco_snow_lantern",
    title: "Snow lantern",
    description: "A lantern dusted with winter frost.",
    kind: "decoration",
    price: 900,
    shopCategory: "seasonal",
    requiredLevel: 80,
  },
  {
    id: "deco_harvest_wreath",
    title: "Harvest wreath",
    description: "A wreath of autumn leaves and berries.",
    kind: "decoration",
    price: 860,
    shopCategory: "seasonal",
    requiredLevel: 80,
  },
  {
    id: "deco_legendary_obelisk",
    title: "Legendary obelisk",
    description: "A towering monument for dedicated companions.",
    kind: "decoration",
    price: 2000,
    shopCategory: "legendary",
    requiredLevel: 100,
  },
  {
    id: "deco_mythic_gate",
    title: "Mythic gate",
    description: "An ornate gate for the rarest gardens.",
    kind: "decoration",
    price: 2200,
    shopCategory: "legendary",
    requiredLevel: 100,
  },
  {
    id: "deco_aurora_spire",
    title: "Aurora spire",
    description: "A crystalline spire catching northern light.",
    kind: "decoration",
    price: 2400,
    shopCategory: "legendary",
    requiredLevel: 100,
  },
  {
    id: "deco_starfall_orb",
    title: "Starfall orb",
    description: "A floating orb of captured starlight.",
    kind: "decoration",
    price: 2500,
    shopCategory: "legendary",
    requiredLevel: 100,
  },
  {
    id: "deco_eternal_fountain",
    title: "Eternal fountain",
    description: "A legendary fountain that never runs dry.",
    kind: "decoration",
    price: 2600,
    shopCategory: "legendary",
    requiredLevel: 100,
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

export const FOOD_SHOP_ITEMS = SHOP_ITEMS.filter((i) => i.kind === "food");
export const DECORATION_SHOP_ITEMS = SHOP_ITEMS.filter(
  (i) => i.kind === "decoration",
);

export const AVATAR_ITEMS = SHOP_ITEMS.filter((i) => i.slot === "avatar");

export const ACCESSORY_ITEMS = SHOP_ITEMS.filter((i) => i.slot === "accessory");

export const DEFAULT_ACCESSORY_ID = null;

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

export function getAccessoryItem(id: string): ShopItem | undefined {
  const item = getShopItem(id);
  return item?.slot === "accessory" ? item : undefined;
}

export function isAccessoryItemId(id: string): boolean {
  return Boolean(getAccessoryItem(id));
}

export function resolveAccessoryId(
  id: string | null | undefined,
): string | null {
  if (id && getAccessoryItem(id)) return id;
  return DEFAULT_ACCESSORY_ID;
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
  | "streak_restore"
  | "pet_gift"
  | "friend_gift_send"
  | "friend_gift_receive"
  | "friend_gift_refund";
