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
  {
    prompt: "What has hands but cannot clap?",
    answer: "clock",
    hint: "It hangs on a wall and marks hours.",
    explanation:
      "A clock has hour and minute hands, but they only point — they never clap.",
  },
  {
    prompt: "What has to be broken before you can use it?",
    answer: "egg",
    hint: "Breakfast shell.",
    explanation:
      "You crack an egg’s shell before cooking or eating what’s inside.",
  },
  {
    prompt: "What goes up but never comes down?",
    answer: "age",
    hint: "Birthdays only add to it.",
    explanation:
      "Your age only increases; it never decreases as years pass.",
  },
  {
    prompt: "What has a neck but no head?",
    answer: "bottle",
    hint: "It holds liquid.",
    explanation:
      "A bottle has a neck under the opening, but no head above it.",
  },
  {
    prompt: "What can you catch but not throw?",
    answer: "cold",
    hint: "You might need a tissue.",
    explanation:
      "You “catch” a cold when you get sick — you don’t throw it like a ball.",
  },
  {
    prompt: "What has words but never speaks?",
    answer: "book",
    hint: "Pages and a cover.",
    explanation:
      "A book is full of words on its pages, but it cannot speak them aloud.",
  },
  {
    prompt: "What has one eye but cannot see?",
    answer: "needle",
    hint: "Used with thread.",
    explanation:
      "A sewing needle has an “eye” for thread, but it has no vision.",
  },
  {
    prompt: "What runs but never walks?",
    answer: "water",
    hint: "Rivers and taps.",
    explanation:
      "Water runs in streams and from faucets; it doesn’t walk on legs.",
  },
  {
    prompt: "What has a bed but never sleeps?",
    answer: "river",
    hint: "It flows to the sea.",
    explanation:
      "A river has a riverbed — the ground it flows over — but it never sleeps.",
  },
  {
    prompt: "What building has the most stories?",
    answer: "library",
    hint: "Quiet shelves.",
    explanation:
      "“Stories” means tales in books, and a library holds more of them than any other building.",
  },
  {
    prompt: "What has four legs in the morning, two at noon, and three in the evening?",
    answer: "man",
    hint: "A classic sphinx riddle about a lifetime.",
    explanation:
      "A person crawls on four limbs as a baby, walks on two as an adult, and uses a cane (third “leg”) when old.",
  },
  {
    prompt: "What disappears as soon as you say its name?",
    answer: "silence",
    hint: "The opposite of noise.",
    explanation:
      "Naming silence out loud breaks it — the quiet is gone the moment you speak.",
  },
  {
    prompt: "What has many keys but can’t open a single door?",
    answer: "keyboard",
    hint: "Letters and typing.",
    explanation:
      "A computer (or piano-style) keyboard is covered in keys that type, not unlock doors.",
  },
  {
    prompt: "What is full of holes but still holds water?",
    answer: "sponge",
    hint: "Kitchen clean-up.",
    explanation:
      "A sponge is porous with many holes, yet those holes trap and hold water.",
  },
  {
    prompt: "What kind of room has no doors or windows?",
    answer: "mushroom",
    hint: "Say the answer out loud.",
    explanation:
      "A “mush-room” is a fungus — the word contains “room,” but it isn’t a room you enter.",
  },
  {
    prompt: "What can fill a room but takes up no space?",
    answer: "light",
    hint: "Flip a switch.",
    explanation:
      "Light fills a room so you can see, but it doesn’t occupy volume like furniture.",
  },
  {
    prompt: "Forward I am heavy, backward I am not. What am I?",
    answer: "ton",
    hint: "A unit of weight — spell it both ways.",
    explanation:
      "Spelled forward, T-O-N is a heavy weight; spelled backward it is N-O-T (“not”).",
  },
  {
    prompt: "I have branches, but no fruit, trunk, or leaves. What am I?",
    answer: "bank",
    hint: "Where money is kept.",
    explanation:
      "A bank has branches (locations), but it isn’t a tree with a trunk and leaves.",
  },
  {
    prompt: "What five-letter word becomes shorter when you add two letters to it?",
    answer: "short",
    hint: "Add “er” to the answer.",
    explanation:
      "Adding “e” and “r” to short makes “shorter” — the word that means less long.",
  },
  {
    prompt: "What word is spelled incorrectly in every dictionary?",
    answer: "incorrectly",
    hint: "Read the question literally.",
    explanation:
      "The word “incorrectly” is always spelled i-n-c-o-r-r-e-c-t-l-y — so it is spelled “incorrectly.”",
  },
  {
    prompt: "If you have me, you want to share me. If you share me, you haven’t got me. What am I?",
    answer: "secret",
    hint: "Keep it between us.",
    explanation:
      "A secret is something you hold; once you share it, it is no longer only yours.",
  },
  {
    prompt: "What begins with T, ends with T, and has T in it?",
    answer: "teapot",
    hint: "Brew and pour.",
    explanation:
      "Teapot starts and ends with T, and it has tea (“T”) inside when in use.",
  },
  {
    prompt: "What comes once in a minute, twice in a moment, but never in a thousand years?",
    answer: "m",
    hint: "Look at the letters, not the time.",
    explanation:
      "The letter M appears once in “minute,” twice in “moment,” and not at all in “a thousand years.”",
  },
  {
    prompt: "What has an endless supply of letters but starts empty?",
    answer: "mailbox",
    hint: "At the end of a driveway.",
    explanation:
      "A mailbox starts empty and keeps receiving letters from the post.",
  },
  {
    prompt: "What can you keep after giving it to someone?",
    answer: "word",
    hint: "A promise.",
    explanation:
      "If you give someone your word, you still “keep” your word by honoring it.",
  },
  {
    prompt: "What goes through cities and fields but never moves?",
    answer: "road",
    hint: "Cars use it.",
    explanation:
      "A road stretches across cities and fields while staying in place.",
  },
  {
    prompt: "What gets bigger the more you take away from it?",
    answer: "hole",
    hint: "Digging.",
    explanation:
      "Removing dirt from a hole makes the hole larger.",
  },
  {
    prompt: "I am an odd number. Take away a letter and I become even. What am I?",
    answer: "seven",
    hint: "Remove the first letter.",
    explanation:
      "Seven is odd; remove the S and you get “even.”",
  },
  {
    prompt: "What has teeth but cannot bite?",
    answer: "comb",
    hint: "Hair tool.",
    explanation:
      "A comb has teeth that part hair, but they don’t bite.",
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
  {
    question: "How many degrees are in a right angle?",
    options: ["45", "90", "180", "360"],
    answerIndex: 1,
    explanation: "A right angle measures exactly 90 degrees.",
  },
  {
    question: "What is the largest mammal?",
    options: ["Elephant", "Blue whale", "Giraffe", "Hippopotamus"],
    answerIndex: 1,
    explanation:
      "The blue whale is the largest animal known — bigger than any land mammal.",
  },
  {
    question: "Which planet is closest to the Sun?",
    options: ["Venus", "Earth", "Mercury", "Mars"],
    answerIndex: 2,
    explanation: "Mercury orbits nearest the Sun of all the planets.",
  },
  {
    question: "What do bees collect to make honey?",
    options: ["Pollen only", "Nectar", "Dew", "Sap"],
    answerIndex: 1,
    explanation:
      "Bees gather nectar from flowers and turn it into honey in the hive.",
  },
  {
    question: "How many continents are there on Earth?",
    options: ["5", "6", "7", "8"],
    answerIndex: 2,
    explanation:
      "The usual school model counts seven continents: Africa, Antarctica, Asia, Australia/Oceania, Europe, North America, and South America.",
  },
  {
    question: "What is H2O more commonly called?",
    options: ["Salt", "Water", "Oxygen", "Hydrogen"],
    answerIndex: 1,
    explanation: "H2O is the chemical formula for water — two hydrogen, one oxygen.",
  },
  {
    question: "Which instrument has 88 keys?",
    options: ["Guitar", "Flute", "Piano", "Violin"],
    answerIndex: 2,
    explanation: "A standard piano keyboard has 88 keys.",
  },
  {
    question: "What is the boiling point of water at sea level in Celsius?",
    options: ["0", "50", "100", "212"],
    answerIndex: 2,
    explanation: "At standard sea-level pressure, water boils at 100°C.",
  },
  {
    question: "Which country gifted the Statue of Liberty to the United States?",
    options: ["England", "France", "Spain", "Italy"],
    answerIndex: 1,
    explanation: "France gave the Statue of Liberty as a gift, dedicated in 1886.",
  },
  {
    question: "How many sides does an octagon have?",
    options: ["6", "7", "8", "10"],
    answerIndex: 2,
    explanation: "The prefix “octa-” means eight.",
  },
  {
    question: "What force pulls objects toward Earth?",
    options: ["Magnetism", "Friction", "Gravity", "Inertia"],
    answerIndex: 2,
    explanation: "Gravity is the force that pulls objects toward Earth’s center.",
  },
  {
    question: "Which animal is known as the king of the jungle?",
    options: ["Tiger", "Lion", "Elephant", "Gorilla"],
    answerIndex: 1,
    explanation: "Lions are traditionally called the “king of the jungle” (even though they live mainly on savanna).",
  },
  {
    question: "What is the capital of Japan?",
    options: ["Osaka", "Kyoto", "Tokyo", "Nagoya"],
    answerIndex: 2,
    explanation: "Tokyo is Japan’s capital and largest city.",
  },
  {
    question: "How many players are on a soccer team on the field at once?",
    options: ["9", "10", "11", "12"],
    answerIndex: 2,
    explanation: "Each soccer side fields 11 players including the goalkeeper.",
  },
  {
    question: "Which gas do humans need to breathe?",
    options: ["Carbon dioxide", "Nitrogen", "Oxygen", "Helium"],
    answerIndex: 2,
    explanation: "Humans breathe in oxygen; we exhale carbon dioxide.",
  },
  {
    question: "What is 12 × 12?",
    options: ["124", "144", "132", "156"],
    answerIndex: 1,
    explanation: "12 × 12 = 144.",
  },
  {
    question: "Which ocean lies between Europe and America?",
    options: ["Pacific", "Indian", "Atlantic", "Arctic"],
    answerIndex: 2,
    explanation: "The Atlantic Ocean separates Europe/Africa from the Americas.",
  },
  {
    question: "What do you call a baby cat?",
    options: ["Puppy", "Cub", "Kitten", "Calf"],
    answerIndex: 2,
    explanation: "A young cat is a kitten.",
  },
  {
    question: "Which shape has three sides?",
    options: ["Square", "Triangle", "Pentagon", "Circle"],
    answerIndex: 1,
    explanation: "A triangle is a three-sided polygon.",
  },
  {
    question: "What is the fastest land animal?",
    options: ["Lion", "Cheetah", "Horse", "Antelope"],
    answerIndex: 1,
    explanation: "Cheetahs can sprint faster than any other land animal.",
  },
  {
    question: "How many hours are in three days?",
    options: ["36", "48", "72", "96"],
    answerIndex: 2,
    explanation: "24 hours × 3 days = 72 hours.",
  },
  {
    question: "Which metal is liquid at room temperature?",
    options: ["Iron", "Mercury", "Copper", "Silver"],
    answerIndex: 1,
    explanation: "Mercury is a metal that stays liquid at ordinary room temperatures.",
  },
  {
    question: "What is the main language spoken in Brazil?",
    options: ["Spanish", "Portuguese", "French", "English"],
    answerIndex: 1,
    explanation: "Brazil’s official language is Portuguese.",
  },
];

