"use client";

import { useState } from "react";
import {
  AVATAR_ITEMS,
  type ShopItem,
} from "@daily-puzzle/puzzle-core";
import { AvatarMark } from "@/components/avatar-mark";
import { emitCoinBalance } from "@/components/coin-balance-chip";
import { emitEquippedAvatar } from "@/components/header-avatar-chip";
import { useRouter } from "next/navigation";

type Props = {
  equippedAvatarId: string;
  ownedAvatarIds: string[];
  isPlus: boolean;
  balance?: number | null;
};

export function AvatarPicker({
  equippedAvatarId,
  ownedAvatarIds,
  isPlus,
  balance = null,
}: Props) {
  const router = useRouter();
  const [equipped, setEquipped] = useState(equippedAvatarId);
  const [owned, setOwned] = useState(() => new Set(ownedAvatarIds));
  const [open, setOpen] = useState(false);
  const [busy, setBusy] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);

  async function select(item: ShopItem) {
    setBusy(item.id);
    setMessage(null);
    try {
      const res = await fetch("/api/shop", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "claim_equip_avatar",
          avatarId: item.id,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setMessage(
          data.error === "plus_required"
            ? "Inkday Plus required for this portrait."
            : data.error === "insufficient"
              ? "Not enough Ink Coins."
              : data.error === "not_owned"
                ? "Unlock this portrait first."
                : data.error ?? "Could not equip",
        );
        return;
      }
      setEquipped(item.id);
      setOwned((prev) => new Set([...prev, item.id]));
      emitEquippedAvatar(item.id);
      if (typeof data.balance === "number") emitCoinBalance(data.balance);
      setMessage(`Equipped ${item.title}`);
      router.refresh();
    } finally {
      setBusy(null);
    }
  }

  function labelFor(item: ShopItem): string {
    if (item.free || owned.has(item.id)) {
      return equipped === item.id ? "Equipped" : "Equip";
    }
    if (item.plusOnly) return isPlus ? "Claim" : "Plus";
    return `${item.price}◈`;
  }

  function disabled(item: ShopItem): boolean {
    if (busy) return true;
    if (item.free || owned.has(item.id)) return false;
    if (item.plusOnly && !isPlus) return true;
    if (!item.plusOnly && item.price > 0 && balance != null && balance < item.price) {
      return true;
    }
    return false;
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-4">
        <AvatarMark avatarId={equipped} size={72} title="Your avatar" />
        <div>
          <p className="text-sm text-fog">Profile picture</p>
          <button
            type="button"
            onClick={() => setOpen((o) => !o)}
            className="mt-1 rounded-lg border border-[var(--line)] px-3 py-1.5 text-sm font-semibold text-paper hover:bg-white/5"
          >
            {open ? "Close" : "Change"}
          </button>
        </div>
      </div>

      {open && (
        <div className="rounded-2xl border border-[var(--line)] bg-panel/60 p-4">
          <p className="mb-3 text-xs uppercase tracking-[0.18em] text-fog">
            Choose a portrait
          </p>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
            {AVATAR_ITEMS.map((item) => {
              const isEquipped = equipped === item.id;
              return (
                <button
                  key={item.id}
                  type="button"
                  disabled={disabled(item)}
                  onClick={() => void select(item)}
                  className={`flex flex-col items-center gap-2 rounded-xl border px-3 py-3 text-center transition disabled:opacity-45 ${
                    isEquipped
                      ? "border-ember/50 bg-ember/10"
                      : "border-[var(--line)] hover:bg-white/5"
                  }`}
                >
                  <AvatarMark avatarId={item.id} size={48} />
                  <span className="text-xs font-semibold text-paper">
                    {item.title}
                  </span>
                  <span className="text-[10px] uppercase tracking-wider text-fog">
                    {busy === item.id ? "…" : labelFor(item)}
                    {item.plusOnly ? " · Plus" : ""}
                  </span>
                </button>
              );
            })}
          </div>
          {message && (
            <p className="mt-3 text-sm text-fog">{message}</p>
          )}
        </div>
      )}
    </div>
  );
}
