"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { emitCoinBalance } from "@/components/coin-balance-chip";
import { GardenDiorama } from "@/components/garden-diorama";
import { PetMark } from "@/components/pet-mark";
import type { CompanionSnapshot } from "@daily-puzzle/puzzle-core";

type Props = {
  signedIn: boolean;
  initial: CompanionSnapshot | null;
};

type GardenUndo =
  | {
      type: "move";
      placementId: string;
      from: { x: number; y: number };
      to: { x: number; y: number };
    }
  | {
      type: "move_nest";
      from: { x: number; y: number };
      to: { x: number; y: number };
    }
  | {
      type: "place";
      placementId: string;
      itemId: string;
      x: number;
      y: number;
    }
  | {
      type: "remove";
      itemId: string;
      x: number;
      y: number;
      layer: "background" | "middle" | "foreground";
    };

const MAX_UNDO = 40;

export function CompanionClient({ signedIn, initial }: Props) {
  const [snapshot, setSnapshot] = useState<CompanionSnapshot | null>(initial);
  const [message, setMessage] = useState<string | null>(null);
  const [busy, setBusy] = useState<string | null>(null);
  const [selectedDecor, setSelectedDecor] = useState<string | null>(null);
  const [selectedPlacement, setSelectedPlacement] = useState<string | null>(
    null,
  );
  const [undoStack, setUndoStack] = useState<GardenUndo[]>([]);
  const snapshotRef = useRef(snapshot);
  snapshotRef.current = snapshot;

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

  function pushUndo(entry: GardenUndo) {
    setUndoStack((prev) => [...prev.slice(-(MAX_UNDO - 1)), entry]);
  }

  async function post(
    body: Record<string, unknown>,
    opts?: { silent?: boolean },
  ) {
    if (!opts?.silent) setBusy(String(body.action ?? "action"));
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
                : data.error === "already_placed"
                  ? "All copies of that decoration are already placed."
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
      if (!opts?.silent) setBusy(null);
    }
  }

  async function undoGarden() {
    const entry = undoStack[undoStack.length - 1];
    if (!entry || busy) return;
    setUndoStack((prev) => prev.slice(0, -1));
    setSelectedPlacement(null);
    setSelectedDecor(null);

    if (entry.type === "move") {
      setSnapshot((prev) => {
        if (!prev) return prev;
        return {
          ...prev,
          garden: {
            ...prev.garden,
            placements: prev.garden.placements.map((p) =>
              p.id === entry.placementId
                ? { ...p, x: entry.from.x, y: entry.from.y }
                : p,
            ),
          },
        };
      });
      const ok = await post(
        {
          action: "move",
          placementId: entry.placementId,
          x: entry.from.x,
          y: entry.from.y,
        },
        { silent: true },
      );
      if (!ok) {
        setSnapshot((prev) => {
          if (!prev) return prev;
          return {
            ...prev,
            garden: {
              ...prev.garden,
              placements: prev.garden.placements.map((p) =>
                p.id === entry.placementId
                  ? { ...p, x: entry.to.x, y: entry.to.y }
                  : p,
              ),
            },
          };
        });
        pushUndo(entry);
      }
      return;
    }

    if (entry.type === "move_nest") {
      setSnapshot((prev) => {
        if (!prev) return prev;
        return {
          ...prev,
          garden: {
            ...prev.garden,
            pet: {
              ...prev.garden.pet,
              x: entry.from.x,
              y: entry.from.y,
            },
          },
        };
      });
      const ok = await post(
        { action: "move_nest", x: entry.from.x, y: entry.from.y },
        { silent: true },
      );
      if (!ok) {
        setSnapshot((prev) => {
          if (!prev) return prev;
          return {
            ...prev,
            garden: {
              ...prev.garden,
              pet: {
                ...prev.garden.pet,
                x: entry.to.x,
                y: entry.to.y,
              },
            },
          };
        });
        pushUndo(entry);
      }
      return;
    }

    if (entry.type === "place") {
      setSnapshot((prev) => {
        if (!prev) return prev;
        return {
          ...prev,
          garden: {
            ...prev.garden,
            placements: prev.garden.placements.filter(
              (p) => p.id !== entry.placementId,
            ),
          },
        };
      });
      const ok = await post(
        { action: "remove", placementId: entry.placementId },
        { silent: true },
      );
      if (!ok) pushUndo(entry);
      return;
    }

    // remove → re-place
    const ok = await post(
      {
        action: "place",
        itemId: entry.itemId,
        x: entry.x,
        y: entry.y,
        layer: entry.layer,
      },
      { silent: true },
    );
    if (!ok) pushUndo(entry);
  }

  if (!signedIn) {
    return (
      <div className="mx-auto max-w-lg animate-rise space-y-6 text-center">
        <h1 className="font-[family-name:var(--font-display)] text-4xl font-bold">
          Garden
        </h1>
        <p className="text-fog">
          Sign in to choose a starter egg and grow your companion.
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
          <h1 className="font-[family-name:var(--font-display)] text-4xl font-bold">
            Choose your companion
          </h1>
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
            </button>
          ))}
        </div>
      </div>
    );
  }

  const pet = snapshot.pet!;
  const pets = [pet];

  return (
    <div className="mx-auto max-w-3xl animate-rise space-y-8">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <h1 className="font-[family-name:var(--font-display)] text-4xl font-bold">
          Garden
        </h1>
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
          <p className="font-semibold">{snapshot.gift.message}</p>
          <p className="mt-1 text-sm text-fog">
            {snapshot.gift.rewardLabel}
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

      <section className="space-y-3">
        <GardenDiorama
          garden={snapshot.garden}
          pet={pet}
          accountLevel={snapshot.accountLevel}
          selectedDecor={selectedDecor}
          selectedPlacement={selectedPlacement}
          busy={busy}
          onSelectPlacement={setSelectedPlacement}
          onPlace={(itemId, x, y) => {
            const beforeIds = new Set(
              snapshotRef.current?.garden.placements.map((p) => p.id) ?? [],
            );
            void post({ action: "place", itemId, x, y }).then((data) => {
              if (!data?.ok || !data.snapshot) return;
              const placed = data.snapshot.garden.placements.find(
                (p: { id: string; itemId: string }) =>
                  !beforeIds.has(p.id) && p.itemId === itemId,
              );
              if (placed) {
                pushUndo({
                  type: "place",
                  placementId: placed.id,
                  itemId,
                  x: placed.x,
                  y: placed.y,
                });
              }
              const remaining = data.snapshot.garden.inventoryDecor?.find(
                (d: { itemId: string; qty: number }) => d.itemId === itemId,
              );
              if (!remaining || remaining.qty < 1) {
                setSelectedDecor(null);
              }
            });
          }}
          onMove={(placementId, x, y, from) => {
            setSelectedPlacement(null);
            if (
              Math.abs(from.x - x) < 0.35 &&
              Math.abs(from.y - y) < 0.35
            ) {
              return;
            }
            pushUndo({
              type: "move",
              placementId,
              from,
              to: { x, y },
            });
            setSnapshot((prev) => {
              if (!prev) return prev;
              return {
                ...prev,
                garden: {
                  ...prev.garden,
                  placements: prev.garden.placements.map((p) =>
                    p.id === placementId ? { ...p, x, y } : p,
                  ),
                },
              };
            });
            void post(
              { action: "move", placementId, x, y },
              { silent: true },
            ).then((data) => {
              if (data?.ok) return;
              setSnapshot((prev) => {
                if (!prev) return prev;
                return {
                  ...prev,
                  garden: {
                    ...prev.garden,
                    placements: prev.garden.placements.map((p) =>
                      p.id === placementId
                        ? { ...p, x: from.x, y: from.y }
                        : p,
                    ),
                  },
                };
              });
              setUndoStack((prev) => prev.slice(0, -1));
            });
          }}
          onMoveNest={(x, y, from) => {
            setSelectedPlacement(null);
            if (
              Math.abs(from.x - x) < 0.35 &&
              Math.abs(from.y - y) < 0.35
            ) {
              return;
            }
            pushUndo({ type: "move_nest", from, to: { x, y } });
            setSnapshot((prev) => {
              if (!prev) return prev;
              return {
                ...prev,
                garden: {
                  ...prev.garden,
                  pet: { ...prev.garden.pet, x, y },
                },
              };
            });
            void post(
              { action: "move_nest", x, y },
              { silent: true },
            ).then((data) => {
              if (data?.ok) return;
              setSnapshot((prev) => {
                if (!prev) return prev;
                return {
                  ...prev,
                  garden: {
                    ...prev.garden,
                    pet: {
                      ...prev.garden.pet,
                      x: from.x,
                      y: from.y,
                    },
                  },
                };
              });
              setUndoStack((prev) => prev.slice(0, -1));
            });
          }}
          onRemove={(placementId) => {
            const removed = snapshotRef.current?.garden.placements.find(
              (p) => p.id === placementId,
            );
            setSelectedPlacement(null);
            if (removed) {
              pushUndo({
                type: "remove",
                itemId: removed.itemId,
                x: removed.x,
                y: removed.y,
                layer: removed.layer,
              });
            }
            setSnapshot((prev) => {
              if (!prev) return prev;
              return {
                ...prev,
                garden: {
                  ...prev.garden,
                  placements: prev.garden.placements.filter(
                    (p) => p.id !== placementId,
                  ),
                },
              };
            });
            void post(
              { action: "remove", placementId },
              { silent: true },
            ).then((data) => {
              if (data?.ok) return;
              if (removed) setUndoStack((prev) => prev.slice(0, -1));
              void fetch("/api/companion")
                .then((r) => r.json())
                .then((s: CompanionSnapshot) => setSnapshot(s))
                .catch(() => undefined);
            });
          }}
        />

        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={() => void undoGarden()}
            disabled={undoStack.length === 0 || Boolean(busy)}
            className="rounded-lg border border-[var(--line)] px-3 py-2 text-sm text-fog hover:text-paper disabled:opacity-40"
          >
            Undo
          </button>
          {snapshot.garden.inventoryDecor.map((item) => (
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
              {item.qty > 1 ? ` ×${item.qty}` : ""}
            </button>
          ))}
          <Link
            href="/shop"
            className="rounded-lg border border-[var(--line)] px-3 py-2 text-sm text-fog hover:text-paper"
          >
            Buy decorations
          </Link>
        </div>
      </section>

      <section className="space-y-3">
        {pets.map((p) => (
          <div
            key={p.id}
            className="rounded-2xl border border-[var(--line)] bg-panel/60 p-5"
          >
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <h2 className="font-[family-name:var(--font-display)] text-2xl font-bold">
                  {p.name ?? p.speciesTitle}
                </h2>
                <p className="mt-0.5 text-sm text-fog">
                  Lv {p.level} · {p.stage}
                </p>
              </div>
              <div className="flex flex-wrap gap-2">
                <button
                  type="button"
                  disabled={!p.canPetToday || busy === "pet"}
                  onClick={() =>
                    void post({ action: "pet" }).then((data) => {
                      if (data?.ok) {
                        setMessage(`+${data.happinessGain} happiness`);
                      }
                    })
                  }
                  className="rounded-lg bg-ember px-4 py-2 text-sm font-semibold text-on-ember hover:bg-ember-deep disabled:opacity-50"
                >
                  {p.canPetToday ? "Pet (+5)" : "Petted today"}
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
                            setMessage(`+${data.happinessGain} happiness`);
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
                    Buy food
                  </Link>
                ) : null}
              </div>
            </div>

            <div className="mt-4 grid gap-3 sm:grid-cols-2">
              <div>
                <div className="flex items-baseline justify-between gap-2 text-sm">
                  <span className="text-fog">XP</span>
                  <span className="font-medium">
                    {p.xpIntoLevel}/{p.xpForNext}
                  </span>
                </div>
                <div className="mt-1.5 h-2 overflow-hidden rounded-full bg-ink-2">
                  <div
                    className="h-full rounded-full bg-ember"
                    style={{
                      width: `${Math.min(100, (p.xpIntoLevel / Math.max(1, p.xpForNext)) * 100)}%`,
                    }}
                  />
                </div>
              </div>
              <div>
                <div className="flex items-baseline justify-between gap-2 text-sm">
                  <span className="text-fog">Happiness</span>
                  <span className="font-medium">{p.happiness}%</span>
                </div>
                <div className="mt-1.5 h-2 overflow-hidden rounded-full bg-ink-2">
                  <div
                    className="h-full rounded-full bg-mint"
                    style={{ width: `${p.happiness}%` }}
                  />
                </div>
              </div>
            </div>
          </div>
        ))}
      </section>

      <section className="rounded-2xl border border-[var(--line)] bg-panel/60 p-5">
        <div className="text-xs uppercase tracking-wider text-fog">
          Account XP
        </div>
        <div className="mt-1 font-[family-name:var(--font-display)] text-xl font-bold">
          Level {snapshot.accountLevel}
        </div>
        <p className="mt-1 text-sm text-fog">
          {snapshot.accountXpIntoLevel}/{snapshot.accountXpForNext}
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
      </section>
    </div>
  );
}
