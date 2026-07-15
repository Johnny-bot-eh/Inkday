import type { Difficulty } from "./types";
import { dayIndex, hashSeed, pickIndex } from "./types";

export type EscapeClue = {
  id: string;
  label: string;
  text: string;
};

export type EscapeRoom = {
  id: string;
  title: string;
  briefing: string;
  prompt: string;
  clues: EscapeClue[];
  /** Canonical normalized answer */
  answer: string;
  placeholder: string;
  maxAttempts: number;
};

/**
 * Clue reveal tiers:
 * - essential: always shown (puzzle is solvable from these alone, with work)
 * - helpful: easy + medium (format / confirmation, not the raw code)
 * - spoiler: easy only (almost gives it away)
 * - decoy: hard + medium add noise; easy may too for flavor
 */
type Tier = "essential" | "helpful" | "spoiler" | "decoy";

type TieredClue = EscapeClue & { tier: Tier };

type EscapeTemplate = {
  slug: string;
  title: string;
  briefing: string;
  prompt: string;
  answer: string;
  placeholder: string;
  cluePool: TieredClue[];
};

const ESCAPES: EscapeTemplate[] = [
  {
    slug: "first-snow",
    title: "The Snowfall Safe",
    briefing:
      "A detective's study. A notebook, a wall calendar, and sticky scraps surround a locked desk safe.",
    prompt: "Enter the safe code.",
    answer: "1012",
    placeholder: "····",
    cluePool: [
      {
        id: "notebook",
        tier: "essential",
        label: "Notebook",
        text: '"Safe = the day winter first interrupted the case."',
      },
      {
        id: "calendar",
        tier: "essential",
        label: "Calendar",
        text: "A circled date mid-autumn: the 12th of the tenth month. Margin note: First flakes.",
      },
      {
        id: "sticky",
        tier: "helpful",
        label: "Sticky note",
        text: "Desk codes run month→day, four digits, no separators.",
      },
      {
        id: "spoiler",
        tier: "spoiler",
        label: "Index card",
        text: "Example style from last winter: January 5 → 0105.",
      },
      {
        id: "mug",
        tier: "decoy",
        label: "Coffee mug",
        text: "Mom's birthday is March 3 — charming, irrelevant.",
      },
    ],
  },
  {
    slug: "gallery-alarm",
    title: "Gallery After Hours",
    briefing:
      "The wing is locked. A keypad blinks beside a scratched plaque and a lobby photo.",
    prompt: "What is the keypad code?",
    answer: "42",
    placeholder: "··",
    cluePool: [
      {
        id: "plaque",
        tier: "essential",
        label: "Plaque",
        text: '"Access = building number times the founding circle."',
      },
      {
        id: "receipt",
        tier: "essential",
        label: "Facility card",
        text: "Building No. 14. Founding circle carved beneath the lobby busts.",
      },
      {
        id: "photo",
        tier: "essential",
        label: "Lobby photo",
        text: "Three names on the brass rail: Ames · Bell · Crowe.",
      },
      {
        id: "math",
        tier: "helpful",
        label: "Docent tip",
        text: "\"Circle\" means how many founders — multiply, don't list them.",
      },
      {
        id: "spoiler",
        tier: "spoiler",
        label: "Maintenance sticker",
        text: "Test unlock last year used fourteen × three.",
      },
      {
        id: "junk",
        tier: "decoy",
        label: "Guard radio",
        text: "Night-shift rumor still claims 0000. It never worked.",
      },
    ],
  },
  {
    slug: "train-locker",
    title: "Platform Locker",
    briefing:
      "A forgotten locker at Platform B. Ticket stub, chalk, and a luggage tag wait beside the dial.",
    prompt: "Locker combination?",
    answer: "7319",
    placeholder: "····",
    cluePool: [
      {
        id: "ticket",
        tier: "essential",
        label: "Ticket stub",
        text: "Carriage 7 · Seat 3A · Depart 19:45",
      },
      {
        id: "chalk",
        tier: "essential",
        label: "Chalk on door",
        text: "Order: ride → berth digits → clock hour.",
      },
      {
        id: "tag",
        tier: "helpful",
        label: "Luggage tag",
        text: "Letters are vanity. The dial only eats numbers.",
      },
      {
        id: "spoiler",
        tier: "spoiler",
        label: "Porter scrap",
        text: "Hour means the departure hour only — drop the minutes.",
      },
      {
        id: "poster",
        tier: "decoy",
        label: "Timetable scrap",
        text: "Express to Riverton also leaves at 21:10 — wrong platform.",
      },
    ],
  },
  {
    slug: "lab-centrifuge",
    title: "Cold Lab Lockout",
    briefing:
      "The centrifuge chamber won't open. Lab notes and a faded wall chart sit under frost.",
    prompt: "Enter the chamber code.",
    answer: "6810",
    placeholder: "····",
    cluePool: [
      {
        id: "notes",
        tier: "essential",
        label: "Lab notes",
        text: "Sequence: the life element, then the breath element, then the buzzing gas — by nuclear count.",
      },
      {
        id: "poster",
        tier: "essential",
        label: "Periodic chart",
        text: "Ice-scraped corner still shows: C·6 · O·8 · Ne·10.",
      },
      {
        id: "magnet",
        tier: "helpful",
        label: "Fridge magnet",
        text: "String the counts. No commas, no element letters in the pad.",
      },
      {
        id: "spoiler",
        tier: "spoiler",
        label: "Intern sticky",
        text: "C 6, O 8, Ne 10 — mash them left to right.",
      },
      {
        id: "spill",
        tier: "decoy",
        label: "Spill report",
        text: "Helium tank logged empty at 02:00 — unrelated.",
      },
    ],
  },
  {
    slug: "library-cipher",
    title: "Reading Room Vault",
    briefing:
      "A book vault wants a careful reading of call numbers and the alphabet rail.",
    prompt: "Vault code?",
    answer: "22719",
    placeholder: "·····",
    cluePool: [
      {
        id: "slip",
        tier: "essential",
        label: "Borrow slip",
        text: "Call number MYST-B-27. Year stamp ends …19.",
      },
      {
        id: "card",
        tier: "essential",
        label: "Librarian card",
        text: "Vault recipe: letter's place → book number → year twin digits.",
      },
      {
        id: "alpha",
        tier: "helpful",
        label: "Alphabet rail",
        text: "A leads the line; B stands second; C third…",
      },
      {
        id: "spoiler",
        tier: "spoiler",
        label: "Practice pad",
        text: "For shelf A-10 in '18 the drill code was 11018.",
      },
      {
        id: "noise",
        tier: "decoy",
        label: "Discard pile",
        text: "Yesterday's failed tries: 2719 and 1927 — order matters.",
      },
    ],
  },
  {
    slug: "manor-clock",
    title: "Stopped Clock Study",
    briefing:
      "The study clock is frozen. A telegram, the clock face, and a watch chain note each disagree until you read them together.",
    prompt: "Drawer combination?",
    answer: "0030",
    placeholder: "····",
    cluePool: [
      {
        id: "telegram",
        tier: "essential",
        label: "Telegram",
        text: "MEET AT HALF PAST THE HOUR THE CLOCK FEARS.",
      },
      {
        id: "clock",
        tier: "essential",
        label: "Clock face",
        text: "Short hand fixed at the crown. Long hand pinned straight down.",
      },
      {
        id: "watch",
        tier: "helpful",
        label: "Pocket watch note",
        text: "Drawer latch speaks only four digits — two for the hour, two for the minutes — from midnight's side of the day.",
      },
      {
        id: "spoiler",
        tier: "spoiler",
        label: "Butler memo",
        text: "\"Fears\" means the dead hour, not noon. Half past that is when the latch yields.",
      },
      {
        id: "ash",
        tier: "decoy",
        label: "Ashtray",
        text: "A burnt scrap still shows 1230 — someone's midday guess.",
      },
    ],
  },
  {
    slug: "harbor-crate",
    title: "Crimson Crate",
    briefing:
      "A sealed crate on Pier 4. Stencil marks and a dock ledger only align if you follow the rule under the lid.",
    prompt: "Bolt code?",
    answer: "3582",
    placeholder: "····",
    cluePool: [
      {
        id: "stencil",
        tier: "essential",
        label: "Crate stencil",
        text: "LOT 58 / BAY 3 / SHIFT 2",
      },
      {
        id: "ledger",
        tier: "essential",
        label: "Dock ledger",
        text: "Bolt cipher: bay, then lot, then shift — as written.",
      },
      {
        id: "ink",
        tier: "helpful",
        label: "Underside ink",
        text: "Glue the numbers. Do not zero-pad the bay.",
      },
      {
        id: "spoiler",
        tier: "spoiler",
        label: "Foreman scrap",
        text: "Bay first always — so three, then fifty-eight, then two.",
      },
      {
        id: "siren",
        tier: "decoy",
        label: "Siren notice",
        text: "Emergency override 911 — disabled on this pier.",
      },
    ],
  },
  {
    slug: "cafe-wi-fi",
    title: "Cafe Back Room",
    briefing:
      "Staff-only door. The chalkboard password is theater — the deadbolt wants a quieter tally.",
    prompt: "Door code?",
    answer: "43",
    placeholder: "··",
    cluePool: [
      {
        id: "menu",
        tier: "essential",
        label: "Specials ticket",
        text: "Table 4: two flat whites, one pour-over.",
      },
      {
        id: "receipt",
        tier: "essential",
        label: "Tip-jar note",
        text: "Back latch = table, then how many cups on that ticket.",
      },
      {
        id: "apron",
        tier: "helpful",
        label: "Apron pocket",
        text: "Count every drink line — milk doesn't matter, cups do.",
      },
      {
        id: "spoiler",
        tier: "spoiler",
        label: "Opening checklist",
        text: "Example: table 9 with four drips → 94.",
      },
      {
        id: "chalk",
        tier: "decoy",
        label: "Chalkboard",
        text: "Wi-Fi: MochaMagic! — guests only. Not the door.",
      },
    ],
  },
];

