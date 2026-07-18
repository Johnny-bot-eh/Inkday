"use client";

import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type PointerEvent as ReactPointerEvent,
} from "react";
import { GardenDecorSprite } from "@/components/garden-decor-sprite";
import { GardenHabitat } from "@/components/garden-habitat";
import { GardenNest, GardenNestRim } from "@/components/garden-nest";
import { GardenWeatherLayer } from "@/components/garden-weather";
import { PetMark, usePetStageMotion } from "@/components/pet-mark";
import { useLocalGardenClimate } from "@/lib/garden-climate";
import type {
  CompanionGardenPlacement,
  CompanionSnapshot,
  PetSpeciesId,
} from "@daily-puzzle/puzzle-core";

type Props = {
  garden: CompanionSnapshot["garden"];
  pet: NonNullable<CompanionSnapshot["pet"]>;
  accountLevel: number;
  selectedDecor: string | null;
  busy: string | null;
  onPlace: (itemId: string, x: number, y: number) => void;
  onMove: (placementId: string, x: number, y: number) => void;
  onSelectPlacement: (placementId: string | null) => void;
  selectedPlacement: string | null;
  onRemove: (placementId: string) => void;
};

const TONE_SKY: Record<CompanionSnapshot["garden"]["tone"], string> = {
  dawn: "linear-gradient(180deg, #f0c9a0 0%, #d8e6c8 36%, #9cbc78 72%, #6e9a52 100%)",
  day: "linear-gradient(180deg, #8ec0e8 0%, #c5ddb0 42%, #7eab58 78%, #5e8c42 100%)",
  dusk: "linear-gradient(180deg, #c45c6a 0%, #d4a060 34%, #6d8f45 78%, #3d5c2e 100%)",
  night: "linear-gradient(180deg, #141c2e 0%, #243848 38%, #1a2e20 78%, #101810 100%)",
};

const SEASON_SKY_TINT: Record<
  string,
  Partial<Record<CompanionSnapshot["garden"]["tone"], string>>
> = {
  autumn: {
    dawn: "linear-gradient(180deg, #f0b888 0%, #e0c898 36%, #b88858 72%, #8a6038 100%)",
    day: "linear-gradient(180deg, #88b0d0 0%, #e0c888 42%, #c07840 78%, #8a5028 100%)",
    dusk: "linear-gradient(180deg, #c04848 0%, #e08840 34%, #8a5030 78%, #4a2818 100%)",
  },
  winter: {
    dawn: "linear-gradient(180deg, #d8c8c0 0%, #c8d8e0 36%, #a0b0b8 72%, #788890 100%)",
    day: "linear-gradient(180deg, #b0c8e0 0%, #d0dce8 42%, #a8b8c0 78%, #889098 100%)",
    dusk: "linear-gradient(180deg, #687898 0%, #8890a8 34%, #586870 78%, #303840 100%)",
    night: "linear-gradient(180deg, #101820 0%, #1a2430 38%, #182028 78%, #0c1014 100%)",
  },
  spring: {
    dawn: "linear-gradient(180deg, #f8d0c0 0%, #e0f0d0 36%, #a8d088 72%, #78b060 100%)",
    day: "linear-gradient(180deg, #98d0f0 0%, #d0ecc0 42%, #88c868 78%, #68a850 100%)",
  },
};

function layerZ(layer: string): number {
  if (layer === "background") return 1;
  if (layer === "foreground") return 4;
  return 2;
}

function motionClass(motion: string): string {
  if (motion === "sway") return "garden-sway";
  if (motion === "bob") return "garden-bob";
  if (motion === "sparkle") return "garden-sparkle";
  if (motion === "ripple") return "garden-ripple";
  if (motion === "drift") return "garden-drift";
  return "";
}

