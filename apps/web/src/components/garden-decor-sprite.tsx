/** Realistic SVG sprites for placeable garden decorations (no letters / captions). */

type Props = {
  itemId: string;
  tone: string;
  className?: string;
};

export function GardenDecorSprite({ itemId, tone, className }: Props) {
  switch (itemId) {
    case "deco_clover":
      return <CloverSprite className={className} />;
    case "deco_mushroom":
    case "deco_toadstool":
      return itemId === "deco_toadstool" ? (
        <ToadstoolSprite className={className} />
      ) : (
        <MushroomSprite className={className} />
      );
    case "deco_pebble_stack":
    case "deco_stepping_stones":
      return <PebbleStackSprite className={className} wide={itemId === "deco_stepping_stones"} />;
    case "deco_dandelion":
      return <DandelionSprite className={className} />;
    case "deco_berry_bush":
      return <BerryBushSprite className={className} />;
    case "deco_wildflower":
      return <WildflowerSprite className={className} />;
    case "deco_acorn_pile":
      return <AcornPileSprite className={className} />;
    case "deco_sunflower":
      return <SunflowerSprite className={className} />;
    case "deco_birdbath":
      return <BirdbathSprite className={className} />;
    case "deco_watering_can":
      return <WateringCanSprite className={className} />;
    case "deco_lily":
      return <LilySprite className={className} />;
    case "deco_rose":
      return <RoseSprite className={className} />;
    case "deco_lavender":
      return <LavenderSprite className={className} />;
    case "deco_log_bench":
      return <LogBenchSprite className={className} />;
    case "deco_crystal":
      return <CrystalSprite className={className} />;
    case "deco_wind_chime":
      return <WindChimeSprite className={className} />;
    case "deco_stone_lantern":
      return <StoneLanternSprite className={className} />;
    case "deco_reeds":
      return <ReedsSprite className={className} />;
    case "deco_mini_fountain":
      return <MiniFountainSprite className={className} />;
    case "deco_vine_arch":
      return <VineArchSprite className={className} />;
    case "deco_garden_statue":
      return <GardenStatueSprite className={className} />;
    case "deco_trellis":
      return <TrellisSprite className={className} />;
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
    case "deco_pine":
      return <PineSprite className={className} />;
    case "deco_birch":
      return <BirchSprite className={className} />;
    case "deco_seasonal_lantern":
      return <SeasonalLanternSprite className={className} />;
    case "deco_festival_banner":
      return <FestivalBannerSprite className={className} />;
    case "deco_legendary_obelisk":
      return <ObeliskSprite className={className} />;
    case "deco_mythic_gate":
      return <MythicGateSprite className={className} />;
    case "deco_grass_tuft":
    case "deco_twig":
    case "deco_fern_pot":
    case "deco_snail_shell":
    case "deco_ivy_pot":
      return <GenericPlantSprite className={className} tone={tone} />;
    case "deco_wheelbarrow":
      return <WheelbarrowSprite className={className} />;
    case "deco_beehive":
      return <BeehiveSprite className={className} />;
    case "deco_orchid":
      return <OrchidSprite className={className} />;
    case "deco_hammock":
      return <HammockSprite className={className} />;
    case "deco_scarecrow":
      return <ScarecrowSprite className={className} />;
    case "deco_koi_bridge":
      return <KoiBridgeSprite className={className} />;
    case "deco_lily_pad":
      return <LilyPadSprite className={className} />;
    case "deco_dragonfly":
      return <DragonflySprite className={className} />;
    case "deco_gazebo_mini":
      return <GazeboSprite className={className} />;
    case "deco_moon_gate":
      return <MoonGateSprite className={className} />;
    case "deco_maple":
      return <MapleSprite className={className} />;
    case "deco_bamboo":
      return <BambooSprite className={className} />;
    case "deco_firefly_jar":
      return <FireflyJarSprite className={className} />;
    case "deco_snow_lantern":
      return <SnowLanternSprite className={className} />;
    case "deco_harvest_wreath":
      return <HarvestWreathSprite className={className} />;
    case "deco_aurora_spire":
      return <AuroraSpireSprite className={className} />;
    case "deco_starfall_orb":
      return <StarfallOrbSprite className={className} />;
    case "deco_eternal_fountain":
      return <EternalFountainSprite className={className} />;
    default:
      return <GenericPlantSprite className={className} tone={tone} />;
  }
}

