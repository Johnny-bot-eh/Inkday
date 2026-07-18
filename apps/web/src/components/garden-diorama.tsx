"use client";

import {
  useCallback,
  useMemo,
  useRef,
  useState,
  type PointerEvent as ReactPointerEvent,
} from "react";
import { GardenDecorSprite } from "@/components/garden-decor-sprite";
import { GardenHabitat } from "@/components/garden-habitat";
import { PetMark } from "@/components/pet-mark";
import type {
  CompanionGardenPlacement,
  CompanionSnapshot,
  PetSpeciesId,
} from "@daily-puzzle/puzzle-core";

type Props = {
  garden: CompanionSnapshot["garden"];
  pet: NonNullable<CompanionSnapshot["pet"]>;
  selectedDecor: string | null;
  busy: string | null;
  onPlace: (itemId: string, x: number, y: number) => void;
  onMove: (placementId: string, x: number, y: number) => void;
  onSelectPlacement: (placementId: string | null) => void;
  selectedPlacement: string | null;
  onRemove: (placementId: string) => void;
};

const TONE_SKY: Record<CompanionSnapshot["garden"]["tone"], string> = {
  dawn: "linear-gradient(180deg, #f3d5b5 0%, #cfe3f4 38%, #b7d39a 72%, #8fbc6e 100%)",
  day: "linear-gradient(180deg, #9ec9ef 0%, #c5e4a8 48%, #8fbc6e 100%)",
  dusk: "linear-gradient(180deg, #c45c6a 0%, #e0a84a 34%, #6d8f45 78%, #3d5c2e 100%)",
  night: "linear-gradient(180deg, #1a2238 0%, #2a3a55 40%, #1e3324 78%, #142018 100%)",
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
  selectedDecor,
  busy,
  onPlace,
  onMove,
  onSelectPlacement,
  selectedPlacement,
  onRemove,
}: Props) {
  const stageRef = useRef<HTMLDivElement>(null);
  const [dragId, setDragId] = useState<string | null>(null);
  const [ghost, setGhost] = useState<{ x: number; y: number } | null>(null);

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

  function onStagePointerDown(e: ReactPointerEvent<HTMLDivElement>) {
    if (e.target !== e.currentTarget && !(e.target as HTMLElement).dataset?.stage)
      return;
    if (!selectedDecor || busy) return;
    const { x, y } = toNorm(e.clientX, e.clientY);
    onPlace(selectedDecor, x, y);
  }

  function onStagePointerMove(e: ReactPointerEvent<HTMLDivElement>) {
    if (selectedDecor) {
      setGhost(toNorm(e.clientX, e.clientY));
    } else if (!dragId) {
      setGhost(null);
    }
  }

  function beginDrag(
    placement: CompanionGardenPlacement,
    e: ReactPointerEvent<HTMLButtonElement>,
  ) {
    e.stopPropagation();
    e.currentTarget.setPointerCapture(e.pointerId);
    setDragId(placement.id);
    onSelectPlacement(placement.id);
  }

  function onDecorPointerMove(e: ReactPointerEvent<HTMLButtonElement>) {
    if (!dragId) return;
    setGhost(toNorm(e.clientX, e.clientY));
  }

  function endDrag(e: ReactPointerEvent<HTMLButtonElement>) {
    if (!dragId) return;
    const { x, y } = toNorm(e.clientX, e.clientY);
    const id = dragId;
    setDragId(null);
    setGhost(null);
    onMove(id, x, y);
  }

  const night = garden.tone === "night" || garden.tone === "dusk";
  const bubbleLeft = garden.pet.x >= 55;

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
          if (!dragId) setGhost(null);
        }}
        className={[
          "absolute inset-0 touch-none",
          selectedDecor ? "cursor-crosshair" : "cursor-default",
        ].join(" ")}
        style={{ background: TONE_SKY[garden.tone] }}
      >
        {/* Ground plane */}
        <div
          className="pointer-events-none absolute inset-x-0 bottom-0 h-[38%]"
          style={{
            background: night
              ? "linear-gradient(180deg, transparent 0%, #1a2a18 35%, #10180f 100%)"
              : "linear-gradient(180deg, transparent 0%, #8fbc6e88 18%, #6d9a4e 100%)",
          }}
        />
        {/* Soft canopy light */}
        <div
          className="pointer-events-none absolute inset-0 opacity-50"
          style={{
            background:
              "radial-gradient(ellipse at 50% 18%, #ffffff55 0 18%, transparent 42%)",
          }}
        />

        {/* Innate habitat wallpaper (trees, vines, moss — not movable) */}
        <GardenHabitat night={night} />

        {/* Ambient life */}
        {garden.ambience.includes("pollen") ? (
          <div className="garden-ambience-pollen pointer-events-none absolute inset-0" />
        ) : null}
        {garden.ambience.includes("soft_mist") ? (
          <div className="garden-ambience-mist pointer-events-none absolute inset-0" />
        ) : null}
        {garden.ambience.includes("fireflies") ? (
          <div className="garden-ambience-fireflies pointer-events-none absolute inset-0" />
        ) : null}
        {garden.ambience.includes("spark_dust") ? (
          <div className="garden-ambience-spark pointer-events-none absolute inset-0" />
        ) : null}
        {garden.ambience.includes("star_glints") ? (
          <div className="garden-ambience-stars pointer-events-none absolute inset-0" />
        ) : null}

        {/* Placeable decorations */}
        {sorted.map((p) => {
          const dragging = dragId === p.id;
          const selected = selectedPlacement === p.id;
          const pos = dragging && ghost ? ghost : { x: p.x, y: p.y };
          return (
            <button
              key={p.id}
              type="button"
              aria-label={p.title}
              onPointerDown={(e) => beginDrag(p, e)}
              onPointerMove={onDecorPointerMove}
              onPointerUp={endDrag}
              onPointerCancel={() => {
                setDragId(null);
                setGhost(null);
              }}
              onDoubleClick={(e) => {
                e.stopPropagation();
                onRemove(p.id);
              }}
              className={[
                "absolute -translate-x-1/2 -translate-y-1/2 rounded-lg border-0 bg-transparent p-0",
                motionClass(p.motion),
                selected
                  ? "ring-2 ring-ember/70 ring-offset-2 ring-offset-transparent"
                  : "",
              ].join(" ")}
              style={{
                left: `${pos.x}%`,
                top: `${pos.y}%`,
                width: `${p.widthPct}%`,
                zIndex: layerZ(p.layer) + Math.round(pos.y),
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

        {/* Companion + dialogue beside pet */}
        <div
          className="garden-pet-idle pointer-events-none absolute -translate-x-1/2 -translate-y-1/2"
          style={{
            left: `${garden.pet.x}%`,
            top: `${garden.pet.y}%`,
            zIndex: layerZ(garden.pet.layer) + Math.round(garden.pet.y) + 1,
            width: "min(28%, 160px)",
          }}
        >
          <div className="relative mx-auto flex w-full justify-center [&_>div]:!mx-0 [&_>div]:!h-auto [&_>div]:!w-full [&_svg]:!h-auto [&_svg]:!w-full">
            <div className="absolute inset-x-[18%] bottom-[6%] h-3 rounded-full bg-[#00000022] blur-[2px]" />
            <PetMark
              speciesId={pet.speciesId as PetSpeciesId}
              stage={pet.stage}
              colors={pet.colors}
              happinessState={pet.happinessState}
              size={120}
            />
          </div>
          <div
            className={[
              "absolute top-[8%] max-w-[9.5rem] rounded-2xl px-2.5 py-1.5 text-[clamp(0.55rem,1.35vw,0.72rem)] leading-snug text-[#1a2414] shadow-md",
              bubbleLeft ? "right-[78%]" : "left-[78%]",
            ].join(" ")}
            style={{
              background: "rgba(255,255,255,0.92)",
              zIndex: 5,
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
        {selectedDecor && ghost ? (
          <div
            className="pointer-events-none absolute -translate-x-1/2 -translate-y-1/2 opacity-60"
            style={{ left: `${ghost.x}%`, top: `${ghost.y}%`, zIndex: 50 }}
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
