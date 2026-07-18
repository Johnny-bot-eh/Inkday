/** Twig nest the companion sits in — one nest, one egg for now. */

type Props = {
  night?: boolean;
  className?: string;
};

export function GardenNest({ night = false, className }: Props) {
  const twig = night ? "#4a3828" : "#6e4e30";
  const twigDark = night ? "#2e2418" : "#4a3420";
  const twigLit = night ? "#5c4834" : "#8a6844";
  const lining = night ? "#2a3824" : "#4f7340";
  const liningLit = night ? "#354830" : "#6a9450";

  return (
    <svg
      viewBox="0 0 120 56"
      className={className}
      aria-hidden
      preserveAspectRatio="xMidYMid meet"
    >
      <ellipse cx="60" cy="46" rx="48" ry="8" fill="#00000033" />
      {/* Outer bowl */}
      <ellipse cx="60" cy="34" rx="52" ry="18" fill={twigDark} />
      <ellipse cx="60" cy="32" rx="48" ry="16" fill={twig} />
      {/* Inner hollow */}
      <ellipse cx="60" cy="28" rx="34" ry="11" fill={lining} />
      <ellipse cx="60" cy="26" rx="28" ry="8" fill={liningLit} opacity="0.85" />
      {/* Twig weave arcs */}
      <path
        d="M14 30 Q30 18 48 24 Q60 16 72 24 Q90 18 106 30"
        fill="none"
        stroke={twigDark}
        strokeWidth="3"
        strokeLinecap="round"
      />
      <path
        d="M16 36 Q34 26 52 32 Q60 24 68 32 Q86 26 104 36"
        fill="none"
        stroke={twigLit}
        strokeWidth="2.4"
        strokeLinecap="round"
        opacity="0.9"
      />
      <path
        d="M20 40 Q40 34 58 38 Q60 32 62 38 Q80 34 100 40"
        fill="none"
        stroke={twigDark}
        strokeWidth="2"
        strokeLinecap="round"
        opacity="0.8"
      />
      <path
        d="M22 28 Q40 38 58 30 Q70 40 88 28 Q98 36 104 32"
        fill="none"
        stroke={twigLit}
        strokeWidth="1.8"
        strokeLinecap="round"
        opacity="0.7"
      />
    </svg>
  );
}

/** Front rim drawn over the pet so it reads as sitting inside the nest. */
export function GardenNestRim({ night = false, className }: Props) {
  const twig = night ? "#4a3828" : "#6e4e30";
  const twigDark = night ? "#2e2418" : "#4a3420";
  const twigLit = night ? "#5c4834" : "#8a6844";

  return (
    <svg
      viewBox="0 0 120 28"
      className={className}
      aria-hidden
      preserveAspectRatio="xMidYMid meet"
    >
      <path
        d="M10 8 Q30 20 50 14 Q60 22 70 14 Q90 20 110 8"
        fill="none"
        stroke={twigDark}
        strokeWidth="3.2"
        strokeLinecap="round"
      />
      <path
        d="M14 12 Q36 22 58 16 Q60 24 62 16 Q84 22 106 12"
        fill="none"
        stroke={twig}
        strokeWidth="2.6"
        strokeLinecap="round"
      />
      <path
        d="M18 16 Q40 24 60 20 Q80 24 102 16"
        fill="none"
        stroke={twigLit}
        strokeWidth="2"
        strokeLinecap="round"
        opacity="0.85"
      />
    </svg>
  );
}
