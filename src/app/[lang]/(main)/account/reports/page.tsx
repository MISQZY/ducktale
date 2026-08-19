import { getTranslations } from "next-intl/server";
import { MessageSquare } from "lucide-react";

export default async function AccountReportsPage() {
  const t = await getTranslations("Reports");
  
  return (
    <div className="flex-1 flex flex-col items-center justify-center text-foreground/40 gap-4 min-h-0">
      <div className="w-16 h-16 rounded-2xl bg-card border border-primary/20 flex items-center justify-center">
        <MessageSquare size={24} className="text-primary/60" />
      </div>
      <p>{t("noReports")}</p>
    </div>
  );
}
