"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import type { LeaderboardPeriod } from "@daily-puzzle/puzzle-core";

type Row = {
  userId: string;
  name: string;
  displayName: string | null;
  dayScore: number;
  wins: number;
};

type Scope = "global" | "friends";

const PERIOD_LABELS: Record<LeaderboardPeriod, string> = {
  day: "Today",
  week: "Week",
  month: "Month",
};

const WINS_LABEL: Record<LeaderboardPeriod, string> = {
  day: "wins today",
  week: "wins this week",
  month: "wins this month",
};

const EMPTY_LABEL: Record<LeaderboardPeriod, string> = {
  day: "No scores yet today. Be first.",
  week: "No scores this week yet.",
  month: "No scores this month yet.",
};

export function LeaderboardPanel({ signedIn }: { signedIn: boolean }) {
  const [scope, setScope] = useState<Scope>("global");
  const [period, setPeriod] = useState<LeaderboardPeriod>("day");
  const [rows, setRows] = useState<Row[]>([]);
  const [rangeLabel, setRangeLabel] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [tournamentNote, setTournamentNote] = useState<string | null>(null);
  const [myAwards, setMyAwards] = useState<
    Array<{
      badge: string;
      weekStart: string;
      place: number;
      bonusPoints: number;
      scope: string;
    }>
  >([]);

  useEffect(() => {
    async function load() {
      setError(null);
      if (scope === "friends" && !signedIn) {
        setRows([]);
        setError("Sign in to see friend ranks.");
        return;
      }
      const res = await fetch(
        `/api/social?view=leaderboard&scope=${scope}&period=${period}`,
      );
      if (!res.ok) {
        setError("Could not load leaderboard.");
        return;
      }
      const data = await res.json();
      setRows(data.rows ?? []);
      setRangeLabel(data.rangeLabel ?? data.dateKey ?? "");
      setMyAwards(data.myAwards ?? []);
      if (data.tournament?.settled && (data.tournament.awards?.length ?? 0) > 0) {
        setTournamentNote(
          `Tournament settled for week of ${data.tournament.weekStart}: ${data.tournament.awards
            .map(
              (a: { badge: string; bonusPoints: number }) =>
                `${a.badge}${a.bonusPoints ? ` (+${a.bonusPoints} pts)` : ""}`,
            )
            .join(" · ")}`,
        );
      } else if (period === "week") {
        setTournamentNote(
          "Weekly tournament: points stack Mon–Sun UTC. When the week closes, top 3 earn badges + bonus points.",
        );
      } else {
        setTournamentNote(null);
      }
    }
    void load();
  }, [scope, period, signedIn]);

  return (
    <div className="mx-auto max-w-xl animate-rise space-y-6">
      <div>
        <p className="text-xs uppercase tracking-[0.22em] text-ember">
          {rangeLabel || "Ranks"}
        </p>
        <h1 className="mt-1 font-[family-name:var(--font-display)] text-4xl font-bold">
          Leaderboards
        </h1>
        <p className="mt-2 text-fog">
          Combined points from Word, Escape, Logic, and Path — global or friends,
          by day, week, or month.
        </p>
      </div>

      <div className="flex flex-wrap gap-2">
        <TabButton
          active={scope === "global"}
          onClick={() => setScope("global")}
          label="Global"
        />
        <TabButton
          active={scope === "friends"}
          onClick={() => setScope("friends")}
          label="Friends"
        />
      </div>

      <div className="flex flex-wrap gap-2">
        {(Object.keys(PERIOD_LABELS) as LeaderboardPeriod[]).map((p) => (
          <TabButton
            key={p}
            active={period === p}
            onClick={() => setPeriod(p)}
            label={PERIOD_LABELS[p]}
          />
        ))}
      </div>

      {tournamentNote && (
        <p className="rounded-xl border border-ember/30 bg-ember/10 px-4 py-3 text-sm">
          {tournamentNote}
        </p>
      )}

      {myAwards.length > 0 && (
        <div className="rounded-xl border border-[var(--line)] bg-panel/60 px-4 py-3 text-sm">
          <div className="text-xs uppercase tracking-wider text-ember">
            Your tournament badges
          </div>
          <ul className="mt-2 space-y-1">
            {myAwards.map((a, i) => (
              <li key={`${a.weekStart}-${a.scope}-${i}`}>
                {a.badge} · week of {a.weekStart}
                {a.bonusPoints ? ` · +${a.bonusPoints}` : ""}
              </li>
            ))}
          </ul>
        </div>
      )}

      {error && (
        <p className="text-sm text-fog">
          {error}{" "}
          {!signedIn && scope === "friends" && (
            <Link href="/auth" className="text-ember hover:underline">
              Sign in
            </Link>
          )}
        </p>
      )}

      <div className="space-y-2">
        {rows.length === 0 && !error && (
          <p className="rounded-xl border border-[var(--line)] bg-panel/50 px-4 py-6 text-center text-sm text-fog">
            {EMPTY_LABEL[period]}
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
              <div className="text-xs text-fog">
                {row.wins} {WINS_LABEL[period]}
              </div>
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

function TabButton({
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
