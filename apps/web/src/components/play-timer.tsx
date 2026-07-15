"use client";

import { useCallback, useEffect, useRef, useState } from "react";

export function formatDuration(ms: number): string {
  const totalSec = Math.max(0, Math.floor(ms / 1000));
  const m = Math.floor(totalSec / 60);
  const s = totalSec % 60;
  if (m >= 60) {
    const h = Math.floor(m / 60);
    const mm = m % 60;
    return `${h}:${String(mm).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
  }
  return `${m}:${String(s).padStart(2, "0")}`;
}

export function usePlayTimer(opts: { running: boolean; resetKey?: string }) {
  const [elapsedMs, setElapsedMs] = useState(0);
  const startedAt = useRef<number | null>(null);
  const accumulated = useRef(0);

  useEffect(() => {
    startedAt.current = null;
    accumulated.current = 0;
    setElapsedMs(0);
  }, [opts.resetKey]);

  useEffect(() => {
    if (!opts.running) {
      if (startedAt.current !== null) {
        accumulated.current += Date.now() - startedAt.current;
        startedAt.current = null;
        setElapsedMs(accumulated.current);
      }
      return;
    }

    startedAt.current = Date.now();
    const id = window.setInterval(() => {
      const live =
        accumulated.current +
        (startedAt.current ? Date.now() - startedAt.current : 0);
      setElapsedMs(live);
    }, 250);

    return () => window.clearInterval(id);
  }, [opts.running]);

  const freeze = useCallback(() => {
    if (startedAt.current !== null) {
      accumulated.current += Date.now() - startedAt.current;
      startedAt.current = null;
    }
    return accumulated.current;
  }, []);

  return { elapsedMs, formatted: formatDuration(elapsedMs), freeze };
}

export function PlayTimer({
  formatted,
  stopped,
}: {
  formatted: string;
  stopped?: boolean;
}) {
  return (
    <div
      className={[
        "inline-flex items-center gap-2 rounded-lg border border-[var(--line)] px-3 py-1.5 font-mono text-sm tabular-nums",
        stopped ? "bg-mint/15 text-mint" : "bg-ink-2/80 text-paper",
      ].join(" ")}
      aria-live="polite"
      aria-label={`Timer ${formatted}`}
    >
      <span className="text-[10px] font-sans font-semibold uppercase tracking-[0.18em] text-fog">
        Time
      </span>
      <span>{formatted}</span>
    </div>
  );
}
