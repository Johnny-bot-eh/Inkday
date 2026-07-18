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
  const moss = night ? "#2a3a24" : "#4a6b38";

  return (
    <svg
      viewBox="0 0 120 72"
      className={className}
      aria-hidden
      preserveAspectRatio="xMidYMid meet"
    >
      <ellipse cx="60" cy="64" rx="42" ry="6" fill="#00000028" />
      {/* Compact bowl */}
      <path
        d="M16 34 C22 16 38 10 60 10 C82 10 98 16 104 34 C108 46 100 58 60 64 C20 58 12 46 16 34 Z"
        fill={twigDark}
      />
      <path
        d="M20 35 C26 20 42 15 60 15 C78 15 94 20 100 35 C104 45 96 55 60 60 C24 55 16 45 20 35 Z"
        fill={twig}
      />
      {/* Soft moss lining */}
      <ellipse cx="60" cy="38" rx="30" ry="14" fill={lining} />
      <ellipse cx="60" cy="36" rx="24" ry="10" fill={liningLit} opacity="0.9" />
      <ellipse cx="60" cy="38" rx="18" ry="7" fill={moss} opacity="0.55" />
      {/* Back rim twigs */}
      <path
        d="M24 32 Q38 20 52 28 Q60 18 68 28 Q82 20 96 32"
        fill="none"
        stroke={twigDark}
        strokeWidth="3.2"
        strokeLinecap="round"
      />
      <path
        d="M28 36 Q42 26 54 32 Q60 24 66 32 Q78 26 92 36"
        fill="none"
        stroke={twigLit}
        strokeWidth="2.4"
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
      viewBox="0 0 120 40"
      className={className}
      aria-hidden
      preserveAspectRatio="xMidYMid meet"
    >
      <path
        d="M12 6 C26 22 42 28 60 28 C78 28 94 22 108 6 C102 24 86 36 60 36 C34 36 18 24 12 6 Z"
        fill={twigDark}
      />
      <path
        d="M16 8 C30 22 44 26 60 26 C76 26 90 22 104 8 C98 22 84 32 60 32 C36 32 22 22 16 8 Z"
        fill={twig}
      />
      <path
        d="M22 12 Q38 24 52 20 Q60 28 68 20 Q82 24 98 12"
        fill="none"
        stroke={twigLit}
        strokeWidth="2.4"
        strokeLinecap="round"
        opacity="0.9"
      />
      <path
        d="M26 16 Q42 28 58 22 Q60 30 62 22 Q78 28 94 16"
        fill="none"
        stroke={twigDark}
        strokeWidth="2"
        strokeLinecap="round"
        opacity="0.8"
      />
    </svg>
  );
}