const MATHS_EASY: Array<{ prompt: string; answer: string; explanation: string }> = [
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
    prompt: "What is 100 − 37?",
    answer: "63",
    explanation: "100 − 30 = 70, then 70 − 7 = 63.",
  },
  {
    prompt: "Half of 86 is?",
    answer: "43",
    explanation: "Half means ÷ 2: 86 ÷ 2 = 43.",
  },
  {
    prompt: "If a train leaves at 3 and arrives 2 hours later, what time is it?",
    answer: "5",
    explanation: "Start at 3 o’clock and add 2 hours: 3 + 2 = 5.",
  },
  {
    prompt: "Find the next number: 3, 6, 9, 12, ?",
    answer: "15",
    explanation: "Each term increases by 3 (multiples of 3): 3, 6, 9, 12, 15.",
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
];

const MATHS_MEDIUM: Array<{ prompt: string; answer: string; explanation: string }> = [
  {
    prompt: "What is 15 × 12?",
    answer: "180",
    explanation: "15 × 10 = 150 and 15 × 2 = 30; 150 + 30 = 180.",
  },
  {
    prompt: "What is 7² − 3²?",
    answer: "40",
    explanation: "7² = 49 and 3² = 9; 49 − 9 = 40 (or (7−3)(7+3) = 4×10 = 40).",
  },
  {
    prompt: "A shirt costs $40. It is 25% off. What is the sale price?",
    answer: "30",
    explanation: "25% of 40 is 10; 40 − 10 = 30.",
  },
  {
    prompt: "Find the next number: 1, 2, 4, 7, 11, ?",
    answer: "16",
    explanation: "Gaps increase by 1 each time (+1, +2, +3, +4, then +5): 11 + 5 = 16.",
  },
  {
    prompt: "What is the least common multiple of 6 and 8?",
    answer: "24",
    explanation: "Multiples of 8: 8, 16, 24… Multiples of 6: 6, 12, 18, 24… First shared value is 24.",
  },
  {
    prompt: "If 3x = 51, what is x?",
    answer: "17",
    explanation: "Divide both sides by 3: x = 51 ÷ 3 = 17.",
  },
  {
    prompt: "A recipe for 4 needs 6 cups of flour. How many cups for 10 people?",
    answer: "15",
    explanation: "6 cups / 4 people = 1.5 cups each; 1.5 × 10 = 15.",
  },
  {
    prompt: "What is 2³ × 5?",
    answer: "40",
    explanation: "2³ = 8; 8 × 5 = 40.",
  },
  {
    prompt: "Find the next number: 81, 27, 9, 3, ?",
    answer: "1",
    explanation: "Each term is divided by 3: 81÷3=27, 27÷3=9, 9÷3=3, 3÷3=1.",
  },
  {
    prompt: "The average of 8, 12, and x is 10. What is x?",
    answer: "10",
    explanation: "(8 + 12 + x) ÷ 3 = 10 → 20 + x = 30 → x = 10.",
  },
];

