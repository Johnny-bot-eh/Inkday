"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

type Row = {
  id: string;
  delta: number;
  balanceAfter: number;
  reason: string;
  refType: string;
  refId: string;
  createdAt: string | Date;
};

export function CoinHistoryClient() {
  const [rows, setRows] = useState<Row[]>([]);
  const [balance, setBalance] = useState<number | null>(null);

  useEffect(() => {
    void (async () => {
      const res = await fetch("/api/coins?view=history");
      if (!res.ok) return;
      const data = await res.json();
      setRows(data.rows ?? []);
      setBalance(data.balance ?? null);
    })();
  }, []);

  return (
    <div className="mx-auto max-w-xl animate-rise space-y-6">
      <div>
        <p className="text-xs uppercase tracking-[0.22em] text-ember">
          Ledger
        </p>
        <h1 className="mt-2 font-[family-name:var(--font-display)] text-4xl font-bold">
          Coin history
        </h1>
        <p className="mt-2 text-fog">
          Balance:{" "}
          <span className="font-semibold text-mint">
            {balance ?? "—"}
          </span>{" "}
          Ink Coins
        </p>
        <p className="mt-2 text-sm text-fog">
          Clears pay a flat coin reward. Faster times add{" "}
          <span className="text-paper">Speed score points</span>, not extra
          coins (≤30s +40 pts · ≤1m +30 · ≤2m +20 · ≤3m +15 · ≤5m +10 · ≤8m +5).
        </p>
        <Link href="/shop" className="mt-3 inline-block text-sm text-ember hover:underline">
          ← Shop
        </Link>
      </div>

      {rows.length === 0 ? (
        <p className="text-sm text-fog">No transactions yet.</p>
      ) : (
        <ul className="space-y-2">
          {rows.map((row) => (
            <li
              key={row.id}
              className="flex items-center justify-between gap-3 rounded-xl border border-[var(--line)] bg-panel/60 px-4 py-3 text-sm"
            >
              <div>
                <div className="font-medium capitalize text-paper">
                  {row.reason.replace(/_/g, " ")}
                </div>
                <div className="text-xs text-fog">
                  {new Date(row.createdAt).toLocaleString()}
                </div>
              </div>
              <div
                className={`tabular-nums font-semibold ${
                  row.delta >= 0 ? "text-mint" : "text-danger"
                }`}
              >
                {row.delta >= 0 ? "+" : ""}
                {row.delta}
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
