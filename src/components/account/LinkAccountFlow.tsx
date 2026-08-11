"use client";

import { useState, useEffect, useCallback } from "react";
import { useTranslations } from "next-intl";
import { CtaButton } from "@/components/common/CtaButton";
import { FormButton } from "@/components/common/FormButton";
import { StatusBadge } from "@/components/common/StatusBadge";
import CopyToClipboard from "@/components/ui/CopyToClipboard";
import { unlinkAccount } from "@/lib/actions/account-link";

type LinkStatusValue = "PENDING" | "CONFIRMED" | "EXPIRED";

interface LinkState {
  status: LinkStatusValue;
  code?: string;
  minecraftName: string | null;
  expiresAt: string;
}

interface LinkAccountFlowProps {
  lang: string;
  initialLink: LinkState | null;
}

export function LinkAccountFlow({ lang, initialLink }: LinkAccountFlowProps) {
  const t = useTranslations("Account.link");
  const [link, setLink] = useState<LinkState | null>(initialLink);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const poll = useCallback(async () => {
    const res = await fetch("/api/account/link/status");
    if (!res.ok) return;
    const data = await res.json();
    if (data.status === "NONE") {
      setLink(null);
      return;
    }
    setLink({
      status: data.status,
      code: data.code,
      minecraftName: data.minecraftName,
      expiresAt: data.expiresAt,
    });
  }, []);

  useEffect(() => {
    if (link?.status !== "PENDING") return;
    // Deferred (not called directly) so the effect body itself stays
    // synchronous — the server (not the client clock) decides whether a
    // code already expired, so this also catches a page left open past
    // expiresAt before the interval's first 4s tick would otherwise.
    const immediate = setTimeout(poll, 0);
    const interval = setInterval(poll, 4000);
    return () => {
      clearTimeout(immediate);
      clearInterval(interval);
    };
    // link?.status is the only field this effect keys off of; poll() itself
    // is stable (useCallback with no deps).
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [link?.status]);

  async function requestCode() {
    setError(null);
    setSubmitting(true);
    try {
      const res = await fetch("/api/account/link/request", { method: "POST" });
      const data = await res.json().catch(() => null);
      if (!res.ok) {
        setError(data?.error ?? t("errors.generic"));
        return;
      }
      setLink({
        status: "PENDING",
        code: data.link.code,
        minecraftName: null,
        expiresAt: data.link.expiresAt,
      });
    } catch {
      setError(t("errors.generic"));
    } finally {
      setSubmitting(false);
    }
  }

  async function handleUnlink() {
    setSubmitting(true);
    try {
      await unlinkAccount(lang);
      setLink(null);
    } finally {
      setSubmitting(false);
    }
  }

  if (link?.status === "CONFIRMED" && link) {
    return (
      <div className="text-center">
        <p className="text-foreground/80 mb-6">{t("confirmed", { name: link.minecraftName ?? "" })}</p>
        <div className="flex flex-col sm:flex-row items-center justify-center gap-3 mb-5">
          <CtaButton href={`/${lang}/account`} variant="primary">
            {t("backToDashboard")}
          </CtaButton>
          <FormButton onClick={requestCode} disabled={submitting} variant="outline">
            {t("relink")}
          </FormButton>
        </div>
        <FormButton onClick={handleUnlink} disabled={submitting} variant="destructive" className="px-5 py-2 text-xs">
          {t("unlink")}
        </FormButton>
      </div>
    );
  }

  if (link?.status === "PENDING" && link) {
    return (
      <div className="text-center">
        <p className="text-foreground/60 text-sm mb-4">{t("codeInstructions")}</p>
        <div className="mb-3">
          <CopyToClipboard value={`/link ${link.code}`} />
        </div>
        <p className="text-foreground/30 text-xs mb-5">{t("codeExpires")}</p>
        <StatusBadge label={t("waiting")} pulse />
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-4">
      {link?.status === "EXPIRED" && (
        <p className="text-sm text-destructive text-center">{t("expired")}</p>
      )}
      {error && <p className="text-sm text-destructive text-center">{error}</p>}
      <FormButton onClick={requestCode} disabled={submitting} className="mt-2 w-full">
        {submitting ? t("submitting") : t("submit")}
      </FormButton>
    </div>
  );
}
