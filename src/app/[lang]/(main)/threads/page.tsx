import { getTranslations } from "next-intl/server";
import { MessagesSquare } from "lucide-react";

export default async function ThreadsIndexPage() {
  const t = await getTranslations("Threads");

  return (
    <div className="w-full h-full flex flex-col items-center justify-center gap-3 min-w-0 text-center px-6">
      <MessagesSquare size={32} className="text-foreground/20" />
      <p className="text-foreground/40 text-sm max-w-xs">{t("selectThreadHint")}</p>
    </div>
  );
}
