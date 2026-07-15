import Link from "next/link";
import { ProfileView } from "@/components/profile-view";
import { getProfile } from "@/lib/game-service";
import { getSession } from "@/lib/session";

export default async function ProfilePage() {
  const session = await getSession();
  if (!session?.user) {
    return (
      <div className="mx-auto max-w-md text-center animate-rise">
        <h1 className="font-[family-name:var(--font-display)] text-3xl font-bold">
          Profile
        </h1>
        <p className="mt-2 text-fog">Sign in to track streaks and scores.</p>
        <Link
          href="/auth"
          className="mt-6 inline-block rounded-lg bg-ember px-5 py-2.5 font-semibold text-on-ember"
        >
          Sign in
        </Link>
      </div>
    );
  }

  const { user, stats, recent } = await getProfile(session.user.id);
  if (!user) return null;

  return (
    <ProfileView
      user={{
        name: user.name,
        email: user.email,
        displayName: user.displayName,
      }}
      stats={stats}
      recent={recent}
    />
  );
}
