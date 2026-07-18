/**
 * Forest-clearing habitat baked into the wallpaper.
 * Colors shift with season + day/night; weather overlays live elsewhere.
 */

import type { GardenSeason } from "@daily-puzzle/puzzle-core";

type Props = {
  night: boolean;
  season: GardenSeason;
};

type SeasonPalette = {
  far: string;
  leafDark: string;
  leafMid: string;
  leafLit: string;
  moss: string;
  grass: string;
};

function seasonPalette(season: GardenSeason, night: boolean): SeasonPalette {
  if (season === "autumn") {
    return {
      far: night ? "#2a1c14" : "#5a3a22",
      leafDark: night ? "#3a2414" : "#8a4420",
      leafMid: night ? "#4a3018" : "#c45c28",
      leafLit: night ? "#5a3c20" : "#e08a38",
      moss: night ? "#2a2818" : "#6a5a30",
      grass: night ? "#2a2418" : "#8a7a38",
    };
  }
  if (season === "winter") {
    return {
      far: night ? "#141820" : "#3a4850",
      leafDark: night ? "#1a2228" : "#4a5a58",
      leafMid: night ? "#243038" : "#6a7a72",
      leafLit: night ? "#2e3c42" : "#8a9a90",
      moss: night ? "#1a2220" : "#5a6a60",
      grass: night ? "#1a2420" : "#6a7a68",
    };
  }
  if (season === "spring") {
    return {
      far: night ? "#152418" : "#3a5a38",
      leafDark: night ? "#1e3524" : "#4a7a48",
      leafMid: night ? "#2a4630" : "#6aaa58",
      leafLit: night ? "#386048" : "#8ad070",
      moss: night ? "#243820" : "#5a9a50",
      grass: night ? "#1e3020" : "#78b858",
    };
  }
  // summer
  return {
    far: night ? "#152018" : "#2a4530",
    leafDark: night ? "#1c3324" : "#2f5535",
    leafMid: night ? "#274230" : "#3f6b3f",
    leafLit: night ? "#35553c" : "#5a8a4a",
    moss: night ? "#243820" : "#4a7340",
    grass: night ? "#1e3020" : "#5f8a48",
  };
}

