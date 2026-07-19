import type { Difficulty } from "./types";
import { buildEscapeExplanation } from "./puzzle-explanations";
import { dailyRotationIndex, hashSeed } from "./types";

export type EscapeClue = {
  id: string;
  label: string;
  text: string;
};

export type EscapeRoom = {
  id: string;
  /** Stable template id — unique across the repertoire. */
  slug: string;
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
 * - essential: always shown — facts to synthesize (never the raw answer, never a step-by-step recipe)
 * - helpful: easy only — gentle format hints (still not the answer)
 * - spoiler: easy only — worked examples with DIFFERENT numbers (never this room’s answer)
 * - decoy: medium + hard — convincing false trails
 *
 * Hard rules:
 * - No clue may state, spell, or concatenate this room’s answer.
 * - No clue may explicitly name the extraction recipe (“use atomic numbers”,
 *   “digits only”, “type HHMM”, etc.). Players must deduce what the lock wants.
 * - Cryptic text (medium+) must be denser / harder — never more explicit than easy.
 */
type Tier = "essential" | "helpful" | "spoiler" | "decoy";

type TieredClue = EscapeClue & {
  tier: Tier;
  /** Medium+ wording — denser, never spoon-feed method more than `text`. */
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
          'Margin: the circled “First flakes” calendar mark is what the safe listens for.',
      },
      {
        id: "calendar",
        tier: "essential",
        label: "Calendar",
        text: "A circled date mid-autumn: the 12th of the tenth month. Margin note: First flakes.",
        cryptic:
          "One autumn square is circled — tenth month, day twelve — inked First flakes.",
      },
      {
        id: "sticky",
        tier: "helpful",
        label: "Sticky note",
        text: "Desk codes prefer month before day.",
      },
      {
        id: "spoiler",
        tier: "spoiler",
        label: "Index card",
        text: "Example style from last winter (different day): January 5 looked like 0105 on the pad.",
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
        cryptic:
          "Etched rule: the building number and the founding circle share a product.",
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
        cryptic: "Brass rail names (the founding circle): Ames · Bell · Crowe.",
      },
      {
        id: "math",
        tier: "helpful",
        label: "Docent tip",
        text: "The “circle” is a count, not a guest list.",
      },
      {
        id: "spoiler",
        tier: "spoiler",
        label: "Maintenance sticker",
        text: "Drill note from another wing: building 9 with two founders left 18 on the test pad.",
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
        text: "Depart 19:45 · Seat 3A · Carriage 7",
        cryptic: "Stub fields: depart 19:45 / seat 3A / carriage 7",
      },
      {
        id: "chalk",
        tier: "essential",
        label: "Chalk on door",
        text: "Order on the dial: the carriage, then the berth, then when the train leaves.",
        cryptic:
          "Chalk stacks three ticket truths: which car, which seat’s number, which hour the wheels roll.",
      },
      {
        id: "tag",
        tier: "helpful",
        label: "Luggage tag",
        text: "Letters are vanity on this dial.",
      },
      {
        id: "spoiler",
        tier: "spoiler",
        label: "Porter scrap",
        text: "Another locker drill used carriage 2, seat 5B, depart 08:15 → 258.",
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
        text: "Sequence: the life element, then the breath element, then the buzzing neon gas.",
        cryptic:
          "Life · breath · neon’s hum — that procession alone matters.",
      },
      {
        id: "poster",
        tier: "essential",
        label: "Periodic chart",
        text: "Frost-scraped strip still lists: B 5 · C 6 · N 7 · O 8 · F 9 · Ne 10 · Na 11 among blank neighbors.",
        cryptic:
          "A cleared ribbon of the wall chart names boron through sodium — their counts are there if you know the table, or still faintly inked if you look close.",
      },
      {
        id: "magnet",
        tier: "helpful",
        label: "Fridge magnet",
        text: "The pad is happier with counts than with letters.",
      },
      {
        id: "spoiler",
        tier: "spoiler",
        label: "Intern sticky",
        text: "Practice run (different trio): hydrogen, helium, lithium in that order left 123 on the pad.",
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
        text: "Vault listens to the call-letter’s rank, then the book number, then the year twin.",
        cryptic:
          "Three whispers from the slip: where the letter stands, what follows it, what the year ends on.",
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
        text: "Drill for shelf A-10 in ’18 left 11018 on a practice lock.",
      },
      {
        id: "noise",
        tier: "decoy",
        label: "Discard pile",
        text: "Pencil trials stacked: 3018, 1922, 4419.",
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
          "MEET · HALF PAST · the hour every dial dreads — ignore the frozen face.",
      },
      {
        id: "clock",
        tier: "essential",
        label: "Clock face",
        text: "Short hand fixed at the crown. Long hand pinned straight down.",
        cryptic:
          "Hands locked at the crown and the base — trust them and you will be late forever.",
      },
      {
        id: "watch",
        tier: "essential",
        label: "Pocket watch note",
        text: "Drawer latch wants the meeting time written the military way.",
        cryptic:
          "The latch prefers a four-beat time from the midnight side of the day.",
      },
      {
        id: "spoiler",
        tier: "spoiler",
        label: "Butler memo",
        text: "House rule: the “dead hour” is neither noon nor the hour shown on a stuck mantel clock.",
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
        text: "Bolt cipher follows bay, then lot, then shift.",
        cryptic:
          "Three stencil numbers — bay first, lot next, shift last — become one breath for the bolt.",
      },
      {
        id: "ink",
        tier: "helpful",
        label: "Underside ink",
        text: "Don’t fatten the bay with a leading zero.",
      },
      {
        id: "spoiler",
        tier: "spoiler",
        label: "Foreman scrap",
        text: "Pier 2 drill (not this crate): bay 4, lot 17, shift 9 became 4179 on the practice bolt.",
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
        text: "Back latch cares about the table, then how many cups that ticket carries.",
        cryptic:
          "Table first, cup-count second — the latch reads them as neighbors, not a sum.",
      },
      {
        id: "apron",
        tier: "helpful",
        label: "Apron pocket",
        text: "Milk foam doesn’t count — cups do.",
      },
      {
        id: "spoiler",
        tier: "spoiler",
        label: "Opening checklist",
        text: "Drill: table 9 with four drips left 94 on the staff lock.",
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
  {
    slug: "attic-trunk",
    title: "Attic Trunk Latch",
    briefing:
      "Dusty attic. A steamer trunk won’t open without a year the diary keeps circling.",
    prompt: "Trunk code?",
    answer: "1963",
    placeholder: "····",
    cluePool: [
      {
        id: "diary",
        tier: "essential",
        label: "Diary page",
        text: "“The year the satellite sang and the president fell — that is the latch.”",
        cryptic:
          "Ink: latch = the year both the sky’s beep and the motorcade grief share.",
      },
      {
        id: "poster",
        tier: "essential",
        label: "Pinned clipping",
        text: "Yellowed headline: SPUTNIK FEVER FADES… beside a later photo of Dallas flags at half-mast.",
        cryptic:
          "Two clippings share a decade — a beeping sphere, then a darkened motorcade.",
      },
      {
        id: "helpful",
        tier: "helpful",
        label: "Pencil margin",
        text: "Four digits. A calendar year, not a day.",
      },
      {
        id: "spoiler",
        tier: "spoiler",
        label: "Practice tag",
        text: "Drill year for ‘moon step’ practice lock: 1969.",
      },
      {
        id: "decoy1",
        tier: "decoy",
        label: "Ticket stub",
        text: "World’s Fair — Flushing Meadows — 1964.",
      },
      {
        id: "decoy2",
        tier: "decoy",
        label: "Vinyl sleeve",
        text: "Pressed 1962. Side A still spins.",
      },
    ],
  },
  {
    slug: "radio-booth",
    title: "Midnight Booth",
    briefing:
      "A shuttered radio booth. The ON-AIR light is dead; the lock wants a quieter frequency.",
    prompt: "Booth code?",
    answer: "909",
    placeholder: "···",
    cluePool: [
      {
        id: "log",
        tier: "essential",
        label: "Broadcast log",
        text: "Last show: “Dial the twin nines around the quiet hour.”",
        cryptic:
          "Log line: twin nines cradle the hour that never speaks.",
      },
      {
        id: "clock",
        tier: "essential",
        label: "Studio clock",
        text: "Hands stopped just after the top of the hour — only the hour digit still lit: 0.",
        cryptic:
          "One glowing digit on the dead clock: a lonely zero.",
      },
      {
        id: "helpful",
        tier: "helpful",
        label: "Engineer sticky",
        text: "Three beats on this pad — left, middle, right.",
      },
      {
        id: "spoiler",
        tier: "spoiler",
        label: "Demo reel note",
        text: "Practice booth used 808 for a different ‘quiet hour’ gag.",
      },
      {
        id: "decoy1",
        tier: "decoy",
        label: "Call sheet",
        text: "Guest booked for 21:00 sharp.",
      },
      {
        id: "decoy2",
        tier: "decoy",
        label: "Frequency card",
        text: "Station ID sticker: 101.7 FM.",
      },
    ],
  },
  {
    slug: "greenhouse-key",
    title: "Orchid House Gate",
    briefing:
      "Humid glasshouse. The gate pad wants a bloom code from the watering slate.",
    prompt: "Gate code?",
    answer: "271",
    placeholder: "···",
    cluePool: [
      {
        id: "slate",
        tier: "essential",
        label: "Watering slate",
        text: "Orchid row: water on the 2nd, mist on the 7th, feed on the 1st — in that garden order.",
        cryptic:
          "Slate order for orchids: second → seventh → first.",
      },
      {
        id: "tag",
        tier: "essential",
        label: "Pot tag",
        text: "“Codes here are calendar days in the month, not plant counts.”",
        cryptic:
          "Tag: the numbers are days of the month the chores fall on.",
      },
      {
        id: "helpful",
        tier: "helpful",
        label: "Apron note",
        text: "Three chores, three digits, same order as the slate.",
      },
      {
        id: "spoiler",
        tier: "spoiler",
        label: "Fern practice",
        text: "Fern drill used days 4, 9, 3 → 493 on a spare lock.",
      },
      {
        id: "decoy1",
        tier: "decoy",
        label: "Thermometer",
        text: "Glass reads a steady 27°C.",
      },
      {
        id: "decoy2",
        tier: "decoy",
        label: "Seed packet",
        text: "Lot 712 stamped in green ink.",
      },
    ],
  },
  {
    slug: "observatory-dome",
    title: "Dome Hatch",
    briefing:
      "A small observatory. The hatch code is written in altitude and a star count.",
    prompt: "Hatch code?",
    answer: "1123",
    placeholder: "····",
    cluePool: [
      {
        id: "chart",
        tier: "essential",
        label: "Star chart",
        text: "Tonight’s mark: altitude 11°, then the constellation with 23 labeled tips.",
        cryptic:
          "Chart margin: eleven degrees up, then twenty-three tips on the traced figure.",
      },
      {
        id: "note",
        tier: "essential",
        label: "Observer note",
        text: "Hatch wants altitude, then tip-count — nothing else from the sky.",
        cryptic:
          "Two sky numbers only: how high, then how many tips.",
      },
      {
        id: "helpful",
        tier: "helpful",
        label: "Lens cloth",
        text: "No decimals on this hatch — whole degrees.",
      },
      {
        id: "spoiler",
        tier: "spoiler",
        label: "Old log",
        text: "Practice night used 09° and 14 tips → 0914.",
      },
      {
        id: "decoy1",
        tier: "decoy",
        label: "Azimuth dial",
        text: "Stuck at 230°.",
      },
      {
        id: "decoy2",
        tier: "decoy",
        label: "Meteor postcard",
        text: "Peak rate scribbled as 112 per hour.",
      },
    ],
  },
  {
    slug: "pawnshop-safe",
    title: "Pawnshop After Dark",
    briefing:
      "Shutters down. The floor safe wants a ticket total the ledger already whispered.",
    prompt: "Safe code?",
    answer: "648",
    placeholder: "···",
    cluePool: [
      {
        id: "ticket",
        tier: "essential",
        label: "Pawn ticket",
        text: "Ticket #64 — interest line shows +8 days overdue.",
        cryptic:
          "Ticket sixty-four; eight days past due in red.",
      },
      {
        id: "rule",
        tier: "essential",
        label: "Counter rule",
        text: "Night safe = ticket number, then overdue days.",
        cryptic:
          "Night rule: the ticket, then how late it ran.",
      },
      {
        id: "helpful",
        tier: "helpful",
        label: "Sharpie",
        text: "No slash between them on this dial.",
      },
      {
        id: "spoiler",
        tier: "spoiler",
        label: "Training slip",
        text: "Drill ticket #12 overdue 3 days → 123.",
      },
      {
        id: "decoy1",
        tier: "decoy",
        label: "Price gun",
        text: "Last sticker printed 19.99.",
      },
      {
        id: "decoy2",
        tier: "decoy",
        label: "Calendar",
        text: "Circled the 8th for rent day.",
      },
    ],
  },
];

/** Fail fast if authors duplicate answers or slugs. */
for (const [field, values] of [
  ["slug", ESCAPES.map((e) => e.slug)],
  ["answer", ESCAPES.map((e) => e.answer)],
] as const) {
  const seen = new Set<string>();
  for (const v of values) {
    if (seen.has(v)) {
      throw new Error(`Duplicate escape ${field}: ${v}`);
    }
    seen.add(v);
  }
}

const ATTEMPTS: Record<Difficulty, number> = {
  easy: 3,
  medium: 3,
  hard: 3,
  obscure: 3,
  impossible: 3,
};

/** Easy gets hand-holds; medium/hard must deduce format and discard red herrings. */
const TIERS_FOR: Record<Difficulty, Tier[]> = {
  easy: ["essential", "helpful", "spoiler"],
  medium: ["essential", "decoy"],
  hard: ["essential", "decoy"],
  obscure: ["essential", "decoy"],
  impossible: ["essential"],
};

function clueTextForDifficulty(clue: TieredClue, difficulty: Difficulty): string {
  if (
    (difficulty === "medium" ||
      difficulty === "hard" ||
      difficulty === "obscure" ||
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

  if (difficulty === "hard" || difficulty === "obscure") {
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
  // Same calendar day → same unique room for every difficulty.
  // Difficulty only changes clue tiers (helpful/spoiler vs decoys/cryptic).
  const seed = hashSeed("escape", pack, seasonId ?? "", dateKey);
  const index = dailyRotationIndex(
    dateKey,
    ESCAPES.length,
    "escape-rotate",
    pack,
    seasonId ?? "",
  );
  const template = ESCAPES[index]!;
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
    slug: template.slug,
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