const MATHS_HARD: Array<{ prompt: string; answer: string; explanation: string }> = [
  {
    prompt: "Find the next number: 2, 3, 5, 8, 12, ?",
    answer: "17",
    explanation: "Gaps grow by +1 each time (+1, +2, +3, +4, +5): 12 + 5 = 17.",
  },
  {
    prompt: "What is 13 × 17?",
    answer: "221",
    explanation: "13 × 10 = 130, 13 × 7 = 91; 130 + 91 = 221.",
  },
  {
    prompt: "If 2^x = 64, what is x?",
    answer: "6",
    explanation: "2⁶ = 64, so x = 6.",
  },
  {
    prompt: "A bag has 3 red and 5 blue marbles. Odds of red then blue without replacement?",
    answer: "15/56",
    explanation: "P(red)=3/8; then P(blue)=5/7. Multiply: (3/8)×(5/7)=15/56.",
  },
  {
    prompt: "Find x: 3x + 7 = 2x + 19",
    answer: "12",
    explanation: "Subtract 2x: x + 7 = 19. Subtract 7: x = 12.",
  },
  {
    prompt: "What is 20% of 20% of 500?",
    answer: "20",
    explanation: "20% of 500 = 100; 20% of 100 = 20.",
  },
  {
    prompt: "Find the next number: 2, 6, 12, 20, 30, ?",
    answer: "42",
    explanation: "Add consecutive even numbers (+4, +6, +8, +10, then +12): 30 + 12 = 42. (Or n(n+1): 6×7=42.)",
  },
  {
    prompt: "A number is doubled, then 9 is added, giving 45. What was the number?",
    answer: "18",
    explanation: "Undo: 45 − 9 = 36; half of 36 is 18.",
  },
  {
    prompt: "How many trailing zeros does 25! have?",
    answer: "6",
    explanation: "Count factors of 5: ⌊25/5⌋ + ⌊25/25⌋ = 5 + 1 = 6.",
  },
  {
    prompt: "Solve for x: x/4 + 5 = 17",
    answer: "48",
    explanation: "Subtract 5: x/4 = 12. Multiply by 4: x = 48.",
  },
];

