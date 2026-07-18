import type { Difficulty } from "@daily-puzzle/puzzle-core";
import { DIFFICULTY_LABELS } from "@daily-puzzle/puzzle-core";

/** Tailwind text class for a difficulty — Easy green, Medium orange, Hard red. */
export function difficultyTextClass(difficulty: Difficulty | string): string {
  switch (difficulty) {
    case "easy":
      return "text-[var(--diff-easy)]";
    case "medium":
      return "text-[var(--diff-medium)]";
    case "hard":
      return "text-[var(--diff-hard)]";
    case "obscure":
      return "text-[var(--diff-obscure)]";
    case "impossible":
      return "text-[var(--diff-impossible)]";
    default:
      return "text-fog";
  }
}

type Props = {
  difficulty: Difficulty | string;
  className?: string;
};

/** Colored difficulty word for quick scanning in game headers and lists. */
export function DifficultyLabel({ difficulty, className = "" }: Props) {
  const label =
    difficulty in DIFFICULTY_LABELS
      ? DIFFICULTY_LABELS[difficulty as Difficulty]
      : String(difficulty);
  return (
    <span className={[difficultyTextClass(difficulty), className].filter(Boolean).join(" ")}>
      {label}
    </span>
  );
}
