"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { emitCoinBalance } from "@/components/coin-balance-chip";
import type { ShopItem } from "@daily-puzzle/puzzle-core";

type InvRow = { itemId: string; qty: number };

export function ShopClient({
  signedIn,
  initialBalance,
}: {
  signedIn: boolean;
  initialBalance: number | null;
}) {
  const [catalog, setCatalog] = useState<ShopItem[]>([]);
  const [balance, setBalance] = useState(initialBalance);
  const [inventory, setInventory] = useState<InvRow[]>([]);
  const [message, setMessage] = useState<string | null>(null);
  const [loading, setLoading] = useState<string | null>(null);

  async function refresh() {
    const res = await fetch("/api/shop");
    if (!res.ok) return;
    const data = await res.json();
    setCatalog(data.catalog ?? []);
    setBalance(data.balance);
    setInventory(data.inventory ?? []);
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
                : data.error ?? "Could not buy",
        );
        return;
      }
      setMessage(
        itemId === "streak_restore"
          ? "Streak restored — play today to keep it."
          : "Added to inventory.",
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

  const qty = (id: string) =>
    inventory.find((i) => i.itemId === id)?.qty ?? 0;

  return (
    <div className="mx-auto max-w-2xl animate-rise space-y-8">
      <div>
        <p className="text-xs uppercase tracking-[0.22em] text-ember">Shop</p>
        <h1 className="mt-2 font-[family-name:var(--font-display)] text-4xl font-bold">
          Ink Coins
        </h1>
        <p className="mt-2 text-fog">
          Earn coins from puzzles, streaks, and daily login. Spend on hints,
          extra attempts, skips, and streak restores.
          {signedIn && balance != null ? (
            <>
              {" "}
              Balance: <span className="font-semibold text-mint">{balance}</span>
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
          <Link href="/companion" className="text-fog hover:text-paper">
            Companions (soon)
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

      <ul className="space-y-3">
        {catalog.map((item) => (
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
                item.price <= 0 ||
                loading === item.id
              }
              onClick={() => void buy(item.id)}
              className="shrink-0 rounded-lg bg-ember px-4 py-2 text-sm font-semibold text-on-ember hover:bg-ember-deep disabled:opacity-50"
            >
              {item.comingSoon
                ? "Soon"
                : loading === item.id
                  ? "…"
                  : `${item.price} ◈`}
            </button>
          </li>
        ))}
      </ul>

      <p className="text-xs text-fog">
        Plus members earn +25% coins from gameplay and can claim a monthly
        stipend on Profile. Score stays fair — no pay-to-win points.
      </p>
    </div>
  );
}
