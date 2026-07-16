import { ShopClient } from "@/components/shop-client";
import { getCoinBalance } from "@/lib/coin-service";
import { getSession } from "@/lib/session";

export default async function ShopPage() {
  const session = await getSession();
  const balance = session?.user
    ? await getCoinBalance(session.user.id)
    : null;

  return (
    <ShopClient
      signedIn={Boolean(session?.user)}
      initialBalance={balance}
    />
  );
}
