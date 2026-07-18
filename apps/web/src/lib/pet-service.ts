import {
  DECORATION_SHOP_ITEMS,
  GARDEN_SCENE,
  HAPPINESS,
  PET_SPECIES,
  STARTER_DECORATION_IDS,
  STARTER_SPECIES,
  clampGardenCoord,
  clampHappiness,
  daysAway,
  decayedHappiness,
  dialogueFor,
  gardenAmbience,
  gardenDecorVisual,
  gardenSceneTone,
  getShopItem,
  happinessState,
  isDecorationItemId,
  isFoodItemId,
  isHabitatDecorItemId,
  isValidGardenLayer,
  levelFromXp,
  pickPersonality,
  rollPetGift,
  shopCategoryUnlocked,
  stageFromLevel,
  todayKey,
  welcomeBackLine,
  xpForDailyWin,
  xpForGardenBuy,
  xpForMonthlySlot,
  xpForStreak7,
  type CompanionGiftView,
  type CompanionPetView,
  type CompanionSnapshot,
  type Difficulty,
  type FoodItemId,
  type GardenLayer,
  type PetSpeciesId,
  type ShopCategoryId,
} from "@daily-puzzle/puzzle-core";
import {
  gardenPlacement,
  getDb,
  getLibsqlClient,
  petGift,
  playResult,
  progressionEvent,
  userPet,
  userProgression,
  coinInventory,
  monthlyCompletion,
} from "@daily-puzzle/db";
import { and, eq, sql } from "drizzle-orm";
import { randomUUID } from "node:crypto";
import { grantCoins, getInventoryQty, listCoinInventory } from "@/lib/coin-service";

export type { CompanionSnapshot } from "@daily-puzzle/puzzle-core";

async function ensureProgression(userId: string) {
  const db = getDb();
  const existing = await db.query.userProgression.findFirst({
    where: eq(userProgression.userId, userId),
  });
  if (existing) return existing;
  await db.insert(userProgression).values({
    userId,
    accountXp: 0,
    starterClaimed: false,
    backfilled: false,
  });
  return (
    (await db.query.userProgression.findFirst({
      where: eq(userProgression.userId, userId),
    })) ?? {
      userId,
      accountXp: 0,
      activePetId: null as string | null,
      starterClaimed: false,
      backfilled: false,
      nestX: null as number | null,
      nestY: null as number | null,
      updatedAt: new Date(),
    }
  );
}

async function recordEvent(opts: {
  userId: string;
  petId?: string | null;
  kind: string;
  amount: number;
  sourceType: string;
  sourceId: string;
  meta?: Record<string, unknown>;
}): Promise<{ ok: true; duplicate: boolean }> {
  const db = getDb();
  const existing = await db.query.progressionEvent.findFirst({
    where: and(
      eq(progressionEvent.userId, opts.userId),
      eq(progressionEvent.kind, opts.kind),
      eq(progressionEvent.sourceType, opts.sourceType),
      eq(progressionEvent.sourceId, opts.sourceId),
    ),
  });
  if (existing) return { ok: true, duplicate: true };
  try {
    await db.insert(progressionEvent).values({
      id: randomUUID(),
      userId: opts.userId,
      petId: opts.petId ?? null,
      kind: opts.kind,
      amount: opts.amount,
      sourceType: opts.sourceType,
      sourceId: opts.sourceId,
      metaJson: opts.meta ? JSON.stringify(opts.meta) : null,
    });
    return { ok: true, duplicate: false };
  } catch {
    return { ok: true, duplicate: true };
  }
}

/**
 * Backfill account XP from historical wins once per user.
 * Pets grow from hatch — historical wins count toward account unlocks only
 * (the “other” part of account XP), never toward pet XP.
 */
export async function backfillProgressionIfNeeded(userId: string) {
  const db = getDb();
  const prog = await ensureProgression(userId);
  if (prog.backfilled) return prog;

  const wins = await db
    .select({
      id: playResult.id,
      difficulty: playResult.difficulty,
    })
    .from(playResult)
    .where(and(eq(playResult.userId, userId), eq(playResult.won, true)));

  const monthly = await db
    .select({
      id: monthlyCompletion.id,
      collectionId: monthlyCompletion.collectionId,
      slotIndex: monthlyCompletion.slotIndex,
    })
    .from(monthlyCompletion)
    .where(
      and(eq(monthlyCompletion.userId, userId), eq(monthlyCompletion.won, true)),
    );

  let totalXp = 0;
  for (const w of wins) {
    totalXp += xpForDailyWin(w.difficulty as Difficulty);
  }
  totalXp += monthly.length * xpForMonthlySlot();

  await db
    .update(userProgression)
    .set({
      accountXp: sql`max(${userProgression.accountXp}, ${totalXp})`,
      backfilled: true,
      updatedAt: new Date(),
    })
    .where(eq(userProgression.userId, userId));

  return ensureProgression(userId);
}