const ATTEMPTS: Record<Difficulty, number> = {
  easy: 5,
  medium: 3,
  hard: 2,
};

const TIERS_FOR: Record<Difficulty, Tier[]> = {
  // Easy: full support + one worked example; light decoy optional
  easy: ["essential", "helpful", "spoiler"],
  // Medium: solvable, but you assemble format yourself; decoys allowed
  medium: ["essential", "helpful", "decoy"],
  // Hard: essentials only + decoys — no format rescue
  hard: ["essential", "decoy"],
};

function cluesForDifficulty(
  template: EscapeTemplate,
  difficulty: Difficulty,
  seed: number,
): EscapeClue[] {
  const allowed = new Set(TIERS_FOR[difficulty]);
  let clues = template.cluePool.filter((c) => allowed.has(c.tier));

  // Hard: keep every essential, at most one decoy
  if (difficulty === "hard") {
    const essentials = clues.filter((c) => c.tier === "essential");
    const decoys = clues.filter((c) => c.tier === "decoy");
    const decoy =
      decoys.length === 0
        ? []
        : [
            [...decoys].sort(
              (a, b) => hashSeed(seed, a.id) - hashSeed(seed, b.id),
            )[0]!,
          ];
    clues = [...essentials, ...decoy];
  }

  // Easy: don't overwhelm — drop decoys (already excluded) and cap spoilers to 1
  if (difficulty === "easy") {
    const spoilers = clues.filter((c) => c.tier === "spoiler");
    const rest = clues.filter((c) => c.tier !== "spoiler");
    const spoiler =
      spoilers.length === 0
        ? []
        : [
            [...spoilers].sort(
              (a, b) => hashSeed(seed, a.id) - hashSeed(seed, b.id),
            )[0]!,
          ];
    clues = [...rest, ...spoiler];
  }

  // Medium: at most one decoy so it stays readable
  if (difficulty === "medium") {
    const decoys = clues.filter((c) => c.tier === "decoy");
    const rest = clues.filter((c) => c.tier !== "decoy");
    const decoy =
      decoys.length === 0
        ? []
        : [
            [...decoys].sort(
              (a, b) => hashSeed(seed, a.id) - hashSeed(seed, b.id),
            )[0]!,
          ];
    clues = [...rest, ...decoy];
  }

  const orderSeed = hashSeed(seed, "order");
  return [...clues]
    .sort((a, b) => hashSeed(orderSeed, a.id) - hashSeed(orderSeed, b.id))
    .map(({ id, label, text }) => ({ id, label, text }));
}

export function normalizeEscapeAnswer(value: string): string {
  return value.trim().toUpperCase().replace(/[\s\-_.]/g, "");
}

export function getEscapeRoom(
  dateKey: string,
  difficulty: Difficulty,
): EscapeRoom {
  const seed = hashSeed("escape", dateKey, difficulty, dayIndex(dateKey));
  const template = ESCAPES[pickIndex(seed, ESCAPES.length)]!;
  const clues = cluesForDifficulty(template, difficulty, seed);

  return {
    id: `${template.slug}-${dateKey}-${difficulty}`,
    title: template.title,
    briefing: template.briefing,
    prompt: template.prompt,
    clues,
    answer: template.answer,
    placeholder: template.placeholder,
    maxAttempts: ATTEMPTS[difficulty],
  };
}

export function checkEscapeAnswer(
  room: EscapeRoom,
  attempt: string,
): { correct: boolean; normalized: string } {
  const normalized = normalizeEscapeAnswer(attempt);
  return {
    correct: normalized === normalizeEscapeAnswer(room.answer),
    normalized,
  };
}
