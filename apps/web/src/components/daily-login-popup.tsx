"use client";

import { useEffect, useState } from "react";
import { emitCoinBalance } from "@/components/coin-balance-chip";

export function DailyLoginPopup({ signedIn }: { signedIn: boolean }) {
  const [open, setOpen] = useState(false);
  const [coins, setCoins] = useState(0);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (!signedIn) return;
    let cancelled = false;
    (async () => {
      try {
        const res = await fetch("/api/coins");
        if (!res.ok) return;
        const data = await res.json();
        if (cancelled) return;
        if (data.dailyLoginClaimed) return;
        setOpen(true);
      } catch {
        // ignore
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [signedIn]);

  async function claim() {
    setBusy(true);
    try {
      const res = await fetch("/api/coins", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "daily_login" }),
      });
      const data = await res.json();
      if (res.ok) {
        setCoins(data.coins ?? 0);
        if (typeof data.balance === "number") emitCoinBalance(data.balance);
        if (data.already) setOpen(false);
        else {
          // show reward then close
          window.setTimeout(() => setOpen(false), 1800);
        }
      } else {
        setOpen(false);
      }
    } finally {
      setBusy(false);
    }
  }

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-ink/70 p-4 backdrop-blur-sm">
      <div className="w-full max-w-sm rounded-2xl border border-[var(--line)] bg-panel p-6 shadow-[0_24px_80px_rgba(0,0,0,0.45)]">
        <p className="text-xs uppercase tracking-[0.22em] text-ember">
          Daily reward
        </p>
        <h2 className="mt-2 font-[family-name:var(--font-display)] text-2xl font-bold">
          {coins > 0 ? `+${coins} Ink Coins` : "Claim today’s Ink Coins"}
        </h2>
        <p className="mt-2 text-sm text-fog">
          Log in each UTC day for a free coin boost. Puzzles still reset at
          midnight UTC.
        </p>
        <button
          type="button"
          disabled={busy || coins > 0}
          onClick={() => void claim()}
          className="mt-5 w-full rounded-lg bg-ember py-2.5 font-semibold text-on-ember hover:bg-ember-deep disabled:opacity-60"
        >
          {coins > 0 ? "Nice!" : busy ? "Claiming…" : "Claim +25"}
        </button>
        <button
          type="button"
          className="mt-3 w-full text-sm text-fog hover:text-paper"
          onClick={() => setOpen(false)}
        >
          Later
        </button>
      </div>
    </div>
  );
}
