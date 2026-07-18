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
                  : data.error === "out_of_bounds"
                    ? "Outside the garden."
                    : (data.error ?? "Something went wrong"),
        );
        return null;
      }
      if (data.snapshot) setSnapshot(data.snapshot);
      if (typeof data.coins === "number" && data.coins > 0) {
        // Balance may have changed via gift claim
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
            Pick one free starter egg. Each companion grows with your puzzle XP
            and develops its own personality.
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
            {snapshot.gift.coins > 0
              ? `${snapshot.gift.coins} coins`
              : snapshot.gift.itemId ?? snapshot.gift.giftKind}
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
                    data.coins
                      ? `Gift claimed · +${data.coins} coins!`
                      : "Gift claimed!",
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

      <section className="grid gap-6 lg:grid-cols-[1.1fr_0.9fr]">
        <div className="rounded-2xl border border-[var(--line)] bg-panel/60 p-5">
          <PetMark
            speciesId={pet.speciesId as PetSpeciesId}
            stage={pet.stage}
            colors={pet.colors}
            happinessState={pet.happinessState}
            size={180}
          />
          <p className="mt-4 text-center text-sm italic text-fog">
            “{pet.dialogue}”
          </p>
          <div className="mt-4 grid grid-cols-2 gap-3 text-sm">
            <div className="rounded-xl border border-[var(--line)] bg-ink-2/50 px-3 py-2">
              <div className="text-xs uppercase tracking-wider text-fog">XP</div>
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
          <p className="mt-4 text-sm text-fog">
            XP unlocks shop categories. Decorations are always bought with
            coins — your garden stays uniquely yours.
          </p>
        </div>
      </section>

      <section className="space-y-4">
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div>
            <h2 className="font-[family-name:var(--font-display)] text-2xl font-bold">
              Garden plot
            </h2>
            <p className="text-sm text-fog">
              {snapshot.garden.cols}×{snapshot.garden.rows} — expands as you
              collect decorations. Select an item, then a cell.
            </p>
          </div>
        </div>

        <div className="flex flex-wrap gap-2">
          {snapshot.garden.inventoryDecor.length === 0 ? (
            <p className="text-sm text-fog">
              No unplaced decorations.{" "}
              <Link href="/shop" className="text-ember hover:underline">
                Visit the Shop
              </Link>{" "}
              when flower plots unlock at level 20.
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

        <div className="grid gap-2" style={gridStyle}>
          {Array.from({ length: snapshot.garden.cells }).map((_, cellIndex) => {
            const placed = snapshot.garden.placements.find(
              (p) => p.cellIndex === cellIndex,
            );
            const selected = selectedPlacement === placed?.id;
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
                    // second tap removes
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
                  if (placed && selectedPlacement && selectedPlacement !== placed.id) {
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
                  "aspect-square rounded-xl border text-xs transition",
                  placed
                    ? selected
                      ? "border-ember/60 bg-ember/15"
                      : "border-mint/35 bg-mint/10"
                    : "border-[var(--line)] bg-ink-2/40 hover:border-ember/30",
                ].join(" ")}
              >
                {placed ? (
                  <span className="px-1 font-medium text-paper">
                    {placed.title}
                  </span>
                ) : (
                  <span className="text-fog/50">{cellIndex + 1}</span>
                )}
              </button>
            );
          })}
        </div>
        <p className="text-xs text-fog">
          Tip: select a placed decoration, then tap another cell to move it —
          or tap it again to remove.
        </p>
      </section>
    </div>
  );
}
