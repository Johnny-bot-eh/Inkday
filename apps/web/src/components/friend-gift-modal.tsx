"use client";

import { useEffect, useState } from "react";
import { emitAccountXp } from "@/components/account-xp-chip";
import {
  MAX_COIN_GIFT,
  MIN_COIN_GIFT,
} from "@/lib/friend-gift-constants";

type SendableDecor = {
  itemId: string;
  title: string;
  qty: number;
};

type Props = {
  recipientId: string;
  recipientName: string;
  open: boolean;
  onClose: () => void;
  onSent?: (detail?: { xpEarned?: number }) => void;
};

export function FriendGiftModal({
  recipientId,
  recipientName,
  open,
  onClose,
  onSent,
}: Props) {
  const [kind, setKind] = useState<"coins" | "decoration">("coins");
  const [coins, setCoins] = useState(MIN_COIN_GIFT);
  const [itemId, setItemId] = useState("");
  const [message, setMessage] = useState("");
  const [decor, setDecor] = useState<SendableDecor[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!open) return;
    setError(null);
    void (async () => {
      const res = await fetch("/api/social?view=sendable_decor");
      if (!res.ok) return;
      const data = (await res.json()) as { decor?: SendableDecor[] };
      const items = data.decor ?? [];
      setDecor(items);
      if (items[0]) setItemId(items[0].itemId);
    })();
  }, [open]);

  if (!open) return null;

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/social", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "send_gift",
          recipientId,
          kind,
          coins: kind === "coins" ? coins : undefined,
          itemId: kind === "decoration" ? itemId : undefined,
          message: message.trim() || undefined,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(
          data.error === "insufficient"
            ? "Not enough coins."
            : data.error === "not_available"
              ? "That decoration isn’t available to send."
              : data.error === "invalid_amount"
                ? `Coins must be ${MIN_COIN_GIFT}–${MAX_COIN_GIFT}.`
                : (data.error ?? "Could not send gift"),
        );
        return;
      }
      if (typeof data.accountXp === "number") {
        emitAccountXp({ accountXp: data.accountXp });
      }
      setMessage("");
      onSent?.(
        typeof data.xpEarned === "number"
          ? { xpEarned: data.xpEarned }
          : undefined,
      );
      onClose();
    } finally {
      setLoading(false);
    }
  }

  return (
    <div
      className="fixed inset-0 z-[80] flex items-center justify-center bg-black/60 p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="gift-modal-title"
      onClick={onClose}
    >
      <form
        onSubmit={(e) => void submit(e)}
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-md rounded-2xl border border-[var(--line)] bg-panel p-5 shadow-xl"
      >
        <h2
          id="gift-modal-title"
          className="font-[family-name:var(--font-display)] text-xl font-bold"
        >
          Send a gift to {recipientName}
        </h2>
        <p className="mt-1 text-sm text-fog">
          Send coins or an unplaced decoration — you earn a little XP for
          sharing.
        </p>

        <div className="mt-4 flex gap-2">
          <button
            type="button"
            onClick={() => setKind("coins")}
            className={[
              "flex-1 rounded-lg border px-3 py-2 text-sm font-medium",
              kind === "coins"
                ? "border-ember bg-ember/15 text-ember"
                : "border-[var(--line)] text-fog",
            ].join(" ")}
          >
            Coins
          </button>
          <button
            type="button"
            onClick={() => setKind("decoration")}
            className={[
              "flex-1 rounded-lg border px-3 py-2 text-sm font-medium",
              kind === "decoration"
                ? "border-ember bg-ember/15 text-ember"
                : "border-[var(--line)] text-fog",
            ].join(" ")}
          >
            Decoration
          </button>
        </div>

        {kind === "coins" ? (
          <label className="mt-4 block text-sm">
            <span className="text-fog">Amount ({MIN_COIN_GIFT}–{MAX_COIN_GIFT})</span>
            <input
              type="number"
              min={MIN_COIN_GIFT}
              max={MAX_COIN_GIFT}
              value={coins}
              onChange={(e) => setCoins(Number(e.target.value))}
              className="mt-1 w-full rounded-lg border border-[var(--line)] bg-ink-2 px-3 py-2 outline-none ring-ember/40 focus:ring-2"
            />
          </label>
        ) : decor.length === 0 ? (
          <p className="mt-4 text-sm text-fog">
            No unplaced decorations to send — buy extras in the Shop.
          </p>
        ) : (
          <label className="mt-4 block text-sm">
            <span className="text-fog">Decoration</span>
            <select
              value={itemId}
              onChange={(e) => setItemId(e.target.value)}
              className="mt-1 w-full rounded-lg border border-[var(--line)] bg-ink-2 px-3 py-2"
            >
              {decor.map((d) => (
                <option key={d.itemId} value={d.itemId}>
                  {d.title} (×{d.qty})
                </option>
              ))}
            </select>
          </label>
        )}

        <label className="mt-4 block text-sm">
          <span className="text-fog">Message (optional)</span>
          <input
            type="text"
            maxLength={140}
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            placeholder="A little note…"
            className="mt-1 w-full rounded-lg border border-[var(--line)] bg-ink-2 px-3 py-2 outline-none ring-ember/40 focus:ring-2"
          />
        </label>

        {error ? <p className="mt-3 text-sm text-crimson">{error}</p> : null}

        <div className="mt-5 flex justify-end gap-2">
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg px-4 py-2 text-sm text-fog hover:text-paper"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={
              loading ||
              (kind === "decoration" && decor.length === 0) ||
              (kind === "coins" &&
                (coins < MIN_COIN_GIFT || coins > MAX_COIN_GIFT))
            }
            className="rounded-lg bg-ember px-4 py-2 text-sm font-semibold text-on-ember hover:bg-ember-deep disabled:opacity-60"
          >
            {loading ? "Sending…" : "Send gift"}
          </button>
        </div>
      </form>
    </div>
  );
}
