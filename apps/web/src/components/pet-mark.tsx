"use client";

import type { PetSpeciesId, PetStage } from "@daily-puzzle/puzzle-core";

const STAGE_SCALE: Record<PetStage, number> = {
  egg: 0.72,
  baby: 0.82,
  teen: 0.92,
  adult: 1,
  mythical: 1.08,
  legendary: 1.16,
};

type Props = {
  speciesId: PetSpeciesId;
  stage: string;
  colors: { primary: string; secondary: string; accent: string };
  happinessState?: string;
  size?: number;
};

export function PetMark({
  speciesId,
  stage,
  colors,
  happinessState = "normal",
  size = 160,
}: Props) {
  const scale = STAGE_SCALE[(stage as PetStage) ?? "egg"] ?? 1;
  const sleepy = happinessState === "sleepy" || happinessState === "sad";
  const glow = stage === "mythical" || stage === "legendary";

  return (
    <div
      className="relative mx-auto"
      style={{ width: size, height: size }}
      aria-hidden
    >
      {glow ? (
        <div
          className="absolute inset-2 animate-pulse rounded-full blur-xl"
          style={{ background: `${colors.accent}55` }}
        />
      ) : null}
      <svg
        viewBox="0 0 120 120"
        width={size}
        height={size}
        className="relative drop-shadow-md transition-transform duration-500"
        style={{ transform: `scale(${scale})` }}
      >
        {stage === "egg" ? (
          <>
            <ellipse cx="60" cy="64" rx="28" ry="36" fill={colors.secondary} />
            <ellipse cx="60" cy="58" rx="18" ry="12" fill={colors.accent} opacity="0.45" />
            <path
              d="M42 54c8-10 28-10 36 0"
              fill="none"
              stroke={colors.primary}
              strokeWidth="2"
              opacity="0.35"
            />
          </>
        ) : speciesId === "ink_owl" ? (
          <>
            <ellipse cx="60" cy="70" rx="30" ry="28" fill={colors.primary} />
            <circle cx="48" cy="52" r="14" fill={colors.secondary} />
            <circle cx="72" cy="52" r="14" fill={colors.secondary} />
            <circle cx="48" cy="52" r="6" fill={sleepy ? colors.primary : "#1a1a1a"} />
            <circle cx="72" cy="52" r="6" fill={sleepy ? colors.primary : "#1a1a1a"} />
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
            <circle cx="52" cy="50" r="4" fill={sleepy ? colors.primary : "#1a1a1a"} />
            <circle cx="68" cy="50" r="4" fill={sleepy ? colors.primary : "#1a1a1a"} />
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
            <circle cx="52" cy="48" r="3.5" fill={sleepy ? colors.primary : "#1a1a1a"} />
            <circle cx="68" cy="48" r="3.5" fill={sleepy ? colors.primary : "#1a1a1a"} />
            <path d="M56 56 Q60 60 64 56" fill="none" stroke={colors.accent} strokeWidth="2" />
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
