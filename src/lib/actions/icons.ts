"use server";

import fs from "fs/promises";
import path from "path";

/**
 * Returns all available Game Icons keys dynamically.
 * Reads from filesystem to avoid bundling the massive gi package on the server.
 */
export async function getGiIconKeys(): Promise<string[]> {
  try {
    const filepath = path.join(process.cwd(), "node_modules", "react-icons", "gi", "index.d.ts");
    const content = await fs.readFile(filepath, "utf-8");
    const matches = Array.from(content.matchAll(/export declare const (Gi[a-zA-Z0-9]+):/g));
    return matches.map((m) => m[1]);
  } catch (e) {
    return [];
  }
}
