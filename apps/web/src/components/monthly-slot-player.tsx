"use client";

import type { Difficulty, MonthlyPuzzleType } from "@daily-puzzle/puzzle-core";
import { isMonthlyOnlyType } from "@daily-puzzle/puzzle-core";
import { MonthlyOnlyGame } from "@/components/monthly-only-game";
import { WordleGame } from "@/components/wordle-game";
import { EscapeGame } from "@/components/escape-game";
import { LogicGame } from "@/components/logic-game";
import { PathGame } from "@/components/path-game";
import { AnagramGame } from "@/components/anagram-game";
import { CryptogramGame } from "@/components/cryptogram-game";
import { AcrosticGame } from "@/components/acrostic-game";
import { WordLadderGame } from "@/components/wordladder-game";
import Link from "next/link";

type Props = {
  collectionId: string;
  slotIndex: number;
  puzzleType: MonthlyPuzzleType;
  difficulty: Difficulty;
  seedKey: string;
  label: string;
  points: number;
  alreadyCleared: boolean;
  signedIn: boolean;
  priorScore?: number;
};

export function MonthlySlotPlayer(props: Props) {
  const monthly = {
    collectionId: props.collectionId,
    slotIndex: props.slotIndex,
  };
  const alreadyPlayed = props.alreadyCleared
    ? { score: props.priorScore ?? props.points, won: true }
    : null;

  if (isMonthlyOnlyType(props.puzzleType)) {
    return (
      <MonthlyOnlyGame
        collectionId={props.collectionId}
        slotIndex={props.slotIndex}
        kind={props.puzzleType}
        seedKey={props.seedKey}
        difficulty={props.difficulty}
        label={props.label}
        points={props.points}
        alreadyCleared={props.alreadyCleared}
        signedIn={props.signedIn}
      />
    );
  }

  const back = (
    <p className="mb-4 text-sm">
      <Link href="/monthly" className="text-fog hover:text-paper">
        ← Case File
      </Link>
      <span className="mx-2 text-fog">·</span>
      <span className="text-fog">
        Slot #{props.slotIndex} · {props.label} · +{props.points} pts
      </span>
    </p>
  );

  const common = {
    difficulty: props.difficulty,
    dateKey: props.seedKey,
    signedIn: props.signedIn,
    alreadyPlayed,
    monthly,
  };

  return (
    <div>
      {back}
      {props.puzzleType === "wordle" && <WordleGame {...common} />}
      {props.puzzleType === "escape" && <EscapeGame {...common} />}
      {props.puzzleType === "logic" && <LogicGame {...common} />}
      {props.puzzleType === "path" && <PathGame {...common} />}
      {props.puzzleType === "anagram" && <AnagramGame {...common} />}
      {props.puzzleType === "cryptogram" && <CryptogramGame {...common} />}
      {props.puzzleType === "acrostic" && <AcrosticGame {...common} />}
      {props.puzzleType === "wordladder" && <WordLadderGame {...common} />}
    </div>
  );
}
