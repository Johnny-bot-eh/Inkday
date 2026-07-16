"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

export function CoinBalanceChip({ initial }: { initial: number }) {
  const [balance, setBalance] = useState(initial);

  useEffect(() => {
    setBalance(initial);
  }, [initial]);

  useEffect(() => {
    function onCoins(e: Event) {
      const detail = (e as CustomEvent<{ balance?: number }>).detail;
      if (typeof detail?.balance === "number") setBalance(detail.balance);
    }
    window.addEventListener("inkday-coins", onCoins);
    return () => window.removeEventListener("inkday-coins", onCoins);
  }, []);

  return (
    <Link
      href="/shop"
      className="ml-1 inline-flex items-center gap-1.5 rounded-md border border-mint/35 bg-mint/10 px-2.5 py-1.5 text-xs font-semibold text-mint"
      title="Ink Coins"
    >
      <span aria-hidden>◈</span>
      {balance}
    </Link>
  );
}

export function emitCoinBalance(balance: number) {
  if (typeof window === "undefined") return;
  window.dispatchEvent(
    new CustomEvent("inkday-coins", { detail: { balance } }),
  );
}
