import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import { cn } from "@/lib/utils";

interface AdminNavProps {
  active: "users" | "content" | "tickets" | "badges" | "roles";
}

export function AdminNav({ active }: AdminNavProps) {
  const t = useTranslations("Admin");

  const tabClass = (tab: "users" | "content" | "tickets" | "badges" | "roles") =>
    cn(
      "px-4 py-1.5 rounded-full text-xs uppercase tracking-widest transition-colors border",
      active === tab
        ? "border-primary/40 bg-primary/10 text-primary/90"
        : "border-primary/15 text-foreground/45 hover:text-foreground/70 hover:border-primary/30"
    );

  return (
    <div className="flex items-center gap-2 mb-6">
      <Link href="/admin/users" className={tabClass("users")}>
        {t("navUsers")}
      </Link>
      <Link href="/admin/content" className={tabClass("content")}>
        {t("navContent")}
      </Link>
      <Link href="/admin/tickets" className={tabClass("tickets")}>
        {t("navTickets")}
      </Link>
      <Link href="/admin/badges" className={tabClass("badges")}>
        {t("navBadges")}
      </Link>
      <Link href="/admin/roles" className={tabClass("roles")}>
        {t("navRoles")}
      </Link>
    </div>
  );
}
