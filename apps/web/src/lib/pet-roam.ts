"use client";

import { useEffect, useRef, useState } from "react";

export type PetRoamMode = "nest" | "walk" | "idle" | "interact" | "nap";

export type PetRoamPose = {
  x: number;
  y: number;
  facing: 1 | -1;
  mode: PetRoamMode;
  /** Decor the pet is sniffing / playing with, when mode is interact. */
  focusPlacementId: string | null;
};

type Placement = { id: string; itemId: string; x: number; y: number };

type Opts = {
  /** False while egg / hatch flourish — pet stays in the nest. */
  enabled: boolean;
  nest: { x: number; y: number };
  placements: Placement[];
  personalityId: string;
  happinessState: string;
  paused: boolean;
};

/** Ground band where companions may wander (normalized %). */
const GROUND = { minX: 12, maxX: 88, minY: 58, maxY: 88 };

function personalityProfile(id: string) {
  switch (id) {
    case "lazy":
      return {
        speed: 3.2,
        decorBias: 0.28,
        nestBias: 0.5,
        pauseMs: [2400, 5200] as const,
        napChance: 0.38,
      };
    case "playful":
      return {
        speed: 9.8,
        decorBias: 0.58,
        nestBias: 0.08,
        pauseMs: [700, 1700] as const,
        napChance: 0.05,
      };
    case "curious":
      return {
        speed: 7.2,
        decorBias: 0.78,
        nestBias: 0.06,
        pauseMs: [1100, 2500] as const,
        napChance: 0.08,
      };
    case "shy":
      return {
        speed: 4.4,
        decorBias: 0.32,
        nestBias: 0.22,
        pauseMs: [1800, 3800] as const,
        napChance: 0.16,
      };
    case "food_lover":
      return {
        speed: 6.6,
        decorBias: 0.72,
        nestBias: 0.1,
        pauseMs: [1300, 2800] as const,
        napChance: 0.1,
      };
    case "mischievous":
      return {
        speed: 8.8,
        decorBias: 0.52,
        nestBias: 0.08,
        pauseMs: [600, 1500] as const,
        napChance: 0.06,
      };
    case "sassy":
      return {
        speed: 5.6,
        decorBias: 0.4,
        nestBias: 0.18,
        pauseMs: [1600, 3400] as const,
        napChance: 0.12,
      };
    default:
      return {
        speed: 6.2,
        decorBias: 0.48,
        nestBias: 0.14,
        pauseMs: [1400, 2800] as const,
        napChance: 0.1,
      };
  }
}

function clamp(n: number, lo: number, hi: number) {
  return Math.min(hi, Math.max(lo, n));
}

function dist(
  a: { x: number; y: number },
  b: { x: number; y: number },
) {
  return Math.hypot(a.x - b.x, a.y - b.y);
}

function foodish(itemId: string) {
  return /berry|mushroom|toadstool|flower|clover|dandelion|fruit|cake|treat|honey/.test(
    itemId,
  );
}

/**
 * Client-only locomotion for hatched companions.
 * Nest position stays persisted; roam pose is ephemeral living-wallpaper motion.
 */
