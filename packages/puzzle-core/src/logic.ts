import type { Difficulty } from "./types";
import { buildLogicExplanation } from "./puzzle-explanations";
import { dayIndex, hashSeed, pickIndex } from "./types";

export type LogicCategory = {
  id: string;
  label: string;
  values: string[];
};

export type LogicPuzzle = {
  id: string;
  title: string;
  synopsis: string;
  subjects: LogicCategory;
  traits: LogicCategory[];
  clues: string[];
  question: string;
  answer: string;
  /** What the final guess dropdown offers (subjects on easy; a place trait on medium+). */
  answerChoices: string[];
  /** Dropdown prompt for the final guess. */
  answerPrompt: string;
  /** subject -> traitId -> value */
  solution: Record<string, Record<string, string>>;
  /** How the answer follows from the clues (shown after clear). */
  explanation?: string;
};

type LogicTemplate = Omit<
  LogicPuzzle,
  "id" | "answerChoices" | "answerPrompt" | "explanation"
> & {
  slug: string;
  /** Hard boards use deduction-only templates instead of direct lookup clues. */
  tier?: "standard" | "deduction";
};

const LOGIC_PUZZLES: LogicTemplate[] = [
  {
    slug: "missing-necklace",
    title: "The Case of the Missing Necklace",
    synopsis:
      "Four guests were interviewed after a necklace vanished. Each person was in a different room with a different item.",
    subjects: {
      id: "person",
      label: "Suspect",
      values: ["Alice", "Bob", "Claire", "Daniel"],
    },
    traits: [
      {
        id: "room",
        label: "Room",
        values: ["Kitchen", "Library", "Garden", "Office"],
      },
      {
        id: "item",
        label: "Item",
        values: ["Necklace", "Watch", "Key", "Letter"],
      },
    ],
    clues: [
      "Alice was in the library.",
      "The person in the library had the key.",
      "Bob was in the garden.",
      "Daniel had the letter.",
      "The person in the office had the watch.",
      "Claire did not have the necklace.",
      "Alice was not in the kitchen.",
    ],
    question: "Who stole the necklace?",
    answer: "Bob",
    solution: {
      Alice: { room: "Library", item: "Key" },
      Bob: { room: "Garden", item: "Necklace" },
      Claire: { room: "Office", item: "Watch" },
      Daniel: { room: "Kitchen", item: "Letter" },
    },
  },
  {
    slug: "poisoned-pastry",
    title: "Poisoned Pastry",
    synopsis:
      "Someone spiked a pastry at the bazaar. Three bakers, three stalls, three frostings — find the guilty stall.",
    subjects: {
      id: "baker",
      label: "Baker",
      values: ["Nora", "Pat", "Quinn"],
    },
    traits: [
      {
        id: "stall",
        label: "Stall",
        values: ["North", "East", "West"],
      },
      {
        id: "frosting",
        label: "Frosting",
        values: ["Lemon", "Chocolate", "Rose"],
      },
    ],
    clues: [
      "Nora does not work the east stall.",
      "The west stall sold rose frosting.",
      "Pat's pastry was lemon.",
      "Quinn was not at the north stall.",
      "The chocolate frosting was at the east stall.",
    ],
    question: "Who sold the spiked chocolate pastry?",
    answer: "Quinn",
    solution: {
      Nora: { stall: "West", frosting: "Rose" },
      Pat: { stall: "North", frosting: "Lemon" },
      Quinn: { stall: "East", frosting: "Chocolate" },
    },
  },
  {
    slug: "cipher-club",
    title: "Cipher Club Heist",
    synopsis:
      "A clubhouse strongbox was emptied. Four members, four seats, four props — only one held the stolen ledger.",
    subjects: {
      id: "member",
      label: "Member",
      values: ["Eva", "Finn", "Gia", "Hugo"],
    },
    traits: [
      {
        id: "seat",
        label: "Seat",
        values: ["Window", "Door", "Fire", "Corner"],
      },
      {
        id: "prop",
        label: "Prop",
        values: ["Ledger", "Fan", "Coin", "Mask"],
      },
    ],
    clues: [
      "Finn sat by the door.",
      "The door seat held the fan.",
      "Gia sat in the corner.",
      "Hugo had the mask.",
      "The fire seat was Hugo's.",
      "Eva sat by the window.",
      "The ledger was not at the door, the fire, or the corner.",
    ],
    question: "Who took the ledger?",
    answer: "Eva",
    solution: {
      Eva: { seat: "Window", prop: "Ledger" },
      Finn: { seat: "Door", prop: "Fan" },
      Gia: { seat: "Corner", prop: "Coin" },
      Hugo: { seat: "Fire", prop: "Mask" },
    },
  },
  {
    slug: "garden-gnome",
    title: "The Wandering Gnome",
    synopsis:
      "A prized garden gnome went missing overnight. Four neighbors, four yards, four tools — find who moved it.",
    subjects: {
      id: "neighbor",
      label: "Neighbor",
      values: ["Ivy", "Jon", "Kim", "Leo"],
    },
    traits: [
      {
        id: "yard",
        label: "Yard",
        values: ["Maple", "Rose", "Pond", "Hill"],
      },
      {
        id: "tool",
        label: "Tool",
        values: ["Rake", "Spade", "Hose", "Gnome"],
      },
    ],
    clues: [
      "Ivy was in the maple yard.",
      "The maple yard had the rake.",
      "Jon was in the pond yard.",
      "The pond yard had the hose.",
      "Leo had the spade.",
      "Leo was in the rose yard.",
      "The hill yard held the gnome.",
    ],
    question: "Who had the gnome?",
    answer: "Kim",
    solution: {
      Ivy: { yard: "Maple", tool: "Rake" },
      Jon: { yard: "Pond", tool: "Hose" },
      Kim: { yard: "Hill", tool: "Gnome" },
      Leo: { yard: "Rose", tool: "Spade" },
    },
  },
  {
    slug: "night-train",
    title: "Night Train Alibi",
    synopsis:
      "A courier parcel vanished between stops. Three travelers, three compartments, three bags.",
    subjects: {
      id: "traveler",
      label: "Traveler",
      values: ["Mira", "Ned", "Opa"],
    },
    traits: [
      {
        id: "car",
        label: "Compartment",
        values: ["A", "B", "C"],
      },
      {
        id: "bag",
        label: "Bag",
        values: ["Parcel", "Umbrella", "Violin"],
      },
    ],
    clues: [
      "Opa was in compartment A.",
      "Ned was in compartment B.",
      "Compartment B had the umbrella.",
      "Opa had the violin.",
      "The parcel was in compartment C.",
    ],
    question: "Who had the parcel?",
    answer: "Mira",
    solution: {
      Opa: { car: "A", bag: "Violin" },
      Ned: { car: "B", bag: "Umbrella" },
      Mira: { car: "C", bag: "Parcel" },
    },
  },
  {
    slug: "studio-paint",
    title: "Missing Palette",
    synopsis:
      "An artist's palette disappeared before the show. Four painters, four easels, four colors — find the thief.",
    subjects: {
      id: "painter",
      label: "Painter",
      values: ["Ash", "Bea", "Cam", "Di"],
    },
    traits: [
      {
        id: "easel",
        label: "Easel",
        values: ["1", "2", "3", "4"],
      },
      {
        id: "color",
        label: "Color",
        values: ["Palette", "Crimson", "Ochre", "Indigo"],
      },
    ],
    clues: [
      "Easel 4 had the stolen palette.",
      "Bea stood at easel 2.",
      "Cam was at easel 1.",
      "Cam had crimson.",
      "Easel 3 used ochre.",
      "Di was at easel 3.",
      "Ash was not at easel 1 or easel 2.",
    ],
    question: "Who took the palette?",
    answer: "Ash",
    solution: {
      Ash: { easel: "4", color: "Palette" },
      Bea: { easel: "2", color: "Indigo" },
      Cam: { easel: "1", color: "Crimson" },
      Di: { easel: "3", color: "Ochre" },
    },
  },
  {
    slug: "harbor-lantern",
    title: "Harbor Lantern",
    synopsis:
      "A harbor light was sabotaged. Three keepers, three docks, three coats — who dimmed the lantern?",
    subjects: {
      id: "keeper",
      label: "Keeper",
      values: ["Rae", "Sid", "Tess"],
    },
    traits: [
      {
        id: "dock",
        label: "Dock",
        values: ["Red", "Blue", "Green"],
      },
      {
        id: "coat",
        label: "Coat",
        values: ["Oilskin", "Wool", "Lantern"],
      },
    ],
    clues: [
      "Rae worked the red dock.",
      "Sid worked the blue dock.",
      "The blue dock had the wool coat.",
      "Rae wore oilskin.",
      "The lantern kit was at the green dock.",
    ],
    question: "Who sabotaged the lantern?",
    answer: "Tess",
    solution: {
      Rae: { dock: "Red", coat: "Oilskin" },
      Sid: { dock: "Blue", coat: "Wool" },
      Tess: { dock: "Green", coat: "Lantern" },
    },
  },
  {
    slug: "midnight-evidence",
    tier: "deduction",
    title: "Midnight Evidence",
    synopsis:
      "Four investigators arrived at different hours carrying different evidence. Determine who brought the anonymous note.",
    subjects: {
      id: "investigator",
      label: "Investigator",
      values: ["Ada", "Bram", "Cora", "Dax"],
    },
    traits: [
      {
        id: "hour",
        label: "Arrival",
        values: ["8", "9", "10", "11"],
      },
      {
        id: "evidence",
        label: "Evidence",
        values: ["Map", "Key", "Lens", "Note"],
      },
    ],
    clues: [
      "Dax arrived exactly one hour after the person carrying the key.",
      "Bram arrived earlier than Ada.",
      "The 8 o’clock arrival carried the key.",
      "The lens arrived at 9 o’clock.",
      "Cora arrived at neither 8 nor 11 o’clock.",
      "Ada carried neither the key nor the note.",
      "Bram did not carry the map.",
      "The note arrived exactly two hours after the key.",
    ],
    question: "Who brought the anonymous note?",
    answer: "Cora",
    solution: {
      Ada: { hour: "11", evidence: "Map" },
      Bram: { hour: "8", evidence: "Key" },
      Cora: { hour: "10", evidence: "Note" },
      Dax: { hour: "9", evidence: "Lens" },
    },
  },
  {
    slug: "museum-after-hours",
    tier: "deduction",
    title: "Museum After Hours",
    synopsis:
      "Four staff members were found in different rooms with different objects. Work out who removed the sealed file.",
    subjects: {
      id: "staff",
      label: "Staff member",
      values: ["Elin", "Faye", "Gus", "Holt"],
    },
    traits: [
      {
        id: "room",
        label: "Room",
        values: ["Archive", "Gallery", "Kitchen", "Roof"],
      },
      {
        id: "object",
        label: "Object",
        values: ["Seal", "Rope", "Flask", "File"],
      },
    ],
    clues: [
      "Faye was in neither the archive nor the kitchen.",
      "Elin was not on the roof.",
      "Gus was in neither the gallery nor on the roof.",
      "The seal was found on the roof.",
      "The rope was found in the gallery.",
      "Holt carried neither the seal nor the rope.",
      "Faye carried neither the file nor the flask.",
      "The kitchen did not contain the file.",
      "Elin carried neither the seal nor the file.",
      "Holt was not in the archive.",
    ],
    question: "Who removed the sealed file?",
    answer: "Gus",
    solution: {
      Elin: { room: "Gallery", object: "Rope" },
      Faye: { room: "Roof", object: "Seal" },
      Gus: { room: "Archive", object: "File" },
      Holt: { room: "Kitchen", object: "Flask" },
    },
  },
  {
    slug: "compass-vault",
    tier: "deduction",
    title: "The Compass Vault",
    synopsis:
      "Four suspects occupied four explicitly named compass desks, each with a different token. Deduce who held the gem.",
    subjects: {
      id: "suspect",
      label: "Suspect",
      values: ["Inez", "Jory", "Kian", "Lux"],
    },
    traits: [
      {
        id: "desk",
        label: "Compass desk",
        values: ["North", "East", "South", "West"],
      },
      {
        id: "token",
        label: "Token",
        values: ["Crown", "Ring", "Letter", "Gem"],
      },
    ],
    clues: [
      "The crown was at the west desk.",
      "The ring was at the south desk.",
      "Inez sat at neither the north nor the south desk.",
      "Jory sat at neither the east nor the west desk.",
      "Kian held neither the letter nor the ring.",
      "Lux held neither the crown nor the gem.",
      "The east desk held neither the letter nor the crown.",
      "Jory was not at the south desk.",
      "Kian was not at the east desk.",
    ],
    question: "Who held the gem?",
    answer: "Inez",
    solution: {
      Inez: { desk: "East", token: "Gem" },
      Jory: { desk: "North", token: "Letter" },
      Kian: { desk: "West", token: "Crown" },
      Lux: { desk: "South", token: "Ring" },
    },
  },
];

