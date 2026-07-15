import { getAcrosticPuzzle } from "./acrostic";
import { getAnagramPuzzle } from "./anagram";
import { getCryptogramPuzzle } from "./cryptogram";
import { getEscapeRoom } from "./escape";
import { getLogicPuzzle } from "./logic";
import { getPathPuzzle } from "./path";
import { getWordLadderPuzzle } from "./wordladder";
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
    case "anagram":
      return getAnagramPuzzle(dateKey, challenge.difficulty).title;
    case "cryptogram":
      return getCryptogramPuzzle(dateKey, challenge.difficulty).title;
    case "acrostic":
      return getAcrosticPuzzle(dateKey, challenge.difficulty).title;
    case "wordladder":
      return getWordLadderPuzzle(dateKey, challenge.difficulty).title;
    default:
      return challenge.title;
  }
}
