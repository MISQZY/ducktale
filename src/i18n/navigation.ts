import { createNavigation } from "next-intl/navigation";
import { routing } from "./routing";

// Lightweight wrappers around Next.js' navigation APIs that are aware of
// `routing` (e.g. will add a "/en/" prefix once that locale exists).
export const { Link, redirect, usePathname, useRouter, getPathname } =
  createNavigation(routing);
