"use client";

import { useEffect, useState } from "react";
import {
  msUntilNextUtcMidnight,
  todayKey,
} from "@daily-puzzle/puzzle-core";

function formatRemaining(ms: number): string {
  const totalSeconds = Math.max(0, Math.floor(ms / 1000));
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;
  if (hours > 0) {
    return `${hours}h ${minutes}m`;
  }
  return `${minutes}m ${String(seconds).padStart(2, "0")}s`;
}

/**
 * Counts down to the next UTC midnight, then hard-reloads so today’s
 * challenges seed to the new calendar day.
 */
export function ChallengeCountdown() {
  const [label, setLabel] = useState(() =>
    formatRemaining(msUntilNextUtcMidnight()),
  );
  const [dayKey] = useState(() => todayKey());

  useEffect(() => {
    let timeoutId = 0;

    function scheduleNext() {
      const ms = msUntilNextUtcMidnight();
      setLabel(formatRemaining(ms));

      if (todayKey() !== dayKey || ms <= 0) {
        window.location.reload();
        return;
      }

      // Tick every second in the last 2 minutes; otherwise every 30s.
      const delay = ms <= 120_000 ? 1_000 : 30_000;
      timeoutId = window.setTimeout(scheduleNext, delay);
    }

    scheduleNext();
    return () => window.clearTimeout(timeoutId);
  }, [dayKey]);

  return (
    <p className="text-sm text-fog text-right">
      Resets at UTC midnight
      <br />
      <span className="font-semibold text-paper tabular-nums">{label}</span>{" "}
      left
    </p>
  );
}
