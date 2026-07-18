import type { Difficulty } from "./types";
import { buildMonthlyExplanation } from "./puzzle-explanations";
import { hashSeed, pickIndex } from "./types";
import { normalizeWord } from "./words";

/** Monthly-only puzzle kinds (not exposed as daily boards). */
export type MonthlyOnlyType =
  | "riddle"
  | "trivia"
  | "mathlogic"
  | "memory"
  | "pattern"
  | "deduction";

export type MonthlyRiddle = {
  kind: "riddle";
  prompt: string;
  answer: string;
  hint: string;
  explanation: string;
};

export type MonthlyTrivia = {
  kind: "trivia";
  question: string;
  options: string[];
  answerIndex: number;
  explanation: string;
};

export type MonthlyMathLogic = {
  kind: "mathlogic";
  prompt: string;
  answer: string;
  explanation: string;
};

export type MonthlyMemory = {
  kind: "memory";
  /** Sequence shown briefly then hidden */
  sequence: string[];
  flashMs: number;
};

export type MonthlyPattern = {
  kind: "pattern";
  /** Shown items; player picks the next */
  shown: string[];
  options: string[];
  answerIndex: number;
  explanation: string;
};

export type MonthlyDeduction = {
  kind: "deduction";
  briefing: string;
  clues: string[];
  options: string[];
  answerIndex: number;
  explanation: string;
};

export type MonthlyOnlyPuzzle =
  | MonthlyRiddle
  | MonthlyTrivia
  | MonthlyMathLogic
  | MonthlyMemory
  | MonthlyPattern
  | MonthlyDeduction;

const RIDDLES: Array<{
  prompt: string;
  answer: string;
  hint: string;
  explanation: string;
}> = [
  {
    prompt: "I speak without a mouth and hear without ears. What am I?",
    answer: "echo",
    hint: "Mountains and canyons keep me.",
    explanation:
      "Something that “speaks” and “hears” with no mouth or ears is a returned sound — an echo bouncing back from walls or cliffs.",
  },
  {
    prompt: "The more you take, the more you leave behind. What are they?",
    answer: "footsteps",
    hint: "Walking leaves a trail.",
    explanation:
      "Each step you “take” leaves another print behind you, so taking more creates more footsteps.",
  },
  {
    prompt: "What has keys but can’t open locks?",
    answer: "piano",
    hint: "It makes music.",
    explanation:
      "“Keys” here are piano keys, not lock keys — they make notes, not open doors.",
  },
  {
    prompt: "What gets wetter the more it dries?",
    answer: "towel",
    hint: "Bathroom helper.",
    explanation:
      "A towel dries you by soaking up water, so as it does its job it becomes wetter.",
  },
  {
    prompt: "I have cities but no houses, forests but no trees, water but no fish. What am I?",
    answer: "map",
    hint: "Folded paper of the world.",
    explanation:
      "A map shows cities, forests, and water as drawings, not as real houses, trees, or fish.",
  },
  {
    prompt: "What can travel around the world while staying in a corner?",
    answer: "stamp",
    hint: "On an envelope.",
    explanation:
      "A postage stamp stays stuck in the corner of an envelope while the mail travels the world.",
  },
  {
    prompt: "What has a head and a tail but no body?",
    answer: "coin",
    hint: "Pocket change.",
    explanation:
      "Coins have a “heads” side and a “tails” side, with no body between them.",
  },
  {
    prompt: "I’m tall when I’m young and short when I’m old. What am I?",
    answer: "candle",
    hint: "Wax and wick.",
    explanation:
      "A new candle is tall; as it burns, the wax melts away and it gets shorter.",
  },
];

