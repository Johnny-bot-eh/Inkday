"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { todayKey, type Difficulty, type PuzzleType } from "@daily-puzzle/puzzle-core";
import { AvatarMark } from "@/components/avatar-mark";

type Friendship = {
  id: string;
  status: string;
  incoming: boolean;
  other: {
    id: string;
    name: string;
    email: string;
    displayName: string | null;
    equippedAvatarId?: string | null;
  } | null;
};

type Challenge = {
  id: string;
  status: string;
  puzzleType: PuzzleType;
  difficulty: Difficulty;
  dateKey: string;
  incoming: boolean;
  challengerScore: number | null;
  opponentScore: number | null;
  winnerId: string | null;
  href: string;
  other: { id: string; name: string } | null;
};

const CHALLENGE_OPTIONS: Array<{
  puzzleType: PuzzleType;
  difficulty: Difficulty;
  label: string;
}> = [
  { puzzleType: "wordle", difficulty: "medium", label: "Word Daily" },
  { puzzleType: "escape", difficulty: "hard", label: "Detective Hard" },
  { puzzleType: "logic", difficulty: "medium", label: "Logic Medium" },
  { puzzleType: "path", difficulty: "medium", label: "Path Medium" },
  { puzzleType: "anagram", difficulty: "medium", label: "Anagram Medium" },
  { puzzleType: "cryptogram", difficulty: "medium", label: "Cryptogram Medium" },
  { puzzleType: "acrostic", difficulty: "medium", label: "Acrostic Medium" },
  { puzzleType: "wordladder", difficulty: "medium", label: "Word Ladder Medium" },
];

