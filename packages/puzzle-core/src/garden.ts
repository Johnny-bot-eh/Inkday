import type { DecorationItemId } from "./pets";

/**
 * Inkday garden = fixed 2.5D animated diorama / living wallpaper.
 * Not a grid, not a navigable world — a collectible scene (Insaniquarium-style).
 * Coordinates are normalized 0–100 so the same layout can drive web or
 * future dynamic-wallpaper surfaces.
 *
 * Habitat scenery (trees, vines, moss) is baked into the wallpaper —
 * only shop decorations are placeable.
 */

export type GardenLayer = "background" | "middle" | "foreground";

export type GardenMotion =
  | "still"
  | "sway"
  | "bob"
  | "sparkle"
  | "ripple"
  | "drift";

export const GARDEN_SCENE = {
  /** Logical canvas — percentages of this box. */
  width: 100,
  height: 100,
  /** Preferred display aspect (width / height). */
  aspectRatio: 1.55,
  sceneVersion: 4,
  /**
   * One nest for now (Ink Plus may unlock extra nests later).
   * Eggs sit in the nest; after hatch the companion roams the clearing
   * (client-side). Nest pose is persisted; roam pose is ephemeral.
   */
  nest: {
    maxNests: 1,
    eggsPerNest: 1,
    x: 52,
    y: 82,
  },
  pet: {
    /** Default nest / egg anchor (also the hatch start pose). */
    x: 52,
    y: 82,
    layer: "middle" as GardenLayer,
  },
} as const;

export type GardenDecorVisual = {
  itemId: string;
  layer: GardenLayer;
  /** Width as % of canvas width */
  widthPct: number;
  motion: GardenMotion;
  /** Anchor used for default auto-place */
  defaultPose: { x: number; y: number };
  /** Accessible short name (not drawn on the sprite). */
  mark: string;
  tone: string;
};

