/** Client-safe gift limits — keep out of server modules that pull in node:fs.
 * Gift-send XP: coins 5+1/50, decoration 10 (see xpForFriendGiftSend).
 */
export const MIN_COIN_GIFT = 10;
export const MAX_COIN_GIFT = 500;
