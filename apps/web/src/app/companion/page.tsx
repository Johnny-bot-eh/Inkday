import Link from "next/link";
import { CompanionClient } from "@/components/companion-client";
import { getCompanionSnapshot } from "@/lib/pet-service";
import { getSession } from "@/lib/session";

export default async function CompanionPage() {
  const session = await getSession();
  let snapshot = null;
  let loadError: string | null = null;

  if (session?.user) {
    try {
      snapshot = await getCompanionSnapshot(session.user.id);
    } catch (err) {
      console.error("Companion snapshot failed", err);
      loadError =
        "Garden is updating — try refresh in a moment. If it keeps failing, run db migrate.";
    }
  }

  return (
    <div className="space-y-4">
      {loadError ? (
        <p className="mx-auto max-w-3xl rounded-xl border border-ember/40 bg-ember/10 px-4 py-3 text-sm">
          {loadError}
        </p>
      ) : null}
      <CompanionClient
        signedIn={Boolean(session?.user)}
        initial={snapshot}
      />
      {session?.user ? (
        <p className="mx-auto max-w-3xl text-center text-xs text-fog">
          <Link href="/" className="text-ember hover:underline">
            Back to today
          </Link>
        </p>
      ) : null}
    </div>
  );
}
