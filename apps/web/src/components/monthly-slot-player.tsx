"use client";

import { useEffect } from "react";
import type { Difficulty, MonthlyPuzzleType } from "@daily-puzzle/puzzle-core";
import { isMonthlyOnlyType } from "@daily-puzzle/puzzle-core";
import { CaseFileBackLink } from "@/components/case-file-back-link";
import { MonthlyOnlyGame } from "@/components/monthly-only-game";
import { WordleGame } from "@/components/wordle-game";
import { EscapeGame } from "@/components/escape-game";
import { LogicGame } from "@/components/logic-game";
import { AnagramGame } from "@/components/anagram-game";
import { CryptogramGame } from "@/components/cryptogram-game";
import { AcrosticGame } from "@/components/acrostic-game";
import { WordLadderGame } from "@/components/wordladder-game";
import { clearMonthlyPlayerNotes } from "@/lib/player-notes";

type Props = {
  collectionId: string;
  slotIndex: number;
  puzzleType: MonthlyPuzzleType;
  difficulty: Difficulty;
  seedKey: string;
  label: string;
  points: number;
  alreadyCleared: boolean;
  /** Slot was cleared, skipped, or failed — cannot be played again. */
  alreadyResolved: boolean;
  priorOutcome?: "cleared" | "skipped" | "failed" | null;
  signedIn: boolean;
  priorScore?: number;
};

export function MonthlySlotPlayer(props: Props) {
  useEffect(() => {
    if (props.alreadyResolved) {
      clearMonthlyPlayerNotes(props.collectionId, props.slotIndex);
    }
  }, [props.alreadyResolved, props.collectionId, props.slotIndex]);

  const monthly = {
    collectionId: props.collectionId,
    slotIndex: props.slotIndex,
  };
  const alreadyPlayed = props.alreadyResolved
    ? {
        score: props.priorScore ?? (props.alreadyCleared ? props.points : 0),
        won: props.alreadyCleared,
      }
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
        alreadyResolved={props.alreadyResolved}
        priorOutcome={props.priorOutcome}
        signedIn={props.signedIn}
      />
    );
  }

  const common = {
    difficulty: props.difficulty,
    dateKey: props.seedKey,
    signedIn: props.signedIn,
    alreadyPlayed,
    monthly,
  };

  return (
    <div>
      <div className="mb-4 flex items-center justify-between gap-3">
        <p className="text-sm text-fog">
          Slot #{props.slotIndex} · {props.label} · +{props.points} pts
        </p>
        <CaseFileBackLink collectionId={props.collectionId} />
      </div>
      {props.puzzleType === "wordle" && <WordleGame {...common} />}
      {props.puzzleType === "escape" && <EscapeGame {...common} />}
      {props.puzzleType === "logic" && <LogicGame {...common} />}
      {props.puzzleType === "anagram" && <AnagramGame {...common} />}
      {props.puzzleType === "cryptogram" && <CryptogramGame {...common} />}
      {props.puzzleType === "acrostic" && <AcrosticGame {...common} />}
      {props.puzzleType === "wordladder" && <WordLadderGame {...common} />}
    </div>
  );
}
