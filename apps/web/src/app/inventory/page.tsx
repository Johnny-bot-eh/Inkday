import Link from "next/link";
import { getShopItem } from "@daily-puzzle/puzzle-core";
import { listCoinInventory } from "@/lib/coin-service";
import { getSession } from "@/lib/session";

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

  const items = await listCoinInventory(session.user.id);

  return (
    <div className="mx-auto max-w-xl animate-rise space-y-6">
      <div>
        <p className="text-xs uppercase tracking-[0.22em] text-ember">Bag</p>
        <h1 className="mt-2 font-[family-name:var(--font-display)] text-4xl font-bold">
          Inventory
        </h1>
        <p className="mt-2 text-fog">
          Consumables ready to use in puzzles. Cosmetics and companions will
          land here later.
        </p>
        <Link href="/shop" className="mt-3 inline-block text-sm text-ember hover:underline">
          ← Shop
        </Link>
      </div>

      {items.length === 0 ? (
        <p className="text-sm text-fog">Empty — pick something up in the shop.</p>
      ) : (
        <ul className="space-y-2">
          {items.map((row) => {
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
