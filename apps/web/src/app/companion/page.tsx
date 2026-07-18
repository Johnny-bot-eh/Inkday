import Link from "next/link";
import { CompanionClient } from "@/components/companion-client";
import { getCompanionSnapshot } from "@/lib/pet-service";
import { getSession } from "@/lib/session";

export default async function CompanionPage() {
  const session = await getSession();
  const snapshot = session?.user
    ? await getCompanionSnapshot(session.user.id)
    : null;

  return (
    <div className="space-y-4">
      <CompanionClient
        signedIn={Boolean(session?.user)}
        initial={snapshot}
      />
      {session?.user ? (
        <p className="mx-auto max-w-3xl text-center text-xs text-fog">
          Pets never die or lose XP. Happiness only softens visuals and gifts.{" "}
          <Link href="/" className="text-ember hover:underline">
            Back to today
          </Link>
        </p>
      ) : null}
    </div>
  );
}
