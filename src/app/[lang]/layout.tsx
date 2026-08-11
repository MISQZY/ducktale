import { AppProvider } from "./provider";
import { NextIntlClientProvider } from "next-intl";
import { notFound } from "next/navigation";
import { ServerStatusProvider } from "@/context/ServerStatusContext";
import { routing } from "@/i18n/routing";
import { auth } from "@/auth";

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

  // Fetched here (not left for SessionProvider's own client-side fetch) so
  // the Navbar's account link renders the right state on first paint —
  // otherwise every page would flash "Войти" before flipping to the
  // username once the client-side session request resolves.
  const session = await auth();

  return (
    <NextIntlClientProvider>
      <AppProvider lang={lang} session={session}>
        <ServerStatusProvider>{children}</ServerStatusProvider>
      </AppProvider>
    </NextIntlClientProvider>
  );
}