const SIZE_FOR: Record<Difficulty, number[]> = {
  easy: [3],
  medium: [3, 4],
  hard: [4],
  obscure: [4],
  impossible: [4],
};

const LOCATION_TRAIT_IDS = new Set([
  "room",
  "stall",
  "seat",
  "desk",
  "place",
  "spot",
  "booth",
  "table",
  "aisle",
  "dock",
  "bay",
]);

function locationTraitFor(template: LogicTemplate): LogicCategory {
  const byId = template.traits.find((t) => LOCATION_TRAIT_IDS.has(t.id));
  if (byId) return byId;
  const byLabel = template.traits.find((t) =>
    /room|stall|seat|desk|place|location|booth|table|aisle|dock|bay/i.test(
      t.label,
    ),
  );
  return byLabel ?? template.traits[0]!;
}

/** Medium+ boards ask for a place/location instead of the suspect’s name. */
function usesLocationAnswer(difficulty: Difficulty): boolean {
  return (
    difficulty === "medium" ||
    difficulty === "hard" ||
    difficulty === "obscure" ||
    difficulty === "impossible"
  );
}

export function getLogicPuzzle(
  dateKey: string,
  difficulty: Difficulty,
  seasonId: string | null = null,
): LogicPuzzle {
  const sizes = SIZE_FOR[difficulty];
  const deductionOnly =
    difficulty === "hard" ||
    difficulty === "obscure" ||
    difficulty === "impossible";
  const pool = LOGIC_PUZZLES.filter(
    (p) =>
      sizes.includes(p.subjects.values.length) &&
      (deductionOnly ? p.tier === "deduction" : p.tier !== "deduction"),
  );
  const seed = hashSeed(
    "logic",
    seasonId ?? "",
    dateKey,
    difficulty,
    dayIndex(dateKey),
  );
  const template = pool[pickIndex(seed, pool.length)]!;

  // Never remove clues merely to increase difficulty: every stated fact may
  // be necessary to preserve a unique solution.
  const clues = [...template.clues];

  const title = seasonId
    ? `Seasonal: ${template.title}`
    : template.title;
  const synopsis = seasonId
    ? `Limited-time event. ${template.synopsis}`
    : template.synopsis;

  let question = template.question;
  let answer = template.answer;
  let answerChoices = [...template.subjects.values];
  let answerPrompt = `Choose ${template.subjects.label.toLowerCase()}…`;

  if (usesLocationAnswer(difficulty)) {
    const place = locationTraitFor(template);
    const culprit = template.answer;
    const placeValue = template.solution[culprit]?.[place.id];
    if (placeValue) {
      question = `${template.question} Name the ${place.label.toLowerCase()} of the person responsible — not their name.`;
      answer = placeValue;
      answerChoices = [...place.values];
      answerPrompt = `Choose ${place.label.toLowerCase()}…`;
    }
  }

  const puzzle: LogicPuzzle = {
    id: `${template.slug}-${seasonId ?? "std"}-${dateKey}-${difficulty}`,
    title,
    synopsis,
    subjects: template.subjects,
    traits: template.traits,
    clues,
    question,
    answer,
    answerChoices,
    answerPrompt,
    solution: template.solution,
  };
  puzzle.explanation = buildLogicExplanation(template.slug, puzzle);
  return puzzle;
}

export function checkLogicAnswer(
  puzzle: LogicPuzzle,
  answer: string,
): { correct: boolean } {
  return {
    correct: answer.trim().toLowerCase() === puzzle.answer.trim().toLowerCase(),
  };
}

export type GridMark = "unknown" | "yes" | "no";

export function cellKey(subject: string, traitId: string, value: string): string {
  return `${subject}::${traitId}::${value}`;
}

export function emptyLogicGrid(puzzle: LogicPuzzle): Record<string, GridMark> {
  const grid: Record<string, GridMark> = {};
  for (const subject of puzzle.subjects.values) {
    for (const trait of puzzle.traits) {
      for (const value of trait.values) {
        grid[cellKey(subject, trait.id, value)] = "unknown";
      }
    }
  }
  return grid;
}
