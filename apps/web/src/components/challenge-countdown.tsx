"use client";

import { useEffect, useState } from "react";
import { msUntilNextUtcMidnight } from "@daily-puzzle/puzzle-core";

function formatRemaining(ms: number): string {
  const totalMinutes = Math.max(0, Math.floor(ms / 60_000));
  const hours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;
  return `${hours}h ${minutes}m`;
}

export function ChallengeCountdown() {
  const [label, setLabel] = useState(() =>
    formatRemaining(msUntilNextUtcMidnight()),
  );

  useEffect(() => {
    function tick() {
      setLabel(formatRemaining(msUntilNextUtcMidnight()));
    }
    tick();
    const id = window.setInterval(tick, 30_000);
    return () => window.clearInterval(id);
  }, []);

  return (
    <p className="text-sm text-fog">
      Time remaining:{" "}
      <span className="font-semibold text-paper tabular-nums">{label}</span>
    </p>
  );
}