function PebbleStackSprite({
  className,
  wide,
}: {
  className?: string;
  wide?: boolean;
}) {
  return (
    <svg viewBox={wide ? "0 0 96 40" : "0 0 64 48"} className={className} aria-hidden>
      <ellipse cx={wide ? 48 : 32} cy={wide ? 34 : 42} rx={wide ? 36 : 14} ry="3" fill="#00000022" />
      {wide ? (
        <>
          <ellipse cx="22" cy="28" rx="12" ry="6" fill="#7a7670" />
          <ellipse cx="48" cy="26" rx="14" ry="7" fill="#8a8680" />
          <ellipse cx="74" cy="28" rx="11" ry="6" fill="#6a6660" />
        </>
      ) : (
        <>
          <ellipse cx="32" cy="36" rx="14" ry="7" fill="#7a7670" />
          <ellipse cx="26" cy="28" rx="9" ry="5" fill="#8a8680" />
          <ellipse cx="38" cy="30" rx="8" ry="4.5" fill="#6a6660" />
          <ellipse cx="32" cy="22" rx="7" ry="4" fill="#9a9690" />
        </>
      )}
    </svg>
  );
}

function DandelionSprite({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 48 64" className={className} aria-hidden>
      <ellipse cx="24" cy="58" rx="8" ry="2.5" fill="#00000022" />
      <path d="M24 58 V28" stroke="#4a7a42" strokeWidth="2" />
      <circle cx="24" cy="24" r="10" fill="#e8c84a" />
      <circle cx="24" cy="24" r="5" fill="#c9a227" />
    </svg>
  );
}

function WildflowerSprite({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 64 64" className={className} aria-hidden>
      <ellipse cx="32" cy="58" rx="12" ry="3" fill="#00000022" />
      <path d="M20 58 V36 M32 58 V30 M44 58 V38" stroke="#3d6b38" strokeWidth="2" />
      <circle cx="20" cy="32" r="5" fill="#c45c8a" />
      <circle cx="32" cy="26" r="5" fill="#7a8ad0" />
      <circle cx="44" cy="34" r="5" fill="#e8b84a" />
    </svg>
  );
}

function AcornPileSprite({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 56 48" className={className} aria-hidden>
      <ellipse cx="28" cy="42" rx="16" ry="3" fill="#00000022" />
      <ellipse cx="22" cy="32" rx="8" ry="10" fill="#8a5a30" />
      <ellipse cx="22" cy="26" rx="8" ry="4" fill="#6a4020" />
      <ellipse cx="34" cy="34" rx="7" ry="9" fill="#9a6a38" />
      <ellipse cx="34" cy="28" rx="7" ry="3.5" fill="#6a4020" />
    </svg>
  );
}

function WateringCanSprite({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 64 56" className={className} aria-hidden>
      <ellipse cx="28" cy="50" rx="14" ry="3" fill="#00000022" />
      <rect x="14" y="24" width="28" height="20" rx="4" fill="#5a8aaa" />
      <path d="M42 30 H54 Q58 30 58 36 V40" fill="none" stroke="#5a8aaa" strokeWidth="4" />
      <path d="M20 24 Q28 14 36 24" fill="none" stroke="#4a7088" strokeWidth="3" />
      <ellipse cx="28" cy="24" rx="12" ry="4" fill="#6a9aba" />
    </svg>
  );
}

function LilySprite({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 56 72" className={className} aria-hidden>
      <ellipse cx="28" cy="66" rx="10" ry="3" fill="#00000022" />
      <path d="M28 66 V36" stroke="#3d6b38" strokeWidth="2.5" />
      <path d="M28 48 Q18 44 16 52" fill="#4a8040" />
      <ellipse cx="28" cy="28" rx="14" ry="10" fill="#f0e8f4" />
      <ellipse cx="28" cy="28" rx="6" ry="4" fill="#e8c84a" />
    </svg>
  );
}

