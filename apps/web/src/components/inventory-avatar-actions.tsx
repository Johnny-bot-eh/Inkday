"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { emitEquippedAvatar } from "@/components/header-avatar-chip";

export function InventoryAvatarActions({ avatarId }: { avatarId: string }) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);

  async function equip() {
    setBusy(true);
    try {
      const res = await fetch("/api/shop", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "equip_avatar", avatarId }),
      });
      if (res.ok) {
        emitEquippedAvatar(avatarId);
        router.refresh();
      }
    } finally {
      setBusy(false);
    }
  }

  return (
    <button
      type="button"
      disabled={busy}
      onClick={() => void equip()}
      className="rounded-lg border border-[var(--line)] px-3 py-1.5 text-xs font-semibold text-paper hover:bg-white/5 disabled:opacity-50"
    >
      {busy ? "…" : "Equip"}
    </button>
  );
}
