"use client";

import { resolveAccessoryId, resolveAvatarId } from "@daily-puzzle/puzzle-core";

type Props = {
  avatarId?: string | null;
  accessoryId?: string | null;
  animate?: boolean;
  size?: number;
  className?: string;
  title?: string;
};

function avatarAnimClass(id: string): string {
  if (id.startsWith("avatar_plus_") || id.startsWith("avatar_badge_")) {
    return "avatar-sparkle";
  }
  return "avatar-idle";
}

/** Distinctive circular Inkday avatar marks (SVG, no uploads). */
export function AvatarMark({
  avatarId,
  accessoryId,
  animate = true,
  size = 40,
  className = "",
  title,
}: Props) {
  const id = resolveAvatarId(avatarId);
  const accessory = resolveAccessoryId(accessoryId);
  const animClass = animate ? avatarAnimClass(id) : "";

  return (
    <span
      className={`relative inline-block shrink-0 overflow-visible leading-none ${className}`}
      style={{ width: size, height: size }}
      title={title}
      aria-hidden={title ? undefined : true}
    >
      <span
        className={`absolute inset-0 overflow-hidden rounded-full border border-[var(--line)] ${animClass}`}
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
      {accessory && (
        <svg
          viewBox="0 0 64 64"
          className="pointer-events-none absolute inset-0 block h-full w-full overflow-visible"
          preserveAspectRatio="xMidYMid meet"
          xmlns="http://www.w3.org/2000/svg"
          aria-hidden
        >
          <AccessoryOverlay id={accessory} />
        </svg>
      )}
    </span>
  );
}

function AccessoryOverlay({ id }: { id: string }) {
  if (id.startsWith("accessory_ribbon_")) {
    const color =
      id === "accessory_ribbon_junior"
        ? "#5eead4"
        : id === "accessory_ribbon_investigator"
          ? "#7ec8e8"
          : id === "accessory_ribbon_master"
            ? "#c9a227"
            : id === "accessory_ribbon_legendary"
              ? "#e85d04"
              : id === "accessory_ribbon_casefile"
                ? "#c45c8a"
                : "#e85d04";
    return (
      <>
        <path
          d="M18 52 L14 64 L26 58 L32 64 L38 58 L50 64 L46 52 Z"
          fill={color}
          opacity="0.95"
        />
        <circle cx="32" cy="50" r="6" fill={color} />
        <circle cx="32" cy="50" r="3" fill="#1a1210" opacity="0.35" />
      </>
    );
  }
  if (id === "accessory_crown_gold") {
    return (
      <>
        <path
          d="M14 18 L20 8 L26 16 L32 6 L38 16 L44 8 L50 18 L50 24 L14 24 Z"
          fill="#c9a227"
          stroke="#e8d48b"
          strokeWidth="1.5"
        />
        <circle cx="32" cy="14" r="2.5" fill="#ffba08" />
      </>
    );
  }
  if (id === "accessory_crown_silver") {
    return (
      <>
        <path
          d="M16 18 L22 10 L28 16 L32 8 L36 16 L42 10 L48 18 L48 24 L16 24 Z"
          fill="#9aa0a8"
          stroke="#e8eef1"
          strokeWidth="1.5"
        />
        <ellipse cx="32" cy="14" rx="4" ry="2" fill="#c9d4e8" />
      </>
    );
  }
  if (id === "accessory_crown_bronze") {
    return (
      <>
        <path
          d="M18 18 L24 12 L30 17 L32 10 L34 17 L40 12 L46 18 L46 24 L18 24 Z"
          fill="#8a5a30"
          stroke="#c9a88a"
          strokeWidth="1.5"
        />
        <rect x="28" y="12" width="8" height="4" rx="1" fill="#c9a227" />
      </>
    );
  }
  if (id === "accessory_frame_ember") {
    return (
      <>
        <circle
          cx="32"
          cy="32"
          r="30"
          fill="none"
          stroke="#e85d04"
          strokeWidth="3"
        />
        <circle
          cx="32"
          cy="32"
          r="27"
          fill="none"
          stroke="#f48c06"
          strokeWidth="1.5"
          opacity="0.7"
        />
      </>
    );
  }
  return null;
}