function RoseSprite({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 48 72" className={className} aria-hidden>
      <ellipse cx="24" cy="66" rx="9" ry="2.5" fill="#00000022" />
      <path d="M24 66 V34" stroke="#3d6b38" strokeWidth="2.5" />
      <circle cx="24" cy="28" r="12" fill="#b83a4a" />
      <circle cx="24" cy="28" r="7" fill="#d45a68" />
      <circle cx="24" cy="28" r="3" fill="#8a2030" />
    </svg>
  );
}

function LavenderSprite({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 56 72" className={className} aria-hidden>
      <ellipse cx="28" cy="66" rx="12" ry="3" fill="#00000022" />
      <path d="M18 66 V30 M28 66 V26 M38 66 V32" stroke="#4a6b38" strokeWidth="2" />
      <ellipse cx="18" cy="24" rx="4" ry="10" fill="#8a6aaa" />
      <ellipse cx="28" cy="20" rx="4" ry="11" fill="#9a7aba" />
      <ellipse cx="38" cy="26" rx="4" ry="10" fill="#8a6aaa" />
    </svg>
  );
}

function WindChimeSprite({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 48 72" className={className} aria-hidden>
      <path d="M24 8 V18" stroke="#5a4030" strokeWidth="2" />
      <ellipse cx="24" cy="20" rx="14" ry="4" fill="#8a6a40" />
      <path d="M14 22 V48 M24 22 V54 M34 22 V46" stroke="#c9a227" strokeWidth="2.5" />
      <circle cx="14" cy="50" r="2" fill="#e8c84a" />
      <circle cx="24" cy="56" r="2" fill="#e8c84a" />
      <circle cx="34" cy="48" r="2" fill="#e8c84a" />
    </svg>
  );
}

function StoneLanternSprite({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 48 72" className={className} aria-hidden>
      <ellipse cx="24" cy="66" rx="12" ry="3" fill="#00000022" />
      <rect x="16" y="48" width="16" height="16" rx="2" fill="#7a7670" />
      <rect x="12" y="28" width="24" height="22" rx="3" fill="#8a8680" />
      <rect x="18" y="32" width="12" height="12" rx="1" fill="#f0d878" opacity="0.85" />
      <path d="M10 28 L24 16 L38 28 Z" fill="#6a6660" />
    </svg>
  );
}

function ReedsSprite({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 64 72" className={className} aria-hidden>
      <ellipse cx="32" cy="66" rx="14" ry="3" fill="#00000022" />
      <path d="M18 66 Q16 30 20 18 M32 66 Q34 28 30 14 M46 66 Q48 32 44 20" fill="none" stroke="#5a7a48" strokeWidth="2.5" />
      <ellipse cx="20" cy="16" rx="3" ry="6" fill="#6a8a50" />
      <ellipse cx="30" cy="12" rx="3" ry="6" fill="#5a7a48" />
      <ellipse cx="44" cy="18" rx="3" ry="6" fill="#6a8a50" />
    </svg>
  );
}

function GardenStatueSprite({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 48 72" className={className} aria-hidden>
      <ellipse cx="24" cy="66" rx="12" ry="3" fill="#00000022" />
      <ellipse cx="24" cy="58" rx="14" ry="5" fill="#8a9098" />
      <ellipse cx="24" cy="40" rx="10" ry="14" fill="#9aa0a8" />
      <circle cx="24" cy="22" r="8" fill="#b0b6bc" />
    </svg>
  );
}

function TrellisSprite({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 64 80" className={className} aria-hidden>
      <path d="M12 74 V20 M52 74 V20" stroke="#6a4a30" strokeWidth="3" />
      <path d="M12 28 H52 M12 40 H52 M12 52 H52" stroke="#8a6a48" strokeWidth="2" />
      <ellipse cx="24" cy="30" rx="6" ry="4" fill="#6a8a50" />
      <ellipse cx="40" cy="42" rx="6" ry="4" fill="#4a7a42" />
      <ellipse cx="32" cy="54" rx="5" ry="3" fill="#c45c8a" />
    </svg>
  );
}