export function FriendsPanel({
  signedIn,
  userId,
  invited,
}: {
  signedIn: boolean;
  userId: string | null;
  invited?: boolean;
}) {
  const [friendships, setFriendships] = useState<Friendship[]>([]);
  const [challenges, setChallenges] = useState<Challenge[]>([]);
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState<string | null>(
    invited ? "You’re friends now — say hi with a challenge." : null,
  );
  const [loading, setLoading] = useState(false);
  const [challengeTarget, setChallengeTarget] = useState<string | null>(null);
  const [challengePick, setChallengePick] = useState(CHALLENGE_OPTIONS[0]!.label);
  const [copied, setCopied] = useState(false);
  const [inviteUrl, setInviteUrl] = useState(
    userId ? `/invite/${userId}` : null,
  );

  useEffect(() => {
    if (!userId) return;
    setInviteUrl(`${window.location.origin}/invite/${userId}`);
  }, [userId]);

  async function copyInviteLink() {
    if (!userId) return;
    const url = `${window.location.origin}/invite/${userId}`;
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      setMessage("Invite link copied.");
      window.setTimeout(() => setCopied(false), 2000);
    } catch {
      setMessage(url);
    }
  }

  async function load() {
    const res = await fetch("/api/social?view=friends");
    if (!res.ok) return;
    const data = await res.json();
    setFriendships(data.friendships ?? []);
    setChallenges(data.challenges ?? []);
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
          Add friends, send puzzle challenges, and compete on weekly ladders.
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

  async function sendChallenge(opponentId: string) {
    const pick =
      CHALLENGE_OPTIONS.find((o) => o.label === challengePick) ??
      CHALLENGE_OPTIONS[0]!;
    setLoading(true);
    setMessage(null);
    try {
      const res = await fetch("/api/social", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "challenge",
          opponentId,
          puzzleType: pick.puzzleType,
          difficulty: pick.difficulty,
          dateKey: todayKey(),
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setMessage(
          data.error === "exists"
            ? "Challenge already open for that board today."
            : data.error === "not_friends"
              ? "You can only challenge friends."
              : data.error,
        );
        return;
      }
      setMessage(`Challenge sent: ${pick.label}`);
      setChallengeTarget(null);
      await load();
    } finally {
      setLoading(false);
    }
  }

  async function respondChallenge(id: string, accept: boolean) {
    await fetch("/api/social", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        action: "challenge_respond",
        challengeId: id,
        accept,
      }),
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
  const openChallenges = challenges.filter((c) =>
    ["pending", "active"].includes(c.status),
  );
  const doneChallenges = challenges.filter((c) => c.status === "completed");

  return (
    <div className="mx-auto max-w-xl animate-rise space-y-8">
      <div>
        <h1 className="font-[family-name:var(--font-display)] text-4xl font-bold">
          Friends
        </h1>
        <p className="mt-2 text-fog">
          Invite friends, challenge them to today’s boards, and battle on weekly
          tournaments.
        </p>
      </div>

      {userId && (
        <div className="rounded-2xl border border-[var(--line)] bg-panel/60 p-4">
          <p className="text-xs uppercase tracking-[0.2em] text-ember">
            Invite link
          </p>
          <p className="mt-2 text-sm text-fog">
            Share this link — anyone who joins (or signs in) becomes your friend
            automatically.
          </p>
          <div className="mt-3 flex flex-col gap-2 sm:flex-row sm:items-center">
            <code className="flex-1 truncate rounded-lg border border-[var(--line)] bg-ink-2 px-3 py-2.5 text-xs text-paper">
              {inviteUrl}
            </code>
            <button
              type="button"
              onClick={() => void copyInviteLink()}
              className="rounded-lg bg-ember px-4 py-2.5 font-semibold text-on-ember hover:bg-ember-deep"
            >
              {copied ? "Copied" : "Copy link"}
            </button>
          </div>
        </div>
      )}

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

      {openChallenges.length > 0 && (
        <section className="space-y-2">
          <h2 className="text-sm uppercase tracking-wider text-ember">
            Active challenges
          </h2>
          {openChallenges.map((c) => (
            <div
              key={c.id}
              className="rounded-xl border border-[var(--line)] bg-ink-2/80 px-4 py-3"
            >
              <div className="font-semibold">
                {c.incoming ? "From" : "To"} {c.other?.name} · {c.puzzleType}{" "}
                {c.difficulty}
              </div>
              <div className="mt-1 text-xs text-fog">
                {c.status === "pending" && c.incoming
                  ? "Accept to open the duel"
                  : c.status === "pending"
                    ? "Waiting for them to accept"
                    : "Both play today’s board — highest score wins"}
              </div>
              <div className="mt-2 flex flex-wrap gap-2">
                {c.status === "pending" && c.incoming && (
                  <>
                    <button
                      type="button"
                      onClick={() => void respondChallenge(c.id, true)}
                      className="rounded-md bg-mint/20 px-3 py-1 text-sm text-mint"
                    >
                      Accept
                    </button>
                    <button
                      type="button"
                      onClick={() => void respondChallenge(c.id, false)}
                      className="rounded-md px-3 py-1 text-sm text-fog"
                    >
                      Decline
                    </button>
                  </>
                )}
                {(c.status === "active" ||
                  (c.status === "pending" && !c.incoming)) && (
                  <Link
                    href={c.href}
                    className="rounded-md bg-ember/20 px-3 py-1 text-sm text-ember"
                  >
                    Play board →
                  </Link>
                )}
              </div>
            </div>
          ))}
        </section>
      )}

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
              <span className="inline-flex items-center gap-2">
                <AvatarMark avatarId={f.other?.equippedAvatarId} size={28} />
                {f.other?.displayName || f.other?.name}
              </span>
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
          <div className="mb-2 flex flex-wrap gap-2">
            <select
              value={challengePick}
              onChange={(e) => setChallengePick(e.target.value)}
              className="rounded-lg border border-[var(--line)] bg-ink-2 px-3 py-2 text-sm"
            >
              {CHALLENGE_OPTIONS.map((o) => (
                <option key={o.label} value={o.label}>
                  {o.label}
                </option>
              ))}
            </select>
          </div>
          {accepted.map((f) => (
            <div
              key={f.id}
              className="flex flex-wrap items-center justify-between gap-2 rounded-xl border border-[var(--line)] bg-panel/50 px-4 py-3"
            >
              <div className="flex items-center gap-3">
                <AvatarMark avatarId={f.other?.equippedAvatarId} size={36} />
                <div>
                  <div>{f.other?.displayName || f.other?.name}</div>
                  <div className="text-xs text-fog">{f.other?.email}</div>
                </div>
              </div>
              {f.other && (
                <button
                  type="button"
                  disabled={loading}
                  onClick={() => {
                    setChallengeTarget(f.other!.id);
                    void sendChallenge(f.other!.id);
                  }}
                  className="rounded-lg border border-ember/40 px-3 py-1.5 text-sm text-ember hover:bg-ember/10"
                >
                  {challengeTarget === f.other.id ? "Sending…" : "Challenge"}
                </button>
              )}
            </div>
          ))}
        </section>
      )}

      {doneChallenges.length > 0 && (
        <section className="space-y-2">
          <h2 className="text-sm uppercase tracking-wider text-fog">
            Recent results
          </h2>
          {doneChallenges.slice(0, 6).map((c) => (
            <div
              key={c.id}
              className="rounded-xl border border-[var(--line)] px-4 py-3 text-sm"
            >
              vs {c.other?.name} · {c.puzzleType} {c.difficulty}
              <div className="text-xs text-fog">
                {c.challengerScore ?? "—"} – {c.opponentScore ?? "—"}
                {c.winnerId
                  ? c.winnerId === c.other?.id
                    ? " · They won"
                    : " · You won"
                  : " · Draw"}
              </div>
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