async function getActivePet(userId: string) {
  const db = getDb();
  const prog = await ensureProgression(userId);
  if (!prog.activePetId) return null;
  return (
    (await db.query.userPet.findFirst({
      where: and(eq(userPet.id, prog.activePetId), eq(userPet.userId, userId)),
    })) ?? null
  );
}

function unlockedCategories(accountLevel: number): ShopCategoryId[] {
  const all: ShopCategoryId[] = [
    "food",
    "garden",
    "flowers",
    "ponds",
    "trees",
    "seasonal",
    "legendary",
  ];
  return all.filter((c) => shopCategoryUnlocked(accountLevel, c));
}

async function maybeRollGift(opts: {
  userId: string;
  pet: typeof userPet.$inferSelect;
  happiness: number;
  dateKey: string;
}): Promise<CompanionGiftView> {
  const stage = stageFromLevel(levelFromXp(opts.pet.petXp).level);
  // Eggs / brand-new companions do not gift yet.
  if (stage === "egg") return null;

  const db = getDb();
  const existing = await db.query.petGift.findFirst({
    where: and(
      eq(petGift.petId, opts.pet.id),
      eq(petGift.dateKey, opts.dateKey),
    ),
  });
  if (existing) {
    if (existing.claimed) return null;
    return {
      id: existing.id,
      giftKind: existing.giftKind,
      coins: existing.coins,
      itemId: existing.itemId,
      claimed: false,
      message: dialogueFor(
        opts.pet.personalityId as never,
        "gift",
        opts.dateKey.length,
      ),
      rewardLabel: describeGiftReward(existing.coins, existing.itemId),
    };
  }
  if (opts.happiness < HAPPINESS.giftThreshold) return null;

  const rolled = rollPetGift(opts.userId, opts.dateKey, opts.pet.id);
  const id = randomUUID();
  try {
    await db.insert(petGift).values({
      id,
      userId: opts.userId,
      petId: opts.pet.id,
      dateKey: opts.dateKey,
      giftKind: rolled.kind,
      coins: rolled.coins ?? 0,
      itemId: rolled.itemId ?? null,
      claimed: false,
    });
  } catch {
    const again = await db.query.petGift.findFirst({
      where: and(
        eq(petGift.petId, opts.pet.id),
        eq(petGift.dateKey, opts.dateKey),
      ),
    });
    if (!again || again.claimed) return null;
    return {
      id: again.id,
      giftKind: again.giftKind,
      coins: again.coins,
      itemId: again.itemId,
      claimed: false,
      message: dialogueFor(
        opts.pet.personalityId as never,
        "gift",
        opts.dateKey.length,
      ),
      rewardLabel: describeGiftReward(again.coins, again.itemId),
    };
  }

  return {
    id,
    giftKind: rolled.kind,
    coins: rolled.coins ?? 0,
    itemId: rolled.itemId ?? null,
    claimed: false,
    message: dialogueFor(
      opts.pet.personalityId as never,
      "gift",
      opts.dateKey.length,
    ),
    rewardLabel: describeGiftReward(rolled.coins ?? 0, rolled.itemId ?? null),
  };
}

/** One-time fix for pets created under the old starter defaults. */
async function repairMisinitializedStarterPet(
  userId: string,
  pet: typeof userPet.$inferSelect,
): Promise<typeof userPet.$inferSelect> {
  const stage = stageFromLevel(levelFromXp(pet.petXp).level);
  if (stage !== "egg") return pet;

  const event = await recordEvent({
    userId,
    petId: pet.id,
    kind: "starter_repair",
    amount: 0,
    sourceType: "pet_init",
    sourceId: pet.id,
  });
  if (event.duplicate) return pet;

  const db = getDb();
  const happinessBase = pet.lastPetDate ? HAPPINESS.petBonus : 0;
  await db
    .update(userPet)
    .set({
      petXp: 0,
      happinessBase,
      happinessUpdatedAt: new Date(),
      updatedAt: new Date(),
    })
    .where(eq(userPet.id, pet.id));

  // Drop unclaimed egg-day gifts created under the old rules.
  await db
    .delete(petGift)
    .where(
      and(
        eq(petGift.petId, pet.id),
        eq(petGift.claimed, false),
      ),
    );

  await clearHabitatInventoryNoise(userId);

  return (
    (await db.query.userPet.findFirst({
      where: eq(userPet.id, pet.id),
    })) ?? { ...pet, petXp: 0, happinessBase }
  );
}

