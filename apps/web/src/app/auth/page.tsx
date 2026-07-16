"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Suspense, useEffect, useState } from "react";
import { authClient } from "@/lib/auth-client";

const INVITE_STORAGE_KEY = "inkday-invite";

async function claimPendingInvite(inviterId: string) {
  try {
    await fetch("/api/social", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "claim_invite", inviterId }),
    });
  } catch {
    // Redirect still proceeds; invite page can retry.
  }
  try {
    window.localStorage.removeItem(INVITE_STORAGE_KEY);
  } catch {
    // ignore
  }
}

function AuthForm() {
  const searchParams = useSearchParams();
  const inviteFromUrl = searchParams.get("invite");
  const modeParam = searchParams.get("mode");

  const [mode, setMode] = useState<"signin" | "signup">(
    modeParam === "signup" ? "signup" : "signin",
  );
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [inviteId, setInviteId] = useState<string | null>(inviteFromUrl);

  useEffect(() => {
    if (inviteFromUrl) {
      setInviteId(inviteFromUrl);
      try {
        window.localStorage.setItem(INVITE_STORAGE_KEY, inviteFromUrl);
      } catch {
        // ignore
      }
      return;
    }
    try {
      const stored = window.localStorage.getItem(INVITE_STORAGE_KEY);
      if (stored) setInviteId(stored);
    } catch {
      // ignore
    }
  }, [inviteFromUrl]);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      if (mode === "signup") {
        const res = await authClient.signUp.email({
          name: name.trim() || email.split("@")[0]!,
          email: email.trim().toLowerCase(),
          password,
        });
        if (res.error && !res.data) {
          throw new Error(res.error.message ?? "Sign up failed");
        }
      } else {
        const res = await authClient.signIn.email({
          email: email.trim().toLowerCase(),
          password,
        });
        if (res.error && !res.data) {
          throw new Error(res.error.message ?? "Sign in failed");
        }
      }

      if (inviteId) {
        await claimPendingInvite(inviteId);
        window.location.assign("/friends?invited=1");
        return;
      }

      // Full navigation avoids soft-nav swallowing a home RSC error as "Error" on this form.
      window.location.assign("/");
      return;
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "Something went wrong";
      setError(
        /failed to fetch/i.test(message)
          ? "Couldn’t reach the auth server. Open Inkday in Chrome or Safari (not Cursor’s preview), confirm Vercel Deployment Protection is off for Production, then try again."
          : message,
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="mx-auto max-w-md animate-rise">
      <h1 className="font-[family-name:var(--font-display)] text-4xl font-bold tracking-tight">
        {mode === "signin" ? "Welcome back" : "Join Inkday"}
      </h1>
      <p className="mt-2 text-fog">
        {inviteId
          ? "Finish signing in to accept your friend invite."
          : "Accounts unlock streaks, friends, and leaderboards."}
      </p>

      <form
        onSubmit={onSubmit}
        className="mt-8 space-y-4 rounded-2xl border border-[var(--line)] bg-panel/70 p-6 shadow-[0_20px_60px_rgba(0,0,0,0.25)]"
      >
        {mode === "signup" && (
          <label className="block space-y-1.5 text-sm">
            <span className="text-fog">Display name</span>
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full rounded-lg border border-[var(--line)] bg-ink-2 px-3 py-2.5 outline-none ring-ember/40 focus:ring-2"
              placeholder="Detective name"
              autoComplete="nickname"
            />
          </label>
        )}
        <label className="block space-y-1.5 text-sm">
          <span className="text-fog">Email</span>
          <input
            type="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full rounded-lg border border-[var(--line)] bg-ink-2 px-3 py-2.5 outline-none ring-ember/40 focus:ring-2"
            autoComplete="email"
          />
        </label>
        <label className="block space-y-1.5 text-sm">
          <span className="text-fog">Password</span>
          <input
            type="password"
            required
            minLength={8}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full rounded-lg border border-[var(--line)] bg-ink-2 px-3 py-2.5 outline-none ring-ember/40 focus:ring-2"
            autoComplete={mode === "signin" ? "current-password" : "new-password"}
          />
        </label>

        {error && (
          <p className="rounded-lg bg-danger/15 px-3 py-2 text-sm text-danger">
            {error}
          </p>
        )}

        <button
          type="submit"
          disabled={loading}
          className="w-full rounded-lg bg-ember py-2.5 font-semibold text-on-ember transition hover:bg-ember-deep disabled:opacity-60"
        >
          {loading ? "Working…" : mode === "signin" ? "Sign in" : "Create account"}
        </button>
      </form>

      <p className="mt-4 text-center text-sm text-fog">
        {mode === "signin" ? "New here?" : "Already have an account?"}{" "}
        <button
          type="button"
          className="font-semibold text-ember hover:underline"
          onClick={() => setMode(mode === "signin" ? "signup" : "signin")}
        >
          {mode === "signin" ? "Create one" : "Sign in"}
        </button>
      </p>
      <p className="mt-6 text-center text-sm">
        <Link href="/" className="text-fog hover:text-paper">
          ← Back to today
        </Link>
      </p>
    </div>
  );
}

export default function AuthPage() {
  return (
    <Suspense
      fallback={
        <div className="mx-auto max-w-md animate-rise text-fog">Loading…</div>
      }
    >
      <AuthForm />
    </Suspense>
  );
}
