"use client";

import { useLocale, useTranslations } from "next-intl";
import { usePathname, useRouter } from "@/i18n/navigation";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export function LanguageSwitcher({ className }: { className?: string }) {
  const t = useTranslations("Nav");
  const locale = useLocale();
  const router = useRouter();
  const pathname = usePathname();

  const nextLocale = locale === "ru" ? "en" : "ru";

  return (
    <Button
      variant="ghost"
      size="icon"
      onClick={() => router.replace(pathname, { locale: nextLocale })}
      aria-label={t("switchLanguage")}
      title={t("switchLanguage")}
      className={cn(
        "text-primary/70 hover:text-primary hover:bg-primary/5 transition-colors text-[11px] font-semibold tracking-wide",
        className
      )}
    >
      {locale.toUpperCase()}
    </Button>
  );
}
