import { timingSafeEqual } from "crypto";

/**
 * Verifies the "Authorization: Bearer <secret>" header on server-to-server
 * routes called by trusted Minecraft plugins (e.g. POST /api/badges/award) —
 * the first such route in this codebase; every other plugin<->site
 * integration (account-link confirmation, BetonQuest catalog sync) instead
 * writes directly into the shared site DB, which isn't an option here since
 * this needs to run inside the website's own validation/upsert logic.
 *
 * timingSafeEqual requires equal-length buffers, so a length mismatch is
 * checked separately first (that comparison itself is length-only, not
 * secret-dependent, so it doesn't reopen a timing side-channel).
 */
export function verifyPluginSecret(req: Request): boolean {
  const secret = process.env.PLUGIN_API_SECRET;
  if (!secret) return false;

  const header = req.headers.get("authorization");
  if (!header?.startsWith("Bearer ")) return false;

  const provided = Buffer.from(header.slice("Bearer ".length));
  const expected = Buffer.from(secret);
  if (provided.length !== expected.length) return false;

  return timingSafeEqual(provided, expected);
}
