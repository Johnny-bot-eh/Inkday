import { getEscapeRoom } from "./escape";
import { getLogicPuzzle } from "./logic";
import { getPathPuzzle } from "./path";
import { wordleTitle, type DailyChallenge } from "./types";

/** Live title for a featured daily — changes each UTC day via puzzle seeds. */
export function dailyChallengeHeadline(
  challenge: DailyChallenge,
  dateKey: string,
): string {
  switch (challenge.puzzleType) {
    case "escape":
      return getEscapeRoom(dateKey, challenge.difficulty).title;
    case "logic":
      return getLogicPuzzle(dateKey, challenge.difficulty).title;
    case "path":
      return getPathPuzzle(dateKey, challenge.difficulty).title;
    case "wordle":
      return wordleTitle(challenge.difficulty);
    default:
      return challenge.title;
  }
}