/** Habitat scenery is baked into the wallpaper — strip legacy starter placements. */
async function clearHabitatInventoryNoise(userId: string) {
  const db = getDb();
  try {
    for (const itemId of STARTER_DECORATION_IDS) {
      await db
        .delete(gardenPlacement)
        .where(
          and(
            eq(gardenPlacement.userId, userId),
            eq(gardenPlacement.itemId, itemId),
          ),
        );
      await db
        .delete(coinInventory)
        .where(
          and(
            eq(coinInventory.userId, userId),
            eq(coinInventory.itemId, itemId),
          ),
        );
    }
  } catch (err) {
    console.error("clearHabitatInventoryNoise failed", err);
  }
}

export function describeGiftReward(coins: number, itemId: string | null): string {
  const parts: string[] = [];
  if (coins > 0) parts.push(`+${coins} coins`);
  if (itemId) parts.push(getShopItem(itemId)?.title ?? itemId);
  return parts.join(" · ") || "a surprise";
}

export async function getCompanionSnapshot(
  userId: string,
): Promise<CompanionSnapshot> {
  const db = getDb();
  await ensureNestColumns();
  await backfillProgressionIfNeeded(userId);
  const prog = await ensureProgression(userId);
  const account = levelFromXp(prog.accountXp);
  const dateKey = todayKey();
  let petRow = await getActivePet(userId);

  let petView: CompanionPetView | null = null;
  let gift: CompanionGiftView = null;

  if (petRow) {
    petRow = await repairMisinitializedStarterPet(userId, petRow);
    const happiness = decayedHappiness(
      petRow.happinessBase,
      petRow.happinessUpdatedAt,
    );
    // Persist decayed baseline so long absences don't recompute forever.
    if (happiness !== petRow.happinessBase) {
      await db
        .update(userPet)
        .set({
          happinessBase: happiness,
          happinessUpdatedAt: new Date(),
          updatedAt: new Date(),
        })
        .where(eq(userPet.id, petRow.id));
      petRow.happinessBase = happiness;
      petRow.happinessUpdatedAt = new Date();
    }

    const away = daysAway(petRow.happinessUpdatedAt);
    const levelInfo = levelFromXp(petRow.petXp);
    const species = PET_SPECIES[petRow.speciesId as PetSpeciesId];
    const state = happinessState(happiness);
    const dialogueMood =
      away > 0
        ? "welcomeBack"
        : state === "sad" || state === "sleepy"
          ? "sleepy"
          : state === "ecstatic" || state === "happy"
            ? "happy"
            : "idle";

    petView = {
      id: petRow.id,
      speciesId: petRow.speciesId as PetSpeciesId,
      speciesTitle: species?.title ?? petRow.speciesId,
      eggTitle: species?.eggTitle ?? "Egg",
      tagline: species?.tagline ?? "",
      personalityId: petRow.personalityId,
      personalityTitle: petRow.personalityId,
      name: petRow.name,
      petXp: petRow.petXp,
      level: levelInfo.level,
      xpIntoLevel: levelInfo.xpIntoLevel,
      xpForNext: levelInfo.xpForNext,
      stage: stageFromLevel(levelInfo.level),
      happiness,
      happinessState: state,
      dialogue:
        away > 0
          ? welcomeBackLine(petRow.personalityId as never, away, dateKey)
          : dialogueFor(petRow.personalityId as never, dialogueMood, dateKey.length),
      awayDays: away,
      colors: species?.colors ?? {
        primary: "#333",
        secondary: "#999",
        accent: "#e8b86d",
      },
      canPetToday: petRow.lastPetDate !== dateKey,
      lastPetDate: petRow.lastPetDate,
    };

    gift = await maybeRollGift({
      userId,
      pet: petRow,
      happiness,
      dateKey,
    });
  }

  await ensureGardenAllowsDuplicateItems();
  await clearHabitatInventoryNoise(userId);

  const inventory = await listCoinInventory(userId);
  const foodInventory = inventory
    .filter((row) => isFoodItemId(row.itemId))
    .map((row) => ({
      itemId: row.itemId,
      title: getShopItem(row.itemId)?.title ?? row.itemId,
      qty: row.qty,
    }));

  const ownedDecor = inventory.filter(
    (row) =>
      isDecorationItemId(row.itemId) &&
      !isHabitatDecorItemId(row.itemId) &&
      row.qty > 0,
  );

  let placements: Array<{
    id: string;
    itemId: string;
    x: number;
    y: number;
    layer: string;
  }> = [];
  try {
    placements = await db.query.gardenPlacement.findMany({
      where: eq(gardenPlacement.userId, userId),
    });
  } catch (err) {
    console.error("garden_placement query failed — run db migrate", err);
    placements = [];
  }

  placements = placements.filter((p) => !isHabitatDecorItemId(p.itemId));

  const placedCounts = new Map<string, number>();
  for (const p of placements) {
    placedCounts.set(p.itemId, (placedCounts.get(p.itemId) ?? 0) + 1);
  }

  const petLevel = petView?.level ?? 1;
  const tone = gardenSceneTone(account.level, petLevel);
  const ambience = gardenAmbience({
    accountLevel: account.level,
    petLevel,
    placedCount: placements.length,
  });

  return {
    needsStarter: !prog.starterClaimed || !petView,
    starters: STARTER_SPECIES.map((id) => {
      const s = PET_SPECIES[id];
      return {
        id,
        title: s.title,
        eggTitle: s.eggTitle,
        tagline: s.tagline,
        colors: s.colors,
      };
    }),
    accountXp: prog.accountXp,
    accountLevel: account.level,
    accountXpIntoLevel: account.xpIntoLevel,
    accountXpForNext: account.xpForNext,
    unlockedCategories: unlockedCategories(account.level),
    pet: petView,
    gift,
    garden: {
      sceneVersion: GARDEN_SCENE.sceneVersion,
      aspectRatio: GARDEN_SCENE.aspectRatio,
      tone,
      ambience,
      pet: {
        x:
          prog.nestX != null
            ? clampGardenCoord(prog.nestX)
            : GARDEN_SCENE.pet.x,
        y:
          prog.nestY != null
            ? clampGardenCoord(prog.nestY)
            : GARDEN_SCENE.pet.y,
        layer: GARDEN_SCENE.pet.layer,
      },
      placements: placements.map((p) => {
        const visual = gardenDecorVisual(p.itemId);
        const layer = isValidGardenLayer(p.layer) ? p.layer : visual.layer;
        return {
          id: p.id,
          itemId: p.itemId,
          title: getShopItem(p.itemId)?.title ?? p.itemId,
          x: clampGardenCoord(Number(p.x)),
          y: clampGardenCoord(Number(p.y)),
          layer,
          widthPct: visual.widthPct,
          motion: visual.motion,
          mark: visual.mark,
          tone: visual.tone,
        };
      }),
      inventoryDecor: ownedDecor
        .map((row) => {
          const placed = placedCounts.get(row.itemId) ?? 0;
          const remaining = Math.max(0, row.qty - placed);
          return {
            itemId: row.itemId,
            title: getShopItem(row.itemId)?.title ?? row.itemId,
            qty: remaining,
          };
        })
        .filter((row) => row.qty > 0),
    },
    foodInventory,
  };
}

