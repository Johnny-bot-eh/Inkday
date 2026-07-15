"use client";

import { useState } from "react";
import Link from "next/link";
import {
  PREMIUM_CHALLENGES,
  PREMIUM_PERKS,
  type NotificationPrefView,
  type PremiumStatusView,
} from "@daily-puzzle/puzzle-core";

type Props = {
  premium: PremiumStatusView;
  notifications: NotificationPrefView;
};

export function AccountPanels({ premium: initialPremium, notifications: initialPrefs }: Props) {
  const [premium, setPremium] = useState(initialPremium);
  const [prefs, setPrefs] = useState(initialPrefs);
  const [code, setCode] = useState("");
  const [message, setMessage] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function post(body: Record<string, unknown>) {
    setBusy(true);
    setMessage(null);
    try {
      const res = await fetch("/api/account", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const data = await res.json();
      if (!res.ok) {
        setMessage(data.error ?? "Request failed");
        return null;
      }
      return data;
    } finally {
      setBusy(false);
    }
  }

  async function redeem() {
    const data = await post({ action: "redeem_promo", code });
    if (data?.premium) {
      setPremium(data.premium);
      setMessage("Inkday Plus activated for 30 days.");
      setCode("");
    }
  }

  async function savePrefs() {
    const data = await post({
      action: "update_notifications",
      notifications: prefs,
    });
    if (data?.notifications) {
      setPrefs(data.notifications);
      setMessage("Notification preferences saved.");
    }
  }

  async function claimFreeze() {
    const data = await post({ action: "claim_streak_freeze" });
    if (data?.ok) {
      setPremium((p) => ({ ...p, streakFreezeAvailable: false }));
      setMessage(
        `Streak freeze claimed — protected through ${data.protectedThrough}.`,
      );
    }
  }

  return (
    <div className="space-y-8">
      <section className="rounded-2xl border border-[var(--line)] bg-ink-2/70 p-5">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <h2 className="font-[family-name:var(--font-display)] text-xl font-bold">
              Inkday Plus
            </h2>
            <p className="mt-1 text-sm text-fog">
              {premium.active
                ? `Active${premium.endsAt ? ` until ${premium.endsAt.slice(0, 10)}` : ""}`
                : "Free plan — redeem a promo to preview Plus (payments later)."}
            </p>
          </div>
          {premium.active && (
            <span className="rounded-md border border-ember/40 bg-ember/15 px-2.5 py-1 text-xs font-semibold text-ember">
              Plus
            </span>
          )}
        </div>

        <ul className="mt-4 grid gap-2 sm:grid-cols-2">
          {PREMIUM_PERKS.map((perk) => (
            <li
              key={perk.id}
              className="rounded-xl border border-[var(--line)] bg-panel/40 px-3 py-3 text-sm"
            >
              <div className="font-semibold">{perk.title}</div>
              <div className="mt-1 text-xs text-fog">{perk.description}</div>
            </li>
          ))}
        </ul>

        {premium.active ? (
          <div className="mt-4 space-y-3">
            <div className="grid gap-2 sm:grid-cols-2">
              {PREMIUM_CHALLENGES.map((challenge) => (
                <Link
                  key={challenge.id}
                  href={challenge.href}
                  className="rounded-lg border border-ember/35 bg-ember/10 px-3 py-2 text-sm font-semibold text-ember hover:bg-ember/15"
                >
                  {challenge.title} →
                </Link>
              ))}
            </div>
            <button
              type="button"
              disabled={busy || !premium.streakFreezeAvailable}
              onClick={() => void claimFreeze()}
              className="rounded-lg border border-[var(--line)] px-4 py-2 text-sm font-semibold text-paper hover:bg-white/5 disabled:opacity-50"
            >
              {premium.streakFreezeAvailable
                ? "Claim weekly streak freeze"
                : "Streak freeze used this week"}
            </button>
          </div>
        ) : (
          <div className="mt-4 flex flex-wrap gap-2">
            <input
              value={code}
              onChange={(e) => setCode(e.target.value)}
              placeholder="Promo code"
              className="min-w-[10rem] flex-1 rounded-lg border border-[var(--line)] bg-ink-2 px-3 py-2 text-sm outline-none ring-ember/40 focus:ring-2"
            />
            <button
              type="button"
              disabled={busy || !code.trim()}
              onClick={() => void redeem()}
              className="rounded-lg bg-ember px-4 py-2 text-sm font-semibold text-on-ember disabled:opacity-50"
            >
              Redeem
            </button>
          </div>
        )}
      </section>

      <section className="rounded-2xl border border-[var(--line)] bg-ink-2/70 p-5">
        <h2 className="font-[family-name:var(--font-display)] text-xl font-bold">
          Notifications
        </h2>
        <p className="mt-1 text-sm text-fog">
          Preferences for future email/push delivery. A cron outbox is ready;
          mail provider wiring comes next.
        </p>

        <div className="mt-4 space-y-3">
          {(
            [
              ["emailEnabled", "Allow email notifications"],
              ["dailyReminder", "Daily puzzle reminder"],
              ["streakAtRisk", "Streak-at-risk nudge"],
              ["friendChallenge", "Friend challenge alerts"],
              ["tournamentResult", "Weekly tournament results"],
              ["seasonStart", "Season start announcements"],
            ] as const
          ).map(([key, label]) => (
            <label
              key={key}
              className="flex items-center justify-between gap-3 text-sm"
            >
              <span>{label}</span>
              <input
                type="checkbox"
                checked={prefs[key]}
                onChange={(e) =>
                  setPrefs((p) => ({ ...p, [key]: e.target.checked }))
                }
                className="h-4 w-4 accent-[var(--ember,#e07a2f)]"
              />
            </label>
          ))}
          <label className="flex items-center justify-between gap-3 text-sm">
            <span>Preferred UTC hour</span>
            <input
              type="number"
              min={0}
              max={23}
              value={prefs.reminderHourUtc}
              onChange={(e) =>
                setPrefs((p) => ({
                  ...p,
                  reminderHourUtc: Number(e.target.value),
                }))
              }
              className="w-20 rounded-lg border border-[var(--line)] bg-ink-2 px-2 py-1.5 text-sm"
            />
          </label>
        </div>

        <button
          type="button"
          disabled={busy}
          onClick={() => void savePrefs()}
          className="mt-4 rounded-lg bg-ember px-4 py-2 text-sm font-semibold text-on-ember disabled:opacity-50"
        >
          Save preferences
        </button>
      </section>

      {message && (
        <p className="rounded-lg bg-mint/15 px-3 py-2 text-sm text-mint">
          {message}
        </p>
      )}
    </div>
  );
}
