/* eslint-disable */
"use client";

import { useLocale, useTranslations } from "next-intl";
import Navbar from "@/components/Navbar";
import { ErrorView } from "@/components/common/ErrorView";
import { useEffect } from "react";

export default function ErrorPage({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  const t = useTranslations("Error");
  const locale = useLocale();

  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <>
      <Navbar />
      <ErrorView
        code="500"
        badge={t("badge")}
        heading={t("heading")}
        description={t("description")}
        ctaHomeLabel={t("ctaHome")}
        homeHref={`/${locale}`}
      />
    </>
  );
}
