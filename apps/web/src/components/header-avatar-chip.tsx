"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { levelFromXp } from "@daily-puzzle/puzzle-core";
import { AvatarMark } from "@/components/avatar-mark";
import type { AccountXpSummary } from "@/components/account-xp-chip";

export function HeaderAvatarChip({
  initialAvatarId,
  initialAccessoryId = null,
  name,
  initialXp = null,
}: {
  initialAvatarId: string;
  initialAccessoryId?: string | null;
  name: string;
  initialXp?: AccountXpSummary | null;
}) {
  const [avatarId, setAvatarId] = useState(initialAvatarId);
  const [accessoryId, setAccessoryId] = useState<string | null>(
    initialAccessoryId ?? null,
  );
  const [summary, setSummary] = useState<AccountXpSummary | null>(initialXp);

  useEffect(() => {
    setAvatarId(initialAvatarId);
  }, [initialAvatarId]);

  useEffect(() => {
    setAccessoryId(initialAccessoryId ?? null);
  }, [initialAccessoryId]);

  useEffect(() => {
    if (!initialXp) {
      setSummary(null);
      return;
    }
    setSummary((prev) => {
      if (
        prev &&
        prev.accountXp === initialXp.accountXp &&
        prev.level === initialXp.level &&
        prev.xpIntoLevel === initialXp.xpIntoLevel &&
        prev.xpForNext === initialXp.xpForNext
      ) {
        return prev;
      }
      return initialXp;
    });
  }, [
    initialXp?.accountXp,
    initialXp?.level,
    initialXp?.xpIntoLevel,
    initialXp?.xpForNext,
  ]);

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

  useEffect(() => {
    function onXp(e: Event) {
      const detail = (e as CustomEvent<Partial<AccountXpSummary>>).detail;
      if (typeof detail?.accountXp === "number") {
        const next = levelFromXp(detail.accountXp);
        setSummary({
          accountXp: next.totalXp,
          level: next.level,
          xpIntoLevel: next.xpIntoLevel,
          xpForNext: next.xpForNext,
        });
        return;
      }
      if (typeof detail?.level === "number") {
        setSummary((prev) => ({
          accountXp: prev?.accountXp ?? 0,
          level: detail.level!,
          xpIntoLevel:
            typeof detail.xpIntoLevel === "number"
              ? detail.xpIntoLevel
              : (prev?.xpIntoLevel ?? 0),
          xpForNext:
            typeof detail.xpForNext === "number"
              ? detail.xpForNext
              : (prev?.xpForNext ?? 1),
        }));
      }
    }
    window.addEventListener("inkday-account-xp", onXp);
    return () => window.removeEventListener("inkday-account-xp", onXp);
  }, []);

  const pct =
    summary != null
      ? Math.min(
          100,
          (summary.xpIntoLevel / Math.max(1, summary.xpForNext)) * 100,
        )
      : 0;

  return (
    <Link
      href="/profile"
      className="ml-1 inline-flex flex-col items-center gap-1 rounded-lg border border-[var(--line)] bg-panel/40 px-2 py-1.5 text-mint"
      title={
        summary
          ? `${name} · Lv ${summary.level} · ${summary.xpIntoLevel}/${summary.xpForNext} XP`
          : name
      }
    >
      <AvatarMark avatarId={avatarId} accessoryId={accessoryId} size={40} />
      {summary ? (
        <span className="flex w-full min-w-[2.75rem] flex-col items-center gap-0.5">
          <span className="text-[9px] font-semibold uppercase tracking-[0.12em] text-ember">
            Lv {summary.level}
          </span>
          <span className="h-1 w-full overflow-hidden rounded-full bg-ink-2/80">
            <span
              className="block h-full rounded-full bg-ember transition-[width] duration-300"
              style={{ width: `${pct}%` }}
            />
          </span>
        </span>
      ) : (
        <span className="max-w-[3.5rem] truncate text-[10px] text-fog">
          {name}
        </span>
      )}
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
