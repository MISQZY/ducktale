import { PageLastUpdate } from "fumadocs-ui/layouts/docs/page";
import { getTranslations } from "next-intl/server";
import { fetchLastModified } from "@/lib/github";

interface GitHubLastModifiedProps {
  filePath?: string;
  date?: Date | number | string;
}

/**
 * Renders the last modified date using Fumadocs' recommended `<PageLastUpdate />` component.
 * Accepts either a pre-resolved `date` (e.g. from page.data.lastModified) or a `filePath`.
 */
export async function GitHubLastModified({ filePath, date }: GitHubLastModifiedProps) {
  let resolvedDate: Date | number | string | undefined = date;

  if (!resolvedDate && filePath) {
    try {
      const result = await fetchLastModified(filePath);
      if (result?.date) {
        resolvedDate = result.date;
      }
    } catch {
      resolvedDate = undefined;
    }
  }

  if (!resolvedDate) {
    const t = await getTranslations("Docs");
    return <p className="text-sm text-fd-muted-foreground">{t("lastModifiedUnknown")}</p>;
  }

  const dateObj =
    typeof resolvedDate === "number" || typeof resolvedDate === "string"
      ? new Date(resolvedDate)
      : resolvedDate;

  return <PageLastUpdate date={dateObj} />;
}