const TRIVIA: Array<{
  question: string;
  options: [string, string, string, string];
  answerIndex: number;
  explanation: string;
}> = [
  {
    question: "Which planet is known as the Red Planet?",
    options: ["Venus", "Mars", "Jupiter", "Mercury"],
    answerIndex: 1,
    explanation:
      "Mars looks reddish from Earth because its surface is rich in iron oxide (rust).",
  },
  {
    question: "How many sides does a hexagon have?",
    options: ["5", "6", "7", "8"],
    answerIndex: 1,
    explanation:
      "The prefix “hexa-” means six, so a hexagon is a six-sided polygon.",
  },
  {
    question: "What is the chemical symbol for gold?",
    options: ["Ag", "Fe", "Au", "Pb"],
    answerIndex: 2,
    explanation:
      "Gold’s symbol Au comes from the Latin name aurum; Ag is silver, Fe iron, Pb lead.",
  },
  {
    question: "Which ocean is the largest?",
    options: ["Atlantic", "Indian", "Arctic", "Pacific"],
    answerIndex: 3,
    explanation:
      "The Pacific covers more of Earth’s surface than any other ocean — larger than the Atlantic, Indian, or Arctic.",
  },
  {
    question: "Who painted the Mona Lisa?",
    options: ["Michelangelo", "Leonardo da Vinci", "Raphael", "Donatello"],
    answerIndex: 1,
    explanation:
      "Leonardo da Vinci painted the Mona Lisa in the early 1500s; the others were Renaissance artists known for different works.",
  },
  {
    question: "What gas do plants absorb from the air?",
    options: ["Oxygen", "Nitrogen", "Carbon dioxide", "Helium"],
    answerIndex: 2,
    explanation:
      "In photosynthesis, plants take in carbon dioxide and release oxygen.",
  },
  {
    question: "How many minutes are in two hours?",
    options: ["60", "90", "120", "180"],
    answerIndex: 2,
    explanation:
      "One hour is 60 minutes, so two hours are 60 × 2 = 120 minutes.",
  },
  {
    question: "Which continent is the Sahara Desert mostly in?",
    options: ["Asia", "Africa", "Australia", "South America"],
    answerIndex: 1,
    explanation:
      "The Sahara spans northern Africa, from the Atlantic across to the Red Sea.",
  },
];

const MATHS: Array<{ prompt: string; answer: string; explanation: string }> = [
  {
    prompt: "What is 17 + 28?",
    answer: "45",
    explanation: "Add the ones: 7 + 8 = 15 (write 5, carry 1). Add the tens: 1 + 2 + 1 = 4 → 45.",
  },
  {
    prompt: "What is 9 × 7?",
    answer: "63",
    explanation: "Nine sevens: 7 + 7 + 7 + 7 + 7 + 7 + 7 + 7 + 7 = 63 (or 9 × 7 from the times table).",
  },
  {
    prompt: "What is 144 ÷ 12?",
    answer: "12",
    explanation: "12 × 12 = 144, so 144 ÷ 12 = 12.",
  },
  {
    prompt: "Find the next number: 2, 4, 8, 16, ?",
    answer: "32",
    explanation: "Each term doubles the one before it (×2): 2→4→8→16→32.",
  },
  {
    prompt: "Find the next number: 3, 6, 9, 12, ?",
    answer: "15",
    explanation: "Each term increases by 3 (multiples of 3): 3, 6, 9, 12, 15.",
  },
  {
    prompt: "What is 100 − 37?",
    answer: "63",
    explanation: "100 − 30 = 70, then 70 − 7 = 63.",
  },
  {
    prompt: "If a train leaves at 3 and arrives 2 hours later, what time is it?",
    answer: "5",
    explanation: "Start at 3 o’clock and add 2 hours: 3 + 2 = 5.",
  },
  {
    prompt: "Half of 86 is?",
    answer: "43",
    explanation: "Half means ÷ 2: 86 ÷ 2 = 43.",
  },
];

const MEMORY_SYMBOLS = ["●", "■", "▲", "◆", "★", "○", "□", "△"];

