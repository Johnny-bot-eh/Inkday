import Link from "next/link";
import { redirect } from "next/navigation";
import { claimFriendInvite, getInvitePreview } from "@/lib/game-service";
import { getSession } from "@/lib/session";

type Props = {
  params: Promise<{ userId: string }>;
};

export default async function InvitePage({ params }: Props) {
  const { userId: inviterId } = await params;
  const preview = await getInvitePreview(inviterId);

  if (!preview) {
    return (
      <div className="mx-auto max-w-md animate-rise text-center">
        <h1 className="font-[family-name:var(--font-display)] text-3xl font-bold">
          Invite not found
        </h1>
        <p className="mt-2 text-fog">
          This invite link is invalid or the player no longer exists.
        </p>
        <Link
          href="/"
          className="mt-6 inline-block rounded-lg bg-ember px-5 py-2.5 font-semibold text-on-ember"
        >
          Play today →
        </Link>
      </div>
    );
  }

  const session = await getSession();

  if (session?.user) {
    if (session.user.id === inviterId) {
      redirect("/friends");
    }
    await claimFriendInvite(session.user.id, inviterId);
    redirect("/friends?invited=1");
  }

  const authHref = `/auth?invite=${encodeURIComponent(inviterId)}&mode=signup`;

  return (
    <div className="mx-auto max-w-md animate-rise text-center">
      <p className="text-xs uppercase tracking-[0.22em] text-ember">Invite</p>
      <h1 className="mt-2 font-[family-name:var(--font-display)] text-4xl font-bold tracking-tight">
        {preview.name} invited you
      </h1>
      <p className="mt-3 text-fog">
        Join Inkday for daily puzzles, streaks, and friend challenges. After you
        create an account you’ll be friends automatically.
      </p>
      <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:justify-center">
        <Link
          href={authHref}
          className="rounded-lg bg-ember px-5 py-2.5 font-semibold text-on-ember transition hover:bg-ember-deep"
        >
          Create account
        </Link>
        <Link
          href={`/auth?invite=${encodeURIComponent(inviterId)}`}
          className="rounded-lg border border-[var(--line)] px-5 py-2.5 font-semibold text-paper transition hover:bg-white/5"
        >
          Sign in
        </Link>
      </div>
      <p className="mt-6 text-sm">
        <Link href="/" className="text-fog hover:text-paper">
          ← Browse today without an account
        </Link>
      </p>
    </div>
  );
}
