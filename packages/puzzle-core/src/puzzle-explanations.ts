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
    "The ticket stub lists departure 19:45, seat 3A, and carriage 7 — not yet in dial order.",
    "Chalk reorders the dial: ride → berth digits → clock hour.",
    "Digits only: carriage 7, then 3 from 3A, then hour 19 from 19:45 → 7319.",
  ],
  "lab-centrifuge": [
    "Notes order elements by role: life (C), breath (O), buzzing gas (Ne).",
    "The chart shows their atomic numbers in a scrambled patch (Ne·10, C·6, O·8).",
    "Reorder by the notes, then concatenate the counts → 6, 8, 10 → 6810.",
  ],
  "library-cipher": [
    "The borrow slip shows call MYST-B-27 and a year ending in 19.",
    "B is the 2nd letter of the alphabet; book number 27; twin year digits 19.",
    "Vault recipe: ABC-place → book# → year-twin → 2, 27, 19 → 22719.",
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

/**
 * Logic-grid writeups: walk the clue chain, not a restatement of the filled grid.
 * Keyed by template slug.
 */
const LOGIC_EXPLANATIONS: Record<string, string[]> = {
  "missing-necklace": [
    "Alice is in the library, and the library person has the key → Alice has the key (not the necklace).",
    "Bob is in the garden; Daniel has the letter; the office person has the watch.",
    "Claire does not have the necklace, so after placing key/letter/watch the necklace is left with Bob in the garden.",
  ],
  "poisoned-pastry": [
    "Pat’s pastry is lemon, so Pat is not chocolate.",
    "Chocolate is at the east stall; Nora is not east, so Nora is not chocolate.",
    "Quinn is therefore at east with chocolate — the spiked pastry.",
  ],
  "cipher-club": [
    "Finn is door/fan; Hugo is fire/mask; Gia is corner — so Eva is at the window.",
    "The ledger is not at the door, fire, or corner, so it sits with Eva at the window.",
  ],
  "garden-gnome": [
    "Ivy is maple with the rake; Jon is pond with the hose; Leo is rose with the spade.",
    "That leaves Kim in the hill yard, and the hill yard holds the gnome.",
  ],
  "night-train": [
    "Opa is in A with the violin; Ned is in B with the umbrella.",
    "The parcel is in C, so the only traveler left — Mira — has the parcel.",
  ],
  "studio-paint": [
    "Cam is easel 1/crimson; Di is easel 3/ochre; Bea is easel 2 — Ash is left at easel 4.",
    "Easel 4 holds the stolen palette, so Ash took it; Bea is left with indigo.",
  ],
  "harbor-lantern": [
    "Rae is red with oilskin; Sid is blue with wool.",
    "The lantern kit is at the green dock, so Tess — the remaining keeper — sabotaged the lantern.",
  ],
  "midnight-evidence": [
    "8 o’clock carries the key; the note is exactly two hours after the key → note at 10.",
    "The lens is at 9; Dax arrives one hour after the key-carrier → Dax at 9 with the lens.",
    "Bram arrives earlier than Ada and 8 is the key → Bram is the 8/key arrival.",
    "Cora is neither 8 nor 11, so Cora is at 10 with the note; Ada is left at 11 with the map.",
  ],
  "museum-after-hours": [
    "Seal is on the roof; rope is in the gallery; kitchen does not have the file → file is in the archive.",
    "Faye is neither archive nor kitchen, and carries neither file nor flask → Faye is roof/seal.",
    "Elin carries neither seal nor file, and is not on the roof → Elin is gallery/rope.",
    "Holt carries neither seal nor rope and is not in the archive → Holt is kitchen/flask.",
    "Gus is left in the archive with the file.",
  ],
  "compass-vault": [
    "Crown is west; ring is south.",
    "Jory is neither east nor west, and not south → Jory is north; north is neither crown nor ring → Jory has the letter.",
    "Inez is neither north nor south → Inez is east or west; east holds neither letter nor crown → east is gem or ring, but ring is south → east is gem → Inez has the gem.",
    "Kian holds neither letter nor ring and is not east → Kian is west with the crown; Lux is south with the ring.",
  ],
};

export function buildEscapeExplanation(slug: string): string | undefined {
  const steps = ESCAPE_EXPLANATIONS[slug];
  if (!steps?.length) return undefined;
  return steps.join(" ");
}

export function buildLogicExplanation(
  slug: string,
  puzzle: LogicPuzzle,
): string {
  const steps = LOGIC_EXPLANATIONS[slug];
  if (steps?.length) {
    return steps.join(" ");
  }
  // Fallback: summarize the deduction goal without dumping the answer alone.
  const traitLabels = puzzle.traits.map((t) => t.label.toLowerCase()).join(" / ");
  return `Match each ${puzzle.subjects.label.toLowerCase()} to a unique ${traitLabels} using the clues (no repeats in a column). Follow links and eliminations until only one assignment answers: ${puzzle.question}`;
}

export function buildMonthlyExplanation(
  puzzle: MonthlyOnlyPuzzle,
): string | undefined {
  switch (puzzle.kind) {
    case "riddle":
    case "mathlogic":
    case "trivia":
    case "pattern":
    case "deduction":
      return puzzle.explanation;
    case "memory": {
      const preview = puzzle.sequence.slice(0, 3).join(" → ");
      const more =
        puzzle.sequence.length > 3
          ? ` … (${puzzle.sequence.length} symbols)`
          : "";
      return `Symbols flash one at a time — remember the order (${preview}${more}), then tap them back in the same sequence. Order matters; guessing the set without the order does not clear the case.`;
    }
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
