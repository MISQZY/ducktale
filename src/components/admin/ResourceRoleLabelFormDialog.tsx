"use client";

import { useState, type ReactNode } from "react";
import { useTranslations } from "next-intl";
import { LocalizedNameInput } from "@/components/common/LocalizedNameInput";
import { AdminFormDialog } from "./AdminFormDialog";
import { upsertResourceLabel, resetResourceLabel } from "@/lib/actions/admin-resource-roles";
import type { Resource } from "@/config/resource-roles";
import type { LocalizedName } from "@/lib/i18n-name";

interface ResourceRoleLabelFormDialogProps {
  lang: string;
  resource: Resource;
  currentNameRu: string;
  currentNameEn: string;
  trigger: ReactNode;
}

/** Edits (or resets) the display-name override for one resource — both locales at once, see ResourceRoleLabel's doc comment in the schema. */
export function ResourceRoleLabelFormDialog({ lang, resource, currentNameRu, currentNameEn, trigger }: ResourceRoleLabelFormDialogProps) {
  const t = useTranslations("Admin.resourceRoles");
  const [open, setOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [name, setName] = useState<LocalizedName>({ ru: currentNameRu, en: currentNameEn });
  const [activeLocale, setActiveLocale] = useState<"ru" | "en">("ru");

  async function handleSubmit(formData: FormData) {
    setError(null);
    setSubmitting(true);
    try {
      await upsertResourceLabel(lang, resource, formData);
      setOpen(false);
    } catch (err) {
      setError((err instanceof Error && err.message) || t("errors.generic"));
    } finally {
      setSubmitting(false);
    }
  }

  async function handleReset() {
    setError(null);
    setSubmitting(true);
    try {
      await resetResourceLabel(lang, resource);
      setOpen(false);
    } catch (err) {
      setError((err instanceof Error && err.message) || t("errors.generic"));
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <AdminFormDialog
      open={open}
      onOpenChange={(next) => {
        setOpen(next);
        if (next) {
          setError(null);
          setName({ ru: currentNameRu, en: currentNameEn });
          setActiveLocale("ru");
        }
      }}
      trigger={trigger}
      title={t("editLabelTitle")}
      error={error}
      submitting={submitting}
      submitLabel={t("save")}
      submittingLabel={t("saving")}
      onSubmit={handleSubmit}
      className="sm:max-w-sm"
      footerExtra={
        <button
          type="button"
          onClick={handleReset}
          disabled={submitting}
          className="text-xs text-foreground/50 hover:text-foreground/80 transition-colors underline underline-offset-2 text-center"
        >
          {t("resetLabel")}
        </button>
      }
    >
      <LocalizedNameInput
        id="resourceLabelName"
        label={t("resourceColumn")}
        ruName="nameRu"
        enName="nameEn"
        value={name}
        onChange={setName}
        active={activeLocale}
        onActiveChange={setActiveLocale}
        maxLength={64}
      />
    </AdminFormDialog>
  );
}
