/**
 * Authoring rules for Inkday puzzles.
 *
 * Solutions must be logically derivable from the clues provided — never from
 * unstated layout assumptions (e.g. “names arranged in a circle” when no
 * circle is mentioned). If a clue refers to shape, position, or relationship,
 * state it explicitly in text or show it visually.
 *
 * Red herrings are welcome, but the true answer should be the only reasonable
 * interpretation once all given facts are applied.
 */
export const PUZZLE_DESIGN_PRINCIPLES = [
  "Solutions must follow logically from the clues given — no unstated assumptions.",
  "The correct answer should have only one reasonable interpretation.",
  "Spatial or relational facts (order, position, shape) must be stated or shown.",
  "Red herrings may mislead, but must not leave multiple equally valid solutions.",
  "Provide a solution explanation when the puzzle type supports one.",
] as const;
