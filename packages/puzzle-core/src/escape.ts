import type { Difficulty } from "./types";
import { buildEscapeExplanation } from "./puzzle-explanations";
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
  /** How the answer follows from the clues (shown after clear). */
  explanation?: string;
};

/**
 * Clue reveal tiers:
 * - essential: always shown — facts you must synthesize (never the raw answer)
 * - helpful: easy only — format / confirmations
 * - spoiler: easy only — near-giveaways
 * - decoy: medium + hard — convincing false trails (never label themselves as junk)
 */
type Tier = "essential" | "helpful" | "spoiler" | "decoy";

type TieredClue = EscapeClue & {
  tier: Tier;
  /** Shown on medium/hard when set — denser / less hand-holding */
  cryptic?: string;
};

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
        cryptic:
          'Margin only: “Code follows the first interruption of the season.”',
      },
      {
        id: "calendar",
        tier: "essential",
        label: "Calendar",
        text: "A circled date mid-autumn: the 12th of the tenth month. Margin note: First flakes.",
        cryptic:
          "One day circled in autumn. Tiny ink: First flakes. No month name written — only the grid.",
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
        text: "Mom’s birthday — March 3 — written under the handle in nail polish.",
      },
      {
        id: "blotter",
        tier: "decoy",
        label: "Desk blotter",
        text: "Repeated doodle: 0312. Beside it: “spring check-in?”",
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
        cryptic: "Etched rule: number × circle.",
      },
      {
        id: "receipt",
        tier: "essential",
        label: "Facility card",
        text: "Building No. 14. Founding circle carved beneath the lobby busts.",
        cryptic: "Building No. 14 stamped on the badge.",
      },
      {
        id: "photo",
        tier: "essential",
        label: "Lobby photo",
        text: "Three names on the brass rail: Ames · Bell · Crowe.",
        cryptic: "Brass rail names: Ames · Bell · Crowe.",
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
        text: "Shift change password rotation still includes 0000 on the laminated card.",
      },
      {
        id: "postcard",
        tier: "decoy",
        label: "Gift shop postcard",
        text: "Front reads “Est. 1914” under a watercolor of the atrium.",
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
        cryptic: "Stub: 7 / 3A / 19:45",
      },
      {
        id: "chalk",
        tier: "essential",
        label: "Chalk on door",
        text: "Order: ride → berth digits → clock hour.",
        cryptic: "Chalk arrows: ride → berth → hour.",
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
        text: "Express Riverton — Platform C — 21:10.",
      },
      {
        id: "seatmap",
        tier: "decoy",
        label: "Seat map scrap",
        text: "Car 9 row D circled in red for a different booking.",
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
        cryptic:
          "Order whispered in the notes: life → breath → buzz. Count, don’t name.",
      },
      {
        id: "poster",
        tier: "essential",
        label: "Periodic chart",
        text: "Ice-scraped corner still shows: C·6 · O·8 · Ne·10.",
        cryptic: "Frost-cleared patch: C 6 · O 8 · Ne 10 among other scratched cells.",
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
        text: "He tank pressure logged at 02:00 — gauge stuck on 02.",
      },
      {
        id: "tray",
        tier: "decoy",
        label: "Sample tray",
        text: "Labels H, N, Ar lined up under the hood light.",
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
        cryptic: "Slip edge: MYST-B-27 / …19",
      },
      {
        id: "card",
        tier: "essential",
        label: "Librarian card",
        text: "Vault recipe: letter's place → book number → year twin digits.",
        cryptic: "Recipe shorthand: place · book · twin.",
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
        text: "Pencil trials stacked: 2719, 1927, 2279.",
      },
      {
        id: "spine",
        tier: "decoy",
        label: "Nearby spine",
        text: "HIST-C-19 with a gold '22 stamped on the flyleaf.",
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
        cryptic:
          "MEET · HALF PAST · THE DEAD HOUR (midnight, not the hour on the frozen dial).",
      },
      {
        id: "clock",
        tier: "essential",
        label: "Clock face",
        text: "Short hand fixed at the crown. Long hand pinned straight down.",
        cryptic:
          "Hands locked at noon on the dial — ignore the frozen face; trust the telegram.",
      },
      {
        id: "watch",
        tier: "essential",
        label: "Pocket watch note",
        text: "Drawer latch speaks only four digits — two for the hour, two for the minutes — from midnight's side of the day.",
        cryptic:
          "Latch wants HHMM counted from midnight (00–23), not from noon.",
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
        text: "Charred fragment still reads 1230 under soot.",
      },
      {
        id: "estate",
        tier: "decoy",
        label: "Estate ledger",
        text: "Wine cellar key signed out at noon sharp yesterday.",
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
        cryptic: "Stencil block: LOT 58 · BAY 3 · SHIFT 2",
      },
      {
        id: "ledger",
        tier: "essential",
        label: "Dock ledger",
        text: "Bolt cipher: bay, then lot, then shift — as written.",
        cryptic: "Cipher column header: bay → lot → shift",
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
        text: "Pier emergency kit lists override 911 in bold red.",
      },
      {
        id: "manifest",
        tier: "decoy",
        label: "Cargo manifest",
        text: "Adjacent crate: BAY 5 / LOT 82 / SHIFT 3.",
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
        cryptic: "Ticket stub: T4 — 2 flat · 1 pour",
      },
      {
        id: "receipt",
        tier: "essential",
        label: "Tip-jar note",
        text: "Back latch = table, then how many cups on that ticket.",
        cryptic: "Latch shorthand: table + cups.",
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
        text: "Guest Wi‑Fi password scrawled as MochaMagic!",
      },
      {
        id: "register",
        tier: "decoy",
        label: "Register tape",
        text: "Table 12 closed out with six drinks at 10:41.",
      },
    ],
  },
];