function AvatarArt({ id }: { id: string }) {
  switch (id) {
    case "avatar_badge_gumshoe":
      return (
        <>
          <rect width="64" height="64" fill="#141820" />
          <circle cx="32" cy="32" r="22" fill="#2a3142" stroke="#94a3b8" strokeWidth="2" />
          <rect x="22" y="26" width="20" height="14" rx="2" fill="#c9d4e8" opacity="0.8" />
          <circle cx="32" cy="33" r="4" fill="#e85d04" />
          <path d="M26 38 H38" stroke="#7a889e" strokeWidth="2" />
        </>
      );
    case "avatar_badge_sherlock":
      return (
        <>
          <rect width="64" height="64" fill="#1a1410" />
          <circle cx="32" cy="34" r="18" fill="#c9a88a" />
          <path d="M18 22 Q32 8 46 22 L42 28 Q32 18 22 28 Z" fill="#5a4030" />
          <circle cx="26" cy="34" r="2" fill="#1a1210" />
          <circle cx="38" cy="34" r="2" fill="#1a1210" />
          <path d="M28 42 Q32 46 36 42" fill="none" stroke="#8a6a50" strokeWidth="1.5" />
        </>
      );
    case "avatar_badge_logic":
      return (
        <>
          <rect width="64" height="64" fill="#101820" />
          <rect x="14" y="14" width="16" height="16" rx="2" fill="#34d399" opacity="0.8" />
          <rect x="34" y="14" width="16" height="16" rx="2" fill="#6ee7b7" opacity="0.6" />
          <rect x="14" y="34" width="16" height="16" rx="2" fill="#6ee7b7" opacity="0.6" />
          <rect x="34" y="34" width="16" height="16" rx="2" fill="#34d399" opacity="0.9" />
        </>
      );
    case "avatar_badge_einstein":
      return (
        <>
          <rect width="64" height="64" fill="#1a1810" />
          <ellipse cx="32" cy="36" rx="20" ry="18" fill="#e8e0d0" />
          <path
            d="M14 28 Q10 18 20 14 Q32 8 44 14 Q54 18 50 28"
            fill="#c9c4b5"
            stroke="#9a9690"
            strokeWidth="1"
          />
          <circle cx="26" cy="36" r="2.5" fill="#1a1210" />
          <circle cx="38" cy="36" r="2.5" fill="#1a1210" />
          <path d="M24 46 Q32 52 40 46" fill="none" stroke="#8a8680" strokeWidth="2" />
        </>
      );
    case "avatar_badge_master":
      return (
        <>
          <rect width="64" height="64" fill="#141018" />
          <path
            d="M32 10 L38 26 L56 26 L42 36 L48 52 L32 42 L16 52 L22 36 L8 26 L26 26 Z"
            fill="#c9a227"
          />
          <circle cx="32" cy="32" r="8" fill="#1a1210" />
          <text x="32" y="36" textAnchor="middle" fill="#ffba08" fontSize="10" fontWeight="700">
            ★
          </text>
        </>
      );
    case "avatar_badge_legend":
      return (
        <>
          <rect width="64" height="64" fill="#1a0c14" />
          <circle cx="32" cy="32" r="22" fill="none" stroke="#e85d04" strokeWidth="3" />
          <path
            d="M32 14 L36 28 L50 28 L39 36 L44 50 L32 42 L20 50 L25 36 L14 28 L28 28 Z"
            fill="#ffba08"
          />
        </>
      );
    case "avatar_badge_season":
      return (
        <>
          <rect width="64" height="64" fill="#101820" />
          <circle cx="32" cy="32" r="20" fill="#1e2a4a" />
          <circle cx="20" cy="22" r="4" fill="#5eead4" />
          <circle cx="44" cy="24" r="4" fill="#f48c06" />
          <circle cx="24" cy="44" r="4" fill="#c45c8a" />
          <circle cx="42" cy="42" r="4" fill="#7ec8e8" />
        </>
      );
    case "avatar_badge_weekly":
      return (
        <>
          <rect width="64" height="64" fill="#12161c" />
          <circle cx="32" cy="32" r="20" fill="#2a3142" stroke="#c9a227" strokeWidth="2" />
          <text x="32" y="28" textAnchor="middle" fill="#e8d48b" fontSize="9" fontWeight="700">
            W
          </text>
          <path d="M20 40 H44" stroke="#c9a227" strokeWidth="2" />
          <circle cx="24" cy="40" r="3" fill="#e85d04" />
          <circle cx="32" cy="40" r="3" fill="#ffba08" />
          <circle cx="40" cy="40" r="3" fill="#c9d4e8" />
        </>
      );
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
    case "avatar_paper":
      return (
        <>
          <rect width="64" height="64" fill="#1a1e28" />
          <path d="M18 14 L42 14 L46 18 L46 50 L18 50 Z" fill="#e8e4d9" />
          <path d="M42 14 L42 18 L46 18 Z" fill="#c9c4b5" />
          <rect x="22" y="24" width="20" height="2" fill="#94a3b8" opacity="0.5" />
          <rect x="22" y="30" width="16" height="2" fill="#94a3b8" opacity="0.4" />
          <rect x="22" y="36" width="18" height="2" fill="#94a3b8" opacity="0.35" />
        </>
      );
    case "avatar_dot":
      return (
        <>
          <rect width="64" height="64" fill="#121820" />
          <circle cx="32" cy="32" r="20" fill="none" stroke="#7a889e" strokeWidth="2" />
          <line x1="32" y1="12" x2="32" y2="20" stroke="#c9d4e8" strokeWidth="2" />
          <line x1="32" y1="44" x2="32" y2="52" stroke="#7a889e" strokeWidth="1.5" />
          <line x1="12" y1="32" x2="20" y2="32" stroke="#7a889e" strokeWidth="1.5" />
          <line x1="44" y1="32" x2="52" y2="32" stroke="#7a889e" strokeWidth="1.5" />
          <circle cx="32" cy="32" r="5" fill="#e85d04" />
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
    case "avatar_lantern":
      return (
        <>
          <rect width="64" height="64" fill="#14100c" />
          <rect x="26" y="12" width="12" height="6" rx="1" fill="#c9a227" />
          <path d="M20 22 L44 22 L42 48 L22 48 Z" fill="#2a2010" stroke="#e8a87c" strokeWidth="2" />
          <ellipse cx="32" cy="34" rx="8" ry="10" fill="#ffba08" opacity="0.85" />
          <ellipse cx="32" cy="32" rx="4" ry="6" fill="#fff3bf" opacity="0.7" />
        </>
      );
    case "avatar_lock":
      return (
        <>
          <rect width="64" height="64" fill="#10141c" />
          <path
            d="M22 28 V20 A10 10 0 0 1 42 20 V28"
            fill="none"
            stroke="#94a3b8"
            strokeWidth="4"
          />
          <rect x="18" y="28" width="28" height="24" rx="3" fill="#2a3142" stroke="#c9d4e8" strokeWidth="2" />
          <circle cx="32" cy="38" r="4" fill="#0c1018" stroke="#e85d04" strokeWidth="2" />
          <rect x="30" y="40" width="4" height="8" rx="1" fill="#e85d04" />
        </>
      );
    case "avatar_stamp":
      return (
        <>
          <rect width="64" height="64" fill="#1a1214" />
          <circle cx="32" cy="32" r="20" fill="none" stroke="#c2410c" strokeWidth="3" />
          <circle cx="32" cy="32" r="14" fill="none" stroke="#ea580c" strokeWidth="1.5" strokeDasharray="3 2" />
          <text
            x="32"
            y="36"
            textAnchor="middle"
            fill="#fb923c"
            fontSize="11"
            fontWeight="700"
            fontFamily="Georgia, serif"
          >
            OK
          </text>
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
    case "avatar_ladder":
      return (
        <>
          <rect width="64" height="64" fill="#12161c" />
          <rect x="20" y="10" width="5" height="44" rx="1" fill="#c9a227" />
          <rect x="39" y="10" width="5" height="44" rx="1" fill="#c9a227" />
          <rect x="20" y="18" width="24" height="3" fill="#e8d48b" />
          <rect x="20" y="28" width="24" height="3" fill="#e8d48b" />
          <rect x="20" y="38" width="24" height="3" fill="#e8d48b" />
          <rect x="20" y="48" width="24" height="3" fill="#e8d48b" />
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
    case "avatar_map":
      return (
        <>
          <rect width="64" height="64" fill="#141810" />
          <path d="M12 16 L28 12 L36 18 L52 14 L52 50 L36 46 L28 52 L12 48 Z" fill="#3d4a2e" />
          <path d="M20 40 L28 28 L36 34 L44 22" fill="none" stroke="#e8d48b" strokeWidth="2" />
          <circle cx="44" cy="22" r="3" fill="#e85d04" />
          <circle cx="20" cy="40" r="2.5" fill="#5eead4" />
        </>
      );
    case "avatar_fog":
      return (
        <>
          <rect width="64" height="64" fill="#0e141c" />
          <ellipse cx="22" cy="36" rx="16" ry="8" fill="#2a3548" opacity="0.7" />
          <ellipse cx="40" cy="40" rx="18" ry="9" fill="#3a4558" opacity="0.55" />
          <ellipse cx="32" cy="28" rx="14" ry="6" fill="#4a5568" opacity="0.4" />
          <rect x="8" y="44" width="48" height="4" rx="1" fill="#1a2433" />
          <circle cx="48" cy="18" r="1.5" fill="#c9d4e8" opacity="0.6" />
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
    case "avatar_crimson":
      return (
        <>
          <rect width="64" height="64" fill="#1a0c10" />
          <circle cx="30" cy="32" r="16" fill="#7f1d1d" />
          <circle cx="38" cy="36" r="12" fill="#991b1b" opacity="0.9" />
          <ellipse cx="26" cy="26" rx="8" ry="5" fill="#b91c1c" opacity="0.7" />
          <circle cx="42" cy="42" r="5" fill="#450a0a" />
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
    case "avatar_plus_star":
      return (
        <>
          <rect width="64" height="64" fill="#0c1020" />
          <circle cx="20" cy="18" r="1.5" fill="#e8d48b" />
          <circle cx="48" cy="22" r="1.2" fill="#c9d4e8" />
          <circle cx="16" cy="44" r="1" fill="#94a3b8" />
          <path
            d="M32 14 L35 26 L48 26 L38 34 L42 46 L32 38 L22 46 L26 34 L16 26 L29 26 Z"
            fill="#ffba08"
          />
          <circle cx="50" cy="46" r="1.3" fill="#e85d04" />
        </>
      );
    case "avatar_plus_ribbon":
      return (
        <>
          <rect width="64" height="64" fill="#1a1014" />
          <circle cx="32" cy="28" r="14" fill="#991b1b" stroke="#c9a227" strokeWidth="2" />
          <circle cx="32" cy="28" r="7" fill="#7f1d1d" />
          <path d="M26 38 L22 54 L32 46 L42 54 L38 38" fill="#e85d04" />
          <path d="M28 40 L32 48 L36 40" fill="#ffba08" opacity="0.8" />
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
