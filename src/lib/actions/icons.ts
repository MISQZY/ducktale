"use server";

import * as GiIcons from "react-icons/gi";

/**
 * Returns all available Game Icons keys dynamically.
 * This runs on the server to bypass client-side bundler optimizations
 * that strip out module keys for tree-shaking.
 */
export async function getGiIconKeys(): Promise<string[]> {
  return Object.keys(GiIcons);
}
