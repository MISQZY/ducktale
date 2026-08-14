"use client";

import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";

interface AdminNavProps {
  active: "users" | "content" | "tickets" | "badges" | "roles";
}

export function AdminNav({ active }: AdminNavProps) {
  const t = useTranslations("Admin");

  return (
    <div className="flex items-center justify-center mb-6">
      <Tabs value={active}>
        <TabsList>
          <TabsTrigger value="users" asChild>
            <Link href="/admin/users">{t("navUsers")}</Link>
          </TabsTrigger>
          <TabsTrigger value="content" asChild>
            <Link href="/admin/content">{t("navContent")}</Link>
          </TabsTrigger>
          <TabsTrigger value="tickets" asChild>
            <Link href="/admin/tickets">{t("navTickets")}</Link>
          </TabsTrigger>
          <TabsTrigger value="badges" asChild>
            <Link href="/admin/badges">{t("navBadges")}</Link>
          </TabsTrigger>
          <TabsTrigger value="roles" asChild>
            <Link href="/admin/roles">{t("navRoles")}</Link>
          </TabsTrigger>
        </TabsList>
      </Tabs>
    </div>
  );
}
