"use client";

import { useState, type ReactNode } from "react";
import { useTranslations } from "next-intl";
import { LocalizedNameInput } from "@/components/common/LocalizedNameInput";
import { LocalizedTextareaInput } from "@/components/common/LocalizedTextareaInput";
import { FormInput } from "@/components/common/FormInput";
import { AdminFormDialog } from "./AdminFormDialog";
import { IconPickerField } from "./IconPickerField";
import { createServerEvent, updateServerEvent } from "@/lib/actions/admin-events";
import { formInputClasses, formInputStyle } from "@/components/common/form-styles";
import { EVENT_CATEGORIES } from "@/config/events";
import type { EventCategory } from "@/config/events";
import type { LocalizedName } from "@/lib/i18n-name";

interface EventFormValues {
  id: string;
  serverId: string | null;
  icon: string;
  category: EventCategory;
  name: LocalizedName;
  description: LocalizedName;
  /** Unix seconds, same as ServerEventEntry. */
  startAt: number;
  endAt: number;
  href: string | null;
}

export interface EventServerOption {
  id: string;
  name: string;
  emoji: string;
}

interface EventFormDialogProps {
  lang: string;
  /** Omitted = create mode. */
  event?: EventFormValues;
  servers: EventServerOption[];
  trigger: ReactNode;
}

const DEFAULT_ICON = "calendar";
// Empty string, not null — <select> option values are always strings; the
// server action (readEventFields, src/lib/actions/admin-events.ts) treats
// this exact sentinel as "network-wide event" and stores it as a null serverId.
const NETWORK_WIDE = "";

/** Unix seconds -> local "YYYY-MM-DDTHH:mm" string, the format <input type="datetime-local"> needs — a plain toISOString() would shift by the viewer's UTC offset instead of showing the wall-clock time the admin originally picked. */
function toDateTimeLocal(unixSeconds: number): string {
  const d = new Date(unixSeconds * 1000);
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

export function EventFormDialog({ lang, event, servers, trigger }: EventFormDialogProps) {
  const t = useTranslations("Admin.events");
  const [open, setOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [name, setName] = useState<LocalizedName>(event?.name ?? { ru: "", en: "" });
  const [description, setDescription] = useState<LocalizedName>(event?.description ?? { ru: "", en: "" });
  const [activeLocale, setActiveLocale] = useState<"ru" | "en">("ru");
  const [category, setCategory] = useState<EventCategory>(event?.category ?? EVENT_CATEGORIES[0]);
  const [serverId, setServerId] = useState(event?.serverId ?? NETWORK_WIDE);
  const [icon, setIcon] = useState(event?.icon ?? DEFAULT_ICON);
  const [iconQuery, setIconQuery] = useState("");
  const [href, setHref] = useState(event?.href ?? "");

  async function handleSubmit(formData: FormData) {
    setError(null);
    setSubmitting(true);
    try {
      if (event) {
        await updateServerEvent(lang, event.id, formData);
      } else {
        await createServerEvent(lang, formData);
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
          setName(event?.name ?? { ru: "", en: "" });
          setDescription(event?.description ?? { ru: "", en: "" });
          setActiveLocale("ru");
          setCategory(event?.category ?? EVENT_CATEGORIES[0]);
          setServerId(event?.serverId ?? NETWORK_WIDE);
          setIcon(event?.icon ?? DEFAULT_ICON);
          setIconQuery("");
          setHref(event?.href ?? "");
        }
      }}
      trigger={trigger}
      title={event ? t("editTitle") : t("createTitle")}
      error={error}
      submitting={submitting}
      submitLabel={event ? t("save") : t("create")}
      submittingLabel={t("saving")}
      onSubmit={handleSubmit}
    >
      <div className="flex flex-col gap-1.5">
        <label htmlFor="event-server" className="text-xs uppercase tracking-widest text-foreground/50 leading-none">
          {t("serverLabel")}
        </label>
        <select
          id="event-server"
          name="serverId"
          value={serverId}
          onChange={(e) => setServerId(e.target.value)}
          className={formInputClasses(false)}
          style={formInputStyle}
        >
          <option value={NETWORK_WIDE}>{t("serverNetworkWide")}</option>
          {servers.map((s) => (
            <option key={s.id} value={s.id}>{s.emoji} {s.name}</option>
          ))}
        </select>
      </div>

      <div className="flex flex-col gap-1.5">
        <label htmlFor="event-category" className="text-xs uppercase tracking-widest text-foreground/50 leading-none">
          {t("categoryLabel")}
        </label>
        <select
          id="event-category"
          name="category"
          value={category}
          onChange={(e) => setCategory(e.target.value as EventCategory)}
          className={formInputClasses(false)}
          style={formInputStyle}
        >
          {EVENT_CATEGORIES.map((c) => (
            <option key={c} value={c}>{t(`categories.${c}`)}</option>
          ))}
        </select>
      </div>

      <LocalizedNameInput
        id="event-name"
        label={t("nameLabel")}
        ruName="nameRu"
        enName="nameEn"
        value={name}
        onChange={setName}
        active={activeLocale}
        onActiveChange={setActiveLocale}
        maxLength={64}
      />

      <LocalizedTextareaInput
        id="event-description"
        label={t("descriptionLabel")}
        ruName="descriptionRu"
        enName="descriptionEn"
        value={description}
        onChange={setDescription}
        active={activeLocale}
        onActiveChange={setActiveLocale}
        maxLength={500}
      />

      <IconPickerField
        icon={icon}
        setIcon={setIcon}
        iconQuery={iconQuery}
        setIconQuery={setIconQuery}
        label={t("iconLabel")}
        searchPlaceholder={t("iconSearchPlaceholder")}
        emptyMessage={t("iconSearchEmpty")}
      />

      <div className="grid grid-cols-2 gap-3">
        <FormInput
          id="event-start"
          name="startAt"
          type="datetime-local"
          label={t("startLabel")}
          defaultValue={event ? toDateTimeLocal(event.startAt) : undefined}
        />
        <FormInput
          id="event-end"
          name="endAt"
          type="datetime-local"
          label={t("endLabel")}
          defaultValue={event ? toDateTimeLocal(event.endAt) : undefined}
        />
      </div>

      <FormInput
        id="event-href"
        name="href"
        label={t("hrefLabel")}
        value={href}
        onChange={(e) => setHref(e.target.value)}
        placeholder="https://discord.gg/..."
      />
    </AdminFormDialog>
  );
}
