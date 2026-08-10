import { AppProvider } from "./provider";
import { NextIntlClientProvider } from "next-intl";
import { notFound } from "next/navigation";
import { ServerStatusProvider } from "@/context/ServerStatusContext";
import { routing } from "@/i18n/routing";

export function generateStaticParams() {
  return routing.locales.map((lang) => ({ lang }));
}

export default async function LangLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ lang: string }>;
}) {
  const { lang } = await params;
  if (!routing.locales.includes(lang as (typeof routing.locales)[number])) {
    notFound();
  }

  return (
    <NextIntlClientProvider>
      <AppProvider lang={lang}>
        <ServerStatusProvider>{children}</ServerStatusProvider>
      </AppProvider>
    </NextIntlClientProvider>
  );
}