const MATHS_BY_DIFFICULTY: Record<
  Difficulty,
  Array<{ prompt: string; answer: string; explanation: string }>
> = {
  easy: MATHS_EASY,
  medium: MATHS_MEDIUM,
  hard: MATHS_HARD,
  obscure: MATHS_HARD,
  impossible: MATHS_HARD,
};

const MEMORY_SYMBOLS = ["●", "■", "▲", "◆", "★", "○", "□", "△"];

type PatternPack = {
  shown: string[];
  options: string[];
  answerIndex: number;
  explanation: string;
};

const PATTERNS_EASY: PatternPack[] = [
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
    explanation: "Each number increases by 2 (even numbers: 2, 4, 6, 8).",
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
      "Each arrow turns 90° clockwise from the one before it: ↑ then → then ↓ then ←.",
  },
];

const PATTERNS_MEDIUM: PatternPack[] = [
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
    shown: ["2", "4", "8", "16"],
    options: ["24", "30", "32", "18"],
    answerIndex: 2,
    explanation: "Each term doubles the previous one: 16 × 2 = 32.",
  },
  {
    shown: ["Z", "Y", "X"],
    options: ["W", "V", "A", "U"],
    answerIndex: 0,
    explanation: "Letters count backward through the alphabet: Z → Y → X → W.",
  },
  {
    shown: ["△", "□", "○", "△"],
    options: ["□", "○", "△", "★"],
    answerIndex: 0,
    explanation: "The shapes cycle △ □ ○ △ □… so after △ comes □.",
  },
];

