import Link from "next/link";
import {
  AVATAR_ITEMS,
  getShopItem,
  isFreeAvatar,
} from "@daily-puzzle/puzzle-core";
import {
  getEquippedAvatar,
  listCoinInventory,
  listOwnedAvatarIds,
} from "@/lib/coin-service";
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

  const [items, ownedAvatarIds, equippedAvatarId] = await Promise.all([
    listCoinInventory(session.user.id),
    listOwnedAvatarIds(session.user.id),
    getEquippedAvatar(session.user.id),
  ]);

  const consumables = items.filter((row) => {
    const def = getShopItem(row.itemId);
    return def?.kind === "consumable";
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
          Consumables for puzzles and portraits you’ve unlocked.
        </p>
        <Link href="/shop" className="mt-3 inline-block text-sm text-ember hover:underline">
          ← Shop
        </Link>
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

      <div className="rounded-2xl border border-dashed border-[var(--line)] px-4 py-6 text-sm text-fog">
        <p className="font-semibold text-paper">Coming soon</p>
        <p className="mt-1">
          Profile frames, themes, pets, plants, and decorations will appear as
          inventory slots without changing the coin system.
        </p>
      </div>
    </div>
  );
}
