import { LeaderboardPanel } from "@/components/leaderboard-panel";
import { getSession } from "@/lib/session";

export default async function LeaderboardPage() {
  const session = await getSession();
  return <LeaderboardPanel signedIn={Boolean(session?.user)} />;
}
