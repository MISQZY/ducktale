import { randomInt } from "crypto";

// Excludes visually ambiguous characters (0/O, 1/I/L) since this is typed
// in-game by hand. Documented in MINECRAFT_ACCOUNT_LINK.md for the plugin side.
const CODE_ALPHABET = "ABCDEFGHJKMNPQRSTUVWXYZ23456789";
const CODE_LENGTH = 8;

export const LINK_CODE_TTL_MS = 10 * 60_000;

export function generateLinkCode(): string {
  let code = "";
  for (let i = 0; i < CODE_LENGTH; i++) {
    code += CODE_ALPHABET[randomInt(CODE_ALPHABET.length)];
  }
  return code;
}
