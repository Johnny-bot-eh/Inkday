"use client";

import Link from "next/link";
import { useSyncExternalStore } from "react";
import { getShopItem } from "@daily-puzzle/puzzle-core";
import {
  dismissAllUnlockNotices,
  dismissUnlockNotice,
  listUnlockNotices,
  subscribeUnlockNotices,
} from "@/lib/unlock-notices";

type UpcomingHint = {
  title: string;
  detail: string;
  href: string;
};

type Props = {
  /** Case File progress teaser — next ribbon still available. */
  upcoming?: UpcomingHint | null;
  /** Shop teaser for purchasable frames when signed in. */
  shopTeaser?: boolean;
};

/**
 * Home-only digest of newly unlocked cosmetics + optional upcoming hints.
 * Never mounts on /play — active puzzles stay uninterrupted.
 */
export function UnlockNoticesBanner({
  upcoming = null,
  shopTeaser = false,
}: Props) {
  const notices = useSyncExternalStore(
    subscribeUnlockNotices,
    listUnlockNotices,
    () => [],
  );

  if (notices.length === 0 && !upcoming && !shopTeaser) return null;

  return (
    <section className="space-y-3 rounded-2xl border border-ember/35 bg-ember/10 px-4 py-4">
      <div className="flex flex-wrap items-start justify-between gap-2">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-ember">
            Unlockables
          </p>
          <p className="mt-1 text-sm text-fog">
            Ribbons and crowns are awarded automatically. Frames can be bought
            with Ink Coins — equip anything on your profile.
          </p>
        </div>
        {notices.length > 0 ? (
          <button
            type="button"
            onClick={() => dismissAllUnlockNotices()}
            className="rounded-lg px-2 py-1 text-xs text-fog hover:bg-white/5 hover:text-paper"
          >
            Dismiss all
          </button>
        ) : null}
      </div>

      {notices.length > 0 ? (
        <ul className="space-y-2">
          {notices.map((n) => (
            <li
              key={n.id}
              className="flex flex-wrap items-start justify-between gap-3 rounded-xl border border-[var(--line)] bg-panel/50 px-3 py-2.5"
            >
              <div className="min-w-0">
                <p className="font-semibold text-paper">
                  {n.kind === "accessory" ? "New accessory · " : "Unlocked · "}
                  {n.title}
                </p>
                <p className="text-xs text-fog">{n.description}</p>
              </div>
              <div className="flex shrink-0 items-center gap-2">
                {n.kind === "accessory" || n.kind === "avatar" ? (
                  <Link
                    href="/profile"
                    className="rounded-lg bg-ember px-3 py-1.5 text-xs font-semibold text-on-ember hover:bg-ember-deep"
                  >
                    Equip
                  </Link>
                ) : null}
                <button
                  type="button"
                  onClick={() => dismissUnlockNotice(n.id)}
                  className="rounded-lg px-2 py-1.5 text-xs text-fog hover:text-paper"
                >
                  Got it
                </button>
              </div>
            </li>
          ))}
        </ul>
      ) : null}

      {upcoming ? (
        <div className="rounded-xl border border-[var(--line)] bg-panel/40 px-3 py-2.5 text-sm">
          <p className="font-semibold text-paper">{upcoming.title}</p>
          <p className="mt-0.5 text-xs text-fog">{upcoming.detail}</p>
          <Link
            href={upcoming.href}
            className="mt-1 inline-block text-xs font-semibold text-ember hover:underline"
          >
            Open Case File →
          </Link>
        </div>
      ) : null}

      {shopTeaser ? (
        <p className="text-xs text-fog">
          Want a frame now?{" "}
          <Link href="/shop" className="font-semibold text-ember hover:underline">
            Browse Accessories in the Shop
          </Link>
          {getShopItem("accessory_frame_ember")
            ? ` · Ember profile frame is ${getShopItem("accessory_frame_ember")!.price}◈`
            : null}
          .
        </p>
      ) : null}
    </section>
  );
}
