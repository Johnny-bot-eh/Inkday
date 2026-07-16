"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { AvatarMark } from "@/components/avatar-mark";

export function HeaderAvatarChip({
  initialAvatarId,
  name,
}: {
  initialAvatarId: string;
  name: string;
}) {
  const [avatarId, setAvatarId] = useState(initialAvatarId);

  useEffect(() => {
    setAvatarId(initialAvatarId);
  }, [initialAvatarId]);

  useEffect(() => {
    function onAvatar(e: Event) {
      const detail = (e as CustomEvent<{ avatarId?: string }>).detail;
      if (typeof detail?.avatarId === "string") setAvatarId(detail.avatarId);
    }
    window.addEventListener("inkday-avatar", onAvatar);
    return () => window.removeEventListener("inkday-avatar", onAvatar);
  }, []);

  return (
    <Link
      href="/profile"
      className="ml-1 hidden items-center gap-2 rounded-md border border-[var(--line)] px-2 py-1 text-xs text-mint md:inline-flex"
    >
      <AvatarMark avatarId={avatarId} size={22} />
      {name}
    </Link>
  );
}

export function emitEquippedAvatar(avatarId: string) {
  if (typeof window === "undefined") return;
  window.dispatchEvent(
    new CustomEvent("inkday-avatar", { detail: { avatarId } }),
  );
}
