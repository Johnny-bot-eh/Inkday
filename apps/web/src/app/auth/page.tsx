"use client";

import Link from "next/link";
import { useState } from "react";
import { authClient } from "@/lib/auth-client";
import { useRouter } from "next/navigation";

export default function AuthPage() {
  const router = useRouter();
  const [mode, setMode] = useState<"signin" | "signup">("signin");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

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
        if (res.error) throw new Error(res.error.message ?? "Sign up failed");
      } else {
        const res = await authClient.signIn.email({
          email: email.trim().toLowerCase(),
          password,
        });
        if (res.error) throw new Error(res.error.message ?? "Sign in failed");
      }
      router.push("/");
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
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
        Accounts unlock streaks, friends, and leaderboards.
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
