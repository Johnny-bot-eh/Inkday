/** Twig nest the companion sits in — one nest, one egg for now. */

type Props = {
  night?: boolean;
  className?: string;
};

export function GardenNest({ night = false, className }: Props) {
  const twig = night ? "#4a3828" : "#6e4e30";
  const twigDark = night ? "#2e2418" : "#4a3420";
  const twigLit = night ? "#5c4834" : "#8a6844";
  const lining = night ? "#243020" : "#3f6234";
  const liningLit = night ? "#2e4030" : "#557844";

  return (
    <svg
      viewBox="0 0 140 90"
      className={className}
      aria-hidden
      preserveAspectRatio="xMidYMid meet"
    >
      <ellipse cx="70" cy="80" rx="58" ry="9" fill="#00000030" />
      {/* Deep outer bowl */}
      <path
        d="M12 38 C18 18 40 10 70 10 C100 10 122 18 128 38 C132 52 124 70 70 78 C16 70 8 52 12 38 Z"
        fill={twigDark}
      />
      <path
        d="M18 40 C24 22 44 16 70 16 C96 16 116 22 122 40 C126 52 118 66 70 72 C22 66 14 52 18 40 Z"
        fill={twig}
      />
      {/* Inner hollow / moss bed */}
      <ellipse cx="70" cy="42" rx="42" ry="20" fill={lining} />
      <ellipse cx="70" cy="40" rx="34" ry="14" fill={liningLit} opacity="0.9" />
      {/* Back rim twigs (behind pet) */}
      <path
        d="M22 36 Q40 22 58 30 Q70 20 82 30 Q100 22 118 36"
        fill="none"
        stroke={twigDark}
        strokeWidth="4"
        strokeLinecap="round"
      />
      <path
        d="M26 40 Q46 28 64 34 Q70 26 76 34 Q94 28 114 40"
        fill="none"
        stroke={twigLit}
        strokeWidth="3"
        strokeLinecap="round"
        opacity="0.85"
      />
    </svg>
  );
}

/** Solid front wall drawn over the pet so it reads as sitting inside the nest. */
export function GardenNestRim({ night = false, className }: Props) {
  const twig = night ? "#4a3828" : "#6e4e30";
  const twigDark = night ? "#2e2418" : "#4a3420";
  const twigLit = night ? "#5c4834" : "#8a6844";

  return (
    <svg
      viewBox="0 0 140 48"
      className={className}
      aria-hidden
      preserveAspectRatio="xMidYMid meet"
    >
      {/* Filled front crescent that covers the bottom of the egg */}
      <path
        d="M10 8 C28 28 48 36 70 36 C92 36 112 28 130 8 C124 30 104 46 70 46 C36 46 16 30 10 8 Z"
        fill={twigDark}
      />
      <path
        d="M16 10 C32 28 50 34 70 34 C90 34 108 28 124 10 C118 28 100 40 70 40 C40 40 22 28 16 10 Z"
        fill={twig}
      />
      {/* Twig weave on the front lip */}
      <path
        d="M20 14 Q40 30 58 24 Q70 34 82 24 Q100 30 120 14"
        fill="none"
        stroke={twigLit}
        strokeWidth="3"
        strokeLinecap="round"
        opacity="0.9"
      />
      <path
        d="M24 20 Q44 34 62 28 Q70 36 78 28 Q96 34 116 20"
        fill="none"
        stroke={twigDark}
        strokeWidth="2.4"
        strokeLinecap="round"
        opacity="0.85"
      />
      <path
        d="M30 26 Q50 38 70 34 Q90 38 110 26"
        fill="none"
        stroke={twigLit}
        strokeWidth="2"
        strokeLinecap="round"
        opacity="0.75"
      />
    </svg>
  );
}
