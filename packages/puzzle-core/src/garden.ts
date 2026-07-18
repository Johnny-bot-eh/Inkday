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
  sceneVersion: 2,
  pet: {
    x: 52,
    y: 60,
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

/** Richness unlocks — scene stays fixed size; depth & life increase. */
export function gardenAmbience(opts: {
  accountLevel: number;
  petLevel: number;
  placedCount: number;
}): GardenAmbientId[] {
  const out: GardenAmbientId[] = ["pollen"];
  if (opts.petLevel >= 5 || opts.placedCount >= 3) out.push("soft_mist");
  if (opts.accountLevel >= 20 || opts.petLevel >= 15) out.push("fireflies");
  if (opts.accountLevel >= 40 || opts.placedCount >= 6) out.push("spark_dust");
  if (opts.petLevel >= 50 || opts.accountLevel >= 80) out.push("star_glints");
  return out;
}

export type GardenSceneTone = "dawn" | "day" | "dusk" | "night";

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
