/** Standard Minecraft chat color codes (`&0`-`&9`, `&a`-`&f`) mapped to their hex value. */
const MINECRAFT_COLORS: Record<string, string> = {
  "0": "#000000",
  "1": "#0000AA",
  "2": "#00AA00",
  "3": "#00AAAA",
  "4": "#AA0000",
  "5": "#AA00AA",
  "6": "#FFAA00",
  "7": "#AAAAAA",
  "8": "#555555",
  "9": "#5555FF",
  a: "#55FF55",
  b: "#55FFFF",
  c: "#FF5555",
  d: "#FF55FF",
  e: "#FFFF55",
  f: "#FFFFFF",
};

const FALLBACK_COLOR = "#FFFFFF";

/**
 * Resolves the hex color for the first `&<code>` Minecraft color code found in
 * a string (e.g. a Towny town/nation tag like `"&6ЗЛТ"`). Falls back to white
 * when there's no `&` followed by a valid color code.
 */
export function resolveMinecraftColor(text: string | null | undefined): string {
  if (!text) return FALLBACK_COLOR;
  const match = text.match(/&([0-9a-fA-F])/);
  if (!match) return FALLBACK_COLOR;
  return MINECRAFT_COLORS[match[1].toLowerCase()] ?? FALLBACK_COLOR;
}
