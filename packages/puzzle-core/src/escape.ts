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

type EscapeTemplate = Omit<EscapeRoom, "id" | "clues" | "maxAttempts"> & {
  slug: string;
  /** All clues; easier difficulties surface more / harder may hide some */
  cluePool: EscapeClue[];
  /** Indices into cluePool always shown first (core path) */
  coreClueIds: string[];
};

const ESCAPES: EscapeTemplate[] = [
  {
    slug: "first-snow",
    title: "The Snowfall Safe",
    briefing:
      "A detective's study. A notebook and calendar sit beside a locked desk safe.",
    prompt: "Enter the safe code.",
    cluePool: [
      {
        id: "notebook",
        label: "Notebook",
        text: 'The code is the date of the first snowfall.',
      },
      {
        id: "calendar",
        label: "Calendar",
        text: "October 12: First snowfall",
      },
      {
        id: "sticky",
        label: "Sticky note",
        text: "Format: month then day. No dashes.",
      },
      {
        id: "mug",
        label: "Coffee mug",
        text: "Mom's birthday is March 3 — not useful today.",
      },
    ],
    coreClueIds: ["notebook", "calendar"],
    answer: "1012",
    placeholder: "····",
  },
  {
    slug: "gallery-alarm",
    title: "Gallery After Hours",
    briefing:
      "The wing is locked. A keypad blinks beside a scratched plaque and a torn receipt.",
    prompt: "What is the keypad code?",
    cluePool: [
      {
        id: "plaque",
        label: "Plaque",
        text: "Wing opened: building number × founders on the board.",
      },
      {
        id: "receipt",
        label: "Receipt",
        text: "Building No. 14 · Board lists three founding patrons.",
      },
      {
        id: "photo",
        label: "Lobby photo",
        text: "Founding patrons: Ames, Bell, and Crowe.",
      },
      {
        id: "junk",
        label: "Guard radio",
        text: "Night shift PIN rumor: 0000. (It never worked.)",
      },
    ],
    coreClueIds: ["plaque", "receipt", "photo"],
    answer: "42",
    placeholder: "··",
  },
  {
    slug: "train-locker",
    title: "Platform Locker",
    briefing:
      "A forgotten locker at Platform B. The ticket stub, chalk marks, and a luggage tag might line up.",
    prompt: "Locker combination?",
    cluePool: [
      {
        id: "ticket",
        label: "Ticket stub",
        text: "Carriage 7 · Seat 3A · Depart 19:45",
      },
      {
        id: "chalk",
        label: "Chalk on door",
        text: "Use carriage, then seat number, then hour.",
      },
      {
        id: "tag",
        label: "Luggage tag",
        text: "Seat letter is ignored — digits only.",
      },
      {
        id: "poster",
        label: "Timetable scrap",
        text: "Express to Riverton also leaves at 21:10 — wrong platform.",
      },
    ],
    coreClueIds: ["ticket", "chalk", "tag"],
    answer: "7319",
    placeholder: "····",
  },
  {
    slug: "lab-centrifuge",
    title: "Cold Lab Lockout",
    briefing:
      "The centrifuge chamber won't open. Lab notes mention elemental symbols and a fridge magnet poem.",
    prompt: "Enter the chamber code.",
    cluePool: [
      {
        id: "notes",
        label: "Lab notes",
        text: "Code = atomic numbers for Carbon, then Oxygen, then Neon.",
      },
      {
        id: "poster",
        label: "Periodic poster",
        text: "C=6 · O=8 · Ne=10",
      },
      {
        id: "magnet",
        label: "Fridge magnet",
        text: "Join as C O Ne → no separators.",
      },
      {
        id: "spill",
        label: "Spill report",
        text: "Helium tank was logged empty — unrelated.",
      },
    ],
    coreClueIds: ["notes", "poster", "magnet"],
    answer: "6810",
    placeholder: "····",
  },
  {
    slug: "library-cipher",
    title: "Reading Room Vault",
    briefing:
      "A book vault needs a word-number hybrid. Shelf marks and a borrowed slip hold the pieces.",
    prompt: "Vault code?",
    cluePool: [
      {
        id: "slip",
        label: "Borrow slip",
        text: "Call number: MYST-B-27. Last digits of the year borrowed: 19.",
      },
      {
        id: "card",
        label: "Librarian card",
        text: "Vault wants shelf letter position + book number + year digits.",
      },
      {
        id: "alpha",
        label: "Alphabet strip",
        text: "A=1 … B=2 …",
      },
      {
        id: "noise",
        label: "Discard pile",
        text: "Someone tried 2719 and 1927 yesterday.",
      },
    ],
    coreClueIds: ["slip", "card", "alpha"],
    answer: "22719",
    placeholder: "·····",
  },
  {
    slug: "manor-clock",
    title: "Stopped Clock Study",
    briefing:
      "The study clock is frozen. A telegram and pocket watch suggest the hour that opens the drawer.",
    prompt: "Drawer combination?",
    cluePool: [
      {
        id: "telegram",
        label: "Telegram",
        text: "MEET AT HALF PAST THE HOUR THE CLOCK FEARS.",
      },
      {
        id: "clock",
        label: "Clock face",
        text: "Hands stuck pointing to XII and VI — midnight/noon and half.",
      },
      {
        id: "watch",
        label: "Pocket watch note",
        text: "Use 24h time: HHMM. Half past twelve night = 0030.",
      },
      {
        id: "ash",
        label: "Ashtray",
        text: "A burnt scrap says 1230 — midday mirage.",
      },
    ],
    coreClueIds: ["telegram", "clock", "watch"],
    answer: "0030",
    placeholder: "····",
  },
  {
    slug: "harbor-crate",
    title: "Crimson Crate",
    briefing:
      "A sealed crate on Pier 4. Stencil numbers and a dock ledger disagree until you follow the instruction inked underneath.",
    prompt: "Bolt code?",
    cluePool: [
      {
        id: "stencil",
        label: "Crate stencil",
        text: "LOT 58 / BAY 3 / SHIFT 2",
      },
      {
        id: "ledger",
        label: "Dock ledger",
        text: "Code rule: bay + lot + shift.",
      },
      {
        id: "ink",
        label: "Underside ink",
        text: "Concatenate. No zeros padded.",
      },
      {
        id: "siren",
        label: "Siren notice",
        text: "Emergency override 911 — disabled on this pier.",
      },
    ],
    coreClueIds: ["stencil", "ledger", "ink"],
    answer: "3582",
    placeholder: "····",
  },
  {
    slug: "cafe-wi-fi",
    title: "Cafe Back Room",
    briefing:
      "Staff-only door. Wi-Fi password on the chalkboard is a red herring — the door wants something else.",
    prompt: "Door code?",
    cluePool: [
      {
        id: "chalk",
        label: "Chalkboard",
        text: "Wi-Fi: MochaMagic! — not the door.",
      },
      {
        id: "menu",
        label: "Specials menu",
        text: "Table 4 ordered 2 flat whites and 1 pour-over.",
      },
      {
        id: "receipt",
        label: "Staff tip jar note",
        text: "Door = table number + drink count.",
      },
      {
        id: "apron",
        label: "Apron pocket",
        text: "Drinks today: 2 + 1 = 3.",
      },
    ],
    coreClueIds: ["menu", "receipt", "apron"],
    answer: "43",
    placeholder: "··",
  },
];

