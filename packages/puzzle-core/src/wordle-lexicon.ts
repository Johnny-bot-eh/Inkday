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

/** Short learner-friendly definitions shown after an Obscure clear. */
export const WORDLE_OBSCURE_DEFINITIONS: Record<string, string> = {
  aglet: "The small plastic or metal tip at the end of a shoelace.",
  anent: "Concerning; about (chiefly archaic or Scottish).",
  askoi: "Ancient Greek flasks with a spout and handle (plural of askos).",
  atopy: "A genetic tendency to develop allergic conditions like eczema or asthma.",
  azoic: "Without living organisms; lifeless.",
  benty: "Covered with bent grass; grassy and coarse.",
  borty: "Related to bort — low-grade diamond used industrially.",
  cwtch: "Welsh for a cuddle, hug, or cozy safe place.",
  cymae: "Architectural moldings with an S-shaped curve (plural of cyma).",
  davit: "A small crane on a ship used to raise and lower boats.",
  dwale: "Deadly nightshade, or an old word for a sleeping draught.",
  elute: "To wash out or extract one substance from another.",
  emeer: "A variant spelling of emir — a Muslim ruler or commander.",
  fichu: "A light triangular scarf worn around the neck or shoulders.",
  fjeld: "A high, rocky, treeless plateau, especially in Scandinavia.",
  ghyll: "A deep ravine or narrow wooded valley.",
  gleby: "Of or relating to soil; earthy (rare).",
  hadal: "Of the ocean’s deepest trenches, below the abyssal zone.",
  hokku: "The opening verse of a linked Japanese poem; forerunner of the haiku.",
  ileac: "Relating to the ileum, the final section of the small intestine.",
  ixora: "A tropical evergreen shrub with dense clusters of bright flowers.",
  jebel: "An Arabic word for a mountain, hill, or rocky ridge.",
  jougs: "An iron collar once used in Scotland for public punishment.",
  karst: "Limestone country riddled with caves, sinkholes, and underground streams.",
  kraal: "A traditional enclosure for livestock in southern Africa.",
  lovat: "A soft green-blue color, especially in tweed or wool.",
  mythe: "An older spelling of myth — a traditional story.",
  naevi: "Birthmarks or moles (plural of naevus).",
  ogham: "An early medieval Irish alphabet cut as notches along a line.",
  pavis: "A large medieval shield that could cover most of the body.",
  qophs: "The letter qoph in Hebrew and related alphabets (plural).",
  ruche: "A gathered or pleated strip of fabric used as trim.",
  sloyd: "A Scandinavian system of craft education, especially woodworking.",
  towzy: "Disheveled, shaggy, or unkempt (Scottish).",
  ulema: "A body of Muslim scholars trained in Islamic law and theology.",
  vleis: "South African word for meat or flesh.",
  wamus: "A heavy jacket or cardigan, often of rough cloth.",
  xeric: "Extremely dry; adapted to very little moisture.",
  yarco: "Australian slang for a rough, working-class youth.",
  zinke: "A historical brass woodwind instrument; an early cornett.",
};

export function getObscureDefinition(word: string): string | undefined {
  return WORDLE_OBSCURE_DEFINITIONS[word.trim().toLowerCase()];
}

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
