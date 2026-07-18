/**
 * Lightweight domain checks for pet progression.
 * Run: pnpm --filter @daily-puzzle/puzzle-core exec tsx src/pets.selftest.ts
 */
import {
  clampGardenCoord,
  gardenAmbience,
  gardenClimateFromLocal,
  gardenDailyWeather,
  gardenSeason,
  gardenTimeOfDay,
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
assert(shopCategoryUnlocked(1, "garden"), "garden open at 1");
assert(!shopCategoryUnlocked(19, "flowers"), "flowers locked before 20");
assert(shopCategoryUnlocked(20, "flowers"), "flowers at 20");
assert(shopCategoryUnlocked(100, "legendary"), "legendary at 100");

assert(xpForDailyWin("hard") > xpForDailyWin("easy"), "harder wins grant more XP");
assert(GARDEN_SCENE.aspectRatio > 1, "diorama is wider than tall");
assert(clampGardenCoord(200) === 92, "garden coord clamps high");
assert(clampGardenCoord(-4) === 8, "garden coord clamps low");

// Local-calendar helpers — construct with explicit local components.
const localNoon = new Date(2026, 6, 18, 12, 0, 0); // July = summer
assert(gardenTimeOfDay(localNoon) === "day", "noon is day");
assert(gardenTimeOfDay(new Date(2026, 6, 18, 6, 30, 0)) === "dawn", "6:30 dawn");
assert(gardenTimeOfDay(new Date(2026, 6, 18, 19, 0, 0)) === "dusk", "19:00 dusk");
assert(gardenTimeOfDay(new Date(2026, 6, 18, 23, 0, 0)) === "night", "23:00 night");
assert(gardenSeason(localNoon) === "summer", "July is summer");
assert(gardenSeason(new Date(2026, 11, 1)) === "winter", "December winter");
assert(gardenSeason(new Date(2026, 3, 1)) === "spring", "April spring");
assert(gardenSeason(new Date(2026, 9, 1)) === "autumn", "October autumn");

const w1 = gardenDailyWeather("2026-07-18", "summer");
const w2 = gardenDailyWeather("2026-07-18", "summer");
assert(w1 === w2, "daily weather stable for same local day");
const climate = gardenClimateFromLocal(localNoon);
assert(climate.season === "summer", "climate season");
assert(climate.tone === "day", "climate tone");

assert(
  gardenAmbience({
    accountLevel: 1,
    petLevel: 1,
    placedCount: 0,
    tone: "day",
  }).includes("pollen"),
  "day pollen",
);
assert(
  gardenAmbience({
    accountLevel: 20,
    petLevel: 10,
    placedCount: 0,
    tone: "night",
  }).includes("star_glints"),
  "night stars",
);

console.log("pets.selftest: ok");
