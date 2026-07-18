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
   * One egg / companion per nest. Nest + pet share this anchor.
   */
  nest: {
    maxNests: 1,
    eggsPerNest: 1,
    x: 52,
    y: 82,
  },
  pet: {
    /** Bottom of companion sits in the nest hollow. */
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
