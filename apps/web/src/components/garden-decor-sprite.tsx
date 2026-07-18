/** Realistic SVG sprites for placeable garden decorations (no letters / captions). */

type Props = {
  itemId: string;
  tone: string;
  className?: string;
};

export function GardenDecorSprite({ itemId, tone, className }: Props) {
  switch (itemId) {
    case "deco_flower_daisy":
      return <DaisySprite className={className} />;
    case "deco_flower_tulip":
      return <TulipSprite className={className} tone={tone} />;
    case "deco_flower_lantern":
      return <LanternBlossomSprite className={className} />;
    case "deco_pond":
      return <PondSprite className={className} />;
    case "deco_tree_oak":
      return <OakSprite className={className} />;
    case "deco_tree_willow":
      return <WillowSprite className={className} />;
    case "deco_seasonal_lantern":
      return <SeasonalLanternSprite className={className} />;
    case "deco_legendary_obelisk":
      return <ObeliskSprite className={className} />;
    default:
      return <GenericPlantSprite className={className} tone={tone} />;
  }
}

function DaisySprite({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 64 64" className={className} aria-hidden>
      <ellipse cx="32" cy="58" rx="10" ry="3" fill="#00000022" />
      <path
        d="M32 58 V28"
        stroke="#3d6b3a"
        strokeWidth="2.5"
        strokeLinecap="round"
      />
      <path
        d="M32 42 Q24 38 22 44"
        fill="none"
        stroke="#4a7a42"
        strokeWidth="2"
      />
      {[0, 45, 90, 135, 180, 225, 270, 315].map((deg) => {
        const rad = (deg * Math.PI) / 180;
        const cx = 32 + Math.cos(rad) * 10;
        const cy = 24 + Math.sin(rad) * 10;
        return (
          <ellipse
            key={deg}
            cx={cx}
            cy={cy}
            rx="6"
            ry="3.5"
            fill="#f5f0e6"
            transform={`rotate(${deg} ${cx} ${cy})`}
          />
        );
      })}
      <circle cx="32" cy="24" r="5" fill="#e8b84a" />
      <circle cx="32" cy="24" r="2.5" fill="#c9922a" />
    </svg>
  );
}

function TulipSprite({
  className,
  tone,
}: {
  className?: string;
  tone: string;
}) {
  return (
    <svg viewBox="0 0 64 64" className={className} aria-hidden>
      <ellipse cx="32" cy="58" rx="8" ry="2.5" fill="#00000022" />
      <path
        d="M32 58 V34"
        stroke="#3a6b38"
        strokeWidth="2.5"
        strokeLinecap="round"
      />
      <path d="M32 44 Q22 40 20 48 Q28 46 32 44Z" fill="#4a8040" />
      <path
        d="M22 34 Q22 18 32 14 Q42 18 42 34 Q37 30 32 34 Q27 30 22 34Z"
        fill={tone || "#e07a3a"}
      />
      <path
        d="M26 28 Q32 22 38 28"
        fill="none"
        stroke="#ffffff44"
        strokeWidth="1.5"
      />
    </svg>
  );
}

function LanternBlossomSprite({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 64 64" className={className} aria-hidden>
      <ellipse cx="32" cy="58" rx="9" ry="2.5" fill="#00000022" />
      <path
        d="M32 58 V36"
        stroke="#4a6b38"
        strokeWidth="2"
        strokeLinecap="round"
      />
      <ellipse cx="32" cy="28" rx="14" ry="16" fill="#c9a22788" />
      <ellipse cx="32" cy="28" rx="10" ry="12" fill="#e8c84a" />
      <ellipse cx="32" cy="30" rx="6" ry="8" fill="#fff4c4" />
      <circle cx="28" cy="24" r="2" fill="#ffffff88" />
    </svg>
  );
}

function PondSprite({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 96 56" className={className} aria-hidden>
      <ellipse cx="48" cy="32" rx="42" ry="18" fill="#2a5a6e" />
      <ellipse cx="48" cy="30" rx="36" ry="14" fill="#3d7a94" />
      <ellipse cx="48" cy="28" rx="28" ry="10" fill="#5a9ab0" />
      <ellipse cx="38" cy="24" rx="12" ry="4" fill="#ffffff33" />
      <ellipse cx="58" cy="34" rx="8" ry="2.5" fill="#ffffff22" />
      <circle cx="30" cy="36" r="3" fill="#4a8a3a" opacity="0.7" />
      <circle cx="66" cy="28" r="2.5" fill="#4a8a3a" opacity="0.6" />
    </svg>
  );
}

