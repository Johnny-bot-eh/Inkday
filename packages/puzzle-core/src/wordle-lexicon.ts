import { dayIndex, hashSeed, pickIndex } from "./types";

/**
 * Hard Wordle answers — uncommon but real 7-letter English.
 * Recognizable with effort; not everyday vocabulary.
 */
export const WORDLE_HARD_ANSWERS = [
  "abjurer",
  "azimuth",
  "banshee",
  "benthic",
  "brazier",
  "cadaver",
  "chicane",
  "diorama",
  "dudgeon",
  "eclogue",
  "epigram",
  "faience",
  "frustum",
  "gherkin",
  "gimbals",
  "harrier",
  "hircine",
  "ichnite",
  "inkhorn",
  "jacinth",
  "javelin",
  "keelson",
  "knacker",
  "lambent",
  "lanyard",
  "mizzens",
  "narthex",
  "oarlock",
  "obelisk",
  "panoply",
  "phalanx",
  "quillon",
  "rondeau",
  "sapwood",
  "sextant",
  "requiem",
  "umbrage",
  "vitrine",
  "warlock",
  "xylitol",
  "yeshiva",
  "zephyrs",
];

/**
 * Obscure Wordle answers — rare / archaic / specialist 5-letter words.
 * Expect a warning: most players will not know these.
 */
export const WORDLE_OBSCURE_ANSWERS = [
  "aglet",
  "anent",
  "askoi",
  "atopy",
  "azoic",
  "benty",
  "borty",
  "cwtch",
  "cymae",
  "davit",
  "dwale",
  "elute",
  "emeer",
  "fichu",
  "fjeld",
  "ghyll",
  "gleby",
  "hadal",
  "hokku",
  "ileac",
  "ixora",
  "jebel",
  "jougs",
  "karst",
  "kraal",
  "lovat",
  "mythe",
  "naevi",
  "ogham",
  "pavis",
  "qophs",
  "ruche",
  "sloyd",
  "towzy",
  "ulema",
  "vleis",
  "wamus",
  "xeric",
  "yarco",
  "zinke",
];

export type WordleCategoryId =
  | "ancient"
  | "nature"
  | "beautiful"
  | "rare_letters"
  | "oddly_specific";

export type WordleCategory = {
  id: WordleCategoryId;
  title: string;
  tagline: string;
  /** Underlying difficulty for scoring / play uniqueness */
  difficulty: "easy" | "medium" | "hard";
  /** All 5-letter themed answers */
  answers: string[];
};

export const WORDLE_CATEGORIES: Record<WordleCategoryId, WordleCategory> = {
  ancient: {
    id: "ancient",
    title: "Ancient Words",
    tagline: "Archaic ink from older tongues.",
    difficulty: "medium",
    answers: [
      "thane",
      "wight",
      "meeds",
      "ersts",
      "fains",
      "anent",
      "scrip",
      "troth",
      "redes",
      "sooth",
      "harks",
      "quoth",
      "afore",
      "wends",
      "glees",
      "runes",
      "sigil",
      "relic",
      "altar",
    ],
  },
  nature: {
    id: "nature",
    title: "Nature Words",
    tagline: "Petals, roots, and wild places.",
    difficulty: "easy",
    answers: [
      "ferns",
      "spore",
      "grove",
      "petal",
      "coral",
      "delta",
      "brook",
      "mossy",
      "cedar",
      "bloom",
      "river",
      "ocean",
      "leafy",
      "thorn",
      "wheat",
      "olive",
      "maple",
      "storm",
    ],
  },
  beautiful: {
    id: "beautiful",
    title: "Beautiful Words",
    tagline: "Words that sound like light.",
    difficulty: "easy",
    answers: [
      "lumen",
      "amber",
      "ivory",
      "silks",
      "pearl",
      "ethos",
      "muses",
      "gleam",
      "grace",
      "charm",
      "heart",
      "unity",
      "shine",
      "dream",
      "vivid",
      "bloom",
      "angel",
      "light",
    ],
  },
  rare_letters: {
    id: "rare_letters",
    title: "Rare Letters",
    tagline: "J, Q, X, Z — and nowhere to hide.",
    difficulty: "hard",
    answers: [
      "fjord",
      "jazzy",
      "joust",
      "quell",
      "axiom",
      "azure",
      "zebra",
      "proxy",
      "jumbo",
      "ozone",
      "quart",
      "exile",
      "vixen",
      "zesty",
      "quack",
      "waxen",
      "jokey",
      "zincs",
      "equal",
      "toxic",
    ],
  },
  oddly_specific: {
    id: "oddly_specific",
    title: "Oddly Specific",
    tagline: "Tiny words for tiny, exact things.",
    difficulty: "medium",
    answers: [
      "aglet",
      "uvula",
      "snark",
      "fleek",
      "droit",
      "rowel",
      "spoor",
      "hafts",
      "kerfs",
      "tangy",
      "lathe",
      "tenon",
      "bevel",
      "shank",
      "fluke",
      "rivet",
      "dowel",
    ],
  },
};

/** Season-like id so surprise boards don’t collide with normal dailies. */
export function wordleCategorySeasonId(categoryId: WordleCategoryId): string {
  return `surprise-wordle-${categoryId}`;
}

export function parseWordleCategory(
  raw: string | null | undefined,
): WordleCategoryId | null {
  if (!raw) return null;
  if (raw in WORDLE_CATEGORIES) return raw as WordleCategoryId;
  return null;
}

export type SurpriseWordleChallenge = {
  category: WordleCategory;
  seasonId: string;
  href: string;
};

/**
 * Roughly one surprise every ~4 days (deterministic by date).
 * Returns null on quiet days.
 */
export function getSurpriseWordleChallenge(
  dateKey: string,
): SurpriseWordleChallenge | null {
  const seed = hashSeed("surprise-wordle", dateKey, dayIndex(dateKey));
  if (seed % 4 !== 1) return null;

  const ids = Object.keys(WORDLE_CATEGORIES) as WordleCategoryId[];
  const category = WORDLE_CATEGORIES[ids[pickIndex(seed, ids.length)]!]!;
  return {
    category,
    seasonId: wordleCategorySeasonId(category.id),
    href: `/play/wordle/${category.difficulty}?category=${category.id}`,
  };
}

export function sanitizeWordPool(words: string[], length: number): string[] {
  return [
    ...new Set(
      words
        .map((w) => w.trim().toLowerCase())
        .filter((w) => w.length === length && /^[a-z]+$/.test(w)),
    ),
  ];
}