export async function claimStarterEgg(
  userId: string,
  speciesId: string,
): Promise<
  | { ok: true; snapshot: CompanionSnapshot }
  | { ok: false; reason: string }
> {
  if (!STARTER_SPECIES.includes(speciesId as PetSpeciesId)) {
    return { ok: false, reason: "invalid_species" };
  }
  const db = getDb();
  const prog = await ensureProgression(userId);
  if (prog.starterClaimed && prog.activePetId) {
    return { ok: false, reason: "already_claimed" };
  }

  const event = await recordEvent({
    userId,
    kind: "starter_claim",
    amount: 0,
    sourceType: "starter",
    sourceId: "first",
    meta: { speciesId },
  });
  if (event.duplicate && prog.starterClaimed) {
    return { ok: false, reason: "already_claimed" };
  }

  const personality = pickPersonality(userId, speciesId as PetSpeciesId);
  const petId = randomUUID();
  const species = PET_SPECIES[speciesId as PetSpeciesId];

  await db.insert(userPet).values({
    id: petId,
    userId,
    speciesId,
    personalityId: personality,
    name: species.title,
    petXp: 0,
    happinessBase: 0,
    happinessUpdatedAt: new Date(),
  });

  await db
    .update(userProgression)
    .set({
      starterClaimed: true,
      activePetId: petId,
      updatedAt: new Date(),
    })
    .where(eq(userProgression.userId, userId));

  await backfillProgressionIfNeeded(userId);
  await clearHabitatInventoryNoise(userId);

  return { ok: true, snapshot: await getCompanionSnapshot(userId) };
}

