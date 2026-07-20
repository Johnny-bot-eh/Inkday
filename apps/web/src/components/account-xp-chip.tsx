"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { levelFromXp } from "@daily-puzzle/puzzle-core";

export type AccountXpSummary = {
  accountXp: number;
  level: number;
  xpIntoLevel: number;
  xpForNext: number;
};

export function AccountXpChip({ initial }: { initial: AccountXpSummary }) {
  const [summary, setSummary] = useState(initial);

  useEffect(() => {
    setSummary((prev) => {
      if (
        prev.accountXp === initial.accountXp &&
        prev.level === initial.level &&
        prev.xpIntoLevel === initial.xpIntoLevel &&
        prev.xpForNext === initial.xpForNext
      ) {
        return prev;
      }
      return initial;
    });
  }, [
    initial.accountXp,
    initial.level,
    initial.xpIntoLevel,
    initial.xpForNext,
  ]);

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
          ...prev,
          level: detail.level!,
          ...(typeof detail.xpIntoLevel === "number"
            ? { xpIntoLevel: detail.xpIntoLevel }
            : {}),
          ...(typeof detail.xpForNext === "number"
            ? { xpForNext: detail.xpForNext }
            : {}),
        }));
      }
    }
    window.addEventListener("inkday-account-xp", onXp);
    return () => window.removeEventListener("inkday-account-xp", onXp);
  }, []);

  const pct = Math.min(
    100,
    (summary.xpIntoLevel / Math.max(1, summary.xpForNext)) * 100,
  );

  return (
    <Link
      href="/profile"
      className="ml-1 inline-flex min-w-[4.5rem] flex-col gap-0.5 rounded-md border border-ember/35 bg-ember/10 px-2.5 py-1.5"
      title={`Account level ${summary.level} · ${summary.xpIntoLevel}/${summary.xpForNext} XP`}
    >
      <span className="text-[10px] font-semibold uppercase tracking-[0.14em] text-ember">
        Lv {summary.level}
      </span>
      <span className="h-1 overflow-hidden rounded-full bg-ink-2/80">
        <span
          className="block h-full rounded-full bg-ember transition-[width] duration-300"
          style={{ width: `${pct}%` }}
        />
      </span>
    </Link>
  );
}

export function emitAccountXp(detail: Partial<AccountXpSummary> & { accountXp?: number }) {
  if (typeof window === "undefined") return;
  window.dispatchEvent(
    new CustomEvent("inkday-account-xp", { detail }),
  );
}
