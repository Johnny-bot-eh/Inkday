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
  /** subject -> traitId -> value */
  solution: Record<string, Record<string, string>>;
  /** How the answer follows from the clues (shown after clear). */
  explanation?: string;
};

type LogicTemplate = Omit<LogicPuzzle, "id"> & { slug: string };

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
      "Eva sat by the window.",
      "The window seat held the ledger.",
      "Finn sat by the door.",
      "The door seat held the fan.",
      "Gia sat in the corner.",
      "Hugo had the mask.",
      "The fire seat was Hugo's.",
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
      "Ash was at easel 4.",
      "Easel 4 had the stolen palette.",
      "Bea stood at easel 2.",
      "Cam was at easel 1.",
      "Cam had crimson.",
      "Easel 3 used ochre.",
      "Di was at easel 3.",
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
];

const SIZE_FOR: Record<Difficulty, number[]> = {
  easy: [3],
  medium: [3, 4],
  hard: [4],
  impossible: [4],
};

export function getLogicPuzzle(
  dateKey: string,
  difficulty: Difficulty,
  seasonId: string | null = null,
): LogicPuzzle {
  const sizes = SIZE_FOR[difficulty];
  const pool = LOGIC_PUZZLES.filter((p) =>
    sizes.includes(p.subjects.values.length),
  );
  const seed = hashSeed(
    "logic",
    seasonId ?? "",
    dateKey,
    difficulty,
    dayIndex(dateKey),
  );
  const template = pool[pickIndex(seed, pool.length)]!;

  let clues = [...template.clues];
  if ((difficulty === "hard" || difficulty === "impossible") && clues.length > 5) {
    // Keep the densest info; drop the last clue as extra challenge when safe
    clues = clues.slice(0, -1);
  }
  if (difficulty === "impossible" && clues.length > 4) {
    clues = clues.slice(0, -1);
  }

  const title = seasonId
    ? `Seasonal: ${template.title}`
    : template.title;
  const synopsis = seasonId
    ? `Limited-time event. ${template.synopsis}`
    : template.synopsis;

  const puzzle: LogicPuzzle = {
    id: `${template.slug}-${seasonId ?? "std"}-${dateKey}-${difficulty}`,
    title,
    synopsis,
    subjects: template.subjects,
    traits: template.traits,
    clues,
    question: template.question,
    answer: template.answer,
    solution: template.solution,
  };
  puzzle.explanation = buildLogicExplanation(puzzle);
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