export async function petCompanion(
  userId: string,
): Promise<
  | { ok: true; snapshot: CompanionSnapshot; happinessGain: number }
  | { ok: false; reason: string }
> {
  const db = getDb();
  const pet = await getActivePet(userId);
  if (!pet) return { ok: false, reason: "no_pet" };
  const dateKey = todayKey();
  if (pet.lastPetDate === dateKey) {
    return { ok: false, reason: "already_petted" };
  }

  const event = await recordEvent({
    userId,
    petId: pet.id,
    kind: "pet",
    amount: HAPPINESS.petBonus,
    sourceType: "daily_pet",
    sourceId: dateKey,
  });
  if (event.duplicate) return { ok: false, reason: "already_petted" };

  const current = decayedHappiness(pet.happinessBase, pet.happinessUpdatedAt);
  const next = clampHappiness(current + HAPPINESS.petBonus);
  await db
    .update(userPet)
    .set({
      happinessBase: next,
      happinessUpdatedAt: new Date(),
      lastPetDate: dateKey,
      updatedAt: new Date(),
    })
    .where(eq(userPet.id, pet.id));

  return {
    ok: true,
    happinessGain: next - current,
    snapshot: await getCompanionSnapshot(userId),
  };
}

async function consumeInventoryQty(
  userId: string,
  itemId: string,
  qty = 1,
): Promise<boolean> {
  const db = getDb();
  const existing = await db.query.coinInventory.findFirst({
    where: and(
      eq(coinInventory.userId, userId),
      eq(coinInventory.itemId, itemId),
    ),
  });
  if (!existing || existing.qty < qty) return false;
  const next = existing.qty - qty;
  if (next <= 0) {
    await db.delete(coinInventory).where(eq(coinInventory.id, existing.id));
  } else {
    await db
      .update(coinInventory)
      .set({ qty: next })
      .where(eq(coinInventory.id, existing.id));
  }
  return true;
}

export async function feedCompanion(
  userId: string,
  itemId: string,
): Promise<
  | { ok: true; snapshot: CompanionSnapshot; happinessGain: number }
  | { ok: false; reason: string }
> {
  if (!isFoodItemId(itemId)) return { ok: false, reason: "invalid_food" };
  const db = getDb();
  const pet = await getActivePet(userId);
  if (!pet) return { ok: false, reason: "no_pet" };

  const bonus = HAPPINESS.food[itemId as FoodItemId];
  if (!bonus) return { ok: false, reason: "invalid_food" };

  const feedId = randomUUID();
  const event = await recordEvent({
    userId,
    petId: pet.id,
    kind: "feed",
    amount: bonus,
    sourceType: "food",
    sourceId: feedId,
    meta: { itemId },
  });
  if (event.duplicate) return { ok: false, reason: "duplicate" };

  const consumed = await consumeInventoryQty(userId, itemId, 1);
  if (!consumed) return { ok: false, reason: "none" };

  const current = decayedHappiness(pet.happinessBase, pet.happinessUpdatedAt);
  const next = clampHappiness(current + bonus);
  const dateKey = todayKey();
  await db
    .update(userPet)
    .set({
      happinessBase: next,
      happinessUpdatedAt: new Date(),
      lastFeedDate: dateKey,
      updatedAt: new Date(),
    })
    .where(eq(userPet.id, pet.id));

  return {
    ok: true,
    happinessGain: next - current,
    snapshot: await getCompanionSnapshot(userId),
  };
}

export async function claimPetGift(
  userId: string,
  giftId: string,
): Promise<
  | {
      ok: true;
      snapshot: CompanionSnapshot;
      coins: number;
      itemId: string | null;
      rewardLabel: string;
    }
  | { ok: false; reason: string }