function PineSprite({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 64 90" className={className} aria-hidden>
      <ellipse cx="32" cy="84" rx="14" ry="3" fill="#00000022" />
      <rect x="28" y="60" width="8" height="24" fill="#5a4030" />
      <path d="M32 12 L48 40 H16 Z" fill="#2d4a28" />
      <path d="M32 24 L52 52 H12 Z" fill="#3d5c2e" />
      <path d="M32 36 L56 68 H8 Z" fill="#2f5535" />
    </svg>
  );
}

function BirchSprite({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 64 90" className={className} aria-hidden>
      <ellipse cx="32" cy="84" rx="12" ry="3" fill="#00000022" />
      <rect x="28" y="40" width="8" height="44" fill="#e8e0d0" />
      <rect x="30" y="48" width="2" height="6" fill="#5a4030" opacity="0.5" />
      <rect x="30" y="62" width="2" height="5" fill="#5a4030" opacity="0.45" />
      <ellipse cx="32" cy="28" rx="20" ry="16" fill="#8aaa68" />
      <ellipse cx="22" cy="34" rx="10" ry="8" fill="#6a8a50" />
    </svg>
  );
}

function FestivalBannerSprite({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 80 56" className={className} aria-hidden>
      <path d="M8 10 H72" stroke="#5a4030" strokeWidth="3" />
      <path d="M16 10 V40 L24 34 L32 40 V10" fill="#c45c6a" />
      <path d="M40 10 V38 L48 32 L56 38 V10" fill="#e8b84a" />
      <path d="M60 10 V36 L68 30 V10" fill="#5a8aaa" />
    </svg>
  );
}

function MythicGateSprite({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 96 80" className={className} aria-hidden>
      <ellipse cx="20" cy="74" rx="10" ry="3" fill="#00000022" />
      <ellipse cx="76" cy="74" rx="10" ry="3" fill="#00000022" />
      <rect x="12" y="28" width="10" height="46" fill="#6a5a9a" />
      <rect x="74" y="28" width="10" height="46" fill="#6a5a9a" />
      <path d="M12 28 Q48 4 84 28" fill="#8a7abc" />
      <circle cx="48" cy="22" r="4" fill="#e8d8ff" />
      <path d="M28 40 V68 M40 40 V68 M56 40 V68 M68 40 V68" stroke="#b0a0e0" strokeWidth="2" />
    </svg>
  );
}

function CloverSprite({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 64 64" className={className} aria-hidden>
      <ellipse cx="32" cy="58" rx="10" ry="3" fill="#00000022" />
      <path d="M32 58 V40" stroke="#3d6b38" strokeWidth="2" strokeLinecap="round" />
      {[0, 90, 180, 270].map((deg) => {
        const rad = ((deg - 45) * Math.PI) / 180;
        const cx = 32 + Math.cos(rad) * 8;
        const cy = 34 + Math.sin(rad) * 8;
        return (
          <ellipse
            key={deg}
            cx={cx}
            cy={cy}
            rx="7"
            ry="5"
            fill="#4a8a42"
            transform={`rotate(${deg} ${cx} ${cy})`}
          />
        );
      })}
      <circle cx="32" cy="34" r="2.5" fill="#3d6b38" />
    </svg>
  );
}

function MushroomSprite({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 64 64" className={className} aria-hidden>
      <ellipse cx="32" cy="58" rx="10" ry="3" fill="#00000022" />
      <path
        d="M26 56 V40 Q26 34 32 34 Q38 34 38 40 V56"
        fill="#e8d8c0"
      />
      <path
        d="M14 38 Q14 22 32 18 Q50 22 50 38 Q42 34 32 34 Q22 34 14 38 Z"
        fill="#c45c5c"
      />
      <circle cx="24" cy="30" r="3" fill="#f5e8e0" opacity="0.9" />
      <circle cx="36" cy="26" r="2.5" fill="#f5e8e0" opacity="0.85" />
      <circle cx="42" cy="32" r="2" fill="#f5e8e0" opacity="0.8" />
    </svg>
  );
}

