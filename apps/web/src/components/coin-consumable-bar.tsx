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
  /** When false, Hint is disabled and does not charge coins. */
  canUseHint?: boolean;
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
  // Always refresh header balance as soon as the spend lands.
  if (typeof data.balance === "number") {
    emitCoinBalance(data.balance);
  } else {
    try {
      const wallet = await fetch("/api/shop");
      const body = await wallet.json();
      if (typeof body.balance === "number") emitCoinBalance(body.balance);
    } catch {
      /* ignore */
    }
  }
  return data;
}

/**
 * Shared Ink Coin spend controls for attempt-based puzzles.
 */
export function CoinConsumableBar({
  signedIn,
  disabled,
  canUseHint = true,
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
    if (disabled || !fn || busy !== null) return;
    if (itemId === "hint" && !canUseHint) {
      setStatus("No further hints on this board.");
      return;
    }
    setBusy(itemId);
    setStatus(null);
    try {
      const data = await buyAndUse(itemId, `${itemId}:${Date.now()}`);
      fn();
      if (typeof data.balance === "number") {
        const spent = typeof data.spent === "number" ? data.spent : null;
        setStatus(
          spent != null && spent > 0
            ? `Used ${label} (−${spent}◈) · balance ${data.balance}◈`
            : `Used ${label} · balance ${data.balance}◈`,
        );
      } else {
        setStatus(`Used ${label}`);
      }
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
            disabled={disabled || busy !== null || !canUseHint}
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
