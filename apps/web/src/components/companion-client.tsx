"use client";

import { useEffect, useMemo, useState, type CSSProperties } from "react";
import Link from "next/link";
import { emitCoinBalance } from "@/components/coin-balance-chip";
import { PetMark } from "@/components/pet-mark";
import type { CompanionSnapshot, PetSpeciesId } from "@daily-puzzle/puzzle-core";

type Props = {
  signedIn: boolean;
  initial: CompanionSnapshot | null;
};

function decoMark(itemId: string): { label: string; tone: string } {
  if (itemId.includes("moss")) return { label: "Moss", tone: "#4f7a3a" };
  if (itemId.includes("pebble") || itemId.includes("stone"))
    return { label: "Stone", tone: "#6d6a63" };
  if (itemId.includes("fern")) return { label: "Fern", tone: "#3f6b48" };
  if (itemId.includes("daisy") || itemId.includes("tulip") || itemId.includes("flower"))
    return { label: "Bloom", tone: "#c45c8a" };
  if (itemId.includes("pond")) return { label: "Pond", tone: "#3d6f8f" };
  if (itemId.includes("tree") || itemId.includes("oak") || itemId.includes("willow"))
    return { label: "Tree", tone: "#3d5c2e" };
  if (itemId.includes("lantern")) return { label: "Lamp", tone: "#c9a227" };
  if (itemId.includes("obelisk")) return { label: "Relic", tone: "#7a5cff" };
  return { label: "Decor", tone: "#8a6b4a" };
}