const ATTEMPTS: Record<Difficulty, number> = {
  easy: 5,
  medium: 3,
  hard: 2,
};

const EXTRA_CLUES: Record<Difficulty, number> = {
  easy: 2,
  medium: 1,
  hard: 0,
};

export function normalizeEscapeAnswer(value: string): string {
  return value.trim().toUpperCase().replace(/[\s\-_.]/g, "");
}

export function getEscapeRoom(
  dateKey: string,
  difficulty: Difficulty,
): EscapeRoom {
  const seed = hashSeed("escape", dateKey, difficulty, dayIndex(dateKey));
  const template = ESCAPES[pickIndex(seed, ESCAPES.length)]!;

  const core = template.cluePool.filter((c) =>
    template.coreClueIds.includes(c.id),
  );
  const extras = template.cluePool.filter(
    (c) => !template.coreClueIds.includes(c.id),
  );
  const extraCount = EXTRA_CLUES[difficulty];
  const chosenExtras = [...extras]
    .map((clue) => ({ clue, rank: hashSeed(seed, clue.id) }))
    .sort((a, b) => a.rank - b.rank)
    .slice(0, extraCount)
    .map((e) => e.clue);

  // On hard, keep core path only; extras (often red herrings or format hints) are for easier modes
  let clues = [...core, ...chosenExtras];
  const orderSeed = hashSeed(seed, "order");
  clues = [...clues].sort(
    (a, b) => hashSeed(orderSeed, a.id) - hashSeed(orderSeed, b.id),
  );

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
