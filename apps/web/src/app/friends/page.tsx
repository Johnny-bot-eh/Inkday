import { FriendsPanel } from "@/components/friends-panel";
import { getSession } from "@/lib/session";

type Props = {
  searchParams: Promise<{ invited?: string }>;
};

export default async function FriendsPage({ searchParams }: Props) {
  const session = await getSession();
  const params = await searchParams;
  return (
    <FriendsPanel
      signedIn={Boolean(session?.user)}
      userId={session?.user?.id ?? null}
      invited={params.invited === "1"}
    />
  );
}