export function CompanionClient({ signedIn, initial }: Props) {
  const [snapshot, setSnapshot] = useState<CompanionSnapshot | null>(initial);
  const [message, setMessage] = useState<string | null>(null);
  const [busy, setBusy] = useState<string | null>(null);
  const [selectedDecor, setSelectedDecor] = useState<string | null>(null);
  const [selectedPlacement, setSelectedPlacement] = useState<string | null>(
    null,
  );

  // Server page already hydrates `initial`; client refresh is only for signed-in empty state.
  useEffect(() => {
    if (!signedIn || snapshot) return;
    let cancelled = false;
    void (async () => {
      const res = await fetch("/api/companion");
      if (!res.ok || cancelled) return;
      const data = (await res.json()) as CompanionSnapshot;
      if (!cancelled) setSnapshot(data);
    })();
    return () => {
      cancelled = true;
    };
  }, [signedIn, snapshot]);

  async function post(body: Record<string, unknown>) {
    setBusy(String(body.action ?? "action"));
    setMessage(null);
    try {
      const res = await fetch("/api/companion", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const data = await res.json();
      if (!res.ok) {
        setMessage(
          data.error === "already_petted"
            ? "Already petted today."
            : data.error === "already_claimed"
              ? "Starter already claimed."
              : data.error === "none"
                ? "No food left — buy some in the Shop."
                : data.error === "cell_taken"
                  ? "That plot is taken."
                  : data.error === "pet_cell"
                    ? "That’s your companion’s nest."
                    : data.error === "out_of_bounds"
                      ? "Outside the garden."
                      : (data.error ?? "Something went wrong"),
        );
        return null;
      }
      if (data.snapshot) setSnapshot(data.snapshot);
      if (typeof data.coins === "number" && data.coins > 0) {
        const balRes = await fetch("/api/shop");
        if (balRes.ok) {
          const shop = await balRes.json();
          if (typeof shop.balance === "number") emitCoinBalance(shop.balance);
        }
      }
      return data;
    } finally {
      setBusy(null);
    }
  }

  const gridStyle = useMemo(() => {
    if (!snapshot) return undefined;
    return {
      gridTemplateColumns: `repeat(${snapshot.garden.cols}, minmax(0, 1fr))`,
    } as CSSProperties;
  }, [snapshot]);

  if (!signedIn) {
    return (
      <div className="mx-auto max-w-lg animate-rise space-y-6 text-center">
        <p className="text-xs uppercase tracking-[0.22em] text-ember">Garden</p>
        <h1 className="font-[family-name:var(--font-display)] text-4xl font-bold">
          Companions & garden
        </h1>
        <p className="text-fog">
          Sign in to choose a starter egg, raise a companion, and decorate your
          garden.
        </p>
        <Link
          href="/auth"
          className="inline-block rounded-lg bg-ember px-5 py-2.5 font-semibold text-on-ember"
        >
          Sign in
        </Link>
      </div>
    );
  }

  if (!snapshot) {
    return (
      <div className="mx-auto max-w-lg animate-rise py-16 text-center text-fog">
        Loading garden…
      </div>
    );
  }

  if (snapshot.needsStarter) {
    return (
      <div className="mx-auto max-w-2xl animate-rise space-y-6">
        <div>
          <p className="text-xs uppercase tracking-[0.22em] text-ember">
            Starter egg
          </p>
          <h1 className="mt-2 font-[family-name:var(--font-display)] text-4xl font-bold">
            Choose your companion
          </h1>
          <p className="mt-2 text-fog">
            Pick one free starter egg. Your companion grows from hatch as you
            solve puzzles — account level unlocks shops.
          </p>
        </div>
        {message ? (
          <p className="rounded-lg border border-[var(--line)] bg-panel/70 px-4 py-3 text-sm">
            {message}
          </p>
        ) : null}
        <div className="grid gap-4 sm:grid-cols-3">
          {snapshot.starters.map((egg) => (
            <button
              key={egg.id}
              type="button"
              disabled={busy === "claim_starter"}
              onClick={() =>
                void post({ action: "claim_starter", speciesId: egg.id }).then(
                  (data) => {
                    if (data?.ok) {
                      setMessage(`Welcome, ${egg.title}!`);
                    }
                  },
                )
              }
              className="rounded-2xl border border-[var(--line)] bg-panel/70 p-4 text-left transition hover:border-ember/50 hover:bg-ember/10"
            >
              <PetMark
                speciesId={egg.id}
                stage="egg"
                colors={egg.colors}
                size={120}
              />
              <div className="mt-3 font-[family-name:var(--font-display)] text-xl font-bold">
                {egg.eggTitle}
              </div>
              <div className="text-sm text-fog">{egg.title}</div>
              <p className="mt-2 text-xs text-fog">{egg.tagline}</p>
            </button>
          ))}
        </div>
      </div>
    );
  }

  const pet = snapshot.pet!;
  const petCell = snapshot.garden.petCellIndex;

  return (
    <div className="mx-auto max-w-3xl animate-rise space-y-8">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-xs uppercase tracking-[0.22em] text-ember">
            Garden
          </p>
          <h1 className="mt-2 font-[family-name:var(--font-display)] text-4xl font-bold">
            {pet.name ?? pet.speciesTitle}
          </h1>
          <p className="mt-1 text-sm text-fog">
            Account lv {snapshot.accountLevel} · Pet lv {pet.level} ·{" "}
            {pet.stage} · {pet.happinessState}
          </p>
        </div>
        <div className="flex flex-wrap gap-3 text-sm">
          <Link href="/shop" className="text-ember hover:underline">
            Shop →
          </Link>
          <Link href="/inventory" className="text-ember hover:underline">
            Inventory →
          </Link>
        </div>
      </div>

      {message ? (
        <p className="rounded-lg border border-[var(--line)] bg-panel/70 px-4 py-3 text-sm">
          {message}
        </p>
      ) : null}

      {snapshot.gift ? (
        <div className="rounded-2xl border border-ember/40 bg-ember/10 px-5 py-4">
          <p className="text-xs uppercase tracking-[0.2em] text-ember">
            Companion gift
          </p>
          <p className="mt-2 font-semibold">{snapshot.gift.message}</p>
          <p className="mt-1 text-sm text-fog">
            Inside: {snapshot.gift.rewardLabel}
          </p>
          <button
            type="button"
            disabled={busy === "claim_gift"}
            onClick={() =>
              void post({
                action: "claim_gift",
                giftId: snapshot.gift!.id,
              }).then((data) => {
                if (data?.ok) {
                  setMessage(
                    `You got ${data.rewardLabel ?? snapshot.gift!.rewardLabel}`,
                  );
                }
              })
            }
            className="mt-3 rounded-lg bg-ember px-4 py-2 text-sm font-semibold text-on-ember hover:bg-ember-deep"
          >
            {busy === "claim_gift" ? "…" : "Claim gift"}
          </button>
        </div>
      ) : null}

      <section className="space-y-4">
        <div>
          <h2 className="font-[family-name:var(--font-display)] text-2xl font-bold">
            Garden plot
          </h2>
          <p className="text-sm text-fog">
            Your companion lives here. Select a decoration, then a free plot.
          </p>
        </div>

        <div
          className="relative overflow-hidden rounded-3xl border border-[var(--line)] p-4 sm:p-5"
          style={{
            background:
              "linear-gradient(180deg, #cfe3f4 0%, #d7ebc8 42%, #b7d39a 100%)",
          }}
        >
          <div
            className="pointer-events-none absolute inset-0 opacity-30"
            style={{
              backgroundImage:
                "radial-gradient(circle at 20% 15%, #fff8 0 18%, transparent 19%), radial-gradient(circle at 80% 10%, #fff6 0 12%, transparent 13%), repeating-linear-gradient(0deg, transparent 0 18px, #0000000a 18px 19px), repeating-linear-gradient(90deg, transparent 0 18px, #0000000a 18px 19px)",
            }}
          />
          <div className="relative grid gap-2" style={gridStyle}>
            {Array.from({ length: snapshot.garden.cells }).map((_, cellIndex) => {
              const isPet = cellIndex === petCell;
              const placed = snapshot.garden.placements.find(
                (p) => p.cellIndex === cellIndex,
              );
              const selected = selectedPlacement === placed?.id;

              if (isPet) {
                return (
                  <div
                    key={cellIndex}
                    className="relative flex aspect-square flex-col items-center justify-end overflow-hidden rounded-2xl border border-[#6f8f4e]/55 bg-[#9fbf6e]/55 p-1 shadow-[inset_0_-10px_0_#00000014]"
                  >
                    <div className="absolute inset-x-3 bottom-2 h-3 rounded-full bg-[#6d8f45]/55 blur-[1px]" />
                    <PetMark
                      speciesId={pet.speciesId as PetSpeciesId}
                      stage={pet.stage}
                      colors={pet.colors}
                      happinessState={pet.happinessState}
                      size={96}
                    />
                  </div>
                );
              }

              return (
                <button
                  key={cellIndex}
                  type="button"
                  onClick={() => {
                    if (selectedDecor) {
                      void post({
                        action: "place",
                        itemId: selectedDecor,
                        cellIndex,
                      }).then((data) => {
                        if (data?.ok) {
                          setSelectedDecor(null);
                          setMessage("Decoration placed.");
                        }
                      });
                      return;
                    }
                    if (placed && selectedPlacement === placed.id) {
                      void post({
                        action: "remove",
                        placementId: placed.id,
                      }).then((data) => {
                        if (data?.ok) {
                          setSelectedPlacement(null);
                          setMessage("Decoration returned to inventory.");
                        }
                      });
                      return;
                    }
                    if (
                      placed &&
                      selectedPlacement &&
                      selectedPlacement !== placed.id
                    ) {
                      void post({
                        action: "move",
                        placementId: selectedPlacement,
                        cellIndex,
                      }).then((data) => {
                        if (data?.ok) {
                          setSelectedPlacement(null);
                          setMessage("Moved.");
                        }
                      });
                      return;
                    }
                    setSelectedPlacement(placed ? placed.id : null);
                  }}
                  className={[
                    "aspect-square rounded-2xl border text-xs transition",
                    placed
                      ? selected
                        ? "border-ember/70 bg-[#f4e7c8]/85"
                        : "border-[#6f8f4e]/45 bg-[#d9ecc0]/75"
                      : "border-[#6f8f4e]/30 bg-[#c5dd9f]/45 hover:border-ember/40",
                  ].join(" ")}
                >
                  {placed ? (
                    <span className="flex h-full flex-col items-center justify-center gap-1 px-1 font-medium text-[#2d3b1f]">
                      <span
                        className="inline-flex h-7 w-7 items-center justify-center rounded-full text-[10px] font-bold text-white"
                        style={{ background: decoMark(placed.itemId).tone }}
                        aria-hidden
                      >
                        {decoMark(placed.itemId).label.slice(0, 1)}
                      </span>
                      <span className="line-clamp-2 text-[10px] leading-tight">
                        {placed.title}
                      </span>
                    </span>
                  ) : (
                    <span className="text-[#4d6234]/35">{cellIndex + 1}</span>
                  )}
                </button>
              );
            })}
          </div>
          <p className="relative mt-4 text-center text-sm italic text-[#2d3b1f]/80">
            “{pet.dialogue}”
          </p>
        </div>

        <div className="flex flex-wrap gap-2">
          {snapshot.garden.inventoryDecor.length === 0 ? (
            <p className="text-sm text-fog">
              All starter pieces are placed. More flower plots unlock in the{" "}
              <Link href="/shop" className="text-ember hover:underline">
                Shop
              </Link>{" "}
              at account level 20.
            </p>
          ) : (
            snapshot.garden.inventoryDecor.map((item) => (
              <button
                key={item.itemId}
                type="button"
                onClick={() => {
                  setSelectedPlacement(null);
                  setSelectedDecor(
                    selectedDecor === item.itemId ? null : item.itemId,
                  );
                }}
                className={[
                  "rounded-lg border px-3 py-2 text-sm",
                  selectedDecor === item.itemId
                    ? "border-ember/50 bg-ember/10 text-paper"
                    : "border-[var(--line)] text-fog hover:text-paper",
                ].join(" ")}
              >
                {item.title}
              </button>
            ))
          )}
        </div>
      </section>

      <section className="grid gap-6 lg:grid-cols-[1.1fr_0.9fr]">
        <div className="rounded-2xl border border-[var(--line)] bg-panel/60 p-5">
          <div className="grid grid-cols-2 gap-3 text-sm">
            <div className="rounded-xl border border-[var(--line)] bg-ink-2/50 px-3 py-2">
              <div className="text-xs uppercase tracking-wider text-fog">
                Pet XP
              </div>
              <div className="font-semibold">
                {pet.xpIntoLevel}/{pet.xpForNext}
              </div>
              <div className="mt-1 h-1.5 overflow-hidden rounded-full bg-ink-2">
                <div
                  className="h-full rounded-full bg-ember"
                  style={{
                    width: `${Math.min(100, (pet.xpIntoLevel / Math.max(1, pet.xpForNext)) * 100)}%`,
                  }}
                />
              </div>
            </div>
            <div className="rounded-xl border border-[var(--line)] bg-ink-2/50 px-3 py-2">
              <div className="text-xs uppercase tracking-wider text-fog">
                Happiness
              </div>
              <div className="font-semibold">{pet.happiness}%</div>
              <div className="mt-1 h-1.5 overflow-hidden rounded-full bg-ink-2">
                <div
                  className="h-full rounded-full bg-mint"
                  style={{ width: `${pet.happiness}%` }}
                />
              </div>
            </div>
          </div>
          <div className="mt-4 flex flex-wrap gap-2">
            <button
              type="button"
              disabled={!pet.canPetToday || busy === "pet"}
              onClick={() =>
                void post({ action: "pet" }).then((data) => {
                  if (data?.ok) {
                    setMessage(`+${data.happinessGain} happiness`);
                  }
                })
              }
              className="rounded-lg bg-ember px-4 py-2 text-sm font-semibold text-on-ember hover:bg-ember-deep disabled:opacity-50"
            >
              {pet.canPetToday ? "Pet (+5)" : "Petted today"}
            </button>
            {snapshot.foodInventory.map((food) => (
              <button
                key={food.itemId}
                type="button"
                disabled={busy === "feed" || food.qty <= 0}
                onClick={() =>
                  void post({ action: "feed", itemId: food.itemId }).then(
                    (data) => {
                      if (data?.ok) {
                        setMessage(
                          `Fed ${food.title} · +${data.happinessGain} happiness`,
                        );
                      }
                    },
                  )
                }
                className="rounded-lg border border-[var(--line)] px-3 py-2 text-sm hover:border-ember/40 disabled:opacity-50"
              >
                Feed {food.title} ×{food.qty}
              </button>
            ))}
            {snapshot.foodInventory.length === 0 ? (
              <Link
                href="/shop"
                className="rounded-lg border border-[var(--line)] px-3 py-2 text-sm text-fog hover:text-paper"
              >
                Buy food in Shop
              </Link>
            ) : null}
          </div>
          <p className="mt-3 text-xs text-fog">
            Personality: {pet.personalityId.replace("_", " ")} · Away days:{" "}
            {pet.awayDays}
          </p>
        </div>

        <div className="rounded-2xl border border-[var(--line)] bg-panel/60 p-5">
          <h2 className="font-[family-name:var(--font-display)] text-xl font-bold">
            Account progress
          </h2>
          <p className="mt-1 text-sm text-fog">
            Level {snapshot.accountLevel} · {snapshot.accountXpIntoLevel}/
            {snapshot.accountXpForNext} XP to next
          </p>
          <div className="mt-2 h-2 overflow-hidden rounded-full bg-ink-2">
            <div
              className="h-full rounded-full bg-ember"
              style={{
                width: `${Math.min(
                  100,
                  (snapshot.accountXpIntoLevel /
                    Math.max(1, snapshot.accountXpForNext)) *
                    100,
                )}%`,
              }}
            />
          </div>
          <p className="mt-3 text-xs text-fog">
            Account XP comes from puzzle wins (including past clears). Pet XP
            starts at hatch and only grows from new wins.
          </p>
          <p className="mt-4 text-xs uppercase tracking-wider text-fog">
            Unlocked shops
          </p>
          <ul className="mt-2 flex flex-wrap gap-2 text-xs">
            {snapshot.unlockedCategories.map((c) => (
              <li
                key={c}
                className="rounded-full border border-mint/30 bg-mint/10 px-2.5 py-1 text-mint"
              >
                {c}
              </li>
            ))}
          </ul>
        </div>
      </section>
    </div>
  );
}