> {
  const db = getDb();
  const gift = await db.query.petGift.findFirst({
    where: and(eq(petGift.id, giftId), eq(petGift.userId, userId)),
  });
  if (!gift) return { ok: false, reason: "not_found" };
  if (gift.claimed) return { ok: false, reason: "already_claimed" };

  const event = await recordEvent({
    userId,
    petId: gift.petId,
    kind: "gift_claim",
    amount: gift.coins,
    sourceType: "pet_gift",
    sourceId: gift.id,
  });
  if (event.duplicate) return { ok: false, reason: "already_claimed" };

  let coins = 0;
  if (gift.coins > 0) {
    const grant = await grantCoins({
      userId,
      delta: gift.coins,
      reason: "pet_gift",
      refType: "pet_gift",
      refId: gift.id,
      raw: true,
    });
    if (grant.ok) coins = grant.granted;
  }

  if (gift.itemId) {
    const existing = await db.query.coinInventory.findFirst({
      where: and(
        eq(coinInventory.userId, userId),
        eq(coinInventory.itemId, gift.itemId),
      ),
    });
    if (existing) {
      const item = getShopItem(gift.itemId);
      const isStackable =
        item?.kind === "consumable" || item?.kind === "food";
      if (isStackable) {
        await db
          .update(coinInventory)
          .set({ qty: existing.qty + 1 })
          .where(eq(coinInventory.id, existing.id));
      }
    } else {
      await db.insert(coinInventory).values({
        id: randomUUID(),
        userId,
        itemId: gift.itemId,
        qty: 1,
      });
    }
  }

  await db
    .update(petGift)
    .set({ claimed: true, claimedAt: new Date() })
    .where(eq(petGift.id, gift.id));

  const rewardLabel = describeGiftReward(coins || gift.coins, gift.itemId);

  return {
    ok: true,
    coins,
    itemId: gift.itemId,
    rewardLabel,
    snapshot: await getCompanionSnapshot(userId),
  };
}

/** Grant diminishing XP when buying another copy of a decoration. */
export async function grantGardenBuyXp(
  userId: string,
  itemId: string,
  requiredLevel: number,
  ownedBefore: number,
): Promise<number> {
  const xp = xpForGardenBuy(requiredLevel, ownedBefore);
  if (xp <= 0) return 0;

  const db = getDb();
  await ensureProgression(userId);
  const event = await recordEvent({
    userId,
    kind: "xp",
    amount: xp,
    sourceType: "garden_buy",
    sourceId: `${itemId}:${ownedBefore}`,
  });
  if (event.duplicate) return 0;

  await db
    .update(userProgression)
    .set({
      accountXp: sql`${userProgression.accountXp} + ${xp}`,
      updatedAt: new Date(),
    })
    .where(eq(userProgression.userId, userId));

  const pet = await getActivePet(userId);
  if (pet) {
    await db
      .update(userPet)
      .set({
        petXp: sql`${userPet.petXp} + ${xp}`,
        updatedAt: new Date(),
      })
      .where(eq(userPet.id, pet.id));
  }
  return xp;
}

/** Drop legacy unique (user,item) index so duplicate decorations can be placed. */
async function ensureGardenAllowsDuplicateItems() {
  const client = getLibsqlClient();
  try {
    await client.execute(`DROP INDEX IF EXISTS garden_placement_item_idx`);
    await client.execute(
      `CREATE INDEX IF NOT EXISTS garden_placement_user_item_idx ON garden_placement(user_id, item_id)`,
    );
  } catch (err) {
    console.error("ensureGardenAllowsDuplicateItems failed", err);
  }
}

/** Ensure nest position columns exist (additive migrate may not have run yet). */
let nestColumnsReady = false;
async function ensureNestColumns() {
  if (nestColumnsReady) return;
  const client = getLibsqlClient();
  try {
    await client.execute(`ALTER TABLE user_progression ADD COLUMN nest_x INTEGER`);
  } catch {
    /* already present */
  }
  try {
    await client.execute(`ALTER TABLE user_progression ADD COLUMN nest_y INTEGER`);
  } catch {
    /* already present */
  }
  nestColumnsReady = true;
}

export async function placeGardenItem(
  userId: string,
  itemId: string,
  x: number,
  y: number,
  layer?: GardenLayer,
): Promise<
  | { ok: true; snapshot: CompanionSnapshot }
  | { ok: false; reason: string }
> {
  if (!isDecorationItemId(itemId) || isHabitatDecorItemId(itemId)) {
    return { ok: false, reason: "invalid_item" };
  }
  const db = getDb();
  const owned = await getInventoryQty(userId, itemId);
  if (owned <= 0) return { ok: false, reason: "not_owned" };

  const placedRows = await db.query.gardenPlacement.findMany({
    where: and(
      eq(gardenPlacement.userId, userId),
      eq(gardenPlacement.itemId, itemId),
    ),
  });
  if (placedRows.length >= owned) {
    return { ok: false, reason: "already_placed" };
  }

  const visual = gardenDecorVisual(itemId);
  const resolvedLayer =
    layer && isValidGardenLayer(layer) ? layer : visual.layer;

  const values = {
    id: randomUUID(),
    userId,
    itemId,
    x: Math.round(clampGardenCoord(x)),
    y: Math.round(clampGardenCoord(y)),
    layer: resolvedLayer,
  };

  try {
    await db.insert(gardenPlacement).values(values);
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    // Legacy unique index still present — drop it and retry once.
    if (/unique|constraint/i.test(message)) {
      await ensureGardenAllowsDuplicateItems();
      try {
        await db.insert(gardenPlacement).values({
          ...values,
          id: randomUUID(),
        });
      } catch {
        return { ok: false, reason: "conflict" };
      }
    } else {
      return { ok: false, reason: "conflict" };
    }
  }

  return {
    ok: true,
    snapshot: await getCompanionSnapshot(userId),
  };
}

