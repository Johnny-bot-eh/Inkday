"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

type Friendship = {
  id: string;
  status: string;
  incoming: boolean;
  other: {
    id: string;
    name: string;
    email: string;
    displayName: string | null;
  } | null;
};

export function FriendsPanel({ signedIn }: { signedIn: boolean }) {
  const [friendships, setFriendships] = useState<Friendship[]>([]);
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function load() {
    const res = await fetch("/api/social?view=friends");
    if (!res.ok) return;
    const data = await res.json();
    setFriendships(data.friendships ?? []);
  }

  useEffect(() => {
    if (signedIn) void load();
  }, [signedIn]);

  if (!signedIn) {
    return (
      <div className="mx-auto max-w-md text-center animate-rise">
        <h1 className="font-[family-name:var(--font-display)] text-3xl font-bold">
          Friends
        </h1>
        <p className="mt-2 text-fog">
          Add friends to compare daily ranks side by side.
        </p>
        <Link
          href="/auth"
          className="mt-6 inline-block rounded-lg bg-ember px-5 py-2.5 font-semibold text-on-ember"
        >
          Sign in
        </Link>
      </div>
    );
  }

  async function requestFriend(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setMessage(null);
    try {
      const res = await fetch("/api/social", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "request", email }),
      });
      const data = await res.json();
      if (!res.ok) {
        setMessage(
          data.error === "not_found"
            ? "No player with that email yet."
            : data.error === "self"
              ? "That’s you."
              : data.error === "exists"
                ? "Already requested or friends."
                : data.error,
        );
        return;
      }
      setEmail("");
      setMessage("Invite sent.");
      await load();
    } finally {
      setLoading(false);
    }
  }

  async function respond(id: string, accept: boolean) {
    await fetch("/api/social", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "respond", friendshipId: id, accept }),
    });
    await load();
  }

  const pending = friendships.filter(
    (f) => f.status === "pending" && f.incoming,
  );
  const outgoing = friendships.filter(
    (f) => f.status === "pending" && !f.incoming,
  );
  const accepted = friendships.filter((f) => f.status === "accepted");

  return (
    <div className="mx-auto max-w-xl animate-rise space-y-8">
      <div>
        <h1 className="font-[family-name:var(--font-display)] text-4xl font-bold">
          Friends
        </h1>
        <p className="mt-2 text-fog">
          Invite by email, then check the Friends leaderboard.
        </p>
      </div>

      <form
        onSubmit={requestFriend}
        className="flex flex-col gap-2 rounded-2xl border border-[var(--line)] bg-panel/60 p-4 sm:flex-row"
      >
        <input
          type="email"
          required
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="friend@email.com"
          className="flex-1 rounded-lg border border-[var(--line)] bg-ink-2 px-3 py-2.5 outline-none ring-ember/40 focus:ring-2"
        />
        <button
          type="submit"
          disabled={loading}
          className="rounded-lg bg-ember px-4 py-2.5 font-semibold text-on-ember hover:bg-ember-deep disabled:opacity-60"
        >
          Invite
        </button>
      </form>
      {message && <p className="text-sm text-fog">{message}</p>}

      {pending.length > 0 && (
        <section className="space-y-2">
          <h2 className="text-sm uppercase tracking-wider text-ember">
            Incoming
          </h2>
          {pending.map((f) => (
            <div
              key={f.id}
              className="flex items-center justify-between rounded-xl border border-[var(--line)] bg-ink-2/80 px-4 py-3"
            >
              <span>{f.other?.displayName || f.other?.name}</span>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => respond(f.id, true)}
                  className="rounded-md bg-mint/20 px-3 py-1 text-sm text-mint"
                >
                  Accept
                </button>
                <button
                  type="button"
                  onClick={() => respond(f.id, false)}
                  className="rounded-md px-3 py-1 text-sm text-fog"
                >
                  Decline
                </button>
              </div>
            </div>
          ))}
        </section>
      )}

      {accepted.length > 0 && (
        <section className="space-y-2">
          <h2 className="text-sm uppercase tracking-wider text-ember">
            Connected
          </h2>
          {accepted.map((f) => (
            <div
              key={f.id}
              className="rounded-xl border border-[var(--line)] bg-panel/50 px-4 py-3"
            >
              {f.other?.displayName || f.other?.name}
              <div className="text-xs text-fog">{f.other?.email}</div>
            </div>
          ))}
        </section>
      )}

      {outgoing.length > 0 && (
        <section className="space-y-2">
          <h2 className="text-sm uppercase tracking-wider text-fog">
            Pending outbound
          </h2>
          {outgoing.map((f) => (
            <div
              key={f.id}
              className="rounded-xl border border-[var(--line)] px-4 py-3 text-sm text-fog"
            >
              Waiting on {f.other?.displayName || f.other?.name}
            </div>
          ))}
        </section>
      )}

      {accepted.length === 0 && pending.length === 0 && (
        <p className="text-sm text-fog">No friends yet — send an invite above.</p>
      )}
    </div>
  );
}