function BerryBushSprite({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 72 64" className={className} aria-hidden>
      <ellipse cx="36" cy="58" rx="16" ry="3.5" fill="#00000022" />
      <ellipse cx="36" cy="40" rx="24" ry="16" fill="#3d6b38" />
      <ellipse cx="24" cy="42" rx="12" ry="10" fill="#4a8040" />
      <ellipse cx="48" cy="40" rx="12" ry="10" fill="#355528" />
      <circle cx="28" cy="38" r="2.2" fill="#c45c6a" />
      <circle cx="40" cy="34" r="2" fill="#c45c6a" />
      <circle cx="48" cy="42" r="2.2" fill="#a83a4a" />
      <circle cx="22" cy="44" r="1.8" fill="#a83a4a" />
      <circle cx="36" cy="44" r="2" fill="#c45c6a" />
    </svg>
  );
}

function ToadstoolSprite({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 64 72" className={className} aria-hidden>
      <ellipse cx="32" cy="66" rx="12" ry="3" fill="#00000022" />
      <path
        d="M27 64 V40 Q27 34 32 34 Q37 34 37 40 V64"
        fill="#efe4d0"
      />
      <path
        d="M12 40 Q12 18 32 14 Q52 18 52 40 Q42 34 32 34 Q22 34 12 40 Z"
        fill="#d46a7a"
      />
      <ellipse cx="32" cy="28" rx="14" ry="6" fill="#e88898" opacity="0.55" />
      <circle cx="22" cy="30" r="2.5" fill="#fff0f2" opacity="0.85" />
      <circle cx="34" cy="24" r="3" fill="#fff0f2" opacity="0.8" />
      <circle cx="42" cy="32" r="2" fill="#fff0f2" opacity="0.75" />
    </svg>
  );
}

function SunflowerSprite({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 64 80" className={className} aria-hidden>
      <ellipse cx="32" cy="74" rx="10" ry="3" fill="#00000022" />
      <path d="M32 74 V40" stroke="#3d6b38" strokeWidth="3" strokeLinecap="round" />
      <path d="M32 56 Q22 50 20 58" fill="#4a8040" />
      <path d="M32 50 Q42 46 44 54" fill="#4a8040" />
      {[0, 45, 90, 135, 180, 225, 270, 315].map((deg) => {
        const rad = (deg * Math.PI) / 180;
        const cx = 32 + Math.cos(rad) * 12;
        const cy = 30 + Math.sin(rad) * 12;
        return (
          <ellipse
            key={deg}
            cx={cx}
            cy={cy}
            rx="7"
            ry="3.5"
            fill="#e8b84a"
            transform={`rotate(${deg} ${cx} ${cy})`}
          />
        );
      })}
      <circle cx="32" cy="30" r="8" fill="#5a3d20" />
      <circle cx="32" cy="30" r="5" fill="#3d2a14" />
    </svg>
  );
}

function BirdbathSprite({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 72 64" className={className} aria-hidden>
      <ellipse cx="36" cy="58" rx="14" ry="3" fill="#00000022" />
      <rect x="32" y="36" width="8" height="20" rx="2" fill="#8a9098" />
      <ellipse cx="36" cy="54" rx="12" ry="4" fill="#6a7078" />
      <ellipse cx="36" cy="34" rx="24" ry="8" fill="#8a9098" />
      <ellipse cx="36" cy="32" rx="20" ry="6" fill="#6a9ab0" />
      <ellipse cx="30" cy="30" rx="8" ry="2.5" fill="#ffffff44" />
    </svg>
  );
}

function LogBenchSprite({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 96 48" className={className} aria-hidden>
      <ellipse cx="48" cy="42" rx="34" ry="4" fill="#00000022" />
      <rect x="14" y="22" width="68" height="14" rx="6" fill="#6a4a30" />
      <rect x="18" y="24" width="60" height="6" rx="3" fill="#8a6a48" opacity="0.7" />
      <ellipse cx="20" cy="29" rx="5" ry="7" fill="#5a3d24" />
      <ellipse cx="76" cy="29" rx="5" ry="7" fill="#5a3d24" />
      <path
        d="M28 28 Q48 24 68 28"
        fill="none"
        stroke="#4a3420"
        strokeWidth="1.5"
        opacity="0.5"
      />
    </svg>
  );
}