const PATTERN_SETS: Array<{
  shown: string[];
  options: string[];
  answerIndex: number;
  explanation: string;
}> = [
  {
    shown: ["A", "B", "C"],
    options: ["D", "E", "A", "Z"],
    answerIndex: 0,
    explanation:
      "The letters advance one step through the alphabet each time (A → B → C → D).",
  },
  {
    shown: ["2", "4", "6"],
    options: ["7", "8", "9", "10"],
    answerIndex: 1,
    explanation:
      "Each number increases by 2 (even numbers: 2, 4, 6, 8).",
  },
  {
    shown: ["■", "■", "○"],
    options: ["■", "○", "▲", "★"],
    answerIndex: 1,
    explanation:
      "The pattern alternates pairs of filled squares with a circle: ■ ■ ○ ■ ■ ○… so the next symbol is ○.",
  },
  {
    shown: ["1", "1", "2", "3"],
    options: ["4", "5", "3", "8"],
    answerIndex: 1,
    explanation:
      "This is the Fibonacci sequence: each number is the sum of the two before it (1+1=2, 1+2=3, 2+3=5).",
  },
  {
    shown: ["red", "blue", "red"],
    options: ["blue", "green", "red", "yellow"],
    answerIndex: 0,
    explanation:
      "The colors alternate red, blue, red, blue… so the next color is blue.",
  },
  {
    shown: ["↑", "→", "↓"],
    options: ["←", "↑", "→", "↓"],
    answerIndex: 0,
    explanation:
      "The arrows turn 90° clockwise each step (up → right → down → left).",
  },
];

const DEDUCTIONS: Array<{
  briefing: string;
  clues: string[];
  options: string[];
  answerIndex: number;
  explanation: string;
}> = [
  {
    briefing: "Three suspects: Ava, Ben, and Cara. Who stole the ledger?",
    clues: [
      "Ava was in the garden at the time.",
      "The thief left muddy boots indoors.",
      "Ben never wears boots.",
    ],
    options: ["Ava", "Ben", "Cara", "No one"],
    answerIndex: 2,
    explanation:
      "The thief left muddy boots indoors, but Ben never wears boots, so Ben is ruled out. Ava was in the garden, so she is unlikely to have left indoor mud. Cara is the only remaining suspect.",
  },
  {
    briefing: "Three labeled boxes — A, B, and C. Exactly one holds the key.",
    clues: [
      "Box A is labeled: “The key is in box B.”",
      "Box B is labeled: “The key is in box C.”",
      "Box C is labeled: “The key is in box C.”",
      "Exactly one label is true.",
    ],
    options: ["A", "B", "C", "None"],
    answerIndex: 1,
    explanation:
      "If the key is in B, only A’s label (“key in B”) is true; B and C are false. If the key were in A or C, two labels would be true. So the key is in box B.",
  },
  {
    briefing: "Three boats — Nora, Quinn, and Remy — dock one at a time. Who arrives first?",
    clues: [
      "Nora arrives after Quinn.",
      "Remy is the last to dock.",
      "There are only Nora, Quinn, and Remy.",
    ],
    options: ["Nora", "Quinn", "Remy", "Tie"],
    answerIndex: 1,
    explanation:
      "Remy is last, so the order ends with Remy. Nora is after Quinn, so Quinn docks before Nora. The only order that fits is Quinn → Nora → Remy; Quinn arrives first.",
  },
  {
    briefing: "Which day was the meeting?",
    clues: [
      "It was not Monday.",
      "It was earlier in the week than Thursday.",
      "It was after Tuesday.",
    ],
    options: ["Monday", "Tuesday", "Wednesday", "Friday"],
    answerIndex: 2,
    explanation:
      "Not Monday rules out Monday. Earlier than Thursday leaves Tuesday or Wednesday. After Tuesday leaves only Wednesday.",
  },
  {
    briefing: "Four painters hung one canvas each. Who hung the landscape?",
    clues: [
      "Rae hung the portrait.",
      "Sid did not hang the still life.",
      "Tess hung neither the portrait nor the landscape.",
      "The abstract was not Sid’s.",
    ],
    options: ["Rae", "Sid", "Tess", "Uma"],
    answerIndex: 1,
    explanation:
      "Rae has the portrait. Tess is not landscape. Sid is neither still life nor abstract, so Sid must have the landscape.",
  },
  {
    briefing: "A courier left one of four parcels. Which color ribbon marks the urgent one?",
    clues: [
      "The blue ribbon is not urgent.",
      "The urgent parcel is not green.",
      "Red was used on a routine delivery.",
      "Only one ribbon is gold, blue, green, or red.",
    ],
    options: ["Blue", "Green", "Red", "Gold"],
    answerIndex: 3,
    explanation:
      "Blue and green are ruled out for urgent; red is routine. Gold is the only color left for the urgent parcel.",
  },
];

