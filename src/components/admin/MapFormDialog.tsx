"use client";

import { useState, type ReactNode } from "react";
import { useTranslations } from "next-intl";
import { LocalizedNameInput } from "@/components/common/LocalizedNameInput";
import { FormInput } from "@/components/common/FormInput";
import { AdminFormDialog } from "./AdminFormDialog";
import { createServerMap, updateServerMap } from "@/lib/actions/admin-maps";
import { formInputClasses, formInputStyle } from "@/components/common/form-styles";
import type { LocalizedName } from "@/lib/i18n-name";

interface MapFormValues {
  id: string;
  serverId: string;
  name: LocalizedName;
  url: string;
}

export interface MapServerOption {
  id: string;
  name: string;
  emoji: string;
}

interface MapFormDialogProps {
  lang: string;
  /** Omitted = create mode. */
  map?: MapFormValues;
  servers: MapServerOption[];
  trigger: ReactNode;
}

export function MapFormDialog({ lang, map, servers, trigger }: MapFormDialogProps) {
  const t = useTranslations("Admin.maps");
  const [open, setOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [name, setName] = useState<LocalizedName>(map?.name ?? { ru: "", en: "" });
  const [activeLocale, setActiveLocale] = useState<"ru" | "en">("ru");
  const [serverId, setServerId] = useState(map?.serverId ?? servers[0]?.id ?? "");
  const [url, setUrl] = useState(map?.url ?? "");

  async function handleSubmit(formData: FormData) {
    setError(null);
    setSubmitting(true);
    try {
      if (map) {
        await updateServerMap(lang, map.id, formData);
      } else {
        await createServerMap(lang, formData);
      }
      setOpen(false);
    } catch (err) {
      setError((err instanceof Error && err.message) || t("saveFailed"));
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
          setName(map?.name ?? { ru: "", en: "" });
          setActiveLocale("ru");
          setServerId(map?.serverId ?? servers[0]?.id ?? "");
          setUrl(map?.url ?? "");
        }
      }}
      trigger={trigger}
      title={map ? t("editTitle") : t("createTitle")}
      error={error}
      submitting={submitting}
      submitLabel={map ? t("save") : t("create")}
      submittingLabel={t("saving")}
      onSubmit={handleSubmit}
    >
      <div className="flex flex-col gap-1.5">
        <label htmlFor="map-server" className="text-xs uppercase tracking-widest text-foreground/50 leading-none">
          {t("serverLabel")}
        </label>
        <select
          id="map-server"
          name="serverId"
          value={serverId}
          onChange={(e) => setServerId(e.target.value)}
          className={formInputClasses(false)}
          style={formInputStyle}
        >
          {servers.map((s) => (
            <option key={s.id} value={s.id}>{s.emoji} {s.name}</option>
          ))}
        </select>
      </div>

      <LocalizedNameInput
        id="map-name"
        label={t("nameLabel")}
        ruName="nameRu"
        enName="nameEn"
        value={name}
        onChange={setName}
        active={activeLocale}
        onActiveChange={setActiveLocale}
        maxLength={64}
      />

      <FormInput
        id="map-url"
        name="url"
        label={t("urlLabel")}
        value={url}
        onChange={(e) => setUrl(e.target.value)}
        placeholder={t("urlPlaceholder")}
      />
    </AdminFormDialog>
  );
}