const ATTEMPTS: Record<Difficulty, number> = {
  easy: 5,
  medium: 3,
  hard: 2,
  impossible: 1,
};

/** Easy gets hand-holds; medium/hard must deduce format and discard red herrings. */
const TIERS_FOR: Record<Difficulty, Tier[]> = {
  easy: ["essential", "helpful", "spoiler"],
  medium: ["essential", "decoy"],
  hard: ["essential", "decoy"],
  impossible: ["essential"],
};

function clueTextForDifficulty(clue: TieredClue, difficulty: Difficulty): string {
  if (
    (difficulty === "medium" ||
      difficulty === "hard" ||
      difficulty === "impossible") &&
    clue.cryptic
  ) {
    return clue.cryptic;
  }
  return clue.text;
}

function cluesForDifficulty(
  template: EscapeTemplate,
  difficulty: Difficulty,
  seed: number,
): EscapeClue[] {
  const allowed = new Set(TIERS_FOR[difficulty]);
  let clues = template.cluePool.filter((c) => allowed.has(c.tier));

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

  if (difficulty === "medium") {
    // One convincing red herring among the essentials
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

  if (difficulty === "hard") {
    // Two red herrings; essentials use cryptic wording
    const decoys = clues.filter((c) => c.tier === "decoy");
    const rest = clues.filter((c) => c.tier !== "decoy");
    const picked = [...decoys]
      .sort((a, b) => hashSeed(seed, a.id) - hashSeed(seed, b.id))
      .slice(0, Math.min(2, decoys.length));
    clues = [...rest, ...picked];
  }

  if (difficulty === "impossible") {
    clues = clues.filter((c) => c.tier === "essential");
  }

  const orderSeed = hashSeed(seed, "order");
  return [...clues]
    .sort((a, b) => hashSeed(orderSeed, a.id) - hashSeed(orderSeed, b.id))
    .map(({ id, label, text, cryptic, tier }) => ({
      id,
      label,
      text: clueTextForDifficulty({ id, label, text, cryptic, tier }, difficulty),
    }));
}

export function normalizeEscapeAnswer(value: string): string {
  return value.trim().toUpperCase().replace(/[\s\-_.]/g, "");
}

export function getEscapeRoom(
  dateKey: string,
  difficulty: Difficulty,
  pack: "standard" | "exclusive" | "premium" = "standard",
  seasonId: string | null = null,
): EscapeRoom {
  const seed = hashSeed(
    "escape",
    pack,
    seasonId ?? "",
    dateKey,
    difficulty,
    dayIndex(dateKey),
  );
  const template = ESCAPES[pickIndex(seed, ESCAPES.length)]!;
  const clues = cluesForDifficulty(template, difficulty, seed);
  const exclusive = pack === "exclusive";
  const premium = pack === "premium";
  const seasonPrefix = seasonId
    ? seasonId
        .split("-")
        .map((w) => w[0]!.toUpperCase() + w.slice(1))
        .join(" ")
    : null;

  let title = template.title;
  let briefing = template.briefing;
  if (exclusive) {
    title = `Exclusive: ${title}`;
    briefing = `Locked case file. ${briefing}`;
  }
  if (premium) {
    title = `Plus: ${title}`;
    briefing = `Inkday Plus case file. ${briefing}`;
  }
  if (seasonPrefix) {
    title = `${seasonPrefix}: ${title}`;
    briefing = `Seasonal event board. ${briefing}`;
  }

  const room: EscapeRoom = {
    id: `${template.slug}-${pack}-${seasonId ?? "std"}-${dateKey}-${difficulty}`,
    title,
    briefing,
    prompt: template.prompt,
    clues,
    answer: template.answer,
    placeholder: template.placeholder,
    maxAttempts: ATTEMPTS[difficulty],
  };
  room.explanation = buildEscapeExplanation(template.slug);
  return room;
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