export const GARDEN_DECOR_VISUALS: Record<string, GardenDecorVisual> = {
  deco_clover: {
    itemId: "deco_clover",
    layer: "middle",
    widthPct: 8,
    motion: "sway",
    defaultPose: { x: 34, y: 74 },
    mark: "Clover",
    tone: "#4a8a42",
  },
  deco_mushroom: {
    itemId: "deco_mushroom",
    layer: "middle",
    widthPct: 8,
    motion: "still",
    defaultPose: { x: 70, y: 72 },
    mark: "Mushroom",
    tone: "#c45c5c",
  },
  deco_pebble_stack: {
    itemId: "deco_pebble_stack",
    layer: "middle",
    widthPct: 9,
    motion: "still",
    defaultPose: { x: 60, y: 80 },
    mark: "Pebbles",
    tone: "#8a8680",
  },
  deco_dandelion: {
    itemId: "deco_dandelion",
    layer: "middle",
    widthPct: 8,
    motion: "sway",
    defaultPose: { x: 44, y: 72 },
    mark: "Dandelion",
    tone: "#e8c84a",
  },
  deco_berry_bush: {
    itemId: "deco_berry_bush",
    layer: "middle",
    widthPct: 12,
    motion: "sway",
    defaultPose: { x: 22, y: 68 },
    mark: "Bush",
    tone: "#3d6b38",
  },
  deco_toadstool: {
    itemId: "deco_toadstool",
    layer: "middle",
    widthPct: 9,
    motion: "bob",
    defaultPose: { x: 78, y: 70 },
    mark: "Toadstool",
    tone: "#d46a7a",
  },
  deco_wildflower: {
    itemId: "deco_wildflower",
    layer: "middle",
    widthPct: 10,
    motion: "sway",
    defaultPose: { x: 56, y: 70 },
    mark: "Wildflower",
    tone: "#c45c8a",
  },
  deco_acorn_pile: {
    itemId: "deco_acorn_pile",
    layer: "middle",
    widthPct: 9,
    motion: "still",
    defaultPose: { x: 74, y: 78 },
    mark: "Acorns",
    tone: "#8a5a30",
  },
  deco_sunflower: {
    itemId: "deco_sunflower",
    layer: "middle",
    widthPct: 11,
    motion: "sway",
    defaultPose: { x: 40, y: 62 },
    mark: "Sunflower",
    tone: "#e8b84a",
  },
  deco_birdbath: {
    itemId: "deco_birdbath",
    layer: "middle",
    widthPct: 12,
    motion: "ripple",
    defaultPose: { x: 66, y: 74 },
    mark: "Bath",
    tone: "#8a9098",
  },
  deco_watering_can: {
    itemId: "deco_watering_can",
    layer: "middle",
    widthPct: 10,
    motion: "still",
    defaultPose: { x: 30, y: 76 },
    mark: "Can",
    tone: "#5a8aaa",
  },
  deco_lily: {
    itemId: "deco_lily",
    layer: "middle",
    widthPct: 10,
    motion: "sway",
    defaultPose: { x: 58, y: 64 },
    mark: "Lily",
    tone: "#f0e8f4",
  },
  deco_rose: {
    itemId: "deco_rose",
    layer: "middle",
    widthPct: 9,
    motion: "sway",
    defaultPose: { x: 46, y: 66 },
    mark: "Rose",
    tone: "#b83a4a",
  },
  deco_lavender: {
    itemId: "deco_lavender",
    layer: "middle",
    widthPct: 10,
    motion: "sway",
    defaultPose: { x: 70, y: 68 },
    mark: "Lavender",
    tone: "#8a6aaa",
  },
  deco_log_bench: {
    itemId: "deco_log_bench",
    layer: "middle",
    widthPct: 16,
    motion: "still",
    defaultPose: { x: 28, y: 78 },
    mark: "Bench",
    tone: "#6a4a30",
  },
  deco_crystal: {
    itemId: "deco_crystal",
    layer: "foreground",
    widthPct: 9,
    motion: "sparkle",
    defaultPose: { x: 82, y: 58 },
    mark: "Crystal",
    tone: "#7ec8e8",
  },
  deco_wind_chime: {
    itemId: "deco_wind_chime",
    layer: "foreground",
    widthPct: 8,
    motion: "bob",
    defaultPose: { x: 24, y: 40 },
    mark: "Chime",
    tone: "#c9a227",
  },
  deco_stone_lantern: {
    itemId: "deco_stone_lantern",
    layer: "middle",
    widthPct: 10,
    motion: "sparkle",
    defaultPose: { x: 18, y: 70 },
    mark: "Lantern",
    tone: "#8a8680",
  },
  deco_reeds: {
    itemId: "deco_reeds",
    layer: "middle",
    widthPct: 12,
    motion: "sway",
    defaultPose: { x: 84, y: 76 },
    mark: "Reeds",
    tone: "#5a7a48",
  },
  deco_stepping_stones: {
    itemId: "deco_stepping_stones",
    layer: "background",
    widthPct: 18,
    motion: "still",
    defaultPose: { x: 50, y: 84 },
    mark: "Stones",
    tone: "#7a7670",
  },
  deco_mini_fountain: {
    itemId: "deco_mini_fountain",
    layer: "middle",
    widthPct: 14,
    motion: "ripple",
    defaultPose: { x: 48, y: 76 },
    mark: "Fountain",
    tone: "#5a8aaa",
  },
  deco_vine_arch: {
    itemId: "deco_vine_arch",
    layer: "background",
    widthPct: 22,
    motion: "sway",
    defaultPose: { x: 50, y: 48 },
    mark: "Arch",
    tone: "#3f6b48",
  },
  deco_garden_statue: {
    itemId: "deco_garden_statue",
    layer: "middle",
    widthPct: 11,
    motion: "still",
    defaultPose: { x: 36, y: 62 },
    mark: "Statue",
    tone: "#9aa0a8",
  },
  deco_trellis: {
    itemId: "deco_trellis",
    layer: "background",
    widthPct: 16,
    motion: "sway",
    defaultPose: { x: 78, y: 50 },
    mark: "Trellis",
    tone: "#6a8a50",
  },
  deco_pine: {
    itemId: "deco_pine",
    layer: "background",
    widthPct: 16,
    motion: "sway",
    defaultPose: { x: 10, y: 44 },
    mark: "Pine",
    tone: "#2d4a28",
  },
  deco_birch: {
    itemId: "deco_birch",
    layer: "background",
    widthPct: 14,
    motion: "sway",
    defaultPose: { x: 90, y: 46 },
    mark: "Birch",
    tone: "#e8e0d0",
  },
  deco_festival_banner: {
    itemId: "deco_festival_banner",
    layer: "foreground",
    widthPct: 14,
    motion: "sway",
    defaultPose: { x: 30, y: 32 },
    mark: "Banner",
    tone: "#c45c6a",
  },
  deco_mythic_gate: {
    itemId: "deco_mythic_gate",
    layer: "background",
    widthPct: 24,
    motion: "sparkle",
    defaultPose: { x: 50, y: 42 },
    mark: "Gate",
    tone: "#7a5cff",
  },
  deco_flower_daisy: {
    itemId: "deco_flower_daisy",
    layer: "middle",
    widthPct: 9,
    motion: "sway",
    defaultPose: { x: 38, y: 68 },
    mark: "Daisy",
    tone: "#c45c8a",
  },
  deco_flower_tulip: {
    itemId: "deco_flower_tulip",
    layer: "middle",
    widthPct: 9,
    motion: "sway",
    defaultPose: { x: 64, y: 66 },
    mark: "Tulip",
    tone: "#e07a3a",
  },
  deco_flower_lantern: {
    itemId: "deco_flower_lantern",
    layer: "middle",
    widthPct: 10,
    motion: "sparkle",
    defaultPose: { x: 44, y: 52 },
    mark: "Glow",
    tone: "#c9a227",
  },
  deco_pond: {
    itemId: "deco_pond",
    layer: "background",
    widthPct: 22,
    motion: "ripple",
    defaultPose: { x: 72, y: 82 },
    mark: "Pond",
    tone: "#3d6f8f",
  },
  deco_tree_oak: {
    itemId: "deco_tree_oak",
    layer: "background",
    widthPct: 20,
    motion: "sway",
    defaultPose: { x: 12, y: 42 },
    mark: "Oak",
    tone: "#3d5c2e",
  },
  deco_tree_willow: {
    itemId: "deco_tree_willow",
    layer: "background",
    widthPct: 20,
    motion: "sway",
    defaultPose: { x: 88, y: 40 },
    mark: "Willow",
    tone: "#4a6b3a",
  },
  deco_seasonal_lantern: {
    itemId: "deco_seasonal_lantern",
    layer: "foreground",
    widthPct: 8,
    motion: "bob",
    defaultPose: { x: 20, y: 28 },
    mark: "Lamp",
    tone: "#c9a227",
  },
  deco_legendary_obelisk: {
    itemId: "deco_legendary_obelisk",
    layer: "middle",
    widthPct: 10,
    motion: "sparkle",
    defaultPose: { x: 50, y: 36 },
    mark: "Relic",
    tone: "#7a5cff",
  },
  deco_grass_tuft: {
    itemId: "deco_grass_tuft",
    layer: "middle",
    widthPct: 8,
    motion: "sway",
    defaultPose: { x: 52, y: 78 },
    mark: "Grass",
    tone: "#5a8a42",
  },
  deco_twig: {
    itemId: "deco_twig",
    layer: "middle",
    widthPct: 10,
    motion: "still",
    defaultPose: { x: 62, y: 80 },
    mark: "Twig",
    tone: "#6a5030",
  },
  deco_fern_pot: {
    itemId: "deco_fern_pot",
    layer: "middle",
    widthPct: 9,
    motion: "sway",
    defaultPose: { x: 16, y: 72 },
    mark: "Fern",
    tone: "#3d6b38",
  },
  deco_snail_shell: {
    itemId: "deco_snail_shell",
    layer: "middle",
    widthPct: 8,
    motion: "still",
    defaultPose: { x: 68, y: 82 },
    mark: "Shell",
    tone: "#c9a88a",
  },
  deco_wheelbarrow: {
    itemId: "deco_wheelbarrow",
    layer: "middle",
    widthPct: 14,
    motion: "still",
    defaultPose: { x: 26, y: 74 },
    mark: "Barrow",
    tone: "#8a5a30",
  },
  deco_beehive: {
    itemId: "deco_beehive",
    layer: "middle",
    widthPct: 9,
    motion: "bob",
    defaultPose: { x: 76, y: 64 },
    mark: "Hive",
    tone: "#c9a227",
  },
  deco_orchid: {
    itemId: "deco_orchid",
    layer: "middle",
    widthPct: 9,
    motion: "sway",
    defaultPose: { x: 54, y: 64 },
    mark: "Orchid",
    tone: "#8a4aaa",
  },
  deco_ivy_pot: {
    itemId: "deco_ivy_pot",
    layer: "middle",
    widthPct: 10,
    motion: "sway",
    defaultPose: { x: 32, y: 70 },
    mark: "Ivy",
    tone: "#3d6b38",
  },
  deco_hammock: {
    itemId: "deco_hammock",
    layer: "background",
    widthPct: 20,
    motion: "sway",
    defaultPose: { x: 40, y: 52 },
    mark: "Hammock",
    tone: "#c45c6a",
  },
  deco_scarecrow: {
    itemId: "deco_scarecrow",
    layer: "middle",
    widthPct: 12,
    motion: "sway",
    defaultPose: { x: 86, y: 62 },
    mark: "Scarecrow",
    tone: "#8a6a30",
  },
  deco_koi_bridge: {
    itemId: "deco_koi_bridge",
    layer: "background",
    widthPct: 20,
    motion: "still",
    defaultPose: { x: 58, y: 78 },
    mark: "Bridge",
    tone: "#8a5a30",
  },
  deco_lily_pad: {
    itemId: "deco_lily_pad",
    layer: "middle",
    widthPct: 11,
    motion: "ripple",
    defaultPose: { x: 64, y: 84 },
    mark: "Lilypad",
    tone: "#4a8a42",
  },
  deco_dragonfly: {
    itemId: "deco_dragonfly",
    layer: "foreground",
    widthPct: 7,
    motion: "drift",
    defaultPose: { x: 72, y: 68 },
    mark: "Dragonfly",
    tone: "#5a9aaa",
  },
  deco_gazebo_mini: {
    itemId: "deco_gazebo_mini",
    layer: "background",
    widthPct: 18,
    motion: "still",
    defaultPose: { x: 22, y: 56 },
    mark: "Gazebo",
    tone: "#e8e0d0",
  },
  deco_moon_gate: {
    itemId: "deco_moon_gate",
    layer: "background",
    widthPct: 16,
    motion: "still",
    defaultPose: { x: 68, y: 48 },
    mark: "Gate",
    tone: "#8a8680",
  },
  deco_maple: {
    itemId: "deco_maple",
    layer: "background",
    widthPct: 16,
    motion: "sway",
    defaultPose: { x: 6, y: 40 },
    mark: "Maple",
    tone: "#c45c26",
  },
  deco_bamboo: {
    itemId: "deco_bamboo",
    layer: "background",
    widthPct: 12,
    motion: "sway",
    defaultPose: { x: 94, y: 44 },
    mark: "Bamboo",
    tone: "#4a8a42",
  },
  deco_firefly_jar: {
    itemId: "deco_firefly_jar",
    layer: "foreground",
    widthPct: 7,
    motion: "sparkle",
    defaultPose: { x: 14, y: 32 },
    mark: "Fireflies",
    tone: "#e8d48b",
  },
  deco_snow_lantern: {
    itemId: "deco_snow_lantern",
    layer: "foreground",
    widthPct: 8,
    motion: "bob",
    defaultPose: { x: 84, y: 30 },
    mark: "Snow lamp",
    tone: "#e8eef1",
  },
  deco_harvest_wreath: {
    itemId: "deco_harvest_wreath",
    layer: "foreground",
    widthPct: 10,
    motion: "sway",
    defaultPose: { x: 50, y: 28 },
    mark: "Wreath",
    tone: "#c45c26",
  },
  deco_aurora_spire: {
    itemId: "deco_aurora_spire",
    layer: "middle",
    widthPct: 11,
    motion: "sparkle",
    defaultPose: { x: 42, y: 34 },
    mark: "Spire",
    tone: "#5eead4",
  },
  deco_starfall_orb: {
    itemId: "deco_starfall_orb",
    layer: "foreground",
    widthPct: 9,
    motion: "bob",
    defaultPose: { x: 58, y: 30 },
    mark: "Orb",
    tone: "#b9a6ff",
  },
  deco_eternal_fountain: {
    itemId: "deco_eternal_fountain",
    layer: "middle",
    widthPct: 16,
    motion: "ripple",
    defaultPose: { x: 50, y: 72 },
    mark: "Fountain",
    tone: "#5a8aaa",
  },
};

