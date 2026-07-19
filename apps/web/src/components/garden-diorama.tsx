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
import { usePetRoam } from "@/lib/pet-roam";
import type {
  CompanionGardenPlacement,
  CompanionSnapshot,
  PetSpeciesId,
} from "@daily-puzzle/puzzle-core";
import { clampNestCoord } from "@daily-puzzle/puzzle-core";

type Props = {
  garden: CompanionSnapshot["garden"];
  pet: CompanionPetView | null;
  accountLevel: number;
  readOnly?: boolean;
  selectedDecor?: string | null;
  busy?: string | null;
  onPlace?: (itemId: string, x: number, y: number) => void;
  onMove?: (
    placementId: string,
    x: number,
    y: number,
    from: { x: number; y: number },
  ) => void;
  onMoveNest?: (
    x: number,
    y: number,
    from: { x: number; y: number },
  ) => void;
  onSelectPlacement?: (placementId: string | null) => void;
  selectedPlacement?: string | null;
  onRemove?: (placementId: string) => void;
};

type CompanionPetView = NonNullable<CompanionSnapshot["pet"]>;

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

/** Cap so garden sprites never outrank page chrome / modals. */
function stageZ(layer: string, y: number, bump = 0): number {
  return Math.min(28, layerZ(layer) + Math.round(y) + bump);
}

