"use client";

import { useEffect, useId, useRef, useState } from "react";
import type { PetSpeciesId, PetStage } from "@daily-puzzle/puzzle-core";

const STAGE_SCALE: Record<PetStage, number> = {
  egg: 0.78,
  baby: 0.82,
  teen: 0.92,
  adult: 1,
  mythical: 1.08,
  legendary: 1.16,
};

const STAGE_ORDER: PetStage[] = [
  "egg",
  "baby",
  "teen",
  "adult",
  "mythical",
  "legendary",
];

export type PetMotion = "idle" | "hatch" | "evolve";

type Props = {
  speciesId: PetSpeciesId;
  stage: string;
  colors: { primary: string; secondary: string; accent: string };
  happinessState?: string;
  size?: number;
  /** Override auto motion (idle / hatch / evolve). */
  motion?: PetMotion;
};

function idleClass(stage: string, happinessState: string): string {
  if (stage === "egg") {
    if (happinessState === "sleepy" || happinessState === "sad") {
      return "pet-egg-breathe";
    }
    return "pet-egg-wobble";
  }
  if (happinessState === "ecstatic" || happinessState === "happy") {
    return "pet-happy-bounce";
  }
  if (happinessState === "sleepy" || happinessState === "sad") {
    return "pet-sleepy-sway";
  }
  return "pet-breathe";
}

export function PetMark({
  speciesId,
  stage,
  colors,
  happinessState = "normal",
  size = 160,
  motion = "idle",
}: Props) {
  const scale = STAGE_SCALE[(stage as PetStage) ?? "egg"] ?? 1;
  const sleepy = happinessState === "sleepy" || happinessState === "sad";
  const glow = stage === "mythical" || stage === "legendary";

  const motionClass =
    motion === "hatch"
      ? "pet-hatch"
      : motion === "evolve"
        ? "pet-evolve"
        : idleClass(stage, happinessState);

  return (
    <div
      className={["relative mx-auto", motionClass].join(" ")}
      style={{ width: size, height: size }}
      aria-hidden
    >
      {glow || motion === "evolve" ? (
        <div
          className="absolute inset-2 animate-pulse rounded-full blur-xl"
          style={{ background: `${colors.accent}55` }}
        />
      ) : null}
      {motion === "hatch" ? (
        <div className="pet-hatch-burst pointer-events-none absolute inset-0" />
      ) : null}
      <svg
        viewBox="0 0 120 120"
        width={size}
        height={size}
        className="relative drop-shadow-md"
        style={{ transform: `scale(${scale})` }}
      >
        {stage === "egg" || motion === "hatch" ? (
          <EggSprite
            colors={colors}
            cracking={motion === "hatch"}
            sleepy={sleepy}
          />
        ) : speciesId === "ink_owl" ? (
          <>
            <ellipse cx="60" cy="70" rx="30" ry="28" fill={colors.primary} />
            <circle cx="48" cy="52" r="14" fill={colors.secondary} />
            <circle cx="72" cy="52" r="14" fill={colors.secondary} />
            <circle
              cx="48"
              cy="52"
              r="6"
              fill={sleepy ? colors.primary : "#1a1a1a"}
            />
            <circle
              cx="72"
              cy="52"
              r="6"
              fill={sleepy ? colors.primary : "#1a1a1a"}
            />
            <path d="M60 58 L66 66 L54 66 Z" fill={colors.accent} />
            <path d="M30 70 Q20 50 34 44" fill={colors.primary} />
            <path d="M90 70 Q100 50 86 44" fill={colors.primary} />
            {stage === "legendary" ? (
              <path
                d="M40 28 Q60 10 80 28"
                fill="none"
                stroke={colors.accent}
                strokeWidth="3"
              />
            ) : null}
          </>
        ) : speciesId === "moss_fox" ? (
          <>
            <ellipse cx="60" cy="72" rx="32" ry="24" fill={colors.primary} />
            <circle cx="60" cy="52" r="22" fill={colors.secondary} />
            <path d="M42 36 L36 18 L52 32 Z" fill={colors.primary} />
            <path d="M78 36 L84 18 L68 32 Z" fill={colors.primary} />
            <circle
              cx="52"
              cy="50"
              r="4"
              fill={sleepy ? colors.primary : "#1a1a1a"}
            />
            <circle
              cx="68"
              cy="50"
              r="4"
              fill={sleepy ? colors.primary : "#1a1a1a"}
            />
            <ellipse cx="60" cy="58" rx="5" ry="3" fill={colors.accent} />
            <path
              d="M88 78 Q104 70 98 92"
              fill="none"
              stroke={colors.accent}
              strokeWidth="6"
              strokeLinecap="round"
            />
            {glow ? (
              <circle cx="60" cy="30" r="6" fill={colors.accent} opacity="0.7" />
            ) : null}
          </>
        ) : (
          <>
            <ellipse cx="60" cy="74" rx="28" ry="22" fill={colors.primary} />
            <circle cx="60" cy="50" r="20" fill={colors.secondary} />
            <path d="M44 38 L40 24 L52 34" fill={colors.primary} />
            <path d="M76 38 L80 24 L68 34" fill={colors.primary} />
            <circle
              cx="52"
              cy="48"
              r="3.5"
              fill={sleepy ? colors.primary : "#1a1a1a"}
            />
            <circle
              cx="68"
              cy="48"
              r="3.5"
              fill={sleepy ? colors.primary : "#1a1a1a"}
            />
            <path
              d="M56 56 Q60 60 64 56"
              fill="none"
              stroke={colors.accent}
              strokeWidth="2"
            />
            <path
              d="M86 70 Q100 60 96 84"
              fill="none"
              stroke={colors.accent}
              strokeWidth="5"
              strokeLinecap="round"
            />
            {(stage === "mythical" || stage === "legendary") && (
              <>
                <circle cx="48" cy="28" r="2" fill={colors.accent} />
                <circle cx="72" cy="24" r="2.5" fill={colors.accent} />
                <circle cx="60" cy="18" r="2" fill={colors.accent} />
              </>
            )}
            {stage === "legendary" ? (
              <ellipse
                cx="60"
                cy="96"
                rx="18"
                ry="4"
                fill={colors.accent}
                opacity="0.45"
              />
            ) : null}
          </>
        )}
      </svg>
    </div>
  );
}