function OakSprite({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 80 96" className={className} aria-hidden>
      <ellipse cx="40" cy="90" rx="18" ry="4" fill="#00000022" />
      <path
        d="M36 90 V48 Q34 40 40 38 Q46 40 44 48 V90"
        fill="#5a3d28"
      />
      <ellipse cx="40" cy="36" rx="28" ry="24" fill="#3d5c2e" />
      <ellipse cx="28" cy="40" rx="16" ry="14" fill="#4a6b38" />
      <ellipse cx="52" cy="38" rx="15" ry="13" fill="#355528" />
      <ellipse cx="40" cy="28" rx="14" ry="12" fill="#4f7340" />
    </svg>
  );
}

function WillowSprite({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 80 96" className={className} aria-hidden>
      <ellipse cx="40" cy="90" rx="16" ry="3.5" fill="#00000022" />
      <path d="M38 90 V42 Q40 36 42 42 V90" fill="#5a4830" />
      <path
        d="M42 44 Q58 50 60 78"
        fill="none"
        stroke="#4a6b3a"
        strokeWidth="2.5"
        strokeLinecap="round"
      />
      <path
        d="M40 42 Q50 48 52 76"
        fill="none"
        stroke="#5a7a48"
        strokeWidth="2"
        strokeLinecap="round"
      />
      <path
        d="M38 44 Q24 52 22 78"
        fill="none"
        stroke="#4a6b3a"
        strokeWidth="2.5"
        strokeLinecap="round"
      />
      <path
        d="M40 42 Q30 50 28 74"
        fill="none"
        stroke="#5a7a48"
        strokeWidth="2"
        strokeLinecap="round"
      />
      <ellipse cx="40" cy="36" rx="22" ry="14" fill="#4a6b3a" />
      <ellipse cx="40" cy="32" rx="16" ry="10" fill="#5a7c48" />
    </svg>
  );
}

function SeasonalLanternSprite({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 48 64" className={className} aria-hidden>
      <ellipse cx="24" cy="58" rx="8" ry="2.5" fill="#00000022" />
      <rect x="22" y="48" width="4" height="10" rx="1" fill="#5a4030" />
      <path
        d="M12 28 Q12 16 24 14 Q36 16 36 28 V42 Q36 48 24 50 Q12 48 12 42Z"
        fill="#c9a227"
      />
      <path
        d="M16 30 Q16 20 24 18 Q32 20 32 30 V40 Q32 44 24 46 Q16 44 16 40Z"
        fill="#f0d878"
      />
      <ellipse cx="24" cy="34" rx="6" ry="8" fill="#fff6c8" />
      <rect x="20" y="10" width="8" height="5" rx="1" fill="#8a6a30" />
    </svg>
  );
}

function ObeliskSprite({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 48 80" className={className} aria-hidden>
      <ellipse cx="24" cy="74" rx="14" ry="3.5" fill="#00000028" />
      <path d="M10 70 L24 8 L38 70 Z" fill="#6a5a9a" />
      <path d="M16 70 L24 18 L32 70 Z" fill="#8a7abc" />
      <path d="M20 70 L24 28 L28 70 Z" fill="#b0a0e0" />
      <circle cx="24" cy="14" r="3" fill="#e8d8ff" />
    </svg>
  );
}

function GenericPlantSprite({
  className,
  tone,
}: {
  className?: string;
  tone: string;
}) {
  return (
    <svg viewBox="0 0 64 64" className={className} aria-hidden>
      <ellipse cx="32" cy="56" rx="12" ry="3" fill="#00000022" />
      <path
        d="M32 56 Q28 40 32 28 Q36 40 32 56"
        fill={tone || "#4a7a42"}
      />
      <ellipse cx="24" cy="36" rx="10" ry="6" fill={tone || "#4a7a42"} />
      <ellipse cx="40" cy="34" rx="9" ry="5" fill={tone || "#3d6b38"} />
    </svg>
  );
}