export function GardenHabitat({ night, season }: Props) {
  const p = seasonPalette(season, night);
  const trunk = night ? "#3a2a1c" : "#5c3d28";
  const trunkLit = night ? "#4a3828" : "#7a5538";
  const vine =
    season === "winter"
      ? night
        ? "#2a3438"
        : "#5a6a60"
      : night
        ? "#2a4030"
        : "#3d5c38";
  const stone = night ? "#3a3a36" : season === "winter" ? "#9aa0a4" : "#7a7670";
  const blossom =
    season === "spring" && !night ? "#f2b8c8" : "transparent";

  return (
    <div className="pointer-events-none absolute inset-0 overflow-hidden" aria-hidden>
      {/* Distant forest wall */}
      <svg
        viewBox="0 0 400 120"
        preserveAspectRatio="none"
        className="absolute inset-x-0 top-[18%] h-[42%] w-full opacity-70"
      >
        <path
          d="M0 120 L0 70 Q20 40 40 55 Q55 30 75 50 Q95 25 120 48 Q140 20 165 45 Q190 18 215 42 Q240 22 260 48 Q285 28 310 50 Q335 32 355 55 Q380 40 400 65 L400 120 Z"
          fill={p.far}
        />
        <path
          d="M0 120 L0 85 Q30 55 55 72 Q80 48 110 68 Q145 42 180 65 Q220 45 255 70 Q290 50 325 72 Q360 55 400 78 L400 120 Z"
          fill={p.leafDark}
          opacity="0.85"
        />
      </svg>

      {/* Left oak-like tree — clean upright trunk, canopy covers the tip */}
      <svg
        viewBox="0 0 120 160"
        className="absolute bottom-[22%] left-[-1%] h-[66%] w-[28%] garden-habitat-sway"
        style={{
          transformOrigin: "50% 100%",
          animationDirection: "reverse",
          animationDuration: "6.4s",
        }}
      >
        <ellipse cx="60" cy="152" rx="24" ry="5" fill="#00000028" />
        {/* Straight trunk — tip ends inside the canopy so no brown spikes peek out */}
        <path
          d="M54 152 L52 88 L56 78 L64 78 L68 88 L66 152 Z"
          fill={trunk}
        />
        <path
          d="M58 148 L57 90 L60 82 L62 90 L61 148 Z"
          fill={trunkLit}
          opacity="0.4"
        />
        {season === "winter" ? (
          <>
            <path
              d="M42 78 C36 60 46 42 60 40 C56 28 68 22 80 30 C90 22 102 34 98 48 C108 54 104 68 92 70 C84 80 56 78 46 70 Z"
              fill={p.leafMid}
              opacity="0.45"
            />
            <path
              d="M60 78 L46 52 M60 78 L60 40 M60 78 L74 50 M60 78 L86 58"
              stroke={trunk}
              strokeWidth="2"
              fill="none"
            />
          </>
        ) : (
          <>
            <path
              d="M28 84 C18 66 26 44 44 38 C38 26 48 12 64 14 C74 4 94 10 100 26 C112 20 124 36 118 52 C128 62 122 80 106 84 C108 98 94 108 76 102 C64 112 44 108 34 96 C24 100 20 92 28 84 Z"
              fill={p.leafDark}
            />
            <path
              d="M36 78 C28 62 38 44 54 42 C48 30 60 20 76 24 C88 16 104 28 100 44 C110 50 108 66 96 72 C98 84 84 92 70 86 C58 94 42 90 38 80 Z"
              fill={p.leafMid}
            />
            <path
              d="M50 60 C46 50 56 40 68 42 C66 34 76 30 86 38 C94 34 100 44 96 52 C102 56 100 66 90 66 C84 74 66 72 56 64 Z"
              fill={p.leafLit}
              opacity="0.9"
            />
            {blossom !== "transparent" ? (
              <>
                <circle cx="48" cy="44" r="3" fill={blossom} />
                <circle cx="82" cy="40" r="2.5" fill={blossom} />
                <circle cx="64" cy="30" r="2.2" fill={blossom} opacity="0.85" />
              </>
            ) : null}
          </>
        )}
      </svg>

      {/* Right denser tree — matching upright trunk language */}
      <svg
        viewBox="0 0 120 160"
        className="absolute bottom-[20%] right-[-2%] h-[70%] w-[30%] garden-habitat-sway"
        style={{ transformOrigin: "50% 100%", animationDelay: "-1.8s" }}
      >
        <ellipse cx="60" cy="154" rx="26" ry="5" fill="#00000028" />
        <path
          d="M54 154 L52 90 L56 80 L64 80 L68 90 L66 154 Z"
          fill={trunk}
        />
        <path
          d="M58 150 L57 92 L60 84 L62 92 L61 150 Z"
          fill={trunkLit}
          opacity="0.4"
        />
        {season === "winter" ? (
          <>
            <path
              d="M36 82 C28 62 40 42 58 40 C52 28 66 20 82 28 C94 20 110 34 104 48 C114 56 110 72 94 74 C82 86 50 84 40 74 Z"
              fill={p.leafMid}
              opacity="0.4"
            />
            <path
              d="M60 80 L44 52 M60 80 L60 40 M60 80 L76 50 M60 80 L90 58"
              stroke={trunk}
              strokeWidth="2"
              fill="none"
            />
          </>
        ) : (
          <>
            <path
              d="M24 88 C14 68 22 44 42 38 C34 24 46 10 64 12 C76 2 96 10 102 26 C116 20 128 36 122 54 C132 64 126 84 110 88 C112 102 96 112 78 106 C66 116 44 112 32 100 C22 106 16 96 24 88 Z"
              fill={p.leafDark}
            />
            <path
              d="M34 80 C26 64 36 46 54 44 C48 32 60 22 76 26 C88 18 106 28 102 46 C112 52 112 68 100 74 C102 88 88 96 72 90 C60 98 42 94 36 84 Z"
              fill={p.leafMid}
            />
            <path
              d="M50 62 C46 52 56 42 68 44 C66 36 78 32 88 40 C96 36 104 46 100 56 C106 60 104 70 94 70 C88 78 70 76 58 68 Z"
              fill={p.leafLit}
              opacity="0.88"
            />
            {blossom !== "transparent" ? (
              <>
                <circle cx="48" cy="42" r="2.8" fill={blossom} />
                <circle cx="86" cy="46" r="2.4" fill={blossom} />
              </>
            ) : null}
          </>
        )}
      </svg>

      {/* Mid-ground shrub belt — sits in front of tree trunks */}
      <svg
        viewBox="0 0 400 90"
        preserveAspectRatio="none"
        className="absolute inset-x-0 bottom-[14%] h-[26%] w-full"
      >
        <path
          d="M0 90 L0 48 Q18 28 40 42 Q58 22 82 40 Q108 18 136 38 Q162 24 188 42 Q214 20 242 40 Q270 22 298 44 Q326 26 352 46 Q378 30 400 48 L400 90 Z"
          fill={p.leafDark}
        />
        <path
          d="M0 90 L0 58 Q24 40 52 54 Q78 36 108 52 Q140 34 172 54 Q204 38 236 56 Q268 40 300 58 Q332 44 364 58 Q386 48 400 56 L400 90 Z"
          fill={p.leafMid}
          opacity="0.92"
        />
        <path
          d="M20 70 Q36 52 52 68 Q70 50 88 70 Q108 54 126 72"
          fill="none"
          stroke={p.leafLit}
          strokeWidth="3"
          strokeLinecap="round"
          opacity="0.45"
        />
        <path
          d="M250 72 Q270 54 290 70 Q310 52 330 72 Q350 56 372 74"
          fill="none"
          stroke={p.leafLit}
          strokeWidth="3"
          strokeLinecap="round"
          opacity="0.4"
        />
        {blossom !== "transparent" ? (
          <>
            <circle cx="64" cy="56" r="2.2" fill={blossom} />
            <circle cx="118" cy="50" r="1.8" fill={blossom} />
            <circle cx="280" cy="54" r="2" fill={blossom} />
            <circle cx="340" cy="58" r="1.6" fill={blossom} />
          </>
        ) : null}
      </svg>

      {/* Long hanging vines from canopy — kept off the tree trunks */}
      {season !== "winter" ? (
        <svg
          viewBox="0 0 400 220"
          preserveAspectRatio="none"
          className="absolute inset-x-0 top-0 h-[72%] w-full"
        >
          <path
            d="M22 0 C26 40 14 80 20 120 C24 150 16 180 22 210"
            fill="none"
            stroke={vine}
            strokeWidth="2.4"
            strokeLinecap="round"
            opacity="0.9"
          />
          <path
            d="M38 0 C34 35 46 70 40 110 C36 145 44 175 38 205"
            fill="none"
            stroke={vine}
            strokeWidth="1.8"
            strokeLinecap="round"
            opacity="0.75"
          />
          <path
            d="M362 0 C358 45 370 85 364 125 C360 155 368 185 362 215"
            fill="none"
            stroke={vine}
            strokeWidth="2.2"
            strokeLinecap="round"
            opacity="0.88"
          />
          <path
            d="M380 0 C386 38 374 78 382 118 C386 150 376 180 384 208"
            fill="none"
            stroke={vine}
            strokeWidth="1.6"
            strokeLinecap="round"
            opacity="0.7"
          />
          <ellipse cx="22" cy="208" rx="5" ry="8" fill={p.leafMid} opacity="0.85" />
          <ellipse cx="16" cy="200" rx="4" ry="6" fill={p.leafLit} opacity="0.7" />
          <ellipse cx="38" cy="202" rx="4.5" ry="7" fill={p.leafMid} opacity="0.8" />
          <ellipse cx="362" cy="212" rx="5" ry="8" fill={p.leafMid} opacity="0.85" />
          <ellipse cx="368" cy="204" rx="4" ry="6" fill={p.leafLit} opacity="0.7" />
          <ellipse cx="384" cy="206" rx="4" ry="7" fill={p.leafMid} opacity="0.75" />
        </svg>
      ) : null}

      {/* Ground moss, grass, stones */}
      <svg
        viewBox="0 0 400 140"
        preserveAspectRatio="none"
        className="absolute inset-x-0 bottom-0 h-[42%] w-full"
      >
        <ellipse cx="70" cy="118" rx="55" ry="16" fill={p.moss} opacity="0.55" />
        <ellipse cx="330" cy="122" rx="60" ry="16" fill={p.moss} opacity="0.5" />
        <ellipse cx="200" cy="128" rx="90" ry="14" fill={p.moss} opacity="0.4" />

        {season !== "winter" ? (
          <>
            <path d="M30 110 Q26 90 32 110 Q28 95 34 110" fill={p.grass} />
            <path d="M48 112 Q44 94 50 112 Q46 98 52 112" fill={p.grass} opacity="0.85" />
            <path d="M360 112 Q356 92 362 112 Q358 98 364 112" fill={p.grass} />
            <path d="M378 114 Q374 96 380 114 Q376 100 382 114" fill={p.grass} opacity="0.85" />
          </>
        ) : (
          <>
            <ellipse cx="200" cy="108" rx="120" ry="18" fill="#ffffff55" />
            <ellipse cx="80" cy="112" rx="40" ry="10" fill="#ffffff44" />
            <ellipse cx="320" cy="114" rx="45" ry="10" fill="#ffffff40" />
          </>
        )}

        <ellipse cx="300" cy="108" rx="14" ry="7" fill={stone} opacity="0.75" />
        <ellipse cx="316" cy="112" rx="9" ry="5" fill={stone} opacity="0.6" />
        <ellipse cx="90" cy="106" rx="10" ry="5" fill={stone} opacity="0.55" />
      </svg>

      {/* Foreground fern fronds */}
      {season !== "winter" ? (
        <>
          <svg
            viewBox="0 0 80 100"
            className="absolute bottom-0 left-0 h-[36%] w-[18%]"
          >
            <path
              d="M8 98 C10 70 4 50 18 34 C10 48 14 68 16 90 Z"
              fill={p.leafMid}
            />
            <path
              d="M20 98 C18 72 28 48 40 36 C28 52 26 74 28 96 Z"
              fill={p.leafLit}
              opacity="0.9"
            />
            <path
              d="M32 98 C34 78 44 58 58 48 C44 62 40 80 42 98 Z"
              fill={p.leafMid}
              opacity="0.85"
            />
          </svg>
          <svg
            viewBox="0 0 80 100"
            className="absolute bottom-0 right-0 h-[38%] w-[20%]"
          >
            <path
              d="M72 98 C70 70 76 50 62 34 C70 48 66 68 64 90 Z"
              fill={p.leafMid}
            />
            <path
              d="M60 98 C62 72 52 48 40 36 C52 52 54 74 52 96 Z"
              fill={p.leafLit}
              opacity="0.9"
            />
            <path
              d="M48 98 C46 78 36 58 22 48 C36 62 40 80 38 98 Z"
              fill={p.leafMid}
              opacity="0.85"
            />
          </svg>
        </>
      ) : null}
    </div>
  );
}
