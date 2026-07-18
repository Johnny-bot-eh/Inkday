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
  onMove: (
    placementId: string,
    x: number,
    y: number,
    from: { x: number; y: number },
  ) => void;
  onMoveNest: (
    x: number,
    y: number,
    from: { x: number; y: number },
  ) => void;
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

type DragTarget =
  | { kind: "decor"; id: string; fromX: number; fromY: number }
  | { kind: "nest"; fromX: number; fromY: number };

export function GardenDiorama({
  garden,
  pet,
  accountLevel,
  selectedDecor,
  busy,
  onPlace,
  onMove,
  onMoveNest,
  onSelectPlacement,
  selectedPlacement,
  onRemove,
}: Props) {
  const stageRef = useRef<HTMLDivElement>(null);
  const dragRef = useRef<DragTarget | null>(null);
  const livePosRef = useRef<{ x: number; y: number } | null>(null);
  const rafRef = useRef<number | null>(null);

  const [drag, setDrag] = useState<DragTarget | null>(null);
  const [livePos, setLivePos] = useState<{ x: number; y: number } | null>(null);
  const [placeGhost, setPlaceGhost] = useState<{ x: number; y: number } | null>(
    null,
  );

  const dragging = drag != null;
  const climate = useLocalGardenClimate({
    accountLevel,
    petLevel: pet.level,
    placedCount: garden.placements.length,
    paused: dragging,
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
    if (rect.width < 1 || rect.height < 1) return { x: 50, y: 50 };
    const x = ((clientX - rect.left) / rect.width) * 100;
    const y = ((clientY - rect.top) / rect.height) * 100;
    return {
      x: Math.min(92, Math.max(8, x)),
      y: Math.min(92, Math.max(8, y)),
    };
  }, []);

  /** Keep new placements on the clearing / grass, not the sky or distant wall. */
  const toPlaceNorm = useCallback(
    (clientX: number, clientY: number) => {
      const pos = toNorm(clientX, clientY);
      return {
        x: pos.x,
        y: Math.min(90, Math.max(52, pos.y)),
      };
    },
    [toNorm],
  );

  const flushLive = useCallback(() => {
    rafRef.current = null;
    const pos = livePosRef.current;
    if (pos) setLivePos(pos);
  }, []);

  const queueLive = useCallback(
    (pos: { x: number; y: number }) => {
      livePosRef.current = pos;
      if (rafRef.current != null) return;
      rafRef.current = window.requestAnimationFrame(flushLive);
    },
    [flushLive],
  );

  useEffect(() => {
    return () => {
      if (rafRef.current != null) window.cancelAnimationFrame(rafRef.current);
    };
  }, []);

  function onStagePointerDown(e: ReactPointerEvent<HTMLDivElement>) {
    if (!selectedDecor) {
      // Only clear selection when tapping empty stage (not a decor/nest).
      if (e.target === e.currentTarget || (e.target as HTMLElement).dataset?.stage) {
        if (selectedPlacement) onSelectPlacement(null);
      }
      return;
    }
    if (busy) return;
    e.stopPropagation();
    const { x, y } = toPlaceNorm(e.clientX, e.clientY);
    onPlace(selectedDecor, x, y);
  }

  function onStagePointerMove(e: ReactPointerEvent<HTMLDivElement>) {
    if (selectedDecor && !dragRef.current) {
      setPlaceGhost(toPlaceNorm(e.clientX, e.clientY));
    } else if (!dragRef.current) {
      setPlaceGhost(null);
    }
  }

  function beginDecorDrag(
    placement: CompanionGardenPlacement,
    e: ReactPointerEvent<HTMLButtonElement>,
  ) {
    e.stopPropagation();
    e.currentTarget.setPointerCapture(e.pointerId);
    const target: DragTarget = {
      kind: "decor",
      id: placement.id,
      fromX: placement.x,
      fromY: placement.y,
    };
    dragRef.current = target;
    livePosRef.current = { x: placement.x, y: placement.y };
    setDrag(target);
    setLivePos({ x: placement.x, y: placement.y });
    onSelectPlacement(placement.id);
  }

  function beginNestDrag(e: ReactPointerEvent<HTMLButtonElement>) {
    e.stopPropagation();
    e.currentTarget.setPointerCapture(e.pointerId);
    const target: DragTarget = {
      kind: "nest",
      fromX: garden.pet.x,
      fromY: garden.pet.y,
    };
    dragRef.current = target;
    livePosRef.current = { x: garden.pet.x, y: garden.pet.y };
    setDrag(target);
    setLivePos({ x: garden.pet.x, y: garden.pet.y });
    onSelectPlacement(null);
  }

  function onDragPointerMove(e: ReactPointerEvent<HTMLButtonElement>) {
    if (!dragRef.current) return;
    queueLive(toNorm(e.clientX, e.clientY));
  }

  function endDrag(e: ReactPointerEvent<HTMLButtonElement>) {
    const current = dragRef.current;
    if (!current) return;
    const pos = toNorm(e.clientX, e.clientY);
    if (rafRef.current != null) {
      window.cancelAnimationFrame(rafRef.current);
      rafRef.current = null;
    }
    dragRef.current = null;
    livePosRef.current = null;
    setDrag(null);
    setLivePos(null);
    onSelectPlacement(null);

    if (current.kind === "nest") {
      onMoveNest(pos.x, pos.y, { x: current.fromX, y: current.fromY });
      return;
    }
    onMove(current.id, pos.x, pos.y, {
      x: current.fromX,
      y: current.fromY,
    });
  }

  function cancelDrag() {
    if (!dragRef.current) return;
    if (rafRef.current != null) {
      window.cancelAnimationFrame(rafRef.current);
      rafRef.current = null;
    }
    dragRef.current = null;
    livePosRef.current = null;
    setDrag(null);
    setLivePos(null);
    onSelectPlacement(null);
  }

  const night = tone === "night" || tone === "dusk";
  const nestX =
    drag?.kind === "nest" && livePos ? livePos.x : garden.pet.x;
  const nestY =
    drag?.kind === "nest" && livePos ? livePos.y : garden.pet.y;
  const bubbleLeft = nestX >= 55;
  const petMotion = usePetStageMotion(pet.id, pet.stage);
  const draggingNest = drag?.kind === "nest";

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
          if (!dragRef.current) setPlaceGhost(null);
        }}
        className={[
          "absolute inset-0 touch-none",
          selectedDecor ? "cursor-crosshair" : "cursor-default",
        ].join(" ")}
        style={{ background: sky }}
      >
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

        {sorted.map((p) => {
          const isDragging = drag?.kind === "decor" && drag.id === p.id;
          const pos =
            isDragging && livePos ? livePos : { x: p.x, y: p.y };
          const selected = selectedPlacement === p.id && !isDragging;
          return (
            <button
              key={p.id}
              type="button"
              aria-label={p.title}
              onPointerDown={(e) => beginDecorDrag(p, e)}
              onPointerMove={onDragPointerMove}
              onPointerUp={endDrag}
              onPointerCancel={cancelDrag}
              onDoubleClick={(e) => {
                e.stopPropagation();
                onRemove(p.id);
              }}
              className={[
                "absolute -translate-x-1/2 -translate-y-1/2 rounded-lg border-0 bg-transparent p-0 cursor-grab",
                isDragging ? "garden-dragging" : motionClass(p.motion),
                selected
                  ? "ring-2 ring-ember/70 ring-offset-2 ring-offset-transparent"
                  : "",
              ].join(" ")}
              style={{
                left: `${pos.x}%`,
                top: `${pos.y}%`,
                width: `${p.widthPct}%`,
                zIndex: isDragging
                  ? 40
                  : layerZ(p.layer) + Math.round(pos.y),
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

        <button
          type="button"
          aria-label="Move nest"
          onPointerDown={beginNestDrag}
          onPointerMove={onDragPointerMove}
          onPointerUp={endDrag}
          onPointerCancel={cancelDrag}
          className={[
            "absolute cursor-grab border-0 bg-transparent p-0 text-left",
            draggingNest ? "garden-dragging cursor-grabbing" : "",
          ].join(" ")}
          style={{
            left: `${nestX}%`,
            top: `${nestY}%`,
            zIndex: draggingNest
              ? 40
              : layerZ(garden.pet.layer) + Math.round(nestY) + 1,
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
                "pointer-events-none absolute left-1/2 z-[2] -translate-x-1/2 [&_>div]:!mx-0 [&_>div]:!h-auto [&_>div]:!w-full [&_svg]:!h-auto [&_svg]:!w-full",
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
              className="pointer-events-none absolute inset-x-0 bottom-0 z-[3] h-auto w-full"
            />
          </div>
          <div
            className={[
              "pointer-events-none absolute top-[-6%] z-[4] max-w-[9.5rem] rounded-2xl px-2.5 py-1.5 text-[clamp(0.55rem,1.35vw,0.72rem)] leading-snug text-[#1a2414] shadow-md",
              bubbleLeft ? "right-[95%]" : "left-[95%]",
            ].join(" ")}
            style={{ background: "rgba(255,255,255,0.92)" }}
          >
            {pet.dialogue}
            <span
              className={[
                "absolute top-1/2 h-2.5 w-2.5 -translate-y-1/2 rotate-45 bg-white/92",
                bubbleLeft ? "-right-1" : "-left-1",
              ].join(" ")}
            />
          </div>
        </button>

        {selectedDecor ? (
          <div
            data-place-layer="1"
            aria-hidden
            className="absolute inset-0 z-[100] cursor-crosshair"
            onPointerDown={(e) => {
              if (busy) return;
              e.stopPropagation();
              const { x, y } = toPlaceNorm(e.clientX, e.clientY);
              onPlace(selectedDecor, x, y);
            }}
            onPointerMove={(e) => {
              setPlaceGhost(toPlaceNorm(e.clientX, e.clientY));
            }}
          />
        ) : null}

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