function CrystalSprite({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 48 72" className={className} aria-hidden>
      <ellipse cx="24" cy="66" rx="12" ry="3" fill="#00000022" />
      <path d="M24 8 L36 28 L30 64 L18 64 L12 28 Z" fill="#7ec8e8" />
      <path d="M24 8 L30 28 L26 64 L18 64 L16 30 Z" fill="#b8e8f8" opacity="0.85" />
      <path d="M24 8 L18 30 L22 64 L30 64 L32 28 Z" fill="#5aa8c8" opacity="0.55" />
      <path d="M20 20 L24 12 L28 22" fill="#ffffff88" />
    </svg>
  );
}

function MiniFountainSprite({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 80 72" className={className} aria-hidden>
      <ellipse cx="40" cy="66" rx="28" ry="4" fill="#00000022" />
      <ellipse cx="40" cy="58" rx="30" ry="10" fill="#8a9098" />
      <ellipse cx="40" cy="56" rx="24" ry="7" fill="#5a9ab0" />
      <rect x="36" y="30" width="8" height="26" rx="2" fill="#9aa0a8" />
      <ellipse cx="40" cy="30" rx="10" ry="4" fill="#8a9098" />
      <ellipse cx="40" cy="28" rx="7" ry="2.5" fill="#7ec8e8" />
      <path
        d="M40 28 Q34 20 40 14 Q46 20 40 28"
        fill="#a8d8e8"
        opacity="0.8"
      />
      <circle cx="40" cy="12" r="2" fill="#c8e8f4" />
      <ellipse cx="32" cy="54" rx="4" ry="1.5" fill="#ffffff44" />
    </svg>
  );
}

