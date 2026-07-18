/** Innate habitat scenery baked into the wallpaper — not movable decorations. */

type Props = {
  night: boolean;
};

export function GardenHabitat({ night }: Props) {
  const canopy = night ? "#1e3320" : "#2d4a28";
  const canopyLit = night ? "#2a4430" : "#3d5c2e";
  const vine = night ? "#2a3e28" : "#3a5a32";
  const moss = night ? "#243820" : "#4f7a3a";
  const fern = night ? "#2e4528" : "#3f6b48";
  const trunk = night ? "#3a2e22" : "#5a4030";
  const stone = night ? "#3a3a36" : "#6d6a63";

  return (
    <div className="pointer-events-none absolute inset-0 overflow-hidden" aria-hidden>
      <svg
        viewBox="0 0 100 100"
        preserveAspectRatio="none"
        className="absolute inset-0 h-full w-full"
      >
        {/* Distant jungle canopy silhouettes */}
        <ellipse cx="8" cy="48" rx="18" ry="22" fill={canopy} opacity="0.55" />
        <ellipse cx="22" cy="42" rx="14" ry="18" fill={canopyLit} opacity="0.5" />
        <ellipse cx="88" cy="46" rx="20" ry="24" fill={canopy} opacity="0.55" />
        <ellipse cx="74" cy="40" rx="15" ry="18" fill={canopyLit} opacity="0.48" />

        {/* Left habitat tree */}
        <path d="M14 88 V52 Q12 46 16 44 Q20 46 18 52 V88" fill={trunk} />
        <ellipse cx="16" cy="42" rx="14" ry="12" fill={canopyLit} />
        <ellipse cx="10" cy="46" rx="9" ry="8" fill={canopy} />
        <ellipse cx="22" cy="44" rx="8" ry="7" fill={canopy} />

        {/* Right habitat tree */}
        <path d="M86 90 V50 Q84 44 88 42 Q92 44 90 50 V90" fill={trunk} />
        <ellipse cx="88" cy="40" rx="15" ry="13" fill={canopyLit} />
        <ellipse cx="80" cy="44" rx="10" ry="9" fill={canopy} />
        <ellipse cx="94" cy="42" rx="9" ry="8" fill={canopy} />

        {/* Vines hanging from canopy */}
        <path
          d="M28 8 Q30 28 26 48"
          fill="none"
          stroke={vine}
          strokeWidth="1.2"
          opacity="0.85"
        />
        <path
          d="M34 4 Q36 22 32 40"
          fill="none"
          stroke={vine}
          strokeWidth="0.9"
          opacity="0.7"
        />
        <path
          d="M68 6 Q66 26 70 46"
          fill="none"
          stroke={vine}
          strokeWidth="1.1"
          opacity="0.8"
        />
        <path
          d="M74 2 Q72 20 76 38"
          fill="none"
          stroke={vine}
          strokeWidth="0.85"
          opacity="0.65"
        />
        <ellipse cx="26" cy="48" rx="2.2" ry="3" fill={fern} opacity="0.9" />
        <ellipse cx="70" cy="46" rx="2" ry="2.8" fill={fern} opacity="0.85" />

        {/* Ground moss patches */}
        <ellipse cx="18" cy="86" rx="12" ry="4" fill={moss} opacity="0.75" />
        <ellipse cx="12" cy="84" rx="6" ry="2.5" fill={moss} opacity="0.55" />
        <ellipse cx="82" cy="88" rx="11" ry="3.5" fill={moss} opacity="0.7" />
        <ellipse cx="90" cy="85" rx="5" ry="2" fill={moss} opacity="0.5" />

        {/* Innate ferns at edges */}
        <path
          d="M8 78 Q4 68 10 62 Q8 70 12 76 Q6 72 8 78"
          fill={fern}
          opacity="0.9"
        />
        <path
          d="M6 80 Q2 72 8 66 Q6 74 10 78"
          fill={fern}
          opacity="0.75"
        />
        <path
          d="M94 80 Q98 70 92 64 Q94 72 90 78 Q96 74 94 80"
          fill={fern}
          opacity="0.9"
        />
        <path
          d="M96 82 Q100 74 94 68 Q96 76 92 80"
          fill={fern}
          opacity="0.75"
        />

        {/* Pebble cluster near ground (habitat, not placeable) */}
        <ellipse cx="72" cy="82" rx="4" ry="2.2" fill={stone} opacity="0.7" />
        <ellipse cx="76" cy="83" rx="3" ry="1.8" fill={stone} opacity="0.55" />
        <ellipse cx="69" cy="83.5" rx="2.4" ry="1.4" fill={stone} opacity="0.5" />
      </svg>

      {/* Soft foreground leaf fringe */}
      <div
        className="absolute inset-x-0 bottom-0 h-[10%]"
        style={{
          background: night
            ? "radial-gradient(ellipse at 15% 100%, #1a2e18 0 22%, transparent 23%), radial-gradient(ellipse at 85% 100%, #1a2e18 0 24%, transparent 25%)"
            : "radial-gradient(ellipse at 15% 100%, #3d5c2e 0 22%, transparent 23%), radial-gradient(ellipse at 85% 100%, #3d5c2e 0 24%, transparent 25%)",
        }}
      />
    </div>
  );
}
