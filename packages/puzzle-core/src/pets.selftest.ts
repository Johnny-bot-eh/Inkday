/**
 * Lightweight domain checks for pet progression.
 * Run: pnpm --filter @daily-puzzle/puzzle-core exec tsx src/pets.selftest.ts
 */
import {
  clampHappiness,
  decayedHappiness,
  gardenGridSize,
  gardenPetCellIndex,
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

assert(gardenGridSize(0).cells === 9, "base garden 3x3");
assert(gardenGridSize(5).cols === 4 && gardenGridSize(5).rows === 4, "expand at 5");
assert(xpForDailyWin("hard") > xpForDailyWin("easy"), "harder wins grant more XP");
assert(gardenPetCellIndex(3, 3) === 4, "pet nest is center of 3x3");
assert(gardenPetCellIndex(4, 3) === 6, "pet nest on 4x3");

console.log("pets.selftest: ok");