const PATTERNS_HARD: PatternPack[] = [
  {
    shown: ["2", "3", "5", "8", "12"],
    options: ["15", "16", "17", "18"],
    answerIndex: 2,
    explanation:
      "The gaps increase by 1 each time (+1, +2, +3, +4, then +5): 12 + 5 = 17.",
  },
  {
    shown: ["A1", "C2", "E3", "G4"],
    options: ["H5", "I5", "I6", "G5"],
    answerIndex: 1,
    explanation:
      "Letters skip one each time (A,C,E,G → I) while numbers rise by 1 (1→2→3→4→5), so I5.",
  },
  {
    shown: ["3", "9", "27", "81"],
    options: ["162", "243", "324", "108"],
    answerIndex: 1,
    explanation: "Each term is multiplied by 3: 81 × 3 = 243.",
  },
  {
    shown: ["1", "4", "9", "16", "25"],
    options: ["30", "35", "36", "49"],
    answerIndex: 2,
    explanation: "Perfect squares: 1², 2², 3², 4², 5² → next is 6² = 36.",
  },
  {
    shown: ["AZ", "BY", "CX", "DW"],
    options: ["EV", "EU", "EX", "FV"],
    answerIndex: 0,
    explanation:
      "First letters run A→B→C→D→E while second letters run backward Z→Y→X→W→V, so EV.",
  },
  {
    shown: ["11", "12", "14", "18", "26"],
    options: ["40", "42", "38", "34"],
    answerIndex: 1,
    explanation:
      "Add powers of 2: +1, +2, +4, +8, then +16 → 26 + 16 = 42.",
  },
];

