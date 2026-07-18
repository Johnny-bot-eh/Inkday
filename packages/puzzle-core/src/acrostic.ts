import type { Difficulty } from "./types";
import { dayIndex, hashSeed, pickIndex } from "./types";
import { normalizeWord } from "./words";

export type AcrosticClue = {
  id: string;
  clue: string;
  length: number;
};

export type AcrosticPuzzle = {
  title: string;
  prompt: string;
  clues: AcrosticClue[];
  answers: string[];
  /** Hidden message = first letters of the answers in order */
  message: string;
  maxAttempts: number;
  hint: string;
};

type Pack = {
  title: string;
  message: string;
  items: Array<{ clue: string; answer: string }>;
};

const EASY: Pack[] = [
  {
    title: "Harbor Sign",
    message: "dock",
    items: [
      { clue: "Faithful canine pet", answer: "dog" },
      { clue: "Big saltwater expanse", answer: "ocean" },
      { clue: "White fluff drifting above", answer: "cloud" },
      { clue: "Baby feline", answer: "kitten" },
    ],
  },
  {
    title: "Garden Gate",
    message: "bloom",
    items: [
      { clue: "Hue of a clear noon sky", answer: "blue" },
      { clue: "Not short", answer: "long" },
      { clue: "Citrus also used as a color", answer: "orange" },
      { clue: "Big saltwater expanse", answer: "ocean" },
      { clue: "Yellow tropical fruit", answer: "mango" },
    ],
  },
  {
    title: "Campfire Glow",
    message: "warm",
    items: [
      { clue: "Giant ocean mammal", answer: "whale" },
      { clue: "Fossil resin used in jewelry", answer: "amber" },
      { clue: "Drops from clouds", answer: "rain" },
      { clue: "Calendar span of about thirty days", answer: "month" },
    ],
  },
  {
    title: "Trail Mark",
    message: "path",
    items: [
      { clue: "Small green pod vegetable", answer: "pea" },
      { clue: "Classic fruit in the doctor joke", answer: "apple" },
      { clue: "Furniture you write on", answer: "table" },
      { clue: "Organ that beats in your chest", answer: "heart" },
    ],
  },
];

const MEDIUM: Pack[] = [
  {
    title: "Atlas Code",
    message: "travel",
    items: [
      { clue: "Woody plant with a trunk", answer: "tree" },
      { clue: "Freshwater flowing to the sea", answer: "river" },
      { clue: "Fruit of the oak", answer: "acorn" },
      { clue: "Low land between hills", answer: "valley" },
      { clue: "Large bird of prey", answer: "eagle" },
      { clue: "Portable light", answer: "lantern" },
    ],
  },
  {
    title: "Library Stack",
    message: "wisdom",
    items: [
      { clue: "Seven-day stretch", answer: "week" },
      { clue: "Land surrounded by water", answer: "island" },
      { clue: "Complete quiet", answer: "silence" },
      { clue: "Hard clear gem", answer: "diamond" },
      { clue: "Big saltwater expanse", answer: "ocean" },
      { clue: "Metal that attracts iron", answer: "magnet" },
    ],
  },
  {
    title: "Night Watch",
    message: "shadow",
    items: [
      { clue: "Glow when daylight fades", answer: "sunset" },
      { clue: "Where ships tie up", answer: "harbor" },
      { clue: "Archery shaft", answer: "arrow" },
      { clue: "Absence of light", answer: "dark" },
      { clue: "Big saltwater expanse", answer: "ocean" },
      { clue: "Air in motion", answer: "wind" },
    ],
  },
  {
    title: "Market Note",
    message: "brave",
    items: [
      { clue: "Structure spanning a river", answer: "bridge" },
      { clue: "Water from clouds", answer: "rain" },
      { clue: "Classic red fruit", answer: "apple" },
      { clue: "Climbing plant that bears grapes", answer: "vine" },
      { clue: "Planet we call home", answer: "earth" },
    ],
  },
];

