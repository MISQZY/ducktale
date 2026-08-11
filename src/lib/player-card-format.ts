import type { useTranslations } from "next-intl";

type PlayerCardT = ReturnType<typeof useTranslations>;

export function dateLocale(locale: string): string {
  return locale === "ru" ? "ru-RU" : "en-US";
}

export function formatDurationMs(ms: number, t: PlayerCardT): string {
  const totalMinutes = Math.floor(ms / 60_000);
  const days = Math.floor(totalMinutes / 1440);
  const hours = Math.floor((totalMinutes % 1440) / 60);
  const minutes = totalMinutes % 60;
  if (days > 0) return t("unit.daysHours", { days, hours });
  if (hours > 0) return t("unit.hoursMinutes", { hours, minutes });
  return t("unit.minutes", { minutes });
}

export function formatLastSeen(ms: number, locale: string): string {
  return new Date(ms).toLocaleString(dateLocale(locale), {
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}
