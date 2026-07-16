import Link from "next/link";

export default function CompanionPage() {
  return (
    <div className="mx-auto max-w-lg animate-rise space-y-6">
      <div>
        <p className="text-xs uppercase tracking-[0.22em] text-ember">
          Companions
        </p>
        <h1 className="mt-2 font-[family-name:var(--font-display)] text-4xl font-bold">
          Pets & plants
        </h1>
        <p className="mt-3 text-fog">
          Soon you’ll adopt plants, cats, dogs, owls, and detective-themed
          pals — fed and decorated with Ink Coins.
        </p>
      </div>

      <div className="rounded-2xl border border-[var(--line)] bg-panel/60 p-5 text-sm text-fog">
        <p className="font-semibold text-paper">They won’t die while you’re away</p>
        <ul className="mt-3 list-disc space-y-1 pl-5">
          <li>Growth slows when you’re inactive</li>
          <li>Plants may wilt temporarily</li>
          <li>Pets may look sleepy or sad</li>
          <li>Interact again to restore them</li>
        </ul>
      </div>

      <p className="text-sm text-fog">
        The wallet and shop already support pet / plant / decoration item
        kinds — this hub will light up when companions ship.
      </p>

      <Link href="/shop" className="inline-block text-sm text-ember hover:underline">
        ← Back to shop
      </Link>
    </div>
  );
}