function rng(seed: number): () => number {
  let s = seed >>> 0;
  return () => {
    s = (Math.imul(s, 1664525) + 1013904223) >>> 0;
    return s / 0x100000000;
  };
}

export function getMonthlyOnlyPuzzle(
  kind: MonthlyOnlyType,
  seedKey: string,
  difficulty: Difficulty,
): MonthlyOnlyPuzzle {
  const seed = hashSeed("monthly-only", kind, seedKey, difficulty);

  switch (kind) {
    case "riddle": {
      const pack = RIDDLES[pickIndex(seed, RIDDLES.length)]!;
      return {
        kind: "riddle",
        prompt: pack.prompt,
        answer: pack.answer,
        hint: difficulty === "easy" ? pack.hint : "No further hints.",
        explanation: pack.explanation,
      };
    }
    case "trivia": {
      const pack = TRIVIA[pickIndex(seed, TRIVIA.length)]!;
      return {
        kind: "trivia",
        question: pack.question,
        options: [...pack.options],
        answerIndex: pack.answerIndex,
        explanation: pack.explanation,
      };
    }
    case "mathlogic": {
      const pack = MATHS[pickIndex(seed, MATHS.length)]!;
      return {
        kind: "mathlogic",
        prompt: pack.prompt,
        answer: pack.answer,
        explanation: pack.explanation,
      };
    }
    case "memory": {
      const length =
        difficulty === "easy" ? 3 : difficulty === "medium" ? 4 : 5;
      const flashMs =
        difficulty === "easy" ? 2500 : difficulty === "medium" ? 1800 : 1200;
      const next = rng(seed);
      const sequence: string[] = [];
      for (let i = 0; i < length; i++) {
        sequence.push(
          MEMORY_SYMBOLS[Math.floor(next() * MEMORY_SYMBOLS.length)]!,
        );
      }
      return { kind: "memory", sequence, flashMs };
    }
    case "pattern": {
      const pack = PATTERN_SETS[pickIndex(seed, PATTERN_SETS.length)]!;
      return {
        kind: "pattern",
        shown: [...pack.shown],
        options: [...pack.options],
        answerIndex: pack.answerIndex,
        explanation: pack.explanation,
      };
    }
    case "deduction": {
      const pack = DEDUCTIONS[pickIndex(seed, DEDUCTIONS.length)]!;
      return {
        kind: "deduction",
        briefing: pack.briefing,
        clues: [...pack.clues],
        options: [...pack.options],
        answerIndex: pack.answerIndex,
        explanation: pack.explanation,
      };
    }
  }
}

export function getMonthlyOnlyExplanation(
  puzzle: MonthlyOnlyPuzzle,
): string | undefined {
  return buildMonthlyExplanation(puzzle);
}

export function checkMonthlyOnlyAnswer(
  puzzle: MonthlyOnlyPuzzle,
  payload: {
    answer?: string;
    choiceIndex?: number;
    sequence?: string[];
  },
): { correct: boolean } {
  switch (puzzle.kind) {
    case "riddle":
    case "mathlogic": {
      if (puzzle.kind === "mathlogic") {
        const got = (payload.answer ?? "").trim().replace(/\s/g, "");
        return { correct: got === puzzle.answer.trim() };
      }
      const got = normalizeWord(payload.answer ?? "");
      const want = normalizeWord(puzzle.answer);
      return { correct: got === want };
    }
    case "trivia":
    case "pattern":
    case "deduction":
      return {
        correct:
          typeof payload.choiceIndex === "number" &&
          payload.choiceIndex === puzzle.answerIndex,
      };
    case "memory":
      if (!payload.sequence || payload.sequence.length !== puzzle.sequence.length) {
        return { correct: false };
      }
      return {
        correct: payload.sequence.every((v, i) => v === puzzle.sequence[i]),
      };
  }
}
