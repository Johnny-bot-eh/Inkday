"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { AvatarMark } from "@/components/avatar-mark";

export function HeaderAvatarChip({
  initialAvatarId,
  initialAccessoryId = null,
  name,
}: {
  initialAvatarId: string;
  initialAccessoryId?: string | null;
  name: string;
}) {
  const [avatarId, setAvatarId] = useState(initialAvatarId);
  const [accessoryId, setAccessoryId] = useState<string | null>(
    initialAccessoryId ?? null,
  );

  useEffect(() => {
    setAvatarId(initialAvatarId);
  }, [initialAvatarId]);

  useEffect(() => {
    setAccessoryId(initialAccessoryId ?? null);
  }, [initialAccessoryId]);

  useEffect(() => {
    function onAvatar(e: Event) {
      const detail = (e as CustomEvent<{
        avatarId?: string;
        accessoryId?: string | null;
      }>).detail;
      if (typeof detail?.avatarId === "string") setAvatarId(detail.avatarId);
      if ("accessoryId" in (detail ?? {})) {
        setAccessoryId(detail?.accessoryId ?? null);
      }
    }
    window.addEventListener("inkday-avatar", onAvatar);
    return () => window.removeEventListener("inkday-avatar", onAvatar);
  }, []);

  return (
    <Link
      href="/profile"
      className="ml-1 hidden items-center gap-2 rounded-md border border-[var(--line)] px-2 py-1 text-xs text-mint md:inline-flex"
    >
      <AvatarMark avatarId={avatarId} accessoryId={accessoryId} size={22} />
      {name}
    </Link>
  );
}

export function emitEquippedAvatar(
  avatarId: string,
  accessoryId?: string | null,
) {
  if (typeof window === "undefined") return;
  window.dispatchEvent(
    new CustomEvent("inkday-avatar", {
      detail: { avatarId, accessoryId: accessoryId ?? null },
    }),
  );
}

export function emitEquippedAccessory(accessoryId: string | null) {
  if (typeof window === "undefined") return;
  window.dispatchEvent(
    new CustomEvent("inkday-avatar", {
      detail: { accessoryId },
    }),
  );
}
