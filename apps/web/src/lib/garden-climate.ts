"use client";

import { useEffect, useState } from "react";
import {
  gardenAmbience,
  gardenClimateFromLocal,
  type GardenAmbientId,
  type GardenClimate,
} from "@daily-puzzle/puzzle-core";

export type LiveGardenClimate = GardenClimate & {
  ambience: GardenAmbientId[];
};

/** Player-local garden climate; refreshes every minute (paused while dragging). */
export function useLocalGardenClimate(opts: {
  accountLevel: number;
  petLevel: number;
  placedCount: number;
  paused?: boolean;
}): LiveGardenClimate {
  const [climate, setClimate] = useState(() => gardenClimateFromLocal());
  const paused = Boolean(opts.paused);

  useEffect(() => {
    if (paused) return;
    const tick = () => setClimate(gardenClimateFromLocal());
    tick();
    const id = window.setInterval(tick, 60_000);
    return () => window.clearInterval(id);
  }, [paused]);

  return {
    ...climate,
    ambience: gardenAmbience({
      accountLevel: opts.accountLevel,
      petLevel: opts.petLevel,
      placedCount: opts.placedCount,
      tone: climate.tone,
      weather: climate.weather,
    }),
  };
}
