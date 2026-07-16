"use client";

import { useState } from "react";
import {
  COIN_SPEND,
  type ConsumableItemId,
} from "@daily-puzzle/puzzle-core";
import { emitCoinBalance } from "@/components/coin-balance-chip";

type Props = {
  signedIn: boolean;
  disabled?: boolean;
  onHint?: () => void;
  onExtraAttempt?: () => void;
  onSkip?: () => void;
};

async function buyAndUse(itemId: ConsumableItemId, refId: string) {
  const res = await fetch("/api/shop", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ action: "buy_and_use", itemId, refId }),
  });
  const data = await res.json();
  if (!res.ok) {
    throw new Error(
      data.error === "insufficient"
        ? "Not enough Ink Coins"
        : data.error ?? "Could not use item",
    );
  }
  if (typeof data.balance === "number") emitCoinBalance(data.balance);
  return data;
}

/**
 * Shared Ink Coin spend controls for attempt-based puzzles.
 */
export function CoinConsumableBar({
  signedIn,
  disabled,
  onHint,
  onExtraAttempt,
  onSkip,
}: Props) {
  const [status, setStatus] = useState<string | null>(null);
  const [busy, setBusy] = useState<string | null>(null);

  if (!signedIn) return null;

  async function run(
    itemId: ConsumableItemId,
    label: string,
    fn?: () => void,
  ) {
    if (disabled || !fn) return;
    setBusy(itemId);
    setStatus(null);
    try {
      await buyAndUse(itemId, `${itemId}:${Date.now()}`);
      fn();
      setStatus(`Used ${label}`);
    } catch (e) {
      setStatus(e instanceof Error ? e.message : "Failed");
    } finally {
      setBusy(null);
    }
  }

  return (
    <div className="mt-4 space-y-2">
      <div className="flex flex-wrap gap-2">
        {onHint && (
          <button
            type="button"
            disabled={disabled || busy !== null}
            onClick={() => void run("hint", "hint", onHint)}
            className="rounded-lg border border-[var(--line)] px-3 py-1.5 text-xs font-semibold text-fog hover:bg-white/5 disabled:opacity-50"
          >
            Hint · {COIN_SPEND.hint}◈
          </button>
        )}
        {onExtraAttempt && (
          <button
            type="button"
            disabled={disabled || busy !== null}
            onClick={() =>
              void run("extra_attempt", "extra attempt", onExtraAttempt)
            }
            className="rounded-lg border border-[var(--line)] px-3 py-1.5 text-xs font-semibold text-fog hover:bg-white/5 disabled:opacity-50"
          >
            Extra try · {COIN_SPEND.extraAttempt}◈
          </button>
        )}
        {onSkip && (
          <button
            type="button"
            disabled={disabled || busy !== null}
            onClick={() => void run("skip", "skip", onSkip)}
            className="rounded-lg border border-[var(--line)] px-3 py-1.5 text-xs font-semibold text-fog hover:bg-white/5 disabled:opacity-50"
          >
            Skip · {COIN_SPEND.skip}◈
          </button>
        )}
      </div>
      {status && <p className="text-xs text-fog">{status}</p>}
    </div>
  );
}
