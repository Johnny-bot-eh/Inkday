"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { emitCoinBalance } from "@/components/coin-balance-chip";
import { AvatarMark } from "@/components/avatar-mark";
import { emitEquippedAvatar } from "@/components/header-avatar-chip";
import {
  isDecorationVisibleInShop,
  type ShopItem,
} from "@daily-puzzle/puzzle-core";

type InvRow = { itemId: string; qty: number };
type CatalogItem = ShopItem & {
  available?: boolean;
  levelLocked?: boolean;
  requiredLevel?: number;
};

export function ShopClient({
  signedIn,
  initialBalance,
}: {
  signedIn: boolean;
  initialBalance: number | null;
}) {
  const [catalog, setCatalog] = useState<CatalogItem[]>([]);
  const [balance, setBalance] = useState(initialBalance);
  const [inventory, setInventory] = useState<InvRow[]>([]);
  const [ownedAvatarIds, setOwnedAvatarIds] = useState<string[]>([]);
  const [ownedAccessoryIds, setOwnedAccessoryIds] = useState<string[]>([]);
  const [equippedAvatarId, setEquippedAvatarId] = useState<string | null>(null);
  const [equippedAccessoryId, setEquippedAccessoryId] = useState<string | null>(
    null,
  );
  const [accountLevel, setAccountLevel] = useState<number | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [loading, setLoading] = useState<string | null>(null);

  async function refresh() {
    const res = await fetch("/api/shop");
    if (!res.ok) return;
    const data = await res.json();
    setCatalog(data.catalog ?? []);
    setBalance(data.balance);
    setInventory(data.inventory ?? []);
    setOwnedAvatarIds(data.ownedAvatarIds ?? []);
    setOwnedAccessoryIds(data.ownedAccessoryIds ?? []);
    setEquippedAvatarId(data.equippedAvatarId ?? null);
    setEquippedAccessoryId(data.equippedAccessoryId ?? null);
    setAccountLevel(
      typeof data.accountLevel === "number" ? data.accountLevel : null,
    );
    if (typeof data.balance === "number") emitCoinBalance(data.balance);
  }

  useEffect(() => {
    void refresh();
  }, []);

  async function buy(itemId: string) {
    if (!signedIn) return;
    setLoading(itemId);
    setMessage(null);
    try {
      const res = await fetch("/api/shop", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: itemId === "streak_restore" ? "restore_streak" : "buy",
          itemId,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setMessage(
          data.error === "insufficient"
            ? "Not enough Ink Coins."
            : data.error === "window_closed"
              ? "Streak restore window closed (48h)."
              : data.error === "unavailable"
                ? "Not available yet."
                : data.error === "plus_required"
                  ? "Inkday Plus required."
                  : data.error === "level_locked"
                    ? "Account level too low for this item."
                    : data.error ?? "Could not buy",
        );
        return;
      }
      const xpNote =
        typeof data.xpEarned === "number" && data.xpEarned > 0
          ? ` · +${data.xpEarned} XP`
          : "";
      setMessage(
        itemId === "streak_restore"
          ? "Streak restored — play today to keep it."
          : data.alreadyOwned
            ? "Already owned."
            : data.spent === 0
              ? `Claimed.${xpNote}`
              : `Added to inventory.${xpNote}`,
      );
      if (typeof data.balance === "number") {
        setBalance(data.balance);
        emitCoinBalance(data.balance);
      }
      await refresh();
    } finally {
      setLoading(null);
    }
  }

  async function equipAvatar(avatarId: string) {
    if (!signedIn) return;
    setLoading(avatarId);
    setMessage(null);
    try {
      const res = await fetch("/api/shop", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "claim_equip_avatar",
          avatarId,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setMessage(
          data.error === "plus_required"
            ? "Inkday Plus required for this portrait."
            : data.error === "insufficient"
              ? "Not enough Ink Coins."
              : data.error ?? "Could not equip",
        );
        return;
      }
      setEquippedAvatarId(avatarId);
      emitEquippedAvatar(avatarId, equippedAccessoryId);
      setMessage("Portrait equipped.");
      if (typeof data.balance === "number") {
        setBalance(data.balance);
        emitCoinBalance(data.balance);
      }
      await refresh();
    } finally {
      setLoading(null);
    }
  }

  const qty = (id: string) =>
    inventory.find((i) => i.itemId === id)?.qty ?? 0;

  const avatars = catalog.filter(
    (i) =>
      i.slot === "avatar" &&
      (!i.badgeReward || ownedAvatarIds.includes(i.id) || qty(i.id) > 0),
  );
  const accessories = catalog.filter(
    (i) =>
      i.slot === "accessory" &&
      (i.available ||
        ownedAccessoryIds.includes(i.id) ||
        qty(i.id) > 0),
  );
  const food = catalog.filter((i) => i.kind === "food");
  const level = accountLevel ?? 1;
  const decorations = catalog
    .filter((i) => i.kind === "decoration" && !i.free)
    .filter((i) =>
      isDecorationVisibleInShop(i.requiredLevel ?? 1, level),
    )
    .sort((a, b) => {
      const ownedA = qty(a.id) > 0 ? 1 : 0;
      const ownedB = qty(b.id) > 0 ? 1 : 0;
      if (ownedA !== ownedB) return ownedA - ownedB;
      const la = a.requiredLevel ?? 1;
      const lb = b.requiredLevel ?? 1;
      if (la !== lb) return la - lb;
      return a.title.localeCompare(b.title);
    });
  const other = catalog.filter(
    (i) =>
      i.slot !== "avatar" &&
      i.slot !== "accessory" &&
      i.kind !== "food" &&
      i.kind !== "decoration",
  );

  function avatarOwned(item: ShopItem) {
    return Boolean(item.free) || ownedAvatarIds.includes(item.id) || qty(item.id) > 0;
  }

  function avatarButtonLabel(item: ShopItem) {
    if (equippedAvatarId === item.id) return "Equipped";
    if (avatarOwned(item)) return "Equip";
    if (item.plusOnly) return item.price === 0 ? "Claim · Plus" : `Plus · ${item.price}◈`;
    return `${item.price}◈`;
  }

  return (
    <div className="mx-auto max-w-2xl animate-rise space-y-8">
      <div>
        <p className="text-xs uppercase tracking-[0.22em] text-ember">Shop</p>
        <h1 className="mt-2 font-[family-name:var(--font-display)] text-4xl font-bold">
          Ink Coins
        </h1>
        <p className="mt-2 text-fog">
          Earn coins from puzzles, streaks, and daily login. Spend on food,
          decorations, hints, and portraits.
          {signedIn && balance != null ? (
            <>
              {" "}
              Balance:{" "}
              <span className="font-semibold text-mint">
                <span aria-hidden>◈</span>
                {balance}
              </span>
            </>
          ) : null}
          {signedIn && accountLevel != null ? (
            <>
              {" "}
              · Account lv{" "}
              <span className="font-semibold text-ember">{accountLevel}</span>
            </>
          ) : null}
        </p>
        <div className="mt-4 flex flex-wrap gap-3 text-sm">
          <Link href="/coins" className="text-ember hover:underline">
            Transaction history →
          </Link>
          <Link href="/inventory" className="text-ember hover:underline">
            Inventory →
          </Link>
          <Link href="/companion" className="text-ember hover:underline">
            Garden →
          </Link>
          <Link href="/profile" className="text-ember hover:underline">
            Change portrait →
          </Link>
        </div>
      </div>

      {!signedIn && (
        <p className="rounded-xl border border-[var(--line)] bg-panel/60 px-4 py-3 text-sm text-fog">
          <Link href="/auth" className="font-semibold text-ember hover:underline">
            Sign in
          </Link>{" "}
          to earn and spend Ink Coins.
        </p>
      )}

      {message && (
        <p className="rounded-lg border border-[var(--line)] bg-panel/70 px-4 py-3 text-sm">
          {message}
        </p>
      )}

      <section className="space-y-3">
        <h2 className="font-[family-name:var(--font-display)] text-2xl font-bold">
          Portraits
        </h2>
        <p className="text-sm text-fog">
          Free starters, coin exclusives, Plus seals, and badge-earned portraits.
          Equip accessories on your profile.
        </p>
        <ul className="grid gap-3 sm:grid-cols-2">
          {avatars.map((item) => {
            return (
              <li
                key={item.id}
                className="flex items-center gap-3 rounded-2xl border border-[var(--line)] bg-panel/60 p-4"
              >
                <AvatarMark
                  avatarId={item.id}
                  accessoryId={equippedAccessoryId}
                  size={48}
                />
                <div className="min-w-0 flex-1">
                  <div className="font-semibold text-paper">
                    {item.title}
                    {item.plusOnly ? (
                      <span className="ml-2 text-[10px] font-semibold uppercase tracking-wider text-ember">
                        Plus
                      </span>
                    ) : null}
                    {item.free ? (
                      <span className="ml-2 text-[10px] font-normal uppercase tracking-wider text-fog">
                        Free
                      </span>
                    ) : null}
                    {item.badgeReward ? (
                      <span className="ml-2 text-[10px] font-normal uppercase tracking-wider text-mint">
                        Badge
                      </span>
                    ) : null}
                  </div>
                  <p className="mt-0.5 text-xs text-fog">{item.description}</p>
                </div>
                <button
                  type="button"
                  disabled={!signedIn || loading === item.id}
                  onClick={() => void equipAvatar(item.id)}
                  className="shrink-0 rounded-lg bg-ember px-3 py-2 text-xs font-semibold text-on-ember hover:bg-ember-deep disabled:opacity-50"
                >
                  {loading === item.id ? "…" : avatarButtonLabel(item)}
                </button>
              </li>
            );
          })}
        </ul>
      </section>

      {accessories.length > 0 ? (
        <section className="space-y-3">
          <h2 className="font-[family-name:var(--font-display)] text-2xl font-bold">
            Accessories
          </h2>
          <p className="text-sm text-fog">
            Ribbons and crowns from Case File ranks and weekly tournaments. Buy
            frames with coins — equip everything on your profile.
          </p>
          <ul className="grid gap-3 sm:grid-cols-2">
            {accessories.map((item) => {
              const owned =
                ownedAccessoryIds.includes(item.id) || qty(item.id) > 0;
              return (
                <li
                  key={item.id}
                  className="flex items-center gap-3 rounded-2xl border border-[var(--line)] bg-panel/60 p-4"
                >
                  <AvatarMark
                    avatarId={equippedAvatarId ?? "avatar_default"}
                    accessoryId={item.id}
                    size={48}
                  />
                  <div className="min-w-0 flex-1">
                    <div className="font-semibold text-paper">
                      {item.title}
                      {item.badgeReward ? (
                        <span className="ml-2 text-[10px] font-normal uppercase tracking-wider text-mint">
                          Event
                        </span>
                      ) : null}
                    </div>
                    <p className="mt-0.5 text-xs text-fog">{item.description}</p>
                  </div>
                  {owned ? (
                    <Link
                      href="/profile"
                      className="shrink-0 rounded-lg border border-[var(--line)] px-3 py-2 text-xs font-semibold text-paper hover:bg-white/5"
                    >
                      Equip →
                    </Link>
                  ) : (
                    <button
                      type="button"
                      disabled={!signedIn || loading === item.id || !item.available}
                      onClick={() => void buy(item.id)}
                      className="shrink-0 rounded-lg bg-ember px-3 py-2 text-xs font-semibold text-on-ember hover:bg-ember-deep disabled:opacity-50"
                    >
                      {loading === item.id ? "…" : `${item.price}◈`}
                    </button>
                  )}
                </li>
              );
            })}
          </ul>
        </section>
      ) : null}

      <section className="space-y-3">
        <h2 className="font-[family-name:var(--font-display)] text-2xl font-bold">
          Pet food
        </h2>
        <p className="text-sm text-fog">
          Inexpensive snacks keep your companion happy without blocking garden
          progress.
        </p>
        <ul className="space-y-3">
          {food.map((item) => (
            <li
              key={item.id}
              className="flex flex-col gap-3 rounded-2xl border border-[var(--line)] bg-panel/60 p-4 sm:flex-row sm:items-center sm:justify-between"
            >
              <div>
                <div className="font-semibold text-paper">
                  {item.title}
                  {qty(item.id) > 0 ? (
                    <span className="ml-2 text-xs font-normal text-mint">
                      Owned ×{qty(item.id)}
                    </span>
                  ) : null}
                </div>
                <p className="mt-1 text-sm text-fog">{item.description}</p>
              </div>
              <button
                type="button"
                disabled={!signedIn || loading === item.id}
                onClick={() => void buy(item.id)}
                className="shrink-0 rounded-lg bg-ember px-4 py-2 text-sm font-semibold text-on-ember hover:bg-ember-deep disabled:opacity-50"
              >
                {loading === item.id ? "…" : `${item.price} ◈`}
              </button>
            </li>
          ))}
        </ul>
      </section>

      <section className="space-y-3">
        <h2 className="font-[family-name:var(--font-display)] text-2xl font-bold">
          Garden decorations
        </h2>
        <ul className="space-y-3">
          {decorations.map((item) => {
            const locked = Boolean(item.levelLocked);
            const ownedQty = qty(item.id);
            return (
              <li
                key={item.id}
                className="flex flex-col gap-3 rounded-2xl border border-[var(--line)] bg-panel/60 p-4 sm:flex-row sm:items-center sm:justify-between"
              >
                <div>
                  <div className="font-semibold text-paper">
                    {item.title}
                    <span className="ml-2 text-xs font-normal text-fog">
                      Lv {item.requiredLevel ?? 1}+
                    </span>
                    {!locked && ownedQty > 0 ? (
                      <span className="ml-2 text-xs font-normal text-mint">
                        Owned ×{ownedQty}
                      </span>
                    ) : null}
                  </div>
                  <p className="mt-1 text-sm text-fog">{item.description}</p>
                </div>
                <button
                  type="button"
                  disabled={!signedIn || locked || loading === item.id}
                  onClick={() => void buy(item.id)}
                  className="shrink-0 rounded-lg bg-ember px-4 py-2 text-sm font-semibold text-on-ember hover:bg-ember-deep disabled:opacity-50"
                >
                  {locked
                    ? `Locked · lv ${item.requiredLevel}`
                    : loading === item.id
                      ? "…"
                      : `${item.price} ◈`}
                </button>
              </li>
            );
          })}
        </ul>
      </section>

      <section className="space-y-3">
        <h2 className="font-[family-name:var(--font-display)] text-2xl font-bold">
          Consumables & more
        </h2>
        <ul className="space-y-3">
          {other.map((item) => (
            <li
              key={item.id}
              className="flex flex-col gap-3 rounded-2xl border border-[var(--line)] bg-panel/60 p-4 sm:flex-row sm:items-center sm:justify-between"
            >
              <div>
                <div className="font-semibold text-paper">
                  {item.title}
                  {item.comingSoon ? (
                    <span className="ml-2 text-xs font-normal text-fog">
                      Coming soon
                    </span>
                  ) : null}
                  {item.plusOnly && !item.comingSoon ? (
                    <span className="ml-2 text-[10px] font-semibold uppercase tracking-wider text-ember">
                      Plus
                    </span>
                  ) : null}
                  {!item.comingSoon && qty(item.id) > 0 ? (
                    <span className="ml-2 text-xs font-normal text-mint">
                      Owned ×{qty(item.id)}
                    </span>
                  ) : null}
                </div>
                <p className="mt-1 text-sm text-fog">{item.description}</p>
              </div>
              <button
                type="button"
                disabled={
                  !signedIn ||
                  item.comingSoon ||
                  (item.price <= 0 && !(item.plusOnly && item.price === 0)) ||
                  loading === item.id
                }
                onClick={() => void buy(item.id)}
                className="shrink-0 rounded-lg bg-ember px-4 py-2 text-sm font-semibold text-on-ember hover:bg-ember-deep disabled:opacity-50"
              >
                {item.comingSoon
                  ? "Soon"
                  : loading === item.id
                    ? "…"
                    : item.plusOnly && item.price === 0
                      ? "Claim"
                      : `${item.price} ◈`}
              </button>
            </li>
          ))}
        </ul>
      </section>

      <p className="text-xs text-fog">
        Plus members earn +25% coins from gameplay, claim a monthly stipend, and
        unlock Plus portraits. Score stays fair — no pay-to-win points.
      </p>
    </div>
  );
}
