import type { LogicPuzzle } from "./logic";
import type { MonthlyOnlyPuzzle } from "./monthly-puzzles";

/** Escape room explanations keyed by template slug. */
const ESCAPE_EXPLANATIONS: Record<string, string[]> = {
  "first-snow": [
    "The notebook ties the safe to the first day winter interrupted the case.",
    "The calendar circles the 12th of the tenth month with the note “First flakes.”",
    "Desk codes use month then day as four digits → 10/12 → 1012.",
  ],
  "gallery-alarm": [
    "The facility card gives building number 14.",
    "The lobby photo lists three founders on the brass rail (Ames · Bell · Crowe).",
    "The plaque rule is building number × founder count → 14 × 3 = 42.",
  ],
  "train-locker": [
    "The ticket stub gives carriage 7, seat 3A, and departure 19:45.",
    "Chalk orders the dial: ride → berth digits → clock hour.",
    "Digits only: 7, then 3 from 3A, then hour 19 from 19:45 → 7319.",
  ],
  "lab-centrifuge": [
    "Notes order elements by role: life (C), breath (O), buzzing gas (Ne).",
    "The chart gives their atomic numbers: C·6, O·8, Ne·10.",
    "Concatenate the counts left to right → 6810.",
  ],
  "library-cipher": [
    "The borrow slip shows call MYST-B-27 and a year ending in 19.",
    "B is the 2nd letter; book number 27; twin year digits 19.",
    "Vault recipe: letter place → book number → year twin → 2, 27, 19 → 22719.",
  ],
  "manor-clock": [
    "“The hour the clock fears” is midnight (00:00), not the frozen noon on the dial.",
    "Half past that dead hour is 00:30.",
    "The latch wants four digits HHMM from midnight → 0030.",
  ],
  "harbor-crate": [
    "The stencil lists LOT 58, BAY 3, and SHIFT 2.",
    "The ledger cipher order is bay, then lot, then shift.",
    "Concatenate as written (no zero-padding the bay) → 3, 58, 2 → 3582.",
  ],
  "cafe-wi-fi": [
    "The specials ticket counts two flat whites and one pour-over at table 4.",
    "The receipt rule sums drinks per table; table 4 has 2 + 1 = 3 drinks.",
    "The deadbolt wants table number and drink tally → 4 and 3 → 43.",
  ],
};

export function buildEscapeExplanation(slug: string): string | undefined {
  const steps = ESCAPE_EXPLANATIONS[slug];
  if (!steps?.length) return undefined;
  return steps.join(" ");
}

export function buildLogicExplanation(puzzle: LogicPuzzle): string {
  const lines: string[] = [];
  for (const subject of puzzle.subjects.values) {
    const row = puzzle.solution[subject];
    if (!row) continue;
    const parts = puzzle.traits.map(
      (trait) => `${trait.label.toLowerCase()} ${row[trait.id]}`,
    );
    lines.push(`${subject}: ${parts.join(", ")}.`);
  }
  lines.push(`Therefore, ${puzzle.question.toLowerCase()} ${puzzle.answer}.`);
  return lines.join(" ");
}

export function buildMonthlyExplanation(
  puzzle: MonthlyOnlyPuzzle,
): string | undefined {
  switch (puzzle.kind) {
    case "riddle":
      return `The clues point to “${puzzle.answer}.”`;
    case "mathlogic":
      return `Work through the prompt step by step to reach ${puzzle.answer}.`;
    case "trivia":
      return `The correct choice is “${puzzle.options[puzzle.answerIndex]}.”`;
    case "pattern": {
      const next = puzzle.options[puzzle.answerIndex];
      return `The shown sequence continues with “${next}.”`;
    }
    case "deduction":
      return puzzle.explanation;
    case "memory":
      return `Memorize and replay the flashed sequence: ${puzzle.sequence.join(" ")}.`;
  }
}

export function monthlyAnswerLabel(puzzle: MonthlyOnlyPuzzle): string | undefined {
  switch (puzzle.kind) {
    case "riddle":
    case "mathlogic":
      return puzzle.answer;
    case "trivia":
    case "pattern":
    case "deduction":
      return puzzle.options[puzzle.answerIndex];
    case "memory":
      return puzzle.sequence.join(" ");
  }
}
