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
};

export type MonthlyTrivia = {
  kind: "trivia";
  question: string;
  options: string[];
  answerIndex: number;
};

export type MonthlyMathLogic = {
  kind: "mathlogic";
  prompt: string;
  answer: string;
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

const RIDDLES: Array<{ prompt: string; answer: string; hint: string }> = [
  {
    prompt: "I speak without a mouth and hear without ears. What am I?",
    answer: "echo",
    hint: "Mountains and canyons keep me.",
  },
  {
    prompt: "The more you take, the more you leave behind. What are they?",
    answer: "footsteps",
    hint: "Walking leaves a trail.",
  },
  {
    prompt: "What has keys but can’t open locks?",
    answer: "piano",
    hint: "It makes music.",
  },
  {
    prompt: "What gets wetter the more it dries?",
    answer: "towel",
    hint: "Bathroom helper.",
  },
  {
    prompt: "I have cities but no houses, forests but no trees, water but no fish. What am I?",
    answer: "map",
    hint: "Folded paper of the world.",
  },
  {
    prompt: "What can travel around the world while staying in a corner?",
    answer: "stamp",
    hint: "On an envelope.",
  },
  {
    prompt: "What has a head and a tail but no body?",
    answer: "coin",
    hint: "Pocket change.",
  },
  {
    prompt: "I’m tall when I’m young and short when I’m old. What am I?",
    answer: "candle",
    hint: "Wax and wick.",
  },
];

const TRIVIA: Array<{
  question: string;
  options: [string, string, string, string];
  answerIndex: number;
}> = [
  {
    question: "Which planet is known as the Red Planet?",
    options: ["Venus", "Mars", "Jupiter", "Mercury"],
    answerIndex: 1,
  },
  {
    question: "How many sides does a hexagon have?",
    options: ["5", "6", "7", "8"],
    answerIndex: 1,
  },
  {
    question: "What is the chemical symbol for gold?",
    options: ["Ag", "Fe", "Au", "Pb"],
    answerIndex: 2,
  },
  {
    question: "Which ocean is the largest?",
    options: ["Atlantic", "Indian", "Arctic", "Pacific"],
    answerIndex: 3,
  },
  {
    question: "Who painted the Mona Lisa?",
    options: ["Michelangelo", "Leonardo da Vinci", "Raphael", "Donatello"],
    answerIndex: 1,
  },
  {
    question: "What gas do plants absorb from the air?",
    options: ["Oxygen", "Nitrogen", "Carbon dioxide", "Helium"],
    answerIndex: 2,
  },
  {
    question: "How many minutes are in two hours?",
    options: ["60", "90", "120", "180"],
    answerIndex: 2,
  },
  {
    question: "Which continent is the Sahara Desert mostly in?",
    options: ["Asia", "Africa", "Australia", "South America"],
    answerIndex: 1,
  },
];

const MATHS: Array<{ prompt: string; answer: string }> = [
  { prompt: "What is 17 + 28?", answer: "45" },
  { prompt: "What is 9 × 7?", answer: "63" },
  { prompt: "What is 144 ÷ 12?", answer: "12" },
  { prompt: "Find the next number: 2, 4, 8, 16, ?", answer: "32" },
  { prompt: "Find the next number: 3, 6, 9, 12, ?", answer: "15" },
  { prompt: "What is 100 − 37?", answer: "63" },
  { prompt: "If a train leaves at 3 and arrives 2 hours later, what time is it?", answer: "5" },
  { prompt: "Half of 86 is?", answer: "43" },
];

const MEMORY_SYMBOLS = ["●", "■", "▲", "◆", "★", "○", "□", "△"];

const PATTERN_SETS: Array<{
  shown: string[];
  options: string[];
  answerIndex: number;
}> = [
  { shown: ["A", "B", "C"], options: ["D", "E", "A", "Z"], answerIndex: 0 },
  { shown: ["2", "4", "6"], options: ["7", "8", "9", "10"], answerIndex: 1 },
  { shown: ["■", "■", "○"], options: ["■", "○", "▲", "★"], answerIndex: 1 },
  { shown: ["1", "1", "2", "3"], options: ["4", "5", "3", "8"], answerIndex: 1 },
  { shown: ["red", "blue", "red"], options: ["blue", "green", "red", "yellow"], answerIndex: 0 },
  { shown: ["↑", "→", "↓"], options: ["←", "↑", "→", "↓"], answerIndex: 0 },
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
      };
    }
    case "trivia": {
      const pack = TRIVIA[pickIndex(seed, TRIVIA.length)]!;
      return {
        kind: "trivia",
        question: pack.question,
        options: [...pack.options],
        answerIndex: pack.answerIndex,
      };
    }
    case "mathlogic": {
      const pack = MATHS[pickIndex(seed, MATHS.length)]!;
      return { kind: "mathlogic", prompt: pack.prompt, answer: pack.answer };
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
