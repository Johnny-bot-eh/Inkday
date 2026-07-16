import Link from "next/link";
import { CoinHistoryClient } from "@/components/coin-history-client";
import { getSession } from "@/lib/session";

export default async function CoinsHistoryPage() {
  const session = await getSession();
  if (!session?.user) {
    return (
      <div className="mx-auto max-w-md animate-rise text-center">
        <h1 className="font-[family-name:var(--font-display)] text-3xl font-bold">
          Coin history
        </h1>
        <p className="mt-2 text-fog">Sign in to see your Ink Coin ledger.</p>
        <Link
          href="/auth"
          className="mt-6 inline-block rounded-lg bg-ember px-5 py-2.5 font-semibold text-on-ember"
        >
          Sign in
        </Link>
      </div>
    );
  }
  return <CoinHistoryClient />;
}