function VineArchSprite({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 96 80" className={className} aria-hidden>
      <ellipse cx="20" cy="74" rx="10" ry="3" fill="#00000022" />
      <ellipse cx="76" cy="74" rx="10" ry="3" fill="#00000022" />
      <path d="M18 74 V36" stroke="#5a4030" strokeWidth="4" strokeLinecap="round" />
      <path d="M78 74 V36" stroke="#5a4030" strokeWidth="4" strokeLinecap="round" />
      <path
        d="M18 36 Q48 8 78 36"
        fill="none"
        stroke="#3f6b48"
        strokeWidth="5"
        strokeLinecap="round"
      />
      <path
        d="M22 38 Q48 14 74 38"
        fill="none"
        stroke="#5a8a4a"
        strokeWidth="3"
        strokeLinecap="round"
      />
      <ellipse cx="30" cy="30" rx="6" ry="4" fill="#4a7a42" />
      <ellipse cx="48" cy="18" rx="7" ry="4" fill="#3f6b48" />
      <ellipse cx="66" cy="30" rx="6" ry="4" fill="#4a7a42" />
      <ellipse cx="40" cy="26" rx="5" ry="3" fill="#5a8a4a" />
      <ellipse cx="58" cy="24" rx="5" ry="3" fill="#5a8a4a" />
    </svg>
  );
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

function WheelbarrowSprite({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 72 56" className={className} aria-hidden>
      <ellipse cx="36" cy="50" rx="20" ry="3" fill="#00000022" />
      <path d="M14 38 H52 L48 28 H18 Z" fill="#8a5a30" />
      <circle cx="48" cy="44" r="8" fill="#5a4030" stroke="#8a6a50" strokeWidth="2" />
      <rect x="12" y="34" width="8" height="4" rx="1" fill="#6a5030" />
    </svg>
  );
}

function BeehiveSprite({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 48 56" className={className} aria-hidden>
      <ellipse cx="24" cy="50" rx="10" ry="3" fill="#00000022" />
      <ellipse cx="24" cy="32" rx="14" ry="16" fill="#c9a227" />
      <path d="M12 28 H36 M12 34 H36 M12 40 H36" stroke="#8a6a20" strokeWidth="2" />
    </svg>
  );
}

function OrchidSprite({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 48 64" className={className} aria-hidden>
      <ellipse cx="24" cy="58" rx="8" ry="2.5" fill="#00000022" />
      <path d="M24 58 V32" stroke="#3d6b38" strokeWidth="2" />
      <ellipse cx="24" cy="26" rx="10" ry="8" fill="#8a4aaa" />
      <ellipse cx="20" cy="22" rx="4" ry="6" fill="#b06acc" />
      <ellipse cx="28" cy="22" rx="4" ry="6" fill="#b06acc" />
    </svg>
  );
}

function HammockSprite({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 96 48" className={className} aria-hidden>
      <line x1="8" y1="8" x2="8" y2="32" stroke="#6a5030" strokeWidth="3" />
      <line x1="88" y1="8" x2="88" y2="32" stroke="#6a5030" strokeWidth="3" />
      <path d="M8 16 Q48 36 88 16" fill="none" stroke="#c45c6a" strokeWidth="6" />
      <path d="M8 20 Q48 40 88 20" fill="#d46a7a" opacity="0.6" />
    </svg>
  );
}

function ScarecrowSprite({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 48 72" className={className} aria-hidden>
      <ellipse cx="24" cy="66" rx="10" ry="3" fill="#00000022" />
      <line x1="24" y1="20" x2="24" y2="58" stroke="#8a6a30" strokeWidth="3" />
      <line x1="8" y1="32" x2="40" y2="32" stroke="#8a6a30" strokeWidth="3" />
      <circle cx="24" cy="16" r="8" fill="#c9a88a" />
      <path d="M16 12 L32 12 L28 8 L20 8 Z" fill="#8a5a30" />
    </svg>
  );
}

function KoiBridgeSprite({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 96 56" className={className} aria-hidden>
      <ellipse cx="48" cy="48" rx="36" ry="6" fill="#3d6f8f" opacity="0.5" />
      <path d="M12 40 Q48 8 84 40" fill="none" stroke="#8a5a30" strokeWidth="5" />
      <path d="M16 38 Q48 12 80 38" fill="none" stroke="#c9a88a" strokeWidth="3" />
    </svg>
  );
}

function LilyPadSprite({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 64 48" className={className} aria-hidden>
      <ellipse cx="32" cy="36" rx="22" ry="8" fill="#3d6f8f" opacity="0.4" />
      <ellipse cx="28" cy="32" rx="12" ry="6" fill="#4a8a42" />
      <ellipse cx="40" cy="34" rx="10" ry="5" fill="#3d7a38" />
      <circle cx="32" cy="28" r="4" fill="#f0e8f4" />
    </svg>
  );
}

function DragonflySprite({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 48 48" className={className} aria-hidden>
      <line x1="24" y1="12" x2="24" y2="36" stroke="#5a9aaa" strokeWidth="2" />
      <ellipse cx="16" cy="18" rx="10" ry="4" fill="#7ec8e8" opacity="0.7" />
      <ellipse cx="32" cy="18" rx="10" ry="4" fill="#7ec8e8" opacity="0.7" />
      <circle cx="24" cy="10" r="3" fill="#5a9aaa" />
    </svg>
  );
}

function GazeboSprite({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 72 64" className={className} aria-hidden>
      <ellipse cx="36" cy="58" rx="18" ry="3" fill="#00000022" />
      <polygon points="36,8 8,28 64,28" fill="#8a5a30" />
      <rect x="14" y="28" width="44" height="28" fill="none" stroke="#c9a88a" strokeWidth="2" />
      <line x1="36" y1="8" x2="36" y2="56" stroke="#6a5030" strokeWidth="2" />
    </svg>
  );
}

function MoonGateSprite({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 64 72" className={className} aria-hidden>
      <ellipse cx="32" cy="66" rx="14" ry="3" fill="#00000022" />
      <circle cx="32" cy="36" r="24" fill="none" stroke="#8a8680" strokeWidth="5" />
      <circle cx="32" cy="36" r="16" fill="none" stroke="#c9c4b5" strokeWidth="2" />
    </svg>
  );
}

function MapleSprite({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 56 80" className={className} aria-hidden>
      <ellipse cx="28" cy="74" rx="12" ry="3" fill="#00000022" />
      <rect x="26" y="40" width="4" height="34" fill="#6a5030" />
      <circle cx="28" cy="28" r="18" fill="#c45c26" />
      <circle cx="22" cy="22" r="10" fill="#d47820" />
      <circle cx="34" cy="24" r="9" fill="#b4531f" />
    </svg>
  );
}

function BambooSprite({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 48 80" className={className} aria-hidden>
      <ellipse cx="24" cy="74" rx="10" ry="3" fill="#00000022" />
      <line x1="16" y1="74" x2="16" y2="16" stroke="#4a8a42" strokeWidth="4" />
      <line x1="24" y1="74" x2="24" y2="12" stroke="#3d7a38" strokeWidth="4" />
      <line x1="32" y1="74" x2="32" y2="18" stroke="#4a8a42" strokeWidth="4" />
      <line x1="14" y1="28" x2="34" y2="24" stroke="#5a9a48" strokeWidth="2" />
      <line x1="14" y1="44" x2="34" y2="40" stroke="#5a9a48" strokeWidth="2" />
    </svg>
  );
}

function FireflyJarSprite({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 40 56" className={className} aria-hidden>
      <ellipse cx="20" cy="50" rx="8" ry="2.5" fill="#00000022" />
      <rect x="12" y="16" width="16" height="32" rx="4" fill="#8aa0a8" opacity="0.5" />
      <circle cx="16" cy="28" r="2" fill="#e8d48b" />
      <circle cx="24" cy="34" r="1.5" fill="#e8d48b" />
      <circle cx="18" cy="38" r="1.5" fill="#ffba08" />
      <rect x="14" y="10" width="12" height="6" rx="2" fill="#8a6a30" />
    </svg>
  );
}

function SnowLanternSprite({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 48 64" className={className} aria-hidden>
      <ellipse cx="24" cy="58" rx="8" ry="2.5" fill="#00000022" />
      <rect x="20" y="48" width="8" height="10" fill="#8a8680" />
      <path d="M14 24 Q14 14 24 12 Q34 14 34 24 V40 Q34 46 24 48 Q14 46 14 40Z" fill="#e8eef1" />
      <ellipse cx="24" cy="30" rx="6" ry="8" fill="#fff6c8" opacity="0.8" />
    </svg>
  );
}

function HarvestWreathSprite({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 56 56" className={className} aria-hidden>
      <circle cx="28" cy="28" r="18" fill="none" stroke="#c45c26" strokeWidth="6" />
      <circle cx="20" cy="20" r="3" fill="#8a5a30" />
      <circle cx="36" cy="18" r="3" fill="#c9a227" />
      <circle cx="38" cy="34" r="3" fill="#8a5a30" />
    </svg>
  );
}

function AuroraSpireSprite({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 48 80" className={className} aria-hidden>
      <ellipse cx="24" cy="74" rx="14" ry="3.5" fill="#00000028" />
      <path d="M12 70 L24 6 L36 70 Z" fill="#2a6a6a" />
      <path d="M18 70 L24 20 L30 70 Z" fill="#5eead4" opacity="0.7" />
      <circle cx="24" cy="12" r="4" fill="#b0fff0" />
    </svg>
  );
}

function StarfallOrbSprite({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 48 56" className={className} aria-hidden>
      <ellipse cx="24" cy="50" rx="10" ry="3" fill="#00000022" />
      <line x1="24" y1="50" x2="24" y2="38" stroke="#8a7abc" strokeWidth="2" />
      <circle cx="24" cy="24" r="14" fill="#b9a6ff" opacity="0.8" />
      <circle cx="24" cy="24" r="8" fill="#e8d8ff" />
      <circle cx="20" cy="20" r="2" fill="#fff" />
    </svg>
  );
}

function EternalFountainSprite({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 64 72" className={className} aria-hidden>
      <ellipse cx="32" cy="66" rx="20" ry="4" fill="#3d6f8f" opacity="0.5" />
      <ellipse cx="32" cy="58" rx="18" ry="6" fill="#5a8aaa" />
      <rect x="28" y="24" width="8" height="34" fill="#9aa0a8" />
      <ellipse cx="32" cy="22" rx="12" ry="6" fill="#8a9098" />
      <path d="M28 18 Q32 8 36 18" fill="none" stroke="#7ec8e8" strokeWidth="2" />
    </svg>
  );
}