function DialogueBubble({
  text,
  side,
}: {
  text: string;
  side: "left" | "right";
}) {
  return (
    <div
      className={[
        // Sit fully above the nest/pet; wide enough that lines stay horizontal.
        "pointer-events-none absolute bottom-[calc(100%+0.4rem)] z-20 w-max max-w-[min(15rem,62vw)] rounded-2xl px-3 py-1.5 text-left text-[clamp(0.58rem,1.4vw,0.75rem)] leading-snug text-[#1a2414] shadow-md",
        side === "left" ? "right-[8%]" : "left-[8%]",
      ].join(" ")}
      style={{ background: "rgba(255,255,255,0.94)" }}
    >
      {text}
      <span
        className={[
          "absolute top-full h-2.5 w-2.5 -translate-y-1/2 rotate-45 bg-white/94",
          side === "left" ? "right-5" : "left-5",
        ].join(" ")}
        aria-hidden
      />
    </div>
  );
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
  readOnly = false,
  selectedDecor = null,
  busy = null,
  onPlace,
  onMove,
  onMoveNest,
  onSelectPlacement,
  selectedPlacement = null,
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
    petLevel: pet?.level ?? 1,
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

  const toNorm = useCallback(
    (clientX: number, clientY: number, el?: HTMLElement | null) => {
      const target = el ?? stageRef.current;
      if (!target) return { x: 50, y: 70 };
      const rect = target.getBoundingClientRect();
      if (rect.width < 1 || rect.height < 1) return { x: 50, y: 70 };
      const x = ((clientX - rect.left) / rect.width) * 100;
      const y = ((clientY - rect.top) / rect.height) * 100;
      return {
        x: Math.min(94, Math.max(6, x)),
        y: Math.min(94, Math.max(8, y)),
      };
    },
    [],
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
    if (readOnly) return;
    if (!selectedDecor) {
      // Only clear selection when tapping empty stage (not a decor/nest).
      if (e.target === e.currentTarget || (e.target as HTMLElement).dataset?.stage) {
        if (selectedPlacement) onSelectPlacement?.(null);
      }
      return;
    }
    if (busy) return;
    e.stopPropagation();
    const { x, y } = toNorm(e.clientX, e.clientY);
    onPlace?.(selectedDecor, x, y);
  }

  function onStagePointerMove(e: ReactPointerEvent<HTMLDivElement>) {
    if (readOnly) return;
    if (selectedDecor && !dragRef.current) {
      setPlaceGhost(toNorm(e.clientX, e.clientY));
    } else if (!dragRef.current) {
      setPlaceGhost(null);
    }
  }

  function beginDecorDrag(
    placement: CompanionGardenPlacement,
    e: ReactPointerEvent<HTMLButtonElement>,
  ) {
    if (readOnly) return;
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
    onSelectPlacement?.(placement.id);
  }

  function beginNestDrag(e: ReactPointerEvent<HTMLButtonElement>) {
    if (readOnly) return;
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
    onSelectPlacement?.(null);
  }

  function onDragPointerMove(e: ReactPointerEvent<HTMLButtonElement>) {
    if (!dragRef.current) return;
    const raw = toNorm(e.clientX, e.clientY);
    if (dragRef.current.kind === "nest") {
      queueLive({
        x: clampNestCoord(raw.x, "x"),
        y: clampNestCoord(raw.y, "y"),
      });
      return;
    }
    queueLive(raw);
  }

  function endDrag(e: ReactPointerEvent<HTMLButtonElement>) {
    const current = dragRef.current;
    if (!current) return;
    const raw = toNorm(e.clientX, e.clientY);
    if (rafRef.current != null) {
      window.cancelAnimationFrame(rafRef.current);
      rafRef.current = null;
    }
    dragRef.current = null;
    livePosRef.current = null;
    setDrag(null);
    setLivePos(null);
    onSelectPlacement?.(null);

    if (current.kind === "nest") {
      onMoveNest?.(
        clampNestCoord(raw.x, "x"),
        clampNestCoord(raw.y, "y"),
        { x: current.fromX, y: current.fromY },
      );
      return;
    }
    onMove?.(current.id, raw.x, raw.y, {
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
    onSelectPlacement?.(null);
  }

  const night = tone === "night" || tone === "dusk";
  const nestX = clampNestCoord(
    drag?.kind === "nest" && livePos ? livePos.x : garden.pet.x,
    "x",
  );
  const nestY = clampNestCoord(
    drag?.kind === "nest" && livePos ? livePos.y : garden.pet.y,
    "y",
  );
  const petMotion = usePetStageMotion(pet?.id ?? "visit", pet?.stage ?? "egg");
  const inNest = !pet || pet.stage === "egg" || petMotion === "hatch";
  const roam = usePetRoam({
    enabled: Boolean(pet) && !inNest,
    nest: { x: nestX, y: nestY },
    placements: garden.placements,
    personalityId: pet?.personalityId ?? "curious",
    happinessState: pet?.happinessState ?? "normal",
    paused: dragging,
  });
  const petX = inNest || !pet ? nestX : roam.x;
  const petY = inNest || !pet ? nestY : roam.y;
  const bubbleLeft = petX >= 55;
  const draggingNest = drag?.kind === "nest";
  const petWidth =
    !pet || pet.stage === "baby"
      ? "min(16%, 96px)"
      : pet.stage === "teen"
        ? "min(18%, 108px)"
        : "min(20%, 120px)";

  return (
    <div
      className="relative z-0 isolate w-full overflow-hidden rounded-3xl border border-[var(--line)] shadow-[inset_0_-24px_40px_rgba(0,0,0,0.12)]"
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
          readOnly
            ? "cursor-default"
            : selectedDecor
              ? "cursor-crosshair"
              : "cursor-default",
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
          const visited =
            !inNest &&
            roam.mode === "interact" &&
            roam.focusPlacementId === p.id;
          return readOnly ? (
            <div
              key={p.id}
              aria-hidden
              className={[
                "pointer-events-none absolute",
                motionClass(p.motion),
                visited ? "garden-decor-visited" : "",
              ].join(" ")}
              style={{
                left: `${pos.x}%`,
                top: `${pos.y}%`,
                width: `${p.widthPct}%`,
                transform: motionClass(p.motion)
                  ? undefined
                  : "translate(-50%, -100%)",
                transformOrigin: "50% 100%",
                zIndex: stageZ(p.layer, pos.y),
              }}
            >
              <GardenDecorSprite
                itemId={p.itemId}
                tone={p.tone}
                className="mx-auto h-auto w-full drop-shadow-md"
              />
            </div>
          ) : (
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
                onRemove?.(p.id);
              }}
              className={[
                "absolute border-0 bg-transparent p-0 cursor-grab",
                isDragging ? "garden-dragging" : motionClass(p.motion),
                selected
                  ? "ring-2 ring-ember/70 ring-offset-2 ring-offset-transparent"
                  : "",
                visited ? "garden-decor-visited" : "",
              ].join(" ")}
              style={{
                left: `${pos.x}%`,
                top: `${pos.y}%`,
                width: `${p.widthPct}%`,
                transform: isDragging
                  ? "translate(-50%, -100%)"
                  : motionClass(p.motion)
                    ? undefined
                    : "translate(-50%, -100%)",
                transformOrigin: "50% 100%",
                zIndex: isDragging ? 40 : stageZ(p.layer, pos.y),
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

        {readOnly ? (
          <div
            aria-hidden
            className="pointer-events-none absolute"
            style={{
              left: `${nestX}%`,
              top: `${nestY}%`,
              zIndex: stageZ(garden.pet.layer, nestY),
              width: "min(22%, 128px)",
              transform: "translate(-50%, -72%)",
            }}
          >
            <div className="relative mx-auto aspect-[120/90] w-full">
              <GardenNest
                night={night}
                className="absolute inset-x-0 bottom-0 z-[1] h-auto w-full drop-shadow-md"
              />
              {pet && inNest ? (
                <div className="pointer-events-none absolute bottom-[4%] left-1/2 z-[2] w-[70%] -translate-x-1/2 [&_>div]:!mx-0 [&_>div]:!h-auto [&_>div]:!w-full [&_svg]:!h-auto [&_svg]:!w-full">
                  <PetMark
                    speciesId={pet.speciesId as PetSpeciesId}
                    stage={pet.stage}
                    colors={pet.colors}
                    happinessState={pet.happinessState}
                    motion={petMotion}
                    size={120}
                  />
                </div>
              ) : null}
              <GardenNestRim
                night={night}
                className="pointer-events-none absolute inset-x-0 bottom-0 z-[3] h-auto w-full"
              />
            </div>
            {pet && inNest ? (
              <DialogueBubble
                text={pet.dialogue}
                side={bubbleLeft ? "left" : "right"}
              />
            ) : null}
          </div>
        ) : (
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
            zIndex: draggingNest ? 40 : stageZ(garden.pet.layer, nestY),
            width: "min(22%, 128px)",
            transform: "translate(-50%, -72%)",
          }}
        >
          <div className="relative mx-auto aspect-[120/90] w-full">
            <GardenNest
              night={night}
              className="absolute inset-x-0 bottom-0 z-[1] h-auto w-full drop-shadow-md"
            />
            {pet && inNest ? (
              <div
                className="pointer-events-none absolute bottom-[4%] left-1/2 z-[2] w-[70%] -translate-x-1/2 [&_>div]:!mx-0 [&_>div]:!h-auto [&_>div]:!w-full [&_svg]:!h-auto [&_svg]:!w-full"
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
            ) : null}
            <GardenNestRim
              night={night}
              className="pointer-events-none absolute inset-x-0 bottom-0 z-[3] h-auto w-full"
            />
          </div>
          {pet && inNest ? (
            <DialogueBubble
              text={pet.dialogue}
              side={bubbleLeft ? "left" : "right"}
            />
          ) : null}
        </button>
        )}

        {pet && !inNest ? (
          <div
            aria-hidden
            className="pointer-events-none absolute"
            style={{
              left: `${petX}%`,
              top: `${petY}%`,
              width: petWidth,
              zIndex: stageZ(garden.pet.layer, petY, 2),
              transform: "translate(-50%, -100%)",
            }}
          >
            <div
              className="relative mx-auto w-full"
              style={{
                transform: `scaleX(${roam.facing})`,
                transformOrigin: "50% 100%",
              }}
            >
              <div
                className={[
                  "[&_>div]:!mx-0 [&_>div]:!h-auto [&_>div]:!w-full [&_svg]:!h-auto [&_svg]:!w-full",
                  roam.mode === "walk"
                    ? "garden-pet-walk"
                    : roam.mode === "interact"
                      ? "garden-pet-interact"
                      : "",
                ].join(" ")}
              >
                <PetMark
                  speciesId={pet.speciesId as PetSpeciesId}
                  stage={pet.stage}
                  colors={pet.colors}
                  happinessState={
                    roam.mode === "nap" ? "sleepy" : pet.happinessState
                  }
                  motion={petMotion}
                  size={120}
                />
              </div>
            </div>
            <DialogueBubble
              text={pet.dialogue}
              side={bubbleLeft ? "left" : "right"}
            />
          </div>
        ) : null}

        {selectedDecor && !readOnly ? (
          <div
            data-place-layer="1"
            aria-hidden
            className="absolute inset-0 z-[100] cursor-crosshair"
            onPointerDown={(e) => {
              if (busy) return;
              e.stopPropagation();
              const layer = e.currentTarget;
              const { x, y } = toNorm(e.clientX, e.clientY, layer);
              onPlace?.(selectedDecor, x, y);
            }}
            onPointerMove={(e) => {
              setPlaceGhost(
                toNorm(e.clientX, e.clientY, e.currentTarget),
              );
            }}
          />
        ) : null}

        {selectedDecor && !readOnly && placeGhost ? (
          <div
            className="pointer-events-none absolute opacity-60"
            style={{
              left: `${placeGhost.x}%`,
              top: `${placeGhost.y}%`,
              zIndex: 110,
              transform: "translate(-50%, -100%)",
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
