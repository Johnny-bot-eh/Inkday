"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  msUntilSeasonEnd,
  type SeasonDef,
} from "@daily-puzzle/puzzle-core";

function formatRemaining(ms: number): string {
  const totalHours = Math.max(0, Math.floor(ms / 3_600_000));
  const days = Math.floor(totalHours / 24);
  const hours = totalHours % 24;
  if (days > 0) return `${days}d ${hours}h`;
  return `${hours}h`;
}

export function SeasonBanner({ season }: { season: SeasonDef }) {
  const [remaining, setRemaining] = useState(() =>
    formatRemaining(msUntilSeasonEnd(season)),
  );

  useEffect(() => {
    function tick() {
      setRemaining(formatRemaining(msUntilSeasonEnd(season)));
    }
    tick();
    const id = window.setInterval(tick, 60_000);
    return () => window.clearInterval(id);
  }, [season]);

  const first = season.challenges[0];

  return (
    <section
      className="animate-rise relative overflow-hidden rounded-[1.75rem] border px-6 py-8 sm:px-8"
      style={{
        borderColor: `${season.accent}55`,
        background: `linear-gradient(135deg, ${season.accent}22, transparent 55%), var(--panel, rgba(20,24,32,0.7))`,
      }}
    >
      <div
        className="pointer-events-none absolute -right-10 top-0 h-48 w-48 rounded-full blur-3xl"
        style={{ background: `${season.accent}33` }}
      />
      <p
        className="text-xs uppercase tracking-[0.28em]"
        style={{ color: season.accent }}
      >
        Seasonal event · ends in {remaining}
      </p>
      <h2 className="mt-2 font-[family-name:var(--font-display)] text-3xl font-bold tracking-tight sm:text-4xl">
        {season.title}
      </h2>
      <p className="mt-2 max-w-xl text-fog">{season.tagline}</p>
      <p className="mt-3 text-sm text-fog">
        Limited boards · +35 seasonal bonus on clears · event achievements
      </p>
      {first && (
        <Link
          href={first.href}
          className="mt-5 inline-block rounded-lg px-5 py-2.5 font-semibold text-on-ember transition"
          style={{ background: season.accent }}
        >
          Play seasonal board →
        </Link>
      )}
    </section>
  );
}

export function UpcomingSeasonNote({ season }: { season: SeasonDef }) {
  return (
    <p className="rounded-xl border border-[var(--line)] bg-ink-2/50 px-4 py-3 text-sm text-fog">
      Next event:{" "}
      <span className="font-semibold text-paper">{season.title}</span> —{" "}
      {season.tagline}
    </p>
  );
}
