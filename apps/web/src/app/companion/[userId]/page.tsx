import Link from "next/link";
import { redirect } from "next/navigation";
import { FriendGardenVisit } from "@/components/friend-garden-visit";
import { getFriendGardenSnapshot } from "@/lib/pet-service";
import { getSession } from "@/lib/session";

export default async function FriendCompanionPage({
  params,
}: {
  params: Promise<{ userId: string }>;
}) {
  const session = await getSession();
  if (!session?.user) {
    redirect("/auth");
  }

  const { userId: friendId } = await params;
  if (friendId === session.user.id) {
    redirect("/companion");
  }
  const result = await getFriendGardenSnapshot(session.user.id, friendId);

  if (!result.ok) {
    return (
      <div className="mx-auto max-w-md space-y-4 text-center animate-rise">
        <h1 className="font-[family-name:var(--font-display)] text-3xl font-bold">
          Garden unavailable
        </h1>
        <p className="text-fog">
          {result.reason === "not_friends"
            ? "You can only visit connected friends’ gardens."
            : "This garden couldn’t be loaded."}
        </p>
        <Link href="/friends" className="text-ember hover:underline">
          Back to friends
        </Link>
      </div>
    );
  }

  return (
    <FriendGardenVisit friend={result.friend} snapshot={result.snapshot} />
  );
}