export async function moveGardenItem(
  userId: string,
  placementId: string,
  x: number,
  y: number,
): Promise<
  | { ok: true; snapshot: CompanionSnapshot }
  | { ok: false; reason: string }
> {
  const db = getDb();
  const placement = await db.query.gardenPlacement.findFirst({
    where: and(
      eq(gardenPlacement.id, placementId),
      eq(gardenPlacement.userId, userId),
    ),
  });
  if (!placement) return { ok: false, reason: "not_found" };

  await db
    .update(gardenPlacement)
    .set({
      x: Math.round(clampGardenCoord(x)),
      y: Math.round(clampGardenCoord(y)),
    })
    .where(eq(gardenPlacement.id, placementId));

  return { ok: true, snapshot: await getCompanionSnapshot(userId) };
}

/** Move the single nest + companion anchor on the garden canvas. */
export async function moveGardenNest(
  userId: string,
  x: number,
  y: number,
): Promise<
  | { ok: true; snapshot: CompanionSnapshot }
  | { ok: false; reason: string }
> {
  await ensureNestColumns();
  await ensureProgression(userId);
  const db = getDb();
  await db
    .update(userProgression)
    .set({
      nestX: Math.round(clampGardenCoord(x)),
      nestY: Math.round(clampGardenCoord(y)),
      updatedAt: new Date(),
    })
    .where(eq(userProgression.userId, userId));

  return { ok: true, snapshot: await getCompanionSnapshot(userId) };
}

export async function removeGardenItem(
  userId: string,
  placementId: string,
): Promise<
  | { ok: true; snapshot: CompanionSnapshot }
  | { ok: false; reason: string }
> {
  const db = getDb();
  const placement = await db.query.gardenPlacement.findFirst({
    where: and(
      eq(gardenPlacement.id, placementId),
      eq(gardenPlacement.userId, userId),
    ),
  });
  if (!placement) return { ok: false, reason: "not_found" };
  await db.delete(gardenPlacement).where(eq(gardenPlacement.id, placementId));
  return { ok: true, snapshot: await getCompanionSnapshot(userId) };
}

/**
 * Grant account + active-pet XP (and optional happiness) after a puzzle win.
 * Idempotent via progression_event unique key.
 *
 * Pet XP grows only the active companion. Account XP always rises — it is the
 * total unlock pool (every pet’s earned XP plus non-pet progression).
 */