export function usePetRoam(opts: Opts): PetRoamPose {
  const [pose, setPose] = useState<PetRoamPose>(() => ({
    x: opts.nest.x,
    y: opts.nest.y,
    facing: 1,
    mode: opts.enabled ? "idle" : "nest",
    focusPlacementId: null,
  }));

  const poseRef = useRef(pose);
  poseRef.current = pose;

  const nestRef = useRef(opts.nest);
  nestRef.current = opts.nest;

  const placementsRef = useRef(opts.placements);
  placementsRef.current = opts.placements;

  const personalityRef = useRef(opts.personalityId);
  personalityRef.current = opts.personalityId;

  const happinessRef = useRef(opts.happinessState);
  happinessRef.current = opts.happinessState;

  // Stay glued to the nest while egg / hatch.
  useEffect(() => {
    if (!opts.enabled) {
      setPose({
        x: opts.nest.x,
        y: opts.nest.y,
        facing: 1,
        mode: "nest",
        focusPlacementId: null,
      });
    }
  }, [opts.enabled, opts.nest.x, opts.nest.y]);

  // After hatch, start at the nest then leave.
  useEffect(() => {
    if (!opts.enabled) return;
    setPose({
      x: nestRef.current.x,
      y: nestRef.current.y,
      facing: Math.random() < 0.5 ? 1 : -1,
      mode: "idle",
      focusPlacementId: null,
    });
  }, [opts.enabled]);

  useEffect(() => {
    if (!opts.enabled || opts.paused) return;

    let raf = 0;
    let last = performance.now();
    let holdUntil = performance.now() + 900 + Math.random() * 900;
    let target: {
      x: number;
      y: number;
      placementId: string | null;
      kind: "wander" | "decor" | "nest";
    } | null = null;

    function profile() {
      const base = personalityProfile(personalityRef.current);
      const mood = happinessRef.current;
      if (mood === "sleepy" || mood === "sad") {
        return {
          ...base,
          speed: base.speed * 0.55,
          napChance: Math.min(0.72, base.napChance + 0.28),
        };
      }
      if (mood === "ecstatic" || mood === "happy") {
        return { ...base, speed: base.speed * 1.18, napChance: base.napChance * 0.6 };
      }
      return base;
    }

    function pickTarget() {
      const p = profile();
      const nest = nestRef.current;
      const placements = placementsRef.current;
      const personality = personalityRef.current;

      if (Math.random() < p.napChance) {
        return {
          x: clamp(nest.x + (Math.random() * 8 - 4), GROUND.minX, GROUND.maxX),
          y: clamp(nest.y + (Math.random() * 5 - 2), GROUND.minY, GROUND.maxY),
          placementId: null as string | null,
          kind: "nest" as const,
        };
      }

      const wantDecor = Math.random() < p.decorBias && placements.length > 0;
      if (wantDecor) {
        let pool = placements.filter(
          (d) => d.y >= GROUND.minY - 10 && d.y <= GROUND.maxY + 6,
        );
        if (personality === "food_lover") {
          const food = pool.filter((d) => foodish(d.itemId));
          if (food.length) pool = food;
        }
        if (pool.length === 0) pool = [...placements];
        const pick = pool[Math.floor(Math.random() * pool.length)]!;
        const side = Math.random() < 0.5 ? -1 : 1;
        return {
          x: clamp(
            pick.x + side * (3.5 + Math.random() * 4),
            GROUND.minX,
            GROUND.maxX,
          ),
          y: clamp(pick.y + Math.random() * 2.5, GROUND.minY, GROUND.maxY),
          placementId: pick.id,
          kind: "decor" as const,
        };
      }

      if (Math.random() < p.nestBias) {
        return {
          x: clamp(nest.x + (Math.random() * 12 - 6), GROUND.minX, GROUND.maxX),
          y: clamp(nest.y + (Math.random() * 8 - 4), GROUND.minY, GROUND.maxY),
          placementId: null,
          kind: "nest" as const,
        };
      }

      if (personality === "shy") {
        const left = Math.random() < 0.5;
        return {
          x: left
            ? GROUND.minX + Math.random() * 16
            : GROUND.maxX - Math.random() * 16,
          y: GROUND.minY + Math.random() * (GROUND.maxY - GROUND.minY),
          placementId: null,
          kind: "wander" as const,
        };
      }

      return {
        x: GROUND.minX + Math.random() * (GROUND.maxX - GROUND.minX),
        y: GROUND.minY + Math.random() * (GROUND.maxY - GROUND.minY),
        placementId: null,
        kind: "wander" as const,
      };
    }

    function tick(now: number) {
      raf = window.requestAnimationFrame(tick);
      const dt = Math.min(0.05, (now - last) / 1000);
      last = now;
      const cur = poseRef.current;
      const p = profile();

      if (now < holdUntil) return;

      if (!target) {
        target = pickTarget();
        setPose((prev) => ({
          ...prev,
          mode: "walk",
          focusPlacementId: null,
          facing: target!.x >= prev.x ? 1 : -1,
        }));
      }

      const remaining = dist(cur, target);
      if (remaining < 1.15) {
        const mode: PetRoamMode =
          target.kind === "decor"
            ? "interact"
            : target.kind === "nest" && Math.random() < p.napChance + 0.25
              ? "nap"
              : "idle";
        const [lo, hi] = p.pauseMs;
        const hold =
          mode === "interact"
            ? lo + Math.random() * (hi - lo) + 900
            : mode === "nap"
              ? hi + 800 + Math.random() * 2800
              : lo + Math.random() * (hi - lo);
        holdUntil = now + hold;
        setPose({
          x: target.x,
          y: target.y,
          facing: poseRef.current.facing,
          mode,
          focusPlacementId: target.placementId,
        });
        target = null;
        return;
      }

      const step = p.speed * dt;
      const t = Math.min(1, step / remaining);
      const nx = cur.x + (target.x - cur.x) * t;
      const ny = cur.y + (target.y - cur.y) * t;
      setPose({
        x: nx,
        y: ny,
        facing: target.x >= cur.x ? 1 : -1,
        mode: "walk",
        focusPlacementId: null,
      });
    }

    raf = window.requestAnimationFrame(tick);
    return () => window.cancelAnimationFrame(raf);
  }, [opts.enabled, opts.paused]);

  return pose;
}
