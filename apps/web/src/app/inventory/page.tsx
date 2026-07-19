import Link from "next/link";
import {
  AVATAR_ITEMS,
  getShopItem,
  isFreeAvatar,
  isHabitatDecorItemId,
} from "@daily-puzzle/puzzle-core";
import {
  getEquippedAvatar,
  listCoinInventory,
  listOwnedAvatarIds,
} from "@/lib/coin-service";
import { getCompanionSnapshot } from "@/lib/pet-service";
import { getSession } from "@/lib/session";
import { InventoryAvatarActions } from "@/components/inventory-avatar-actions";
import { AvatarMark } from "@/components/avatar-mark";

export default async function InventoryPage() {
  const session = await getSession();
  if (!session?.user) {
    return (
      <div className="mx-auto max-w-md animate-rise text-center">
        <h1 className="font-[family-name:var(--font-display)] text-3xl font-bold">
          Inventory
        </h1>
        <p className="mt-2 text-fog">Sign in to hold consumables and cosmetics.</p>
        <Link
          href="/auth"
          className="mt-6 inline-block rounded-lg bg-ember px-5 py-2.5 font-semibold text-on-ember"
        >
          Sign in
        </Link>
      </div>
    );
  }

  const [items, ownedAvatarIds, equippedAvatarId, companion] =
    await Promise.all([
      listCoinInventory(session.user.id),
      listOwnedAvatarIds(session.user.id),
      getEquippedAvatar(session.user.id),
      getCompanionSnapshot(session.user.id).catch(() => null),
    ]);

  const placedCounts = new Map<string, number>();
  for (const p of companion?.garden.placements ?? []) {
    if (isHabitatDecorItemId(p.itemId)) continue;
    placedCounts.set(p.itemId, (placedCounts.get(p.itemId) ?? 0) + 1);
  }

  const consumables = items.filter((row) => {
    const def = getShopItem(row.itemId);
    return def?.kind === "consumable" || def?.kind === "food";
  });

  const decorations = items.filter((row) => {
    const def = getShopItem(row.itemId);
    return (
      def?.kind === "decoration" && !isHabitatDecorItemId(row.itemId)
    );
  });

  const ownedAvatars = AVATAR_ITEMS.filter(
    (a) => isFreeAvatar(a.id) || ownedAvatarIds.includes(a.id),
  );

  return (
    <div className="mx-auto max-w-xl animate-rise space-y-8">
      <div>
        <p className="text-xs uppercase tracking-[0.22em] text-ember">Bag</p>
        <h1 className="mt-2 font-[family-name:var(--font-display)] text-4xl font-bold">
          Inventory
        </h1>
        <p className="mt-2 text-fog">
          Consumables, food, portraits, and garden decorations you’ve unlocked.
        </p>
        <div className="mt-3 flex flex-wrap gap-3 text-sm">
          <Link href="/shop" className="text-ember hover:underline">
            ← Shop
          </Link>
          <Link href="/companion" className="text-ember hover:underline">
            Garden →
          </Link>
        </div>
      </div>

      <section className="space-y-3">
        <h2 className="font-[family-name:var(--font-display)] text-xl font-bold">
          Portraits
        </h2>
        <ul className="space-y-2">
          {ownedAvatars.map((a) => (
            <li
              key={a.id}
              className="flex items-center justify-between gap-3 rounded-xl border border-[var(--line)] bg-panel/60 px-4 py-3"
            >
              <div className="flex items-center gap-3">
                <AvatarMark avatarId={a.id} size={36} />
                <div>
                  <div className="font-medium">{a.title}</div>
                  {equippedAvatarId === a.id ? (
                    <div className="text-xs text-mint">Equipped</div>
                  ) : (
                    <div className="text-xs text-fog">
                      {a.free ? "Free" : a.plusOnly ? "Plus" : "Owned"}
                    </div>
                  )}
                </div>
              </div>
              {equippedAvatarId !== a.id && (
                <InventoryAvatarActions avatarId={a.id} />
              )}
            </li>
          ))}
        </ul>
      </section>

      <section className="space-y-3">
        <h2 className="font-[family-name:var(--font-display)] text-xl font-bold">
          Consumables
        </h2>
        {consumables.length === 0 ? (
          <p className="text-sm text-fog">Empty — pick something up in the shop.</p>
        ) : (
          <ul className="space-y-2">
            {consumables.map((row) => {
              const def = getShopItem(row.itemId);
              return (
                <li
                  key={row.id}
                  className="flex justify-between rounded-xl border border-[var(--line)] bg-panel/60 px-4 py-3"
                >
                  <span className="font-medium">
                    {def?.title ?? row.itemId}
                  </span>
                  <span className="tabular-nums text-mint">×{row.qty}</span>
                </li>
              );
            })}
          </ul>
        )}
      </section>

      <section className="space-y-3">
        <h2 className="font-[family-name:var(--font-display)] text-xl font-bold">
          Garden decorations
        </h2>
        {decorations.length === 0 ? (
          <p className="text-sm text-fog">
            None yet — buy starter decorations in the Shop from level 1.
          </p>
        ) : (
          <ul className="space-y-2">
            {decorations.map((row) => {
              const def = getShopItem(row.itemId);
              const placed = placedCounts.get(row.itemId) ?? 0;
              const remaining = Math.max(0, row.qty - placed);
              const fullyPlaced = placed > 0 && remaining === 0;
              return (
                <li
                  key={row.id}
                  className="flex items-center justify-between gap-3 rounded-xl border border-[var(--line)] bg-panel/60 px-4 py-3"
                >
                  <span className="font-medium">
                    {def?.title ?? row.itemId}
                    {row.qty > 1 ? (
                      <span className="ml-2 text-xs font-normal text-fog">
                        ×{row.qty}
                        {placed > 0 ? ` · ${placed} placed` : ""}
                      </span>
                    ) : null}
                  </span>
                  <div className="flex shrink-0 flex-col items-end gap-1 text-right">
                    {fullyPlaced || placed > 0 ? (
                      <Link
                        href={`/companion?highlight=${encodeURIComponent(row.itemId)}`}
                        className="max-w-[11.5rem] text-sm leading-snug text-ember hover:underline"
                      >
                        Placed in garden. Tap to view location.
                      </Link>
                    ) : null}
                    {remaining > 0 ? (
                      <Link
                        href={`/companion?place=${encodeURIComponent(row.itemId)}`}
                        className="text-sm text-ember hover:underline"
                      >
                        {placed > 0 ? "Place another" : "Place in garden"}
                      </Link>
                    ) : null}
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </section>
    </div>
  );
}