export function gardenDecorVisual(itemId: string): GardenDecorVisual {
  return (
    GARDEN_DECOR_VISUALS[itemId] ?? {
      itemId,
      layer: "middle",
      widthPct: 10,
      motion: "still",
      defaultPose: { x: 50, y: 60 },
      mark: "Decor",
      tone: "#8a6b4a",
    }
  );
}

export type GardenAmbientId =
  | "pollen"
  | "fireflies"
  | "spark_dust"
  | "soft_mist"
  | "star_glints";

export type GardenSceneTone = "dawn" | "day" | "dusk" | "night";

export type GardenSeason = "spring" | "summer" | "autumn" | "winter";

export type GardenWeather =
  | "clear"
  | "cloudy"
  | "rain"
  | "fog"
  | "snow";

export type GardenClimate = {
  /** Player-local calendar day key (YYYY-MM-DD). */
  localDateKey: string;
  tone: GardenSceneTone;
  season: GardenSeason;
  weather: GardenWeather;
};

/** Local calendar day key from a Date (uses the Date's local getters). */
export function localDateKey(date: Date = new Date()): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

/** Time-of-day lighting from the player's local clock (not UTC). */
export function gardenTimeOfDay(date: Date = new Date()): GardenSceneTone {
  const hour = date.getHours() + date.getMinutes() / 60;
  if (hour >= 5 && hour < 8) return "dawn";
  if (hour >= 8 && hour < 17) return "day";
  if (hour >= 17 && hour < 21) return "dusk";
  return "night";
}

