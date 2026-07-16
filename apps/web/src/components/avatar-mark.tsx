"use client";

import { resolveAvatarId } from "@daily-puzzle/puzzle-core";

type Props = {
  avatarId?: string | null;
  size?: number;
  className?: string;
  title?: string;
};

/** Distinctive circular Inkday avatar marks (SVG, no uploads). */
export function AvatarMark({
  avatarId,
  size = 40,
  className = "",
  title,
}: Props) {
  const id = resolveAvatarId(avatarId);
  return (
    <span
      className={`relative inline-block shrink-0 overflow-hidden rounded-full border border-[var(--line)] leading-none ${className}`}
      style={{ width: size, height: size }}
      title={title}
      aria-hidden={title ? undefined : true}
    >
      <svg
        viewBox="0 0 64 64"
        className="absolute inset-0 block h-full w-full"
        preserveAspectRatio="xMidYMid slice"
        xmlns="http://www.w3.org/2000/svg"
        role="img"
        aria-label={title}
      >
        <AvatarArt id={id} />
      </svg>
    </span>
  );
}

function AvatarArt({ id }: { id: string }) {
  switch (id) {
    case "avatar_ink":
      return (
        <>
          <rect width="64" height="64" fill="#0c1220" />
          <circle cx="32" cy="34" r="18" fill="#1a2744" />
          <ellipse cx="28" cy="28" rx="10" ry="7" fill="#2a3d66" opacity="0.8" />
          <circle cx="40" cy="40" r="6" fill="#0a0f18" />
        </>
      );
    case "avatar_quill":
      return (
        <>
          <rect width="64" height="64" fill="#141c2b" />
          <path
            d="M18 48 L34 16 L40 20 L28 50 Z"
            fill="#c9d4e8"
            opacity="0.9"
          />
          <path d="M34 16 L46 10 L42 22 Z" fill="#e8a87c" />
          <rect x="20" y="46" width="18" height="4" rx="1" fill="#7a889e" />
        </>
      );
    case "avatar_ember":
      return (
        <>
          <rect width="64" height="64" fill="#1a100c" />
          <circle cx="32" cy="32" r="22" fill="none" stroke="#e85d04" strokeWidth="3" />
          <circle cx="32" cy="32" r="14" fill="none" stroke="#f48c06" strokeWidth="2" />
          <circle cx="32" cy="32" r="6" fill="#ffba08" />
        </>
      );
    case "avatar_vault":
      return (
        <>
          <rect width="64" height="64" fill="#12161f" />
          <circle cx="32" cy="32" r="18" fill="#2a3142" stroke="#c9a227" strokeWidth="3" />
          <circle cx="32" cy="32" r="6" fill="#0c1018" stroke="#e8d48b" strokeWidth="2" />
          <rect x="30" y="32" width="12" height="3" rx="1" fill="#c9a227" />
        </>
      );
    case "avatar_cipher":
      return (
        <>
          <rect width="64" height="64" fill="#101820" />
          <circle cx="32" cy="32" r="20" fill="none" stroke="#6ee7b7" strokeWidth="2" />
          <circle cx="32" cy="32" r="12" fill="none" stroke="#34d399" strokeWidth="1.5" />
          <text
            x="32"
            y="36"
            textAnchor="middle"
            fill="#a7f3d0"
            fontSize="14"
            fontFamily="Georgia, serif"
          >
            A
          </text>
        </>
      );
    case "avatar_nocturne":
      return (
        <>
          <rect width="64" height="64" fill="#0b1020" />
          <circle cx="38" cy="28" r="14" fill="#1e2a4a" />
          <circle cx="44" cy="26" r="12" fill="#0b1020" />
          <circle cx="18" cy="16" r="1.5" fill="#c9d4e8" />
          <circle cx="50" cy="48" r="1" fill="#c9d4e8" />
          <circle cx="24" cy="44" r="1.2" fill="#94a3b8" />
        </>
      );
    case "avatar_mint":
      return (
        <>
          <rect width="64" height="64" fill="#0f1f1c" />
          <rect x="14" y="14" width="36" height="36" rx="6" fill="#134e4a" />
          <rect x="18" y="20" width="28" height="4" rx="1" fill="#5eead4" />
          <rect x="18" y="28" width="20" height="3" rx="1" fill="#2dd4bf" opacity="0.7" />
          <rect x="18" y="36" width="24" height="3" rx="1" fill="#99f6e4" opacity="0.5" />
        </>
      );
    case "avatar_plus_seal":
      return (
        <>
          <rect width="64" height="64" fill="#1a1210" />
          <circle cx="32" cy="32" r="20" fill="#e85d04" />
          <circle cx="32" cy="32" r="14" fill="#1a1210" />
          <text
            x="32"
            y="37"
            textAnchor="middle"
            fill="#ffba08"
            fontSize="18"
            fontWeight="700"
            fontFamily="Georgia, serif"
          >
            +
          </text>
        </>
      );
    case "avatar_plus_gold":
      return (
        <>
          <rect width="64" height="64" fill="#1a1608" />
          <circle cx="32" cy="32" r="22" fill="#c9a227" />
          <circle cx="32" cy="32" r="16" fill="#2a2410" />
          <circle cx="32" cy="32" r="10" fill="#e8d48b" />
          <circle cx="32" cy="32" r="5" fill="#1a1608" />
        </>
      );
    case "avatar_plus_case":
      return (
        <>
          <rect width="64" height="64" fill="#141018" />
          <rect x="12" y="16" width="40" height="32" rx="3" fill="#2a2030" stroke="#e85d04" strokeWidth="2" />
          <rect x="18" y="22" width="28" height="3" fill="#c9d4e8" opacity="0.6" />
          <rect x="18" y="28" width="20" height="2" fill="#94a3b8" opacity="0.5" />
          <rect x="18" y="34" width="24" height="2" fill="#94a3b8" opacity="0.4" />
          <circle cx="44" cy="38" r="3" fill="#ffba08" />
        </>
      );
    case "avatar_default":
    default:
      return (
        <>
          <rect width="64" height="64" fill="#151a24" />
          <circle cx="26" cy="30" r="12" fill="#2d3748" />
          <circle cx="40" cy="36" r="14" fill="#1a202c" />
          <circle cx="34" cy="28" r="8" fill="#4a5568" opacity="0.7" />
          <ellipse cx="22" cy="42" rx="8" ry="4" fill="#0f141c" opacity="0.5" />
        </>
      );
  }
}
