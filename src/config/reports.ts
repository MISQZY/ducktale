/**
 * Fixed catalog of report categories — validated against at the app layer
 * (Report.category is a plain VarChar, not a Prisma enum), same
 * string-validated-against-code-catalog pattern as EventCategory
 * (src/config/events.ts) and Badge.icon.
 */
export type ReportCategory = "cheating" | "griefing" | "chat" | "scam" | "other";

export const REPORT_CATEGORIES: ReportCategory[] = ["cheating", "griefing", "chat", "scam", "other"];

export function isReportCategory(value: string): value is ReportCategory {
  return (REPORT_CATEGORIES as string[]).includes(value);
}
