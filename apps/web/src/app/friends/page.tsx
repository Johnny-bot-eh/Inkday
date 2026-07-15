import { FriendsPanel } from "@/components/friends-panel";
import { getSession } from "@/lib/session";

export default async function FriendsPage() {
  const session = await getSession();
  return <FriendsPanel signedIn={Boolean(session?.user)} />;
}