const PATTERNS_BY_DIFFICULTY: Record<Difficulty, PatternPack[]> = {
  easy: PATTERNS_EASY,
  medium: PATTERNS_MEDIUM,
  hard: PATTERNS_HARD,
  obscure: PATTERNS_HARD,
  impossible: PATTERNS_HARD,
};

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
  {
    briefing: "Four desks — north, south, east, west. Whose desk holds the missing stamp?",
    clues: [
      "The stamp is not on the north desk.",
      "South’s desk was cleared yesterday.",
      "East’s desk has only pencils.",
    ],
    options: ["North", "South", "East", "West"],
    answerIndex: 3,
    explanation:
      "North is ruled out. South was cleared. East has only pencils. West is the only desk left that can hold the stamp.",
  },
  {
    briefing: "Three keys on a ring. Which opens the archive?",
    clues: [
      "The brass key opens the garden shed.",
      "The silver key is tagged “front gate.”",
      "Only one key is left for the archive.",
    ],
    options: ["Brass", "Silver", "Iron", "None"],
    answerIndex: 2,
    explanation:
      "Brass opens the shed and silver is for the front gate, so the remaining iron key opens the archive.",
  },
  {
    briefing: "A train stops in four towns: P, Q, R, and S. Which town is second?",
    clues: [
      "P is first.",
      "S is last.",
      "R is not immediately after P.",
    ],
    options: ["P", "Q", "R", "S"],
    answerIndex: 1,
    explanation:
      "Order starts with P and ends with S. R is not right after P, so Q must be second and R third: P → Q → R → S.",
  },
  {
    briefing: "Who watered the office plant last?",
    clues: [
      "Dana waters only on Mondays.",
      "Today is Thursday.",
      "Ellis watered two days ago.",
      "Fran never waters plants.",
    ],
    options: ["Dana", "Ellis", "Fran", "No one"],
    answerIndex: 1,
    explanation:
      "Dana only waters Mondays and today is Thursday, so Dana didn’t water last. Fran never waters. Ellis watered two days ago (Tuesday), which is the most recent watering among the named people.",
  },
  {
    briefing: "Three suitcases — red, blue, black. Which holds the passport?",
    clues: [
      "The passport is not in the red suitcase.",
      "The blue suitcase holds only clothes.",
      "Black was packed after the passport was found missing.",
    ],
    options: ["Red", "Blue", "Black", "None of them"],
    answerIndex: 3,
    explanation:
      "Not red; blue has only clothes; black was packed after the passport was already missing. So none of the three suitcases holds it.",
  },
  {
    briefing: "Four floor buttons: 1, 2, 3, 4. Which floor is the lab on?",
    clues: [
      "The lab is above floor 1.",
      "The lab is not the top floor.",
      "Floor 2 is the cafeteria.",
    ],
    options: ["1", "2", "3", "4"],
    answerIndex: 2,
    explanation:
      "Above 1 rules out floor 1. Not the top floor rules out 4. Floor 2 is the cafeteria, so the lab is on floor 3.",
  },
  {
    briefing: "A code uses one of four shapes. Which shape is the password?",
    clues: [
      "It is not the circle.",
      "Squares were retired last year.",
      "Triangles open the side door, not the main vault.",
      "The vault accepts exactly one shape.",
    ],
    options: ["Circle", "Square", "Triangle", "Diamond"],
    answerIndex: 3,
    explanation:
      "Circle and square are out. Triangle opens the side door, not the vault. Diamond is the only shape left for the vault password.",
  },
  {
    briefing: "Three chefs — Kit, Lou, and Mo — each made one dish. Who made the soup?",
    clues: [
      "Kit made the salad.",
      "Lou did not make the roast.",
      "Mo never makes soup.",
    ],
    options: ["Kit", "Lou", "Mo", "Unknown"],
    answerIndex: 1,
    explanation:
      "Kit made salad, so not soup. Mo never makes soup. Lou didn’t make the roast, so Lou’s dish is the soup (Mo must have the roast).",
  },
  {
    briefing: "Which envelope has the invitation?",
    clues: [
      "The white envelope is empty.",
      "The invitation is not in the brown envelope.",
      "The gray envelope has a receipt.",
      "Only cream, white, brown, and gray envelopes were mailed.",
    ],
    options: ["White", "Brown", "Gray", "Cream"],
    answerIndex: 3,
    explanation:
      "White is empty, brown doesn’t have it, gray has a receipt. Cream is the only envelope left for the invitation.",
  },
  {
    briefing: "Four lockers — A, B, C, D. Whose locker has the spare badge?",
    clues: [
      "A’s locker is empty.",
      "B keeps gym clothes only.",
      "D lost their badge last week and hasn’t replaced it.",
    ],
    options: ["A", "B", "C", "D"],
    answerIndex: 2,
    explanation:
      "A is empty, B has only gym clothes, and D has no badge. C is the only locker left that can hold the spare badge.",
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
        hint: pack.hint,
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
      const pool = MATHS_BY_DIFFICULTY[difficulty];
      const pack = pool[pickIndex(seed, pool.length)]!;
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
      const pool = PATTERNS_BY_DIFFICULTY[difficulty];
      const pack = pool[pickIndex(seed, pool.length)]!;
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
