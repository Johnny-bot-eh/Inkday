import Link from "next/link";
import { ProfileView } from "@/components/profile-view";
import { AccountPanels } from "@/components/account-panels";
import { getProfile } from "@/lib/game-service";
import { getSession } from "@/lib/session";
import {
  DEFAULT_NOTIFICATION_PREFS,
  type PremiumStatusView,
} from "@daily-puzzle/puzzle-core";

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

  const profile = await getProfile(session.user.id);
  if (!profile.user) return null;
  const { user, stats, recent, insights, premium, notifications } = profile;

  const premiumView: PremiumStatusView = premium ?? {
    active: false,
    tier: null,
    source: null,
    endsAt: null,
    streakFreezeAvailable: false,
  };

  return (
    <div className="space-y-10">
      <ProfileView
        user={{
          name: user.name,
          email: user.email,
          displayName: user.displayName,
        }}
        stats={stats}
        insights={insights}
        recent={recent}
        isPlus={premiumView.active}
      />
      <AccountPanels
        premium={premiumView}
        notifications={notifications ?? DEFAULT_NOTIFICATION_PREFS}
      />
    </div>
  );
}