function EggSprite({
  colors,
  cracking,
  sleepy,
}: {
  colors: { primary: string; secondary: string; accent: string };
  cracking: boolean;
  sleepy: boolean;
}) {
  const uid = useId().replace(/:/g, "");
  const gid = `eggGrad-${uid}`;
  const sid = `eggShade-${uid}`;
  return (
    <>
      <defs>
        <radialGradient id={gid} cx="38%" cy="32%" r="68%">
          <stop offset="0%" stopColor="#ffffff" stopOpacity="0.55" />
          <stop offset="35%" stopColor={colors.secondary} />
          <stop offset="100%" stopColor={colors.primary} />
        </radialGradient>
        <linearGradient id={sid} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#ffffff" stopOpacity="0.15" />
          <stop offset="55%" stopColor="#000000" stopOpacity="0" />
          <stop offset="100%" stopColor="#000000" stopOpacity="0.28" />
        </linearGradient>
      </defs>
      {/* Soft contact shadow into nest */}
      <ellipse cx="60" cy="98" rx="22" ry="5" fill="#00000033" />
      {/* Shell body */}
      <ellipse cx="60" cy="62" rx="26" ry="34" fill={`url(#${gid})`} />
      <ellipse cx="60" cy="62" rx="26" ry="34" fill={`url(#${sid})`} />
      {/* Specular highlight */}
      <ellipse
        cx="50"
        cy="46"
        rx="9"
        ry="14"
        fill="#ffffff"
        opacity="0.35"
      />
      {/* Accent blotch */}
      <ellipse
        cx="68"
        cy="58"
        rx="10"
        ry="8"
        fill={colors.accent}
        opacity="0.35"
      />
      {/* Speckles */}
      <circle cx="46" cy="70" r="1.6" fill={colors.primary} opacity="0.35" />
      <circle cx="72" cy="74" r="1.2" fill={colors.primary} opacity="0.3" />
      <circle cx="58" cy="80" r="1.4" fill={colors.primary} opacity="0.28" />
      <circle cx="64" cy="48" r="1.1" fill={colors.primary} opacity="0.25" />
      {/* Shell seam */}
      <path
        d="M40 56c7-9 33-9 40 0"
        fill="none"
        stroke={colors.primary}
        strokeWidth="1.6"
        opacity="0.28"
      />
      {/* Sleepy face hint */}
      {sleepy ? (
        <path
          d="M50 64 Q54 62 58 64 M62 64 Q66 62 70 64"
          fill="none"
          stroke={colors.primary}
          strokeWidth="1.8"
          strokeLinecap="round"
          opacity="0.45"
        />
      ) : null}
      {cracking ? (
        <>
          <path
            d="M48 40 L54 52 L50 60 L58 72"
            fill="none"
            stroke={colors.primary}
            strokeWidth="2"
            strokeLinecap="round"
            opacity="0.75"
          />
          <path
            d="M70 44 L66 56 L72 64 L64 78"
            fill="none"
            stroke={colors.primary}
            strokeWidth="1.8"
            strokeLinecap="round"
            opacity="0.65"
          />
          <path
            d="M56 36 L60 48 L58 58"
            fill="none"
            stroke="#1a1a1a"
            strokeWidth="1.4"
            opacity="0.35"
          />
        </>
      ) : null}
    </>
  );
}

/** Detect hatch/evolve when a pet’s stage advances; plays a short flourish. */
export function usePetStageMotion(
  petId: string,
  stage: string,
): PetMotion {
  const [motion, setMotion] = useState<PetMotion>("idle");
  const prevRef = useRef<string | null>(null);

  useEffect(() => {
    const key = `inkday.pet.stage.${petId}`;
    const stored =
      typeof window !== "undefined" ? window.localStorage.getItem(key) : null;
    const previous = prevRef.current ?? stored;

    if (previous && previous !== stage) {
      const prevIdx = STAGE_ORDER.indexOf(previous as PetStage);
      const nextIdx = STAGE_ORDER.indexOf(stage as PetStage);
      const kind: PetMotion =
        previous === "egg" && stage !== "egg"
          ? "hatch"
          : nextIdx > prevIdx
            ? "evolve"
            : "idle";
      if (kind !== "idle") {
        setMotion(kind);
        const t = window.setTimeout(() => setMotion("idle"), kind === "hatch" ? 2800 : 2200);
        prevRef.current = stage;
        window.localStorage.setItem(key, stage);
        return () => window.clearTimeout(t);
      }
    }

    prevRef.current = stage;
    if (typeof window !== "undefined") {
      window.localStorage.setItem(key, stage);
    }
    return undefined;
  }, [petId, stage]);

  return motion;
}