export function GardenDiorama({
  garden,
  pet,
  accountLevel,
  selectedDecor,
  busy,
  onPlace,
  onMove,
  onSelectPlacement,
  selectedPlacement,
  onRemove,
}: Props) {
  const stageRef = useRef<HTMLDivElement>(null);
  const dragIdRef = useRef<string | null>(null);
  const dragPosRef = useRef<{ x: number; y: number } | null>(null);
  const rafRef = useRef<number | null>(null);
  const decorElsRef = useRef<Map<string, HTMLButtonElement>>(new Map());

  const [dragId, setDragId] = useState<string | null>(null);
  const [placeGhost, setPlaceGhost] = useState<{ x: number; y: number } | null>(
    null,
  );

  const climate = useLocalGardenClimate({
    accountLevel,
    petLevel: pet.level,
    placedCount: garden.placements.length,
  });

  const tone = climate.tone;
  const ambience = climate.ambience;
  const sky = SEASON_SKY_TINT[climate.season]?.[tone] ?? TONE_SKY[tone];

  const sorted = useMemo(() => {
    return [...garden.placements].sort((a, b) => {
      const z = layerZ(a.layer) - layerZ(b.layer);
      if (z !== 0) return z;
      return a.y - b.y;
    });
  }, [garden.placements]);

  const toNorm = useCallback((clientX: number, clientY: number) => {
    const el = stageRef.current;
    if (!el) return { x: 50, y: 50 };
    const rect = el.getBoundingClientRect();
    const x = ((clientX - rect.left) / Math.max(1, rect.width)) * 100;
    const y = ((clientY - rect.top) / Math.max(1, rect.height)) * 100;
    return {
      x: Math.min(92, Math.max(8, x)),
      y: Math.min(92, Math.max(8, y)),
    };
  }, []);

  const paintDrag = useCallback((id: string, x: number, y: number) => {
    const el = decorElsRef.current.get(id);
    if (!el) return;
    el.style.left = `${x}%`;
    el.style.top = `${y}%`;
    el.style.zIndex = String(40);
  }, []);

  const flushDragFrame = useCallback(() => {
    rafRef.current = null;
    const id = dragIdRef.current;
    const pos = dragPosRef.current;
    if (!id || !pos) return;
    paintDrag(id, pos.x, pos.y);
  }, [paintDrag]);

  const queueDragPaint = useCallback(() => {
    if (rafRef.current != null) return;
    rafRef.current = window.requestAnimationFrame(flushDragFrame);
  }, [flushDragFrame]);

  useEffect(() => {
    return () => {
      if (rafRef.current != null) window.cancelAnimationFrame(rafRef.current);
    };
  }, []);

  function onStagePointerDown(e: ReactPointerEvent<HTMLDivElement>) {
    if (e.target !== e.currentTarget && !(e.target as HTMLElement).dataset?.stage)
      return;
    // Empty stage tap: place if buying, otherwise clear the selection ring.
    if (!selectedDecor) {
      if (selectedPlacement) onSelectPlacement(null);
      return;
    }
    if (busy) return;
    const { x, y } = toNorm(e.clientX, e.clientY);
    onPlace(selectedDecor, x, y);
  }

  function onStagePointerMove(e: ReactPointerEvent<HTMLDivElement>) {
    if (selectedDecor) {
      setPlaceGhost(toNorm(e.clientX, e.clientY));
    } else if (!dragIdRef.current) {
      setPlaceGhost(null);
    }
  }

  function beginDrag(
    placement: CompanionGardenPlacement,
    e: ReactPointerEvent<HTMLButtonElement>,
  ) {
    e.stopPropagation();
    e.currentTarget.setPointerCapture(e.pointerId);
    dragIdRef.current = placement.id;
    dragPosRef.current = { x: placement.x, y: placement.y };
    setDragId(placement.id);
    onSelectPlacement(placement.id);
    paintDrag(placement.id, placement.x, placement.y);
  }

  function onDecorPointerMove(e: ReactPointerEvent<HTMLButtonElement>) {
    if (!dragIdRef.current) return;
    dragPosRef.current = toNorm(e.clientX, e.clientY);
    queueDragPaint();
  }

  function endDrag(e: ReactPointerEvent<HTMLButtonElement>) {
    if (!dragIdRef.current) return;
    const id = dragIdRef.current;
    const pos = toNorm(e.clientX, e.clientY);
    if (rafRef.current != null) {
      window.cancelAnimationFrame(rafRef.current);
      rafRef.current = null;
    }
    paintDrag(id, pos.x, pos.y);
    dragIdRef.current = null;
    dragPosRef.current = null;
    setDragId(null);
    onSelectPlacement(null);
    onMove(id, pos.x, pos.y);
  }

  function cancelDrag() {
    if (!dragIdRef.current) return;
    const id = dragIdRef.current;
    const placement = garden.placements.find((p) => p.id === id);
    if (rafRef.current != null) {
      window.cancelAnimationFrame(rafRef.current);
      rafRef.current = null;
    }
    if (placement) paintDrag(id, placement.x, placement.y);
    dragIdRef.current = null;
    dragPosRef.current = null;
    setDragId(null);
    onSelectPlacement(null);
  }

  const night = tone === "night" || tone === "dusk";
  const bubbleLeft = garden.pet.x >= 55;
  const petMotion = usePetStageMotion(pet.id, pet.stage);

  return (
    <div
      className="relative w-full overflow-hidden rounded-3xl border border-[var(--line)] shadow-[inset_0_-24px_40px_rgba(0,0,0,0.12)]"
      style={{ aspectRatio: String(garden.aspectRatio) }}
    >
      <div
        ref={stageRef}
        data-stage="1"
        role="presentation"
        onPointerDown={onStagePointerDown}
        onPointerMove={onStagePointerMove}
        onPointerLeave={() => {
          if (!dragIdRef.current) setPlaceGhost(null);
        }}
        className={[
          "absolute inset-0 touch-none",
          selectedDecor ? "cursor-crosshair" : "cursor-default",
        ].join(" ")}
        style={{ background: sky }}
      >
        {/* Ground plane — forest clearing floor */}
        <div
          className="pointer-events-none absolute inset-x-0 bottom-0 h-[44%]"
          style={{
            background: night
              ? "linear-gradient(180deg, transparent 0%, #1a2a18 28%, #10180f 100%)"
              : climate.season === "winter"
                ? "linear-gradient(180deg, transparent 0%, #c8d4dc88 16%, #a8b4bc 100%)"
                : climate.season === "autumn"
                  ? "linear-gradient(180deg, transparent 0%, #b8885888 16%, #8a6038 100%)"
                  : "linear-gradient(180deg, transparent 0%, #7eaa5e88 16%, #5f8c42 100%)",
          }}
        />
        {/* Soft canopy light */}
        <div
          className="pointer-events-none absolute inset-0 opacity-40"
          style={{
            background:
              tone === "night"
                ? "radial-gradient(ellipse at 50% 12%, #8aa0ff33 0 12%, transparent 40%)"
                : "radial-gradient(ellipse at 50% 12%, #ffffff66 0 14%, transparent 40%)",
          }}
        />

        <GardenHabitat night={night} season={climate.season} />

        <GardenWeatherLayer weather={climate.weather} night={night} />

        {/* Ambient life */}
        {ambience.includes("pollen") ? (
          <div className="garden-ambience-pollen pointer-events-none absolute inset-0" />
        ) : null}
        {ambience.includes("soft_mist") ? (
          <div className="garden-ambience-mist pointer-events-none absolute inset-0" />
        ) : null}
        {ambience.includes("fireflies") ? (
          <div className="garden-ambience-fireflies pointer-events-none absolute inset-0" />
        ) : null}
        {ambience.includes("spark_dust") ? (
          <div className="garden-ambience-spark pointer-events-none absolute inset-0" />
        ) : null}
        {ambience.includes("star_glints") && tone === "night" ? (
          <div className="garden-ambience-stars pointer-events-none absolute inset-0" />
        ) : null}

        {/* Placeable decorations */}
        {sorted.map((p) => {
          const dragging = dragId === p.id;
          const selected = selectedPlacement === p.id && !dragging;
          return (
            <button
              key={p.id}
              type="button"
              aria-label={p.title}
              ref={(node) => {
                if (node) decorElsRef.current.set(p.id, node);
                else decorElsRef.current.delete(p.id);
              }}
              onPointerDown={(e) => beginDrag(p, e)}
              onPointerMove={onDecorPointerMove}
              onPointerUp={endDrag}
              onPointerCancel={cancelDrag}
              onDoubleClick={(e) => {
                e.stopPropagation();
                onRemove(p.id);
              }}
              className={[
                "absolute -translate-x-1/2 -translate-y-1/2 rounded-lg border-0 bg-transparent p-0 cursor-grab",
                dragging ? "garden-dragging" : motionClass(p.motion),
                selected
                  ? "ring-2 ring-ember/70 ring-offset-2 ring-offset-transparent"
                  : "",
              ].join(" ")}
              style={{
                left: `${p.x}%`,
                top: `${p.y}%`,
                width: `${p.widthPct}%`,
                zIndex: layerZ(p.layer) + Math.round(p.y),
                willChange: dragging ? "left, top" : undefined,
              }}
            >
              <GardenDecorSprite
                itemId={p.itemId}
                tone={p.tone}
                className="mx-auto h-auto w-full drop-shadow-md"
              />
            </button>
          );
        })}

        {/* One nest · one companion (Plus may unlock extra nests later) */}
        <div
          className="pointer-events-none absolute"
          style={{
            left: `${garden.pet.x}%`,
            top: `${garden.pet.y}%`,
            zIndex: layerZ(garden.pet.layer) + Math.round(garden.pet.y) + 1,
            width: "min(22%, 128px)",
            transform: "translate(-50%, -72%)",
          }}
        >
          <div className="relative mx-auto aspect-[120/90] w-full">
            <GardenNest
              night={night}
              className="absolute inset-x-0 bottom-0 z-[1] h-auto w-full drop-shadow-md"
            />
            <div
              className={[
                "absolute left-1/2 z-[2] -translate-x-1/2 [&_>div]:!mx-0 [&_>div]:!h-auto [&_>div]:!w-full [&_svg]:!h-auto [&_svg]:!w-full",
                pet.stage === "egg" || petMotion === "hatch"
                  ? "w-[70%]"
                  : "w-[78%]",
              ].join(" ")}
              style={{
                bottom:
                  pet.stage === "egg" || petMotion === "hatch" ? "4%" : "12%",
              }}
            >
              <PetMark
                speciesId={pet.speciesId as PetSpeciesId}
                stage={pet.stage}
                colors={pet.colors}
                happinessState={pet.happinessState}
                motion={petMotion}
                size={120}
              />
            </div>
            <GardenNestRim
              night={night}
              className="absolute inset-x-0 bottom-0 z-[3] h-auto w-full"
            />
          </div>
          <div
            className={[
              "absolute top-[-6%] z-[4] max-w-[9.5rem] rounded-2xl px-2.5 py-1.5 text-[clamp(0.55rem,1.35vw,0.72rem)] leading-snug text-[#1a2414] shadow-md",
              bubbleLeft ? "right-[95%]" : "left-[95%]",
            ].join(" ")}
            style={{
              background: "rgba(255,255,255,0.92)",
            }}
          >
            {pet.dialogue}
            <span
              className={[
                "absolute top-1/2 h-2.5 w-2.5 -translate-y-1/2 rotate-45 bg-white/92",
                bubbleLeft ? "-right-1" : "-left-1",
              ].join(" ")}
            />
          </div>
        </div>

        {/* Placement ghost */}
        {selectedDecor && placeGhost ? (
          <div
            className="pointer-events-none absolute -translate-x-1/2 -translate-y-1/2 opacity-60"
            style={{
              left: `${placeGhost.x}%`,
              top: `${placeGhost.y}%`,
              zIndex: 50,
            }}
          >
            <div className="h-10 w-10 rounded-full border-2 border-dashed border-ember bg-ember/20" />
          </div>
        ) : null}

        {/* Foreground vignette */}
        <div
          className="pointer-events-none absolute inset-x-0 bottom-0 h-[14%]"
          style={{
            background: night
              ? "linear-gradient(180deg, transparent, #0a120aee)"
              : "linear-gradient(180deg, transparent, #4d7238cc)",
            zIndex: 60,
          }}
        />
      </div>
    </div>
  );
}
