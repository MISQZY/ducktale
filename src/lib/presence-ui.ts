/**
 * Pure UI helpers for the (Minecraft-server-online, site-online) combination
 * — green/blue/blue-green-duo, see the "animate-border-glow-" and
 * "dot-online-" classes in globals.css. Deliberately has no server-only
 * imports (no siteDb/presence.ts) so client components can import it directly.
 */

export function presenceGlowClass(online: boolean, siteOnline: boolean): string | undefined {
  if (online && siteOnline) return "animate-border-glow-duo";
  if (online) return "animate-border-glow-green";
  if (siteOnline) return "animate-border-glow-blue";
  return undefined;
}

export function presenceDotClass(online: boolean, siteOnline: boolean): string | undefined {
  if (online && siteOnline) return "dot-online-duo";
  if (online) return "dot-online-green";
  if (siteOnline) return "dot-online-blue";
  return undefined;
}