const HARD: Pack[] = [
  {
    title: "Cipher Shelf",
    message: "mystery",
    items: [
      { clue: "Metal that attracts iron", answer: "magnet" },
      { clue: "Strong desire; longing", answer: "yearning" },
      { clue: "Total quiet", answer: "silence" },
      { clue: "Connecting strand running through a story’s scenes", answer: "thread" },
      { clue: "Moon covering the sun (or reverse)", answer: "eclipse" },
      { clue: "Glowing brightly", answer: "radiant" },
      { clue: "Twelve months make one", answer: "year" },
    ],
  },
  {
    title: "Vault Phrase",
    message: "freedom",
    items: [
      { clue: "Dense woodland", answer: "forest" },
      { clue: "Freshwater flowing to the sea", answer: "river" },
      { clue: "Planet we live on", answer: "earth" },
      { clue: "Glowing coal in a fire", answer: "ember" },
      { clue: "Fate; what is meant to be", answer: "destiny" },
      { clue: "Path a planet traces around the sun", answer: "orbit" },
      { clue: "Metal that attracts iron", answer: "magnet" },
    ],
  },
  {
    title: "Signal Book",
    message: "harmony",
    items: [
      { clue: "Where earth appears to meet the sky", answer: "horizon" },
      { clue: "Trembling white-barked tree", answer: "aspen" },
      { clue: "Freshwater course to the sea", answer: "river" },
      { clue: "Iron, copper, gold — not wood", answer: "metal" },
      { clue: "Round citrus fruit", answer: "orange" },
      { clue: "Opposite of day", answer: "night" },
      { clue: "Strong longing", answer: "yearning" },
    ],
  },
];

function assertPacks(packs: Pack[]) {
  for (const pack of packs) {
    const initials = pack.items.map((i) => i.answer[0]!.toLowerCase()).join("");
    if (initials !== pack.message.toLowerCase()) {
      throw new Error(
        `Acrostic "${pack.title}": initials "${initials}" ≠ "${pack.message}"`,
      );
    }
  }
}

assertPacks(EASY);
assertPacks(MEDIUM);
assertPacks(HARD);

const BY_DIFFICULTY: Record<Difficulty, Pack[]> = {
  easy: EASY,
  medium: MEDIUM,
  hard: HARD,
  obscure: HARD,
  impossible: HARD,
};

const ATTEMPTS: Record<Difficulty, number> = {
  easy: 8,
  medium: 6,
  hard: 5,
  obscure: 5,
  impossible: 4,
};

export function getAcrosticPuzzle(
  dateKey: string,
  difficulty: Difficulty,
): AcrosticPuzzle {
  const packs = BY_DIFFICULTY[difficulty];
  const seed = hashSeed("acrostic", dateKey, difficulty, dayIndex(dateKey));
  const pack = packs[pickIndex(seed, packs.length)]!;
  const answers = pack.items.map((i) => i.answer.toLowerCase());
  return {
    title: pack.title,
    prompt:
      "Solve each clue. The first letter of every answer spells a hidden message.",
    clues: pack.items.map((item, i) => ({
      id: `c${i + 1}`,
      clue: item.clue,
      length: item.answer.length,
    })),
    answers,
    message: pack.message.toLowerCase(),
    maxAttempts: ATTEMPTS[difficulty],
    hint:
      difficulty === "easy"
        ? "Fill every clue, then read the initials top to bottom."
        : "Submit the hidden message when you see it — or solve every clue.",
  };
}

export function checkAcrosticMessage(
  puzzle: AcrosticPuzzle,
  guess: string,
): { correct: boolean } {
  return { correct: normalizeWord(guess) === normalizeWord(puzzle.message) };
}

export function checkAcrosticAnswers(
  puzzle: AcrosticPuzzle,
  guesses: string[],
): { correct: boolean; solved: boolean[] } {
  const solved = puzzle.answers.map((answer, i) => {
    const g = normalizeWord(guesses[i] ?? "");
    return g === answer;
  });
  return { correct: solved.every(Boolean), solved };
}
