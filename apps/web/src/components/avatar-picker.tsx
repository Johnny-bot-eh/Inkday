"use client";

import { useMemo, useState } from "react";
import {
  ACCESSORY_ITEMS,
  AVATAR_ITEMS,
  type ShopItem,
} from "@daily-puzzle/puzzle-core";
import { AvatarMark } from "@/components/avatar-mark";
import { emitCoinBalance } from "@/components/coin-balance-chip";
import { emitEquippedAccessory, emitEquippedAvatar } from "@/components/header-avatar-chip";
import { useRouter } from "next/navigation";

type Props = {
  equippedAvatarId: string;
  equippedAccessoryId?: string | null;
  ownedAvatarIds: string[];
  ownedAccessoryIds?: string[];
  isPlus: boolean;
  balance?: number | null;
};

export function AvatarPicker({
  equippedAvatarId,
  equippedAccessoryId = null,
  ownedAvatarIds,
  ownedAccessoryIds = [],
  isPlus,
  balance = null,
}: Props) {
  const router = useRouter();
  const [equipped, setEquipped] = useState(equippedAvatarId);
  const [accessory, setAccessory] = useState<string | null>(
    equippedAccessoryId ?? null,
  );
  const [owned, setOwned] = useState(() => new Set(ownedAvatarIds));
  const [ownedAccessories, setOwnedAccessories] = useState(
    () => new Set(ownedAccessoryIds),
  );
  const [open, setOpen] = useState(false);
  const [busy, setBusy] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);

  const visibleAvatars = useMemo(
    () =>
      AVATAR_ITEMS.filter((item) => {
        if (item.badgeReward) return owned.has(item.id);
        if (item.free || owned.has(item.id) || item.plusOnly) return true;
        return item.price > 0;
      }),
    [owned],
  );

  const visibleAccessories = useMemo(
    () => ACCESSORY_ITEMS.filter((item) => ownedAccessories.has(item.id)),
    [ownedAccessories],
  );

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
      emitEquippedAvatar(item.id, accessory);
      if (typeof data.balance === "number") emitCoinBalance(data.balance);
      setMessage(`Equipped ${item.title}`);
      router.refresh();
    } finally {
      setBusy(null);
    }
  }

  async function equipAccessoryItem(item: ShopItem) {
    setBusy(item.id);
    setMessage(null);
    try {
      const res = await fetch("/api/shop", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "equip_accessory",
          accessoryId: item.id,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setMessage(data.error ?? "Could not equip accessory");
        return;
      }
      setAccessory(item.id);
      emitEquippedAccessory(item.id);
      emitEquippedAvatar(equipped, item.id);
      setMessage(`Equipped ${item.title}`);
      router.refresh();
    } finally {
      setBusy(null);
    }
  }

  async function removeAccessory() {
    setBusy("__unequip__");
    setMessage(null);
    try {
      const res = await fetch("/api/shop", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "unequip_accessory" }),
      });
      if (!res.ok) {
        const data = await res.json();
        setMessage(data.error ?? "Could not unequip");
        return;
      }
      setAccessory(null);
      emitEquippedAccessory(null);
      emitEquippedAvatar(equipped, null);
      setMessage("Accessory removed");
      router.refresh();
    } finally {
      setBusy(null);
    }
  }

  function labelFor(item: ShopItem): string {
    if (item.badgeReward && !owned.has(item.id)) return "Locked";
    if (item.free || owned.has(item.id)) {
      return equipped === item.id ? "Equipped" : "Equip";
    }
    if (item.plusOnly) return isPlus ? "Claim" : "Plus";
    return `${item.price}◈`;
  }

  function disabled(item: ShopItem): boolean {
    if (busy) return true;
    if (item.badgeReward && !owned.has(item.id)) return true;
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
        <AvatarMark
          avatarId={equipped}
          accessoryId={accessory}
          size={96}
          title="Your avatar"
        />
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
            {visibleAvatars.map((item) => {
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
                  <AvatarMark avatarId={item.id} accessoryId={accessory} size={48} />
                  <span className="text-xs font-semibold text-paper">
                    {item.title}
                  </span>
                  <span className="text-[10px] uppercase tracking-wider text-fog">
                    {busy === item.id ? "…" : labelFor(item)}
                    {item.plusOnly ? " · Plus" : ""}
                    {item.badgeReward ? " · Badge" : ""}
                  </span>
                </button>
              );
            })}
          </div>

          {visibleAccessories.length > 0 && (
            <>
              <p className="mb-3 mt-5 text-xs uppercase tracking-[0.18em] text-fog">
                Accessories
              </p>
              <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
                {visibleAccessories.map((item) => {
                  const isEquipped = accessory === item.id;
                  return (
                    <button
                      key={item.id}
                      type="button"
                      disabled={Boolean(busy)}
                      onClick={() => void equipAccessoryItem(item)}
                      className={`flex flex-col items-center gap-2 rounded-xl border px-3 py-3 text-center transition disabled:opacity-45 ${
                        isEquipped
                          ? "border-mint/50 bg-mint/10"
                          : "border-[var(--line)] hover:bg-white/5"
                      }`}
                    >
                      <AvatarMark
                        avatarId={equipped}
                        accessoryId={item.id}
                        size={48}
                      />
                      <span className="text-xs font-semibold text-paper">
                        {item.title}
                      </span>
                      <span className="text-[10px] uppercase tracking-wider text-fog">
                        {busy === item.id ? "…" : isEquipped ? "Equipped" : "Equip"}
                      </span>
                    </button>
                  );
                })}
              </div>
              {accessory && (
                <button
                  type="button"
                  disabled={Boolean(busy)}
                  onClick={() => void removeAccessory()}
                  className="mt-3 text-xs text-fog underline hover:text-paper"
                >
                  {busy === "__unequip__" ? "…" : "Remove accessory"}
                </button>
              )}
            </>
          )}

          {message && (
            <p className="mt-3 text-sm text-fog">{message}</p>
          )}
        </div>
      )}
    </div>
  );
}
