import { NextIntlClientProvider } from "next-intl";
import { getMessages, getLocale, getTranslations } from "next-intl/server";
import { SessionProvider } from "next-auth/react";
import Navbar from "@/components/Navbar";
import { ErrorView } from "@/components/common/ErrorView";
import { createMetadata } from "@/lib/create-metadata";

export const generateMetadata = createMetadata({ namespace: "NotFound" });

export default async function RootNotFound() {
  const t = await getTranslations("NotFound");
  const locale = await getLocale();
  const messages = await getMessages();

  return (
    <NextIntlClientProvider messages={messages}>
      <SessionProvider>
        <Navbar />
        <ErrorView
          code="404"
          badge={t("badge")}
          heading={t("heading")}
          description={t("description")}
          ctaHomeLabel={t("ctaHome")}
          homeHref={`/${locale}`}
        />
      </SessionProvider>
    </NextIntlClientProvider>
  );
}
