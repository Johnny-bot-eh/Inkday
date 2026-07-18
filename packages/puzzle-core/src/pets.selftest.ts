/**
 * Lightweight domain checks for pet progression.
 * Run: pnpm --filter @daily-puzzle/puzzle-core exec tsx src/pets.selftest.ts
 */
import {
  clampGardenCoord,
  gardenAmbience,
  gardenSceneTone,
  GARDEN_SCENE,
} from "./garden";
import {
  clampHappiness,
  decayedHappiness,
  levelFromXp,
  shopCategoryUnlocked,
  stageFromLevel,
  xpForDailyWin,
  xpToNextLevel,
} from "./pets";

function assert(cond: unknown, msg: string) {
  if (!cond) throw new Error(msg);
}

assert(levelFromXp(0).level === 1, "level starts at 1");
assert(xpToNextLevel(1) > 0, "xp curve positive");
const mid = levelFromXp(xpToNextLevel(1));
assert(mid.level === 2, "crossing first threshold reaches level 2");

assert(stageFromLevel(1) === "egg", "stage egg");
assert(stageFromLevel(15) === "baby", "stage baby");
assert(stageFromLevel(30) === "teen", "stage teen");
assert(stageFromLevel(50) === "adult", "stage adult");
assert(stageFromLevel(75) === "mythical", "stage mythical");
assert(stageFromLevel(100) === "legendary", "stage legendary");

assert(clampHappiness(150) === 100, "happiness clamp high");
assert(clampHappiness(-3) === 0, "happiness clamp low");

const now = new Date("2026-07-18T12:00:00Z");
const threeDaysAgo = new Date("2026-07-15T12:00:00Z");
assert(
  decayedHappiness(100, threeDaysAgo, now) === 85,
  "decay −5 per full day",
);
assert(decayedHappiness(10, threeDaysAgo, now) === 0, "decay floors at 0");

assert(shopCategoryUnlocked(1, "food"), "food always open");
assert(!shopCategoryUnlocked(19, "flowers"), "flowers locked before 20");
assert(shopCategoryUnlocked(20, "flowers"), "flowers at 20");
assert(shopCategoryUnlocked(100, "legendary"), "legendary at 100");

assert(xpForDailyWin("hard") > xpForDailyWin("easy"), "harder wins grant more XP");
assert(GARDEN_SCENE.aspectRatio > 1, "diorama is wider than tall");
assert(clampGardenCoord(200) === 92, "garden coord clamps high");
assert(clampGardenCoord(-4) === 8, "garden coord clamps low");
assert(gardenSceneTone(1, 1) === "dawn", "starter tone dawn");
assert(gardenAmbience({ accountLevel: 1, petLevel: 1, placedCount: 0 }).includes("pollen"), "base pollen");

console.log("pets.selftest: ok");