export async function grantPuzzleProgression(opts: {
  userId: string;
  sourceType: "play_result" | "monthly_completion" | "streak_7";
  sourceId: string;
  xp: number;
  /** First daily puzzle happiness bonus */
  dailyPuzzleHappy?: boolean;
  /** Streak happiness bonus */
  streakHappy?: boolean;
  dateKey?: string;
}): Promise<{
  xpEarned: number;
  accountXp: number;
  accountLevel: number;
  petXp: number | null;
  petLevel: number | null;
  petStage: string | null;
  happinessGain: number;
  duplicate: boolean;
}> {
  const db = getDb();
  await ensureProgression(opts.userId);
  const event = await recordEvent({
    userId: opts.userId,
    kind: "xp",
    amount: opts.xp,
    sourceType: opts.sourceType,
    sourceId: opts.sourceId,
  });

  let xpEarned = 0;
  if (!event.duplicate && opts.xp > 0) {
    await db
      .update(userProgression)
      .set({
        accountXp: sql`${userProgression.accountXp} + ${opts.xp}`,
        updatedAt: new Date(),
      })
      .where(eq(userProgression.userId, opts.userId));

    const pet = await getActivePet(opts.userId);
    if (pet) {
      await db
        .update(userPet)
        .set({
          petXp: sql`${userPet.petXp} + ${opts.xp}`,
          updatedAt: new Date(),
        })
        .where(eq(userPet.id, pet.id));
    }
    xpEarned = opts.xp;
  }

  let happinessGain = 0;
  const dateKey = opts.dateKey ?? todayKey();
  const pet = await getActivePet(opts.userId);

  if (pet && opts.dailyPuzzleHappy) {
    const happyEvent = await recordEvent({
      userId: opts.userId,
      petId: pet.id,
      kind: "puzzle_happy",
      amount: HAPPINESS.dailyPuzzleBonus,
      sourceType: "daily_puzzle",
      sourceId: dateKey,
    });
    if (!happyEvent.duplicate && pet.lastPuzzleHappyDate !== dateKey) {
      const current = decayedHappiness(
        pet.happinessBase,
        pet.happinessUpdatedAt,
      );
      const next = clampHappiness(current + HAPPINESS.dailyPuzzleBonus);
      happinessGain += next - current;
      await db
        .update(userPet)
        .set({
          happinessBase: next,
          happinessUpdatedAt: new Date(),
          lastPuzzleHappyDate: dateKey,
          updatedAt: new Date(),
        })
        .where(eq(userPet.id, pet.id));
      pet.happinessBase = next;
    }
  }

  if (pet && opts.streakHappy) {
    const streakEvent = await recordEvent({
      userId: opts.userId,
      petId: pet.id,
      kind: "streak_happy",
      amount: HAPPINESS.streakBonus,
      sourceType: "streak",
      sourceId: dateKey,
    });
    if (!streakEvent.duplicate) {
      const current = decayedHappiness(
        pet.happinessBase,
        pet.happinessUpdatedAt,
      );
      const next = clampHappiness(current + HAPPINESS.streakBonus);
      happinessGain += next - current;
      await db
        .update(userPet)
        .set({
          happinessBase: next,
          happinessUpdatedAt: new Date(),
          updatedAt: new Date(),
        })
        .where(eq(userPet.id, pet.id));
    }
  }

  const prog = await ensureProgression(opts.userId);
  const account = levelFromXp(prog.accountXp);
  const active = await getActivePet(opts.userId);
  const petLevel = active ? levelFromXp(active.petXp) : null;

  return {
    xpEarned,
    accountXp: prog.accountXp,
    accountLevel: account.level,
    petXp: active?.petXp ?? null,
    petLevel: petLevel?.level ?? null,
    petStage: petLevel ? stageFromLevel(petLevel.level) : null,
    happinessGain,
    duplicate: event.duplicate,
  };
}

export async function grantWinProgressionRewards(opts: {
  userId: string;
  playId: string;
  difficulty: Difficulty;
  won: boolean;
  streak: number;
  dateKey: string;
}) {
  if (!opts.won) {
    return {
      xpEarned: 0,
      accountXp: 0,
      accountLevel: 1,
      petXp: null as number | null,
      petLevel: null as number | null,
      petStage: null as string | null,
      happinessGain: 0,
    };
  }

  const base = await grantPuzzleProgression({
    userId: opts.userId,
    sourceType: "play_result",
    sourceId: opts.playId,
    xp: xpForDailyWin(opts.difficulty),
    dailyPuzzleHappy: true,
    streakHappy: opts.streak > 1,
    dateKey: opts.dateKey,
  });

  let xpEarned = base.xpEarned;
  if (opts.streak > 0 && opts.streak % 7 === 0) {
    const streakXp = await grantPuzzleProgression({
      userId: opts.userId,
      sourceType: "streak_7",
      sourceId: `${opts.streak}:${opts.dateKey}`,
      xp: xpForStreak7(),
      dateKey: opts.dateKey,
    });
    xpEarned += streakXp.xpEarned;
  }

  return {
    xpEarned,
    accountXp: base.accountXp,
    accountLevel: base.accountLevel,
    petXp: base.petXp,
    petLevel: base.petLevel,
    petStage: base.petStage,
    happinessGain: base.happinessGain,
  };
}

export async function grantMonthlyProgressionRewards(opts: {
  userId: string;
  collectionId: string;
  slotIndex: number;
  alreadyCleared: boolean;
}) {
  if (opts.alreadyCleared) {
    return {
      xpEarned: 0,
      accountXp: 0,
      accountLevel: 1,
      petXp: null as number | null,
      petLevel: null as number | null,
      petStage: null as string | null,
      happinessGain: 0,
    };
  }
  return grantPuzzleProgression({
    userId: opts.userId,
    sourceType: "monthly_completion",
    sourceId: `${opts.collectionId}:${opts.slotIndex}`,
    xp: xpForMonthlySlot(),
  });
}

export async function getAccountLevel(userId: string): Promise<number> {
  await backfillProgressionIfNeeded(userId);
  const prog = await ensureProgression(userId);
  return levelFromXp(prog.accountXp).level;
}

export function decorationCatalog() {
  return DECORATION_SHOP_ITEMS;
}
