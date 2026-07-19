"use client";

import { useState } from "react";
import Link from "next/link";
import { AvatarMark } from "@/components/avatar-mark";
import { FriendGiftModal } from "@/components/friend-gift-modal";
import { GardenDiorama } from "@/components/garden-diorama";
import type { CompanionSnapshot } from "@daily-puzzle/puzzle-core";

type Props = {
  friend: {
    id: string;
    name: string;
    displayName: string | null;
    equippedAvatarId: string | null;
    equippedAccessoryId: string | null;
  };
  snapshot: CompanionSnapshot;
};

export function FriendGardenVisit({ friend, snapshot }: Props) {
  const [giftOpen, setGiftOpen] = useState(false);
  const displayName = friend.displayName?.trim() || friend.name;

  return (
    <div className="mx-auto max-w-3xl space-y-6 animate-rise">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <AvatarMark
            avatarId={friend.equippedAvatarId}
            accessoryId={friend.equippedAccessoryId}
            size={44}
          />
          <div>
            <h1 className="font-[family-name:var(--font-display)] text-3xl font-bold">
              {displayName}&apos;s garden
            </h1>
            <p className="text-sm text-fog">Read-only visit — wander and say hi.</p>
          </div>
        </div>
        <button
          type="button"
          onClick={() => setGiftOpen(true)}
          className="rounded-lg bg-ember px-4 py-2 text-sm font-semibold text-on-ember hover:bg-ember-deep"
        >
          Send gift
        </button>
      </div>

      <GardenDiorama
        garden={snapshot.garden}
        pet={snapshot.pet}
        accountLevel={snapshot.accountLevel}
        readOnly
      />

      {!snapshot.pet ? (
        <p className="text-center text-sm text-fog">
          No companion hatched yet — but the nest is ready when they are.
        </p>
      ) : null}

      <p className="text-center text-xs text-fog">
        <Link href="/friends" className="text-ember hover:underline">
          ← Back to friends
        </Link>
      </p>

      <FriendGiftModal
        recipientId={friend.id}
        recipientName={displayName}
        open={giftOpen}
        onClose={() => setGiftOpen(false)}
      />
    </div>
  );
}
