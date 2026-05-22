import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function coloredBadgeCn(
  color: string,
  bgOpacity = "50",
  borderOpacity = "30"
): string {
  return `bg-${color}-900/${bgOpacity} text-${color}-300 border-${color}-700/${borderOpacity}`;
}