/** Season from the player's local calendar month. */
export function gardenSeason(date: Date = new Date()): GardenSeason {
  const month = date.getMonth(); // 0–11 local
  if (month >= 2 && month <= 4) return "spring";
  if (month >= 5 && month <= 7) return "summer";
  if (month >= 8 && month <= 10) return "autumn";
  return "winter";
}

function hashSeed(input: string): number {
  let h = 2166136261;
  for (let i = 0; i < input.length; i++) {
    h ^= input.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

/**
 * One random weather for the player's local day.
 * Season biases the table (e.g. snow more likely in winter).
 */
export function gardenDailyWeather(
  dateKey: string,
  season: GardenSeason,
): GardenWeather {
  const roll = hashSeed(`garden-weather:${dateKey}`) % 100;
  if (season === "winter") {
    if (roll < 28) return "snow";
    if (roll < 48) return "cloudy";
    if (roll < 62) return "fog";
    if (roll < 74) return "rain";
    return "clear";
  }
  if (season === "autumn") {
    if (roll < 30) return "rain";
    if (roll < 50) return "cloudy";
    if (roll < 62) return "fog";
    if (roll < 68) return "snow";
    return "clear";
  }
  if (season === "spring") {
    if (roll < 28) return "rain";
    if (roll < 48) return "cloudy";
    if (roll < 58) return "fog";
    return "clear";
  }
  // summer
  if (roll < 18) return "rain";
  if (roll < 38) return "cloudy";
  if (roll < 45) return "fog";
  return "clear";
}

/** Full local climate snapshot for the garden wallpaper. */
export function gardenClimateFromLocal(
  date: Date = new Date(),
): GardenClimate {
  const key = localDateKey(date);
  const season = gardenSeason(date);
  return {
    localDateKey: key,
    tone: gardenTimeOfDay(date),
    season,
    weather: gardenDailyWeather(key, season),
  };
}

/**
 * Ambient life particles — richness unlocks plus local time of day.
 * Prefer passing `tone` from the player's local clock.
 */
export function gardenAmbience(opts: {
  accountLevel: number;
  petLevel: number;
  placedCount: number;
  tone?: GardenSceneTone;
  weather?: GardenWeather;
}): GardenAmbientId[] {
  const tone = opts.tone ?? "day";
  const out: GardenAmbientId[] = [];
  if (tone === "day" || tone === "dawn") out.push("pollen");
  if (
    opts.weather === "fog" ||
    opts.petLevel >= 5 ||
    opts.placedCount >= 3
  ) {
    out.push("soft_mist");
  }
  if (
    (tone === "dusk" || tone === "night") &&
    (opts.accountLevel >= 10 || opts.petLevel >= 5)
  ) {
    out.push("fireflies");
  }
  if (opts.accountLevel >= 40 || opts.placedCount >= 6) out.push("spark_dust");
  if (tone === "night" || opts.petLevel >= 50 || opts.accountLevel >= 80) {
    out.push("star_glints");
  }
  return out;
}

/**
 * @deprecated Prefer `gardenTimeOfDay` (player-local clock).
 * Kept for older callers — maps progression to a static tone.
 */
export function gardenSceneTone(
  accountLevel: number,
  petLevel: number,
): GardenSceneTone {
  if (petLevel >= 75 || accountLevel >= 80) return "night";
  if (petLevel >= 50 || accountLevel >= 40) return "dusk";
  if (petLevel >= 15 || accountLevel >= 20) return "day";
  return "dawn";
}

export function clampGardenCoord(n: number): number {
  const value = typeof n === "number" ? n : Number(n);
  if (!Number.isFinite(value)) return 50;
  return Math.min(92, Math.max(8, value));
}

/**
 * Nest sits on the clearing with a tall sprite (`translate(-50%, -72%)`).
 * Keep Y low enough that the nest rim never spills past the garden frame.
 */
export function clampNestCoord(n: number, axis: "x" | "y"): number {
  const value = typeof n === "number" ? n : Number(n);
  if (!Number.isFinite(value)) return axis === "x" ? 52 : 78;
  if (axis === "x") return Math.min(88, Math.max(12, value));
  return Math.min(84, Math.max(56, value));
}

export function isValidGardenLayer(v: unknown): v is GardenLayer {
  return v === "background" || v === "middle" || v === "foreground";
}

/** @deprecated Habitat is wallpaper-baked; kept for type compatibility. */
export const STARTER_GARDEN_POSES: Array<{
  itemId: DecorationItemId;
  x: number;
  y: number;
  layer: GardenLayer;
}> = [];
