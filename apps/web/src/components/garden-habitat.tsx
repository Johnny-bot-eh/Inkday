/**
 * Forest-clearing habitat baked into the wallpaper.
 * Trees/vines/groundcover are scenery — not movable decorations.
 * Drawn as separate positioned SVGs so aspect ratio does not squash shapes.
 */

type Props = {
  night: boolean;
};

export function GardenHabitat({ night }: Props) {
  const far = night ? "#152018" : "#2a4530";
  const leafDark = night ? "#1c3324" : "#2f5535";
  const leafMid = night ? "#274230" : "#3f6b3f";
  const leafLit = night ? "#35553c" : "#5a8a4a";
  const trunk = night ? "#3a2a1c" : "#5c3d28";
  const trunkLit = night ? "#4a3828" : "#7a5538";
  const vine = night ? "#2a4030" : "#3d5c38";
  const moss = night ? "#243820" : "#4a7340";
  const grass = night ? "#1e3020" : "#5f8a48";
  const stone = night ? "#3a3a36" : "#7a7670";
  const nest = night ? "#4a3828" : "#8a6a40";
  const nestDark = night ? "#2e2418" : "#5c4428";

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
          fill={far}
        />
        <path
          d="M0 120 L0 85 Q30 55 55 72 Q80 48 110 68 Q145 42 180 65 Q220 45 255 70 Q290 50 325 72 Q360 55 400 78 L400 120 Z"
          fill={leafDark}
          opacity="0.85"
        />
      </svg>

      {/* Left oak-like tree */}
      <svg
        viewBox="0 0 120 160"
        className="absolute bottom-[8%] left-[-2%] h-[78%] w-[34%] garden-sway"
        style={{ transformOrigin: "50% 100%" }}
      >
        <ellipse cx="58" cy="152" rx="28" ry="6" fill="#00000028" />
        <path
          d="M52 152 C50 110 48 90 54 72 C46 78 40 88 36 98 C42 86 50 78 58 74 C62 68 66 62 70 58 C68 72 66 100 64 152 Z"
          fill={trunk}
        />
        <path
          d="M54 100 C62 88 74 82 86 86 C78 92 68 98 60 108 Z"
          fill={trunkLit}
          opacity="0.55"
        />
        <path
          d="M28 78 C18 62 22 42 40 36 C34 28 38 16 54 14 C62 6 78 8 86 20 C98 14 112 24 110 40 C122 48 118 68 104 74 C108 88 96 98 80 94 C72 104 54 100 42 92 C32 96 24 88 28 78 Z"
          fill={leafDark}
        />
        <path
          d="M36 70 C28 56 36 40 52 38 C48 28 58 18 72 22 C82 14 98 22 98 36 C108 40 110 56 100 64 C102 76 90 84 76 80 C68 88 50 84 42 76 Z"
          fill={leafMid}
        />
        <path
          d="M48 58 C44 48 52 38 64 40 C62 32 72 28 82 34 C90 30 98 38 96 48 C102 52 100 62 90 64 C86 72 70 70 60 64 Z"
          fill={leafLit}
          opacity="0.9"
        />
      </svg>

      {/* Right denser tree */}
      <svg
        viewBox="0 0 120 160"
        className="absolute bottom-[6%] right-[-3%] h-[82%] w-[36%] garden-sway"
        style={{ transformOrigin: "50% 100%", animationDelay: "-1.8s" }}
      >
        <ellipse cx="62" cy="154" rx="30" ry="6" fill="#00000028" />
        <path
          d="M56 154 C54 118 52 96 58 76 C50 84 42 96 38 110 C46 96 54 84 62 78 C66 70 70 64 74 60 C72 78 70 112 68 154 Z"
          fill={trunk}
        />
        <path
          d="M22 86 C12 68 18 44 38 38 C30 26 40 12 58 14 C68 4 88 10 94 24 C108 18 122 32 116 48 C128 58 122 78 106 82 C110 96 96 108 78 102 C66 112 44 108 32 98 C22 104 16 96 22 86 Z"
          fill={leafDark}
        />
        <path
          d="M34 78 C26 62 34 46 52 44 C46 32 58 22 74 26 C86 18 104 28 102 44 C112 50 112 66 100 72 C102 86 88 94 72 88 C60 96 42 92 36 82 Z"
          fill={leafMid}
        />
        <path
          d="M50 60 C46 50 56 40 68 42 C66 34 78 30 88 38 C96 34 104 44 100 54 C106 58 104 68 94 68 C88 76 70 74 58 66 Z"
          fill={leafLit}
          opacity="0.88"
        />
      </svg>

      {/* Long hanging vines from canopy */}
      <svg
        viewBox="0 0 400 220"
        preserveAspectRatio="none"
        className="absolute inset-x-0 top-0 h-[72%] w-full"
      >
        <path
          d="M48 0 C52 40 40 80 46 120 C50 150 42 180 48 210"
          fill="none"
          stroke={vine}
          strokeWidth="2.4"
          strokeLinecap="round"
          opacity="0.9"
        />
        <path
          d="M70 0 C66 35 78 70 72 110 C68 145 76 175 70 205"
          fill="none"
          stroke={vine}
          strokeWidth="1.8"
          strokeLinecap="round"
          opacity="0.75"
        />
        <path
          d="M330 0 C326 45 338 85 332 125 C328 155 336 185 330 215"
          fill="none"
          stroke={vine}
          strokeWidth="2.2"
          strokeLinecap="round"
          opacity="0.88"
        />
        <path
          d="M352 0 C358 38 346 78 354 118 C358 150 348 180 356 208"
          fill="none"
          stroke={vine}
          strokeWidth="1.6"
          strokeLinecap="round"
          opacity="0.7"
        />
        <path
          d="M108 0 C104 30 112 55 106 85"
          fill="none"
          stroke={vine}
          strokeWidth="1.4"
          opacity="0.55"
        />
        <path
          d="M292 0 C296 28 288 58 294 90"
          fill="none"
          stroke={vine}
          strokeWidth="1.4"
          opacity="0.55"
        />
        {/* Leaf clusters on vine tips */}
        <ellipse cx="48" cy="208" rx="5" ry="8" fill={leafMid} opacity="0.85" />
        <ellipse cx="42" cy="200" rx="4" ry="6" fill={leafLit} opacity="0.7" />
        <ellipse cx="70" cy="202" rx="4.5" ry="7" fill={leafMid} opacity="0.8" />
        <ellipse cx="330" cy="212" rx="5" ry="8" fill={leafMid} opacity="0.85" />
        <ellipse cx="336" cy="204" rx="4" ry="6" fill={leafLit} opacity="0.7" />
        <ellipse cx="356" cy="206" rx="4" ry="7" fill={leafMid} opacity="0.75" />
      </svg>

      {/* Ground moss, grass, stones, nest bed */}
      <svg
        viewBox="0 0 400 140"
        preserveAspectRatio="none"
        className="absolute inset-x-0 bottom-0 h-[42%] w-full"
      >
        {/* Soft ground patches */}
        <ellipse cx="70" cy="118" rx="55" ry="16" fill={moss} opacity="0.55" />
        <ellipse cx="330" cy="122" rx="60" ry="16" fill={moss} opacity="0.5" />
        <ellipse cx="200" cy="128" rx="90" ry="14" fill={moss} opacity="0.4" />

        {/* Grass tufts */}
        <path d="M30 110 Q26 90 32 110 Q28 95 34 110" fill={grass} />
        <path d="M48 112 Q44 94 50 112 Q46 98 52 112" fill={grass} opacity="0.85" />
        <path d="M360 112 Q356 92 362 112 Q358 98 364 112" fill={grass} />
        <path d="M378 114 Q374 96 380 114 Q376 100 382 114" fill={grass} opacity="0.85" />
        <path d="M120 118 Q116 104 122 118" fill={grass} opacity="0.7" />
        <path d="M280 120 Q276 106 282 120" fill={grass} opacity="0.7" />

        {/* Stones */}
        <ellipse cx="300" cy="108" rx="14" ry="7" fill={stone} opacity="0.75" />
        <ellipse cx="316" cy="112" rx="9" ry="5" fill={stone} opacity="0.6" />
        <ellipse cx="90" cy="106" rx="10" ry="5" fill={stone} opacity="0.55" />

        {/* Nest / moss bed under companion */}
        <ellipse cx="208" cy="102" rx="42" ry="14" fill={nestDark} opacity="0.55" />
        <ellipse cx="208" cy="100" rx="36" ry="11" fill={nest} opacity="0.85" />
        <ellipse cx="208" cy="98" rx="28" ry="8" fill={moss} opacity="0.75" />
        <path
          d="M176 96 Q182 88 190 94 Q198 86 208 92 Q218 86 226 94 Q234 88 240 96"
          fill="none"
          stroke={nestDark}
          strokeWidth="2.2"
          strokeLinecap="round"
          opacity="0.7"
        />
        <path
          d="M180 100 Q188 94 196 100 Q208 92 220 100 Q228 94 236 100"
          fill="none"
          stroke={nest}
          strokeWidth="1.6"
          strokeLinecap="round"
          opacity="0.8"
        />
      </svg>

      {/* Foreground fern fronds */}
      <svg
        viewBox="0 0 80 100"
        className="absolute bottom-0 left-0 h-[36%] w-[18%]"
      >
        <path
          d="M8 98 C10 70 4 50 18 34 C10 48 14 68 16 90 Z"
          fill={leafMid}
        />
        <path
          d="M20 98 C18 72 28 48 40 36 C28 52 26 74 28 96 Z"
          fill={leafLit}
          opacity="0.9"
        />
        <path
          d="M32 98 C34 78 44 58 58 48 C44 62 40 80 42 98 Z"
          fill={leafMid}
          opacity="0.85"
        />
      </svg>
      <svg
        viewBox="0 0 80 100"
        className="absolute bottom-0 right-0 h-[38%] w-[20%]"
      >
        <path
          d="M72 98 C70 70 76 50 62 34 C70 48 66 68 64 90 Z"
          fill={leafMid}
        />
        <path
          d="M60 98 C62 72 52 48 40 36 C52 52 54 74 52 96 Z"
          fill={leafLit}
          opacity="0.9"
        />
        <path
          d="M48 98 C46 78 36 58 22 48 C36 62 40 80 38 98 Z"
          fill={leafMid}
          opacity="0.85"
        />
      </svg>
    </div>
  );
}
