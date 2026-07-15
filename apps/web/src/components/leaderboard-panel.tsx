"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

type Row = {
  userId: string;
  name: string;
  displayName: string | null;
  dayScore: number;
  wins: number;
};

export function LeaderboardPanel({ signedIn }: { signedIn: boolean }) {
  const [scope, setScope] = useState<"global" | "friends">("global");
  const [rows, setRows] = useState<Row[]>([]);
  const [dateKey, setDateKey] = useState("");
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function load() {
      setError(null);
      if (scope === "friends" && !signedIn) {
        setRows([]);
        setError("Sign in to see friend ranks.");
        return;
      }
      const res = await fetch(
        `/api/social?view=leaderboard&scope=${scope}`,
      );
      if (!res.ok) {
        setError("Could not load leaderboard.");
        return;
      }
      const data = await res.json();
      setRows(data.rows ?? []);
      setDateKey(data.dateKey ?? "");
    }
    void load();
  }, [scope, signedIn]);

  return (
    <div className="mx-auto max-w-xl animate-rise space-y-6">
      <div>
        <p className="text-xs uppercase tracking-[0.22em] text-ember">
          {dateKey || "Today"}
        </p>
        <h1 className="mt-1 font-[family-name:var(--font-display)] text-4xl font-bold">
          Ranks
        </h1>
        <p className="mt-2 text-fog">
          Combined points from today’s Word Daily and Case File clears.
        </p>
      </div>

      <div className="flex gap-2">
        <ScopeButton
          active={scope === "global"}
          onClick={() => setScope("global")}
          label="Global"
        />
        <ScopeButton
          active={scope === "friends"}
          onClick={() => setScope("friends")}
          label="Friends"
        />
      </div>

      {error && (
        <p className="text-sm text-fog">
          {error}{" "}
          {!signedIn && (
            <Link href="/auth" className="text-ember hover:underline">
              Sign in
            </Link>
          )}
        </p>
      )}

      <div className="space-y-2">
        {rows.length === 0 && !error && (
          <p className="rounded-xl border border-[var(--line)] bg-panel/50 px-4 py-6 text-center text-sm text-fog">
            No scores yet today. Be first.
          </p>
        )}
        {rows.map((row, index) => (
          <div
            key={row.userId}
            className="flex items-center gap-4 rounded-xl border border-[var(--line)] bg-ink-2/70 px-4 py-3"
          >
            <div className="w-8 font-[family-name:var(--font-display)] text-xl font-bold text-ember">
              {index + 1}
            </div>
            <div className="flex-1">
              <div className="font-semibold">
                {row.displayName || row.name}
              </div>
              <div className="text-xs text-fog">{row.wins} wins today</div>
            </div>
            <div className="font-[family-name:var(--font-display)] text-xl font-bold">
              {row.dayScore}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function ScopeButton({
  active,
  onClick,
  label,
}: {
  active: boolean;
  onClick: () => void;
  label: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={[
        "rounded-lg px-4 py-2 text-sm font-semibold transition",
        active
          ? "bg-ember text-on-ember"
          : "border border-[var(--line)] text-fog hover:text-paper",
      ].join(" ")}
    >
      {label}
    </button>
  );
}
